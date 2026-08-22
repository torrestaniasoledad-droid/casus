import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/rateLimit";

const ideaSchema = z.object({
  title: z.string().trim().min(1, "Escribí un título.").max(200),
  editorialNote: z.string().trim().max(500).optional(),
});

/**
 * Crea una "idea" suelta para el checklist editorial: un Content mínimo,
 * sin pasar por el pipeline de análisis/generación con IA. `format`,
 * `objective` y `clinicalLearning` quedan null — recién se completan si
 * más adelante la profesional decide llevar esa idea a "Crear contenido".
 * `status` (pipeline de IA) queda en su default (BORRADOR);
 * `editorialStatus` también queda en su default (IDEA), es justo el punto
 * de partida del checklist.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Necesitás iniciar sesión." }, { status: 401 });
  }

  const rl = checkRateLimit(`content-create:${userId}`, 30, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Estás creando ideas muy seguido. Esperá un momento y probá de nuevo." },
      { status: 429 }
    );
  }

  const parsed = ideaSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 }
    );
  }

  const content = await prisma.content.create({
    data: {
      userId,
      title: parsed.data.title,
      editorialNote: parsed.data.editorialNote || null,
    },
  });

  return NextResponse.json({ id: content.id });
}
