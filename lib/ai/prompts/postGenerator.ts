import type { PromptDefinition } from "./types";
import { BASE_CLINICAL_RULES } from "./types";
import { OBJECTIVE_GUIDANCE } from "./contentStrategy";

export const postGeneratorPrompt: PromptDefinition = {
  id: "postGenerator.v1",
  objective:
    "Convertir un aprendizaje clínico ya desidentificado en un post estático (imagen única + texto) para Instagram, para un profesional de la salud.",
  instructions: `
Vas a recibir un aprendizaje clínico ya desidentificado, la especialidad del profesional, y
el objetivo elegido. Generá el texto de un post estático:

- hook: la primera línea del texto de la imagen o del caption, para frenar el scroll.
- desarrollo: el cuerpo del aprendizaje, en 3-5 oraciones, claro y concreto.
- cta: cierre acorde al objetivo.

Guía según el objetivo:
${Object.entries(OBJECTIVE_GUIDANCE)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join("\n")}
`.trim(),
  inputShape: `{
  "clinical_learning": string,
  "profession": string,
  "specialty": string | null,
  "objective": "EDUCAR"|"AUTORIDAD"|"CONSULTAS"|"INTERACCION"|"CONFIANZA"
}`,
  outputShape: `{
  "hook": string,
  "desarrollo": string,
  "cta": string,
  "caption": string,
  "hashtags": string[]
}`,
  rules: [
    ...BASE_CLINICAL_RULES,
    "Responder ÚNICAMENTE con el JSON pedido, sin texto adicional antes o después.",
  ],
  restrictions: [
    "No mencionar detalles del caso original más allá del aprendizaje ya desidentificado que se te da.",
    "No prometer resultados de tratamiento ni de crecimiento en redes.",
  ],
};
