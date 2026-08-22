/**
 * Llamadas mínimas a la API de Sheets. Una sola pestaña ("Contenidos"), un
 * layout fijo de columnas (ver HEADER_ROW) — la columna A guarda el
 * Content.id de CASUS, oculta, para poder ubicar la fila de cada contenido
 * de forma confiable aunque la planilla crezca.
 */

const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";
const SHEET_TITLE = "Contenidos";

const HEADER_ROW = [
  "ID (no editar)",
  "Título",
  "Formato",
  "Objetivo",
  "Estado editorial",
  "Fecha programada",
  "Canal",
  "Nota",
  "Abrir en CASUS",
  "Última actualización",
];

export interface SheetRowData {
  contentId: string;
  title: string;
  format: string;
  objective: string;
  editorialStatus: string;
  scheduledFor: string;
  channel: string;
  editorialNote: string;
  link: string;
  updatedAt: string;
}

function toRowValues(row: SheetRowData): string[] {
  return [
    row.contentId,
    row.title,
    row.format,
    row.objective,
    row.editorialStatus,
    row.scheduledFor,
    row.channel,
    row.editorialNote,
    row.link,
    row.updatedAt,
  ];
}

async function sheetsFetch(accessToken: string, path: string, init: RequestInit = {}): Promise<any> {
  const res = await fetch(`${SHEETS_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Sheets API error ${res.status}: ${body.slice(0, 300)}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function createSpreadsheet(
  accessToken: string,
  title: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; gridSheetId: number }> {
  const data = await sheetsFetch(accessToken, "", {
    method: "POST",
    body: JSON.stringify({
      properties: { title },
      sheets: [{ properties: { title: SHEET_TITLE, gridProperties: { frozenRowCount: 1 } } }],
    }),
  });
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl,
    gridSheetId: data.sheets[0].properties.sheetId,
  };
}

/**
 * Encabezados en negrita, columna A oculta, y el rango protegido contra
 * ediciones. La request de protección se hace con el propio access token de
 * la profesional (no un service account), así que ella queda como editora
 * implícita del rango protegido — lo que bloquea es que OTRAS personas con
 * las que comparta la planilla puedan editarla, no ella misma. Es un
 * supuesto razonable según la documentación de la API, pero no se pudo
 * probar contra una cuenta real todavía — vale la pena confirmarlo la
 * primera vez que alguien conecte de verdad.
 */
export async function setupSheetLayout(
  accessToken: string,
  spreadsheetId: string,
  gridSheetId: number
): Promise<void> {
  await sheetsFetch(accessToken, `/${spreadsheetId}/values/${SHEET_TITLE}!A1:J1?valueInputOption=RAW`, {
    method: "PUT",
    body: JSON.stringify({ values: [HEADER_ROW] }),
  });

  await sheetsFetch(accessToken, `/${spreadsheetId}:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({
      requests: [
        {
          updateDimensionProperties: {
            range: { sheetId: gridSheetId, dimension: "COLUMNS", startIndex: 0, endIndex: 1 },
            properties: { hiddenByUser: true },
            fields: "hiddenByUser",
          },
        },
        {
          repeatCell: {
            range: { sheetId: gridSheetId, startRowIndex: 0, endRowIndex: 1 },
            cell: { userEnteredFormat: { textFormat: { bold: true } } },
            fields: "userEnteredFormat.textFormat.bold",
          },
        },
        {
          addProtectedRange: {
            protectedRange: {
              range: { sheetId: gridSheetId },
              description: "Gestionado desde CASUS — los cambios se hacen ahí, no acá.",
              warningOnly: false,
            },
          },
        },
      ],
    }),
  });
}

/** Busca en qué fila está un contentId (columna A, arranca en la fila 2). Devuelve el número de fila (1-indexado) o null. */
export async function findRowIndex(
  accessToken: string,
  spreadsheetId: string,
  contentId: string
): Promise<number | null> {
  const data = await sheetsFetch(accessToken, `/${spreadsheetId}/values/${SHEET_TITLE}!A2:A`);
  const values: string[][] = data?.values ?? [];
  const idx = values.findIndex((row) => row[0] === contentId);
  return idx === -1 ? null : idx + 2;
}

export async function writeRow(
  accessToken: string,
  spreadsheetId: string,
  rowIndex: number,
  row: SheetRowData
): Promise<void> {
  await sheetsFetch(accessToken, `/${spreadsheetId}/values/${SHEET_TITLE}!A${rowIndex}:J${rowIndex}?valueInputOption=RAW`, {
    method: "PUT",
    body: JSON.stringify({ values: [toRowValues(row)] }),
  });
}

export async function appendRow(accessToken: string, spreadsheetId: string, row: SheetRowData): Promise<void> {
  await sheetsFetch(
    accessToken,
    `/${spreadsheetId}/values/${SHEET_TITLE}!A:J:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    { method: "POST", body: JSON.stringify({ values: [toRowValues(row)] }) }
  );
}

/**
 * "Borra" una fila limpiando sus valores, en vez de eliminar la fila físicamente
 * (deleteDimension). Evita tener que conocer/recalcular el gridSheetId numérico
 * fuera del aprovisionamiento inicial, y no corre el riesgo de desalinear los
 * demás sheetRowId guardados si dos borrados llegaran a superponerse.
 */
export async function clearRow(accessToken: string, spreadsheetId: string, rowIndex: number): Promise<void> {
  await sheetsFetch(accessToken, `/${spreadsheetId}/values/${SHEET_TITLE}!A${rowIndex}:J${rowIndex}:clear`, {
    method: "POST",
  });
}

/** Reescribe todas las filas de una (usado por el resync completo). */
export async function writeAllRows(accessToken: string, spreadsheetId: string, rows: SheetRowData[]): Promise<void> {
  await sheetsFetch(accessToken, `/${spreadsheetId}/values/${SHEET_TITLE}!A2:J:clear`, { method: "POST" });
  if (rows.length === 0) return;
  await sheetsFetch(
    accessToken,
    `/${spreadsheetId}/values/${SHEET_TITLE}!A2:J${rows.length + 1}?valueInputOption=RAW`,
    { method: "PUT", body: JSON.stringify({ values: rows.map(toRowValues) }) }
  );
}
