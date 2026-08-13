import { describe, it, expect } from "vitest";
import { analysisResponseSchema } from "@/lib/analysis";

describe("analysisResponseSchema", () => {
  it("acepta una respuesta completa y válida", () => {
    const result = analysisResponseSchema.safeParse({
      detected_information: [
        { category: "nombre", original_excerpt: "Martina", action: "eliminado", replacement: null },
      ],
      deidentified_text: "Atendí a una niña en edad escolar...",
      risk_level: "BAJO",
      risk_explanation: "No quedan datos identificables.",
      clinical_learning: "La detección temprana ayuda.",
    });
    expect(result.success).toBe(true);
  });

  it("acepta detected_information vacío cuando no hay nada que proteger", () => {
    const result = analysisResponseSchema.safeParse({
      detected_information: [],
      deidentified_text: "texto sin cambios",
      risk_level: "BAJO",
      risk_explanation: "ok",
      clinical_learning: "ok",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza un risk_level fuera del enum", () => {
    const result = analysisResponseSchema.safeParse({
      detected_information: [],
      deidentified_text: "x",
      risk_level: "MEDIO", // no es un valor válido
      risk_explanation: "x",
      clinical_learning: "x",
    });
    expect(result.success).toBe(false);
  });

  it("rechaza una categoría de dato detectado no reconocida", () => {
    const result = analysisResponseSchema.safeParse({
      detected_information: [
        { category: "telefono", original_excerpt: "x", action: "eliminado", replacement: null },
      ],
      deidentified_text: "x",
      risk_level: "BAJO",
      risk_explanation: "x",
      clinical_learning: "x",
    });
    expect(result.success).toBe(false);
  });
});
