/**
 * Llamadas mínimas a la API de Drive necesarias para aprovisionar la
 * carpeta "CASUS" — con scope drive.file, CASUS solo puede ver/editar los
 * archivos que ella misma crea, así que no hace falta (ni se puede)
 * "buscar" una carpeta preexistente creada por otra app: la referencia que
 * importa es la que ya quedó guardada en GoogleAccount.driveFolderId.
 */

const DRIVE_API = "https://www.googleapis.com/drive/v3";

export async function createCasusFolder(accessToken: string): Promise<string> {
  const res = await fetch(`${DRIVE_API}/files`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: "CASUS", mimeType: "application/vnd.google-apps.folder" }),
  });
  if (!res.ok) {
    throw new Error(`Drive: no se pudo crear la carpeta (${res.status})`);
  }
  const data = await res.json();
  return data.id as string;
}

export async function moveFileToFolder(accessToken: string, fileId: string, folderId: string): Promise<void> {
  const res = await fetch(`${DRIVE_API}/files/${fileId}?addParents=${folderId}&fields=id,parents`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Drive: no se pudo mover la planilla a la carpeta (${res.status})`);
  }
}
