import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { generateContent, type ContentFormat, type ContentObjective } from "@/lib/contentGeneration";
import { toUserFacingError } from "@/lib/errors";
import { getUsageLimit, currentPeriod } from "@/lib/plans";
import { checkRateLimit } from "@/lib/rateLimit";
import { assertEnv } from "@/lib/env";
import { ensureHashtagSymbols } from "@/lib/hashtags";
import { syncContent } from "@/lib/google/sync";

const generateSchema = z.object({
  contentId: z.string().min(1),
  objective: z.enum(["EDUCAR", "AUTORIDAD", "CONSULTAS", "INTERACCION", "CONFIANZA"]),
  format: z.enum(["REEL", "CARRUSEL", "POST", "STORIES"]),
});

/**
 * Normaliza la salida (distinta por formato) a las columnas fijas de
 * ContentVersion. El título se guarda completo (sin recortar a un largo
 * fijo) para que la vista de detalle pueda mostrarlo entero; las vistas en
 * grilla (biblioteca) recortan visualmente con CSS si hace falta, sin tocar
 * el dato guardado.
 */
function toVersionFields(format: ContentFormat, data: any) {
  switch (format) {
    case "REEL":
      return {
        title: data.hook,
        hook: data.hook,
        script: data.script,
        caption: data.caption,
        cta: data.cta,
        hashtags: ensureHashtagSymbols(data.hashtags).join(" "),
      };
    case "CARRUSEL":
      return {
        title: data.slides[0],
        hook: data.slides[0],
        script: JSON.stringify(data.slides),
        caption: data.caption,
        cta: data.cta,
        hashtags: ensureHashtagSymbols(data.hashtags).join(" "),
      };
    case "STORIES":
      return {
        title: data.stories[0],
        hook: data.stories[0],
        script: JSON.stringify(data.stories),
        caption: null as string | null,
        cta: data.cta,
        hashtags: null as string | null,
      };
    case "POST":
      return {
        title: data.hook,
        hook: data.hook,
        script: data.desarrollo,
        caption: data.caption,
        cta: data.cta,
        hashtags: ensureHashtagSymbols(data.hashtags).join(" "),
      };
  }
}

export async function POST(req: Request) {
  try {
    assertEnv();
  } catch {
    return NextResponse.json(
      { error: "CASUS no está configurado correctamente en este momento. Avisá al equipo." },
      { status: 500 }
    );
  }

  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Necesitás iniciar sesión." }, { status: 401 });
  }

  const rl = checkRateLimit(`generate:${userId}`, 10, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Estás generando contenido muy seguido. Esperá un momento y probá de nuevo." },
      { status: 429 }
    );
  }

  const parsedBody = generateSchema.safeParse(await req.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 }
    );
  }
  const { contentId, objective, format } = parsedBody.data;

  const [content, profile, subscription, user] = await Promise.all([
    prisma.content.findUnique({ where: { id: contentId } }),
    prisma.profile.findUnique({ where: { userId } }),
    prisma.subscription.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
  ]);

  // El contenido tiene que existir, pertenecerle al usuario, y ya haber
  // pasado por el análisis/desidentificación de la Etapa 2.
  if (!content || content.userId !== userId) {
    return NextResponse.json({ error: "No encontramos ese contenido." }, { status: 404 });
  }
  if (!content.clinicalLearning) {
    return NextResponse.json(
      { error: "Este contenido todavía no pasó por el análisis de CASUS." },
      { status: 400 }
    );
  }
  if (!profile) {
    return NextResponse.json({ error: "Completá tu perfil antes de generar contenido." }, { status: 400 });
  }

  // --- Límite de uso por plan ---
  const plan = subscription?.plan ?? "FREE";
  const period = currentPeriod();
  const usage = await prisma.usage.upsert({
    where: { userId_period: { userId, period } },
    create: { userId, period },
    update: {},
  });
  const limit = getUsageLimit(plan, user?.email, "generations");
  if (usage.generations >= limit) {
    return NextResponse.json(
      {
        error: `Alcanzaste el límite de ${limit} generaciones de tu plan ${plan} este mes. Actualizá tu plan para seguir generando contenido.`,
      },
      { status: 429 }
    );
  }

  // --- Generación con IA ---
  let generated;
  try {
    generated = await generateContent({
      format: format as ContentFormat,
      objective: objective as ContentObjective,
      clinicalLearning: content.clinicalLearning,
      profession: profile.profession,
      specialty: profile.specialty,
    });
  } catch (err) {
    const { message, status } = toUserFacingError(err);
    return NextResponse.json({ error: message }, { status });
  }

  const versionFields = toVersionFields(format as ContentFormat, generated.data);

  try {
    const [version] = await prisma.$transaction([
      prisma.contentVersion.create({
        data: {
          contentId: content.id,
          hook: versionFields.hook,
          script: versionFields.script,
          caption: versionFields.caption,
          cta: versionFields.cta,
          hashtags: versionFields.hashtags,
          raw: generated.data as any,
        },
      }),
      prisma.content.update({
        where: { id: content.id },
        data: {
          objective: objective as ContentObjective,
          format: format as ContentFormat,
          status: "GENERADO",
          title: versionFields.title,
        },
      }),
      prisma.usage.update({
        where: { userId_period: { userId, period } },
        data: { generations: { increment: 1 } },
      }),
    ]);

    // Best-effort: recién acá el contenido tiene título/formato reales,
    // así que es el punto natural para que aparezca (o se actualice) en la
    // planilla si tiene Google conectado.
    await syncContent(userId, content.id);

    return NextResponse.json({
      versionId: version.id,
      format,
      objective,
      data: generated.data,
    });
  } catch {
    return NextResponse.json(
      { error: "No pudimos guardar el contenido generado. Probá de nuevo." },
      { status: 500 }
    );
  }
}
