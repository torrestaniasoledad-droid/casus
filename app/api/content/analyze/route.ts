import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { runAnalysis } from "@/lib/analysis";
import { toUserFacingError } from "@/lib/errors";
import { getUsageLimit, currentPeriod } from "@/lib/plans";
import { analysisPrompt } from "@/lib/ai/prompts";
import { checkRateLimit } from "@/lib/rateLimit";
import { assertEnv } from "@/lib/env";

const analyzeSchema = z.object({
  rawInput: z
    .string()
    .trim()
    .min(1, "Contanos qué pasó antes de analizar.")
    .max(4000, "Tu relato es demasiado largo (máximo 4000 caracteres). Resumilo un poco."),
});

/**
 * ETAPA 2: detección de datos + desidentificación + semáforo de riesgo +
 * aprendizaje clínico, en una sola llamada a la IA (ver /lib/analysis.ts).
 *
 * Importante (sección 13 del brief): el texto crudo del usuario ("rawInput")
 * SOLO existe en memoria durante esta request. Nunca se escribe en la base
 * de datos — lo único que se persiste es el resultado ya desidentificado.
 */
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

  // Además del límite de plan (más abajo), un rate limit corto evita que un
  // doble click o un script dispare llamadas repetidas a la IA.
  const rl = checkRateLimit(`analyze:${userId}`, 10, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Estás analizando contenido muy seguido. Esperá un momento y probá de nuevo." },
      { status: 429 }
    );
  }

  const parsedBody = analyzeSchema.safeParse(await req.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Contenido vacío." },
      { status: 400 }
    );
  }

  const [profile, subscription, user] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.subscription.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
  ]);

  if (!profile) {
    return NextResponse.json(
      { error: "Completá tu perfil antes de crear contenido." },
      { status: 400 }
    );
  }

  // --- Límite de uso por plan (sección 15) ---
  const plan = subscription?.plan ?? "FREE";
  const period = currentPeriod();
  const usage = await prisma.usage.upsert({
    where: { userId_period: { userId, period } },
    create: { userId, period },
    update: {},
  });

  const limit = getUsageLimit(plan, user?.email, "analyses");
  if (usage.analyses >= limit) {
    return NextResponse.json(
      {
        error: `Alcanzaste el límite de ${limit} análisis de tu plan ${plan} este mes. Actualizá tu plan para seguir creando contenido.`,
      },
      { status: 429 }
    );
  }

  // --- Análisis con IA ---
  let analysisResult;
  try {
    analysisResult = await runAnalysis({
      rawInput: parsedBody.data.rawInput,
      profession: profile.profession,
      specialty: profile.specialty,
    });
  } catch (err) {
    const { message, status } = toUserFacingError(err);
    return NextResponse.json({ error: message }, { status });
  }

  // --- Persistencia: nunca el texto original, solo el resultado ---
  try {
    const content = await prisma.$transaction(async (tx) => {
      const created = await tx.content.create({
        data: {
          userId,
          status: "DESIDENTIFICADO",
          riskLevel: analysisResult.risk_level,
          clinicalLearning: analysisResult.clinical_learning,
          deidentifiedInput: analysisResult.deidentified_text,
        },
      });

      await tx.analysis.create({
        data: {
          contentId: created.id,
          riskLevel: analysisResult.risk_level,
          summary: analysisResult.risk_explanation,
          model: "claude-sonnet-4-6",
          promptVersion: analysisPrompt.id,
        },
      });

      if (analysisResult.detected_information.length > 0) {
        await tx.privacyFlag.createMany({
          data: analysisResult.detected_information.map((item) => ({
            contentId: created.id,
            category: item.category,
            action: item.action,
            // Solo se guarda el reemplazo (texto ya seguro), NUNCA original_excerpt.
            replacement: item.replacement,
          })),
        });
      }

      await tx.usage.update({
        where: { userId_period: { userId, period } },
        data: { analyses: { increment: 1 } },
      });

      return created;
    });

    // La respuesta al frontend SÍ incluye original_excerpt (para el
    // "momento wow" de mostrar qué se detectó), pero eso vive solo en esta
    // response HTTP — no en la base de datos.
    return NextResponse.json({
      contentId: content.id,
      detected: analysisResult.detected_information,
      deidentifiedText: analysisResult.deidentified_text,
      riskLevel: analysisResult.risk_level,
      riskExplanation: analysisResult.risk_explanation,
      clinicalLearning: analysisResult.clinical_learning,
    });
  } catch {
    return NextResponse.json(
      { error: "No pudimos guardar el resultado del análisis. Probá de nuevo." },
      { status: 500 }
    );
  }
}
