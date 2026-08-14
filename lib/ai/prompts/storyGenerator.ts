import type { PromptDefinition } from "./types";
import { BASE_CLINICAL_RULES } from "./types";
import { OBJECTIVE_GUIDANCE, VISUAL_DIRECTION_GUIDANCE } from "./contentStrategy";

export const storyGeneratorPrompt: PromptDefinition = {
  id: "storyGenerator.v1",
  objective:
    "Convertir un aprendizaje clínico ya desidentificado en una secuencia de 4 Stories de Instagram para un profesional de la salud.",
  instructions: `
Vas a recibir un aprendizaje clínico ya desidentificado, la especialidad del profesional, y
el objetivo elegido. Generá exactamente 4 historias secuenciales, pensadas para leerse en
segundos cada una:

- Historia 1: plantea la situación o pregunta que engancha.
- Historia 2 y 3: desarrollan el aprendizaje, un paso a la vez.
- Historia 4: cierre con el CTA.

Guía según el objetivo:
${Object.entries(OBJECTIVE_GUIDANCE)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join("\n")}

Cada historia es texto corto (pensá en el espacio de una pantalla de celular), no un párrafo.

Sugerí también una idea visual (visual_suggestion): qué mostrar de fondo en cada historia.
${VISUAL_DIRECTION_GUIDANCE}
`.trim(),
  inputShape: `{
  "clinical_learning": string,
  "profession": string,
  "specialty": string | null,
  "objective": "EDUCAR"|"AUTORIDAD"|"CONSULTAS"|"INTERACCION"|"CONFIANZA"
}`,
  outputShape: `{
  "stories": string[],
  "cta": string,
  "visual_suggestion": string[]  // 3 a 5 puntos cortos
}`,
  rules: [
    ...BASE_CLINICAL_RULES,
    "'stories' debe tener exactamente 4 elementos.",
    "Responder ÚNICAMENTE con el JSON pedido, sin texto adicional antes o después.",
  ],
  restrictions: [
    "No mencionar detalles del caso original más allá del aprendizaje ya desidentificado que se te da.",
    "No prometer resultados de tratamiento ni de crecimiento en redes.",
  ],
};
