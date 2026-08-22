import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

const editorialSchema = z.object({
  editorialStatus: z.enum(["IDEA", "EN_PROCESO", "LISTO", "PROGRAMADO", "PUBLICADO", "NO_UTILIZAR"]).optional(),
  scheduledFor: z.string().nullable().optional(), // "YYYY-MM-DD" o null para borrar la fecha
  channel: z.string().trim().max(60).nullable().optional(),
  editorialNote: z.string().trim().max(500).nullable().optional(),
});

/**
 * Actualiza los campos del checklist/calendario editorial. Separado del
 * PATCH en /api/content/[id] a propósito: ese endpoint versiona el
 * contenido generado (crea un ContentVersion nuevo); esto es metadata de
 * planificación, no una edición del contenido en sí, así que actualiza
 * `Content` directamente sin tocar el historial de versiones.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Necesitás iniciar sesión." }, { status: 401 });

  const content = await prisma.content.findUnique({ where: { id: params.id } });
  if (!content || content.userId !== userId) {
    return NextResponse.json({ error: "No encontramos ese contenido." }, { status: 404 });
  }

  const parsed = editorialSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const updated = await prisma.content.update({
    where: { id: content.id },
    data: {
      ...(data.editorialStatus !== undefined && { editorialStatus: data.editorialStatus }),
      ...(data.scheduledFor !== undefined && {
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
      }),
      ...(data.channel !== undefined && { channel: data.channel }),
      ...(data.editorialNote !== undefined && { editorialNote: data.editorialNote }),
      // Al pasar a "Publicado" se registra cuándo, sin pisarlo si ya se
      // había marcado publicado antes (por ejemplo, si vuelve a cambiar de
      // estado y regresa a Publicado más tarde).
      ...(data.editorialStatus === "PUBLICADO" &&
        !content.publishedAt && { publishedAt: new Date() }),
    },
  });

  return NextResponse.json({
    id: updated.id,
    editorialStatus: updated.editorialStatus,
    scheduledFor: updated.scheduledFor,
    publishedAt: updated.publishedAt,
    channel: updated.channel,
    editorialNote: updated.editorialNote,
  });
}
