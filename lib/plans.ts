import type { Plan } from "@prisma/client";

/**
 * Límites mensuales por plan.
 *
 * PREMIUM NO es infinito a propósito: un tope alto (pero finito) protege el
 * margen ante un usuario que abuse del uso o un error/bug que dispare
 * llamadas repetidas — sin eso, el costo de la IA para ese usuario no tiene
 * techo. 500 análisis + 1000 generaciones por mes es, en la práctica, muy
 * por encima de lo que cualquier usuario real llega a usar (serían ~16
 * análisis Y ~33 generaciones por día, todos los días del mes).
 */
export const PLAN_LIMITS: Record<Plan, { analyses: number; generations: number }> = {
  FREE: { analyses: 5, generations: 10 },
  PRO: { analyses: 60, generations: 150 },
  PREMIUM: { analyses: 500, generations: 500 },
};

export function currentPeriod(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
