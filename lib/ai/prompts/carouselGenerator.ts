import type { PromptDefinition } from "./types";
import { BASE_CLINICAL_RULES } from "./types";
import { OBJECTIVE_GUIDANCE } from "./contentStrategy";

export const carouselGeneratorPrompt: PromptDefinition = {
  id: "carouselGenerator.v1",
  objective:
    "Convertir un aprendizaje clínico ya desidentificado en un carrusel de 7 slides para Instagram, para un profesional de la salud.",
  instructions: `
Vas a recibir un aprendizaje clínico ya desidentificado, la especialidad del profesional, y
el objetivo elegido. Generá exactamente 7 slides de texto (uno por imagen del carrusel):

- Slide 1: el hook — la portada, debe frenar el scroll.
- Slides 2 a 6: el desarrollo del aprendizaje, un punto claro por slide, en lenguaje simple.
- Slide 7: el cierre con el CTA.

Guía según el objetivo:
${Object.entries(OBJECTIVE_GUIDANCE)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join("\n")}

Cada slide debe poder leerse en pocos segundos (no son párrafos largos).
`.trim(),
  inputShape: `{
  "clinical_learning": string,
  "profession": string,
  "specialty": string | null,
  "objective": "EDUCAR"|"AUTORIDAD"|"CONSULTAS"|"INTERACCION"|"CONFIANZA"
}`,
  outputShape: `{
  "slides": string[],
  "caption": string,
  "hashtags": string[],
  "cta": string
}`,
  rules: [
    ...BASE_CLINICAL_RULES,
    "'slides' debe tener exactamente 7 elementos.",
    "Responder ÚNICAMENTE con el JSON pedido, sin texto adicional antes o después.",
  ],
  restrictions: [
    "No mencionar detalles del caso original más allá del aprendizaje ya desidentificado que se te da.",
    "No prometer resultados de tratamiento ni de crecimiento en redes.",
  ],
};
