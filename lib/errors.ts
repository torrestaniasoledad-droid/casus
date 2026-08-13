import { AIProviderError } from "./ai/provider";

/**
 * Traduce cualquier error interno a un mensaje en español, comprensible
 * para un usuario no técnico, y a un status HTTP apropiado. Nunca exponer
 * mensajes de error crudos (stack traces, nombres de librerías) al usuario.
 */
export function toUserFacingError(err: unknown): { message: string; status: number } {
  if (err instanceof AIProviderError) {
    switch (err.kind) {
      case "timeout":
        return {
          message: "CASUS tardó demasiado en responder. Probá de nuevo en un momento.",
          status: 504,
        };
      case "unavailable":
        return {
          message: "El servicio de IA no está disponible en este momento. Probá más tarde.",
          status: 503,
        };
      case "rate_limited":
        return {
          message: "Alcanzaste el límite de uso de tu plan por ahora.",
          status: 429,
        };
      case "invalid_response":
        return {
          message: "CASUS no pudo procesar tu experiencia correctamente. Probá reformularla o intentá de nuevo.",
          status: 502,
        };
      default:
        return { message: "Ocurrió un error inesperado al analizar tu experiencia.", status: 500 };
    }
  }

  return { message: "Ocurrió un error inesperado. Probá de nuevo en unos minutos.", status: 500 };
}
