import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, AICompletionRequest, AICompletionResult } from "../provider";
import { AIProviderError } from "../provider";

const MODEL = "claude-sonnet-4-6";

export class ClaudeProvider implements AIProvider {
  readonly name = "claude";
  private client: Anthropic;

  constructor(apiKey: string = process.env.ANTHROPIC_API_KEY ?? "") {
    if (!apiKey) {
      // No lanzamos en el constructor para no romper el build; falla al usarlo.
      // eslint-disable-next-line no-console
      console.warn("[ClaudeProvider] ANTHROPIC_API_KEY no está configurada.");
    }
    this.client = new Anthropic({ apiKey });
  }

  async complete(req: AICompletionRequest): Promise<AICompletionResult> {
    try {
      const response = await this.client.messages.create({
        model: MODEL,
        max_tokens: req.maxTokens ?? 2000,
        system: req.systemPrompt,
        messages: [{ role: "user", content: req.userInput }],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new AIProviderError("La IA no devolvió contenido de texto.", "invalid_response");
      }

      return { text: textBlock.text, model: MODEL, raw: response };
    } catch (err: any) {
      if (err instanceof AIProviderError) throw err;
      if (err?.status === 429) {
        throw new AIProviderError("Límite de uso de la IA alcanzado.", "rate_limited");
      }
      if (err?.name === "APIConnectionTimeoutError") {
        throw new AIProviderError("La IA tardó demasiado en responder.", "timeout");
      }
      if (err?.status >= 500) {
        throw new AIProviderError("El servicio de IA no está disponible.", "unavailable");
      }
      throw new AIProviderError("Ocurrió un error inesperado con la IA.", "unknown");
    }
  }
}
