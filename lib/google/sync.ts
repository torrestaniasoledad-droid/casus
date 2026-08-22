import type { Content } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { EDITORIAL_STATUS_LABEL, FORMAT_LABEL, OBJECTIVE_LABEL } from "@/lib/labels";
import { getValidAccessToken } from "./account";
import { createCasusFolder, moveFileToFolder } from "./drive";
import {
  appendRow,
  clearRow,
  createSpreadsheet,
  findRowIndex,
  setupSheetLayout,
  writeAllRows,
  writeRow,
  type SheetRowData,
} from "./sheets";

/**
 * Capa de sincronización CASUS → Sheets. Postgres sigue siendo la fuente de
 * verdad en todo momento — esto solo empuja una copia de lectura hacia la
 * planilla de la profesional. Todo acá es "best-effort": un fallo de
 * sincronización nunca debe impedir la acción real en CASUS (crear, editar,
 * borrar un contenido), solo queda registrado en SheetSyncLog y en
 * GoogleAccount.lastSyncError para que la UI lo muestre.
 */

async function log(
  googleAccountId: string,
  contentId: string | null,
  action: string,
  success: boolean,
  errorMessage?: string
) {
  await prisma.sheetSyncLog
    .create({ data: { googleAccountId, contentId, action, success, errorMessage } })
    .catch(() => {});
}

function toSheetRow(content: Content): SheetRowData {
  const appUrl = process.env.NEXTAUTH_URL ?? "";
  return {
    contentId: content.id,
    title: content.title ?? "Sin título",
    format: content.format ? FORMAT_LABEL[content.format] : "",
    objective: content.objective ? OBJECTIVE_LABEL[content.objective] : "",
    editorialStatus: EDITORIAL_STATUS_LABEL[content.editorialStatus] ?? content.editorialStatus,
    scheduledFor: content.scheduledFor ? content.scheduledFor.toISOString().slice(0, 10) : "",
    channel: content.channel ?? "",
    editorialNote: content.editorialNote ?? "",
    link: `${appUrl}/dashboard/library/${content.id}`,
    updatedAt: new Date().toLocaleString("es-AR"),
  };
}

/**
 * Crea la carpeta + planilla si todavía no existen para esta cuenta
 * (reutilizando lo guardado si ya existían, por ejemplo tras una
 * reconexión — ver GoogleAccount en el schema). Devuelve un access token
 * vigente listo para usar y el spreadsheetId.
 */
export async function ensureProvisioned(userId: string): Promise<{ accessToken: string; spreadsheetId: string }> {
  const account = await prisma.googleAccount.findUniqueOrThrow({ where: { userId } });
  const accessToken = await getValidAccessToken(userId);

  let folderId = account.driveFolderId;
  let sheetId = account.sheetId;
  let sheetUrl = account.sheetUrl;

  if (!folderId) {
    folderId = await createCasusFolder(accessToken);
  }

  if (!sheetId) {
    const created = await createSpreadsheet(accessToken, "CASUS – Calendario editorial");
    sheetId = created.spreadsheetId;
    sheetUrl = created.spreadsheetUrl;
    await moveFileToFolder(accessToken, sheetId, folderId);
    try {
      await setupSheetLayout(accessToken, sheetId, created.gridSheetId);
    } catch (err) {
      // El formato/protección es un nice-to-have: si falla, la planilla
      // queda igual de funcional para leer/organizar, solo sin el pulido.
      // eslint-disable-next-line no-console
      console.error("Google Sheets: no se pudo aplicar el formato/protección inicial.", err);
    }
  }

  if (folderId !== account.driveFolderId || sheetId !== account.sheetId || sheetUrl !== account.sheetUrl) {
    await prisma.googleAccount.update({ where: { userId }, data: { driveFolderId: folderId, sheetId, sheetUrl } });
  }

  return { accessToken, spreadsheetId: sheetId! };
}

/**
 * Sincroniza un único Content (crea su fila si es la primera vez, la
 * actualiza si ya existe). Se apoya en `Content.sheetRowId` como atajo
 * directo — es seguro confiar en él porque el rango está protegido contra
 * ediciones manuales (ver setupSheetLayout); si no está seteado, busca la
 * fila por columna A antes de decidir si crea o actualiza.
 */
export async function syncContent(userId: string, contentId: string): Promise<void> {
  const account = await prisma.googleAccount.findUnique({ where: { userId } });
  if (!account || account.status !== "CONNECTED") return; // no conectado: no hay nada que sincronizar

  try {
    const { accessToken, spreadsheetId } = await ensureProvisioned(userId);
    const content = await prisma.content.findUnique({ where: { id: contentId } });
    if (!content) return;

    const row = toSheetRow(content);
    const existingRowIndex = content.sheetRowId ?? (await findRowIndex(accessToken, spreadsheetId, contentId));

    let finalRowIndex = existingRowIndex;
    if (existingRowIndex) {
      await writeRow(accessToken, spreadsheetId, existingRowIndex, row);
    } else {
      await appendRow(accessToken, spreadsheetId, row);
      finalRowIndex = await findRowIndex(accessToken, spreadsheetId, contentId);
    }

    await prisma.content.update({
      where: { id: contentId },
      data: { sheetRowId: finalRowIndex ?? undefined, lastSyncedAt: new Date() },
    });
    await prisma.googleAccount.update({ where: { userId }, data: { lastSyncAt: new Date(), lastSyncError: null } });
    await log(account.id, contentId, existingRowIndex ? "update_row" : "create_row", true);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    await prisma.googleAccount.update({ where: { userId }, data: { lastSyncError: message } }).catch(() => {});
    await log(account.id, contentId, "update_row", false, message);
  }
}

/** Limpia la fila de un Content que ya se borró en CASUS. `sheetRowId` debe capturarse ANTES de borrar el Content. */
export async function removeContentRow(userId: string, sheetRowId: number | null): Promise<void> {
  if (!sheetRowId) return;

  const account = await prisma.googleAccount.findUnique({ where: { userId } });
  if (!account || account.status !== "CONNECTED" || !account.sheetId) return;

  try {
    const accessToken = await getValidAccessToken(userId);
    await clearRow(accessToken, account.sheetId, sheetRowId);
    await log(account.id, null, "delete_row", true);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    await log(account.id, null, "delete_row", false, message);
  }
}

/** Resync completo: reescribe todas las filas de una. Dispara la conexión inicial y el botón "Sincronizar ahora". */
export async function fullResync(userId: string): Promise<{ count: number }> {
  const { accessToken, spreadsheetId } = await ensureProvisioned(userId);
  const account = await prisma.googleAccount.findUniqueOrThrow({ where: { userId } });
  const contents = await prisma.content.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });

  await writeAllRows(accessToken, spreadsheetId, contents.map(toSheetRow));

  if (contents.length > 0) {
    await prisma.$transaction(
      contents.map((c, i) =>
        prisma.content.update({ where: { id: c.id }, data: { sheetRowId: i + 2, lastSyncedAt: new Date() } })
      )
    );
  }
  await prisma.googleAccount.update({ where: { userId }, data: { lastSyncAt: new Date(), lastSyncError: null } });
  await log(account.id, null, "full_resync", true);

  return { count: contents.length };
}
