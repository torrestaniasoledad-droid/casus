/**
 * Asegura que cada hashtag empiece con "#", sin depender solo de que la IA
 * lo haga bien. Si ya viene con #, lo deja igual; si no, se lo agrega.
 */
export function ensureHashtagSymbols(hashtags: string[]): string[] {
  return hashtags
    .map((h) => h.trim())
    .filter(Boolean)
    .map((h) => (h.startsWith("#") ? h : `#${h}`));
}
