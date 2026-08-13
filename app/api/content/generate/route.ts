import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { generateContent, type ContentFormat, type ContentObjective } from "@/lib/contentGeneration";
import { toUserFacingError } from "@/lib/errors";
import { PLAN_LIMITS, currentPeriod } from "@/lib/plans";
import { checkRateLimit } from "@/lib/rateLimit";
import { assertEnv } from "@/lib/env";

const generateSchema = z.object({
  contentId: z.string().min(1),
  objective: z.enum(["EDUCAR", "AUTORIDAD", "CONSULTAS", "INTERACCION", "CONFIANZA"]),
  format: z.enum(["REEL", "CARRUSEL", "POST", "STORIES"]),
});

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** Normaliza la salida (distinta por formato) a las columnas fijas de ContentVersion. */
function toVersionFields(format: ContentFormat, data: any) {
  switch (format) {
    case "REEL":
      return {
        title: truncate(data.hook, 70),
        hook: data.hook,
        script: data.script,
        caption: data.caption,
        cta: data.cta,
        hashtags: data.hashtags.join(" "),
      };
    case "CARRUSEL":
      return {
        title: truncate(data.slides[0], 70),
        hook: data.slides[0],
        script: JSON.stringify(data.slides),
        caption: data.caption,
        cta: data.cta,
        hashtags: data.hashtags.join(" "),
      };
    case "STORIES":
      return {
        title: truncate(data.stories[0], 70),
        hook: data.stories[0],
        script: JSON.stringify(data.stories),
        caption: null as string | null,
        cta: data.cta,
        hashtags: null as string | null,
      };
    case "POST":
      return {
        title: truncate(data.hook, 70),
        hook: data.hook,
        script: data.desarrollo,
        caption: data.caption,
        cta: data.cta,
        hashtags: data.hashtags.join(" "),
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

  const [content, profile, subscription] = await Promise.all([
    prisma.content.findUnique({ where: { id: contentId } }),
    prisma.profile.findUnique({ where: { userId } }),
    prisma.subscription.findUnique({ where: { userId } }),
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
  const limit = PLAN_LIMITS[plan].generations;
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
