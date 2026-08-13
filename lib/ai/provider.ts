/**
 * AIProvider — capa de abstracción de IA.
 *
 * Ningún componente de UI ni ruta de API debe importar un SDK de IA
 * directamente. Todo pasa por esta interfaz, para poder cambiar de
 * Claude -> OpenAI/Gemini (o mezclar proveedores por tarea) sin tocar
 * el resto de la aplicación.
 */

export interface AICompletionRequest {
  systemPrompt: string;
  userInput: string;
  /** Fuerza al proveedor a devolver JSON válido cuando el proveedor lo soporte. */
  expectJson?: boolean;
  maxTokens?: number;
}

export interface AICompletionResult {
  text: string;
  model: string;
  raw: unknown;
}

export interface AIProvider {
  readonly name: string;
  complete(req: AICompletionRequest): Promise<AICompletionResult>;
}

/**
 * Error tipado para que las rutas de API puedan mapear fallos de IA a
 * mensajes comprensibles para usuarios no técnicos (ver /lib/errors.ts).
 */
export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly kind: "timeout" | "unavailable" | "invalid_response" | "rate_limited" | "unknown"
  ) {
    super(message);
    this.name = "AIProviderError";
  }
}
