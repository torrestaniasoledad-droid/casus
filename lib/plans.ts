import type { Plan } from "@prisma/client";

/**
 * Límites mensuales por plan. Sin integración de pagos todavía (sección 15
 * del brief): esto solo sirve para que el plan FREE tenga un tope real y la
 * lógica de "excedido tu límite" ya funcione de punta a punta.
 */
export const PLAN_LIMITS: Record<Plan, { analyses: number; generations: number }> = {
  FREE: { analyses: 5, generations: 10 },
  PRO: { analyses: 60, generations: 150 },
  PREMIUM: { analyses: Infinity, generations: Infinity },
};

export function currentPeriod(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
