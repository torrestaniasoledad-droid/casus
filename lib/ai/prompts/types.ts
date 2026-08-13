/**
 * Forma estándar de un prompt de CASUS. Cada archivo en /prompts exporta
 * un objeto de este tipo. Nada de prompts sueltos dentro de componentes.
 */
export interface PromptDefinition {
  id: string;
  objective: string;
  instructions: string;
  inputShape: string;
  outputShape: string;
  rules: string[];
  restrictions: string[];
}

/** Reglas comunes a TODOS los prompts clínicos de CASUS (sección 23). */
export const BASE_CLINICAL_RULES: string[] = [
  "CASUS trabaja con profesionales de la salud, no con pacientes ni el público general.",
  "El contenido generado debe ser educativo, no un diagnóstico ni un consejo médico individual.",
  "Nunca inventar información clínica que el usuario no haya provisto.",
  "Nunca modificar artificialmente hechos clínicos relatados por el usuario.",
  "Evitar afirmaciones absolutas y promesas de resultados.",
  "Proteger siempre la identidad de pacientes y terceros mencionados.",
  "Recomendar revisión profesional del contenido antes de publicarlo.",
];
