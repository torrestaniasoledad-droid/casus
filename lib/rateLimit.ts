/**
 * Rate limiter en memoria, ventana fija. Sirve para el MVP corriendo en un
 * solo proceso. NO sirve tal cual en producción con múltiples instancias
 * (cada instancia tendría su propio contador) — ahí hay que reemplazar este
 * Map por Redis/Upstash, manteniendo la misma firma de `checkRateLimit`
 * para no tocar los call sites.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}
