import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { removeContentRow } from "@/lib/google/sync";

const editSchema = z.object({
  title: z.string().min(1).optional(),
  hook: z.string().min(1).optional(),
  script: z.string().min(1).optional(),
  caption: z.string().nullable().optional(),
  cta: z.string().min(1).optional(),
  hashtags: z.string().nullable().optional(),
});

async function loadOwnedContent(userId: string, id: string) {
  const content = await prisma.content.findUnique({
    where: { id },
    include: {
      versions: { orderBy: { createdAt: "desc" } },
      privacyFlags: true,
    },
  });
  if (!content || content.userId !== userId) return null;
  return content;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Necesitás iniciar sesión." }, { status: 401 });

  const content = await loadOwnedContent(userId, params.id);
  if (!content) return NextResponse.json({ error: "No encontramos ese contenido." }, { status: 404 });

  return NextResponse.json({ content });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Necesitás iniciar sesión." }, { status: 401 });

  const content = await prisma.content.findUnique({ where: { id: params.id } });
  if (!content || content.userId !== userId) {
    return NextResponse.json({ error: "No encontramos ese contenido." }, { status: 404 });
  }

  // onDelete: Cascade en el schema se encarga de versions/analysis/privacyFlags.
  await prisma.content.delete({ where: { id: params.id } });

  // Best-effort: limpia la fila en Sheets si tenía Google conectado. Se
  // captura sheetRowId ANTES del delete de arriba porque ya no hay Content
  // del que leerlo después.
  await removeContentRow(userId, content.sheetRowId);

  return NextResponse.json({ ok: true });
}

/**
 * Editar (sección 8: "permitir abrir, editar, duplicar, eliminar").
 * Una edición NO sobreescribe la versión generada por la IA: crea una
 * ContentVersion nueva a partir de la más reciente, con los campos editados
 * encima. Así se conserva el historial completo (ver comentario en
 * schema.prisma sobre ContentVersion).
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Necesitás iniciar sesión." }, { status: 401 });

  const content = await prisma.content.findUnique({
    where: { id: params.id },
    include: { versions: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!content || content.userId !== userId) {
    return NextResponse.json({ error: "No encontramos ese contenido." }, { status: 404 });
  }

  const latest = content.versions[0];
  if (!latest) {
    return NextResponse.json(
      { error: "Este contenido todavía no tiene una versión generada para editar." },
      { status: 400 }
    );
  }

  const parsed = editSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 }
    );
  }
  const edits = parsed.data;

  const [newVersion] = await prisma.$transaction([
    prisma.contentVersion.create({
      data: {
        contentId: content.id,
        hook: edits.hook ?? latest.hook,
        script: edits.script ?? latest.script,
        caption: edits.caption !== undefined ? edits.caption : latest.caption,
        cta: edits.cta ?? latest.cta,
        hashtags: edits.hashtags !== undefined ? edits.hashtags : latest.hashtags,
        raw: latest.raw ?? undefined,
      },
    }),
    prisma.content.update({
      where: { id: content.id },
      data: {
        status: "EDITADO",
        title: edits.title ?? content.title,
      },
    }),
  ]);

  return NextResponse.json({ versionId: newVersion.id });
}
