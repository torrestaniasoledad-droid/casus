import type { AIProvider } from "./provider";
import { ClaudeProvider } from "./providers/claude";

let cachedProvider: AIProvider | null = null;

/**
 * Punto único de acceso a la IA en toda la aplicación.
 * Cambiar de proveedor = cambiar esta función, nada más.
 */
export function getAIProvider(): AIProvider {
  if (!cachedProvider) {
    cachedProvider = new ClaudeProvider();
  }
  return cachedProvider;
}

export * from "./provider";
