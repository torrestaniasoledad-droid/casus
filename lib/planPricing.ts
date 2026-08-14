import type { Plan } from "@prisma/client";
import { PLAN_LIMITS } from "./plans";

/**
 * Precios en USD como referencia — Mercado Pago cobra en pesos, así que esto
 * NO es lo que se le cobra literalmente al usuario (eso se calcula al tipo
 * de cambio del momento cuando se conecte el pago real). Ver la nota sobre
 * precios en el README para el detalle del margen y por qué se llegó a
 * estos números.
 */
export const PLAN_PRICING: Record<
  Plan,
  { name: string; priceUsd: number; tagline: string; features: string[] }
> = {
  FREE: {
    name: "Free",
    priceUsd: 0,
    tagline: "Para probar CASUS sin compromiso.",
    features: [
      `${PLAN_LIMITS.FREE.analyses} análisis por mes`,
      `${PLAN_LIMITS.FREE.generations} generaciones de contenido por mes`,
      "Desidentificación y semáforo de riesgo",
      "Biblioteca de contenidos",
    ],
  },
  PRO: {
    name: "Pro",
    priceUsd: 7,
    tagline: "Para quien publica contenido de forma regular.",
    features: [
      `${PLAN_LIMITS.PRO.analyses} análisis por mes`,
      `${PLAN_LIMITS.PRO.generations} generaciones de contenido por mes`,
      "Desidentificación y semáforo de riesgo",
      "Biblioteca de contenidos",
      "Ideas visuales a nivel experto",
    ],
  },
  PREMIUM: {
    name: "Premium",
    priceUsd: 19,
    tagline: "Para consultorios o profesionales muy activos en redes.",
    features: [
      `${PLAN_LIMITS.PREMIUM.analyses} análisis por mes`,
      `${PLAN_LIMITS.PREMIUM.generations} generaciones de contenido por mes`,
      "Desidentificación y semáforo de riesgo",
      "Biblioteca de contenidos",
      "Ideas visuales a nivel experto",
      "Soporte prioritario",
    ],
  },
};
