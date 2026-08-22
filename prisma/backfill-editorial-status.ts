/**
 * Backfill de EditorialStatus para contenidos que ya existían antes de esta
 * funcionalidad (calendario/checklist editorial + integración con Google).
 *
 * Por qué hace falta: el campo `editorialStatus` se agregó con
 * `@default(IDEA)`, así que después de aplicar el schema TODO el contenido
 * existente —incluido lo ya publicado o archivado— quedaría marcado como
 * "Idea" en el checklist. Este script corrige eso una sola vez, mapeando el
 * `ContentStatus` (pipeline de generación con IA) a un `EditorialStatus`
 * inicial razonable (flujo editorial/publicación):
 *
 *   BORRADOR, DESIDENTIFICADO  -> IDEA        (todavía no se generó nada)
 *   GENERADO, EDITADO          -> EN_PROCESO  (ya hay contenido generado, no marcado como listo)
 *   GUARDADO                   -> LISTO
 *   ARCHIVADO                  -> NO_UTILIZAR
 *
 * Es seguro correrlo más de una vez: solo toca filas que todavía están en
 * el valor por defecto (IDEA) Y cuyo `status` no es BORRADOR/DESIDENTIFICADO
 * (es decir, nunca pisa un editorialStatus que alguien ya cambió a mano
 * desde el checklist).
 *
 * Uso: npx tsx prisma/backfill-editorial-status.ts
 * (requiere DATABASE_URL configurada, igual que cualquier otro comando de Prisma)
 */
import { PrismaClient, ContentStatus, EditorialStatus } from "@prisma/client";

const prisma = new PrismaClient();

const STATUS_TO_EDITORIAL: Partial<Record<ContentStatus, EditorialStatus>> = {
  GENERADO: "EN_PROCESO",
  EDITADO: "EN_PROCESO",
  GUARDADO: "LISTO",
  ARCHIVADO: "NO_UTILIZAR",
  // BORRADOR y DESIDENTIFICADO no están acá a propósito: su destino (IDEA)
  // ya es el valor por defecto, no hace falta un UPDATE para esas filas.
};

async function main() {
  console.log("[backfill] Empezando backfill de editorialStatus...");

  let totalUpdated = 0;

  for (const [status, editorialStatus] of Object.entries(STATUS_TO_EDITORIAL) as [
    ContentStatus,
    EditorialStatus,
  ][]) {
    const result = await prisma.content.updateMany({
      where: {
        status,
        editorialStatus: "IDEA", // solo si nadie lo tocó todavía a mano
      },
      data: { editorialStatus },
    });

    console.log(`[backfill] ${status} -> ${editorialStatus}: ${result.count} filas actualizadas.`);
    totalUpdated += result.count;
  }

  console.log(`[backfill] Listo. Total de filas actualizadas: ${totalUpdated}.`);
}

main()
  .catch((err) => {
    console.error("[backfill] Error corriendo el backfill:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
