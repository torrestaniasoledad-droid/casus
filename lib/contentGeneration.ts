import { z } from "zod";
import { getAIProvider, AIProviderError } from "./ai";
import {
  reelGeneratorPrompt,
  carouselGeneratorPrompt,
  storyGeneratorPrompt,
  postGeneratorPrompt,
} from "./ai/prompts";
import { BASE_CLINICAL_RULES } from "./ai/prompts/types";
import type { PromptDefinition } from "./ai/prompts/types";
import { extractJson } from "./json";

export type ContentFormat = "REEL" | "CARRUSEL" | "POST" | "STORIES";
export type ContentObjective = "EDUCAR" | "AUTORIDAD" | "CONSULTAS" | "INTERACCION" | "CONFIANZA";

const reelSchema = z.object({
  hook: z.string().min(1),
  script: z.string().min(1),
  spoken_text: z.string().min(1),
  cta: z.string().min(1),
  caption: z.string().min(1),
  hashtags: z.array(z.string()).min(1),
  visual_suggestion: z.array(z.string().min(1)).min(2).max(6),
});

const carouselSchema = z.object({
  slides: z.array(z.string().min(1)).length(7),
  caption: z.string().min(1),
  hashtags: z.array(z.string()).min(1),
  cta: z.string().min(1),
  visual_suggestion: z.array(z.string().min(1)).min(2).max(6),
});

const storiesSchema = z.object({
  stories: z.array(z.string().min(1)).length(4),
  cta: z.string().min(1),
  visual_suggestion: z.array(z.string().min(1)).min(2).max(6),
});

const postSchema = z.object({
  hook: z.string().min(1),
  desarrollo: z.string().min(1),
  cta: z.string().min(1),
  caption: z.string().min(1),
  hashtags: z.array(z.string()).min(1),
  visual_suggestion: z.array(z.string().min(1)).min(2).max(6),
});

const FORMAT_CONFIG: Record<
  ContentFormat,
  { prompt: PromptDefinition; schema: z.ZodTypeAny }
> = {
  REEL: { prompt: reelGeneratorPrompt, schema: reelSchema },
  CARRUSEL: { prompt: carouselGeneratorPrompt, schema: carouselSchema },
  STORIES: { prompt: storyGeneratorPrompt, schema: storiesSchema },
  POST: { prompt: postGeneratorPrompt, schema: postSchema },
};

export type ReelResult = z.infer<typeof reelSchema>;
export type CarouselResult = z.infer<typeof carouselSchema>;
export type StoriesResult = z.infer<typeof storiesSchema>;
export type PostResult = z.infer<typeof postSchema>;
export type GenerationResult = ReelResult | CarouselResult | StoriesResult | PostResult;

/** Exportados solo para tests — validar los schemas sin llamar a la IA. */
export const FORMAT_SCHEMAS = {
  REEL: reelSchema,
  CARRUSEL: carouselSchema,
  STORIES: storiesSchema,
  POST: postSchema,
} as const;

function buildSystemPrompt(p: PromptDefinition): string {
  return [
    `OBJETIVO: ${p.objective}`,
    `INSTRUCCIONES:\n${p.instructions}`,
    `FORMA DE ENTRADA (JSON que vas a recibir en el mensaje del usuario):\n${p.inputShape}`,
    `FORMA DE SALIDA ESPERADA (responder SOLO esto, como JSON válido):\n${p.outputShape}`,
    `REGLAS:\n${[...BASE_CLINICAL_RULES, ...p.rules].map((r) => `- ${r}`).join("\n")}`,
    `RESTRICCIONES:\n${p.restrictions.map((r) => `- ${r}`).join("\n")}`,
  ].join("\n\n");
}



export async function generateContent(input: {
  format: ContentFormat;
  objective: ContentObjective;
  clinicalLearning: string;
  profession: string;
  specialty: string | null;
}): Promise<{ promptId: string; data: GenerationResult }> {
  const { prompt, schema } = FORMAT_CONFIG[input.format];
  const provider = getAIProvider();

  const result = await provider.complete({
    systemPrompt: buildSystemPrompt(prompt),
    userInput: JSON.stringify({
      clinical_learning: input.clinicalLearning,
      profession: input.profession,
      specialty: input.specialty,
      objective: input.objective,
    }),
    expectJson: true,
    maxTokens: 2000,
  });

  let parsedJson: unknown;
  try {
    parsedJson = extractJson(result.text);
  } catch {
    throw new AIProviderError("La IA no devolvió un JSON válido.", "invalid_response");
  }

  const parsed = schema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new AIProviderError(
      "La IA devolvió una respuesta con un formato inesperado.",
      "invalid_response"
    );
  }

  return { promptId: prompt.id, data: parsed.data };
}
