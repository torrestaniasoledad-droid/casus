import { z } from "zod";
import { getAIProvider, AIProviderError } from "./ai";
import { analysisPrompt } from "./ai/prompts";
import { BASE_CLINICAL_RULES } from "./ai/prompts/types";
import { extractJson } from "./json";

const detectedItemSchema = z.object({
  category: z.enum(["nombre", "edad", "institucion", "ubicacion", "fecha", "relacion", "otro"]),
  original_excerpt: z.string(),
  action: z.enum(["eliminado", "generalizado"]),
  replacement: z.string().nullable(),
});

const analysisResponseSchema = z.object({
  detected_information: z.array(detectedItemSchema),
  deidentified_text: z.string().min(1),
  risk_level: z.enum(["BAJO", "REVISAR", "ALTO"]),
  risk_explanation: z.string().min(1),
  clinical_learning: z.string().min(1),
});

export type AnalysisResponse = z.infer<typeof analysisResponseSchema>;

function buildSystemPrompt(): string {
  const p = analysisPrompt;
  return [
    `OBJETIVO: ${p.objective}`,
    `INSTRUCCIONES:\n${p.instructions}`,
    `FORMA DE ENTRADA (JSON que vas a recibir en el mensaje del usuario):\n${p.inputShape}`,
    `FORMA DE SALIDA ESPERADA (responder SOLO esto, como JSON válido):\n${p.outputShape}`,
    `REGLAS:\n${[...BASE_CLINICAL_RULES, ...p.rules].map((r) => `- ${r}`).join("\n")}`,
    `RESTRICCIONES:\n${p.restrictions.map((r) => `- ${r}`).join("\n")}`,
  ].join("\n\n");
}


export async function runAnalysis(input: {
  rawInput: string;
  profession: string;
  specialty: string | null;
}): Promise<AnalysisResponse> {
  const provider = getAIProvider();

  const result = await provider.complete({
    systemPrompt: buildSystemPrompt(),
    userInput: JSON.stringify({
      profession: input.profession,
      specialty: input.specialty,
      rawInput: input.rawInput,
    }),
    expectJson: true,
    maxTokens: 2000,
  });

  let parsedJson: unknown;
  try {
    parsedJson = extractJson(result.text);
  } catch {
    throw new AIProviderError(
      "La IA no devolvió un JSON válido.",
      "invalid_response"
    );
  }

  const parsed = analysisResponseSchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new AIProviderError(
      "La IA devolvió una respuesta con un formato inesperado.",
      "invalid_response"
    );
  }

  return parsed.data;
}

export { analysisResponseSchema };
