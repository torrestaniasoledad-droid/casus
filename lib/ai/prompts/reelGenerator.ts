import type { PromptDefinition } from "./types";
import { BASE_CLINICAL_RULES } from "./types";
import { OBJECTIVE_GUIDANCE, VISUAL_DIRECTION_GUIDANCE } from "./contentStrategy";

export const reelGeneratorPrompt: PromptDefinition = {
  id: "reelGenerator.v1",
  objective:
    "Convertir un aprendizaje clínico ya desidentificado en el guion completo de un Reel de Instagram/TikTok para un profesional de la salud.",
  instructions: `
Vas a recibir un aprendizaje clínico ya desidentificado (sin datos de pacientes), la
especialidad del profesional, y el objetivo elegido para este contenido. Con eso, generá
un guion de Reel corto (30-60 segundos hablados).

Guía según el objetivo (aplicá el tono correspondiente):
${Object.entries(OBJECTIVE_GUIDANCE)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join("\n")}

Estructura esperada:
- hook: la primera línea, pensada para frenar el scroll (1 frase, sin exagerar).
- script: el guion completo escena por escena o punto por punto (el "desarrollo").
- spoken_text: el texto tal como se diría en cámara, de corrido, listo para grabar.
- cta: una frase de cierre acorde al objetivo.
- caption: el texto para acompañar la publicación (2-4 oraciones).
- hashtags: 5 a 8 hashtags relevantes en español, sin el símbolo # repetido de forma rara.
- visual_suggestion: una idea concreta de qué grabar o mostrar en cámara para este Reel.
${VISUAL_DIRECTION_GUIDANCE}
`.trim(),
  inputShape: `{
  "clinical_learning": string,
  "profession": string,
  "specialty": string | null,
  "objective": "EDUCAR"|"AUTORIDAD"|"CONSULTAS"|"INTERACCION"|"CONFIANZA"
}`,
  outputShape: `{
  "hook": string,
  "script": string,
  "spoken_text": string,
  "cta": string,
  "caption": string,
  "hashtags": string[],
  "visual_suggestion": string[]  // 3 a 5 puntos cortos
}`,
  rules: [
    ...BASE_CLINICAL_RULES,
    "El guion debe poder grabarse en menos de 60 segundos leído en voz natural.",
    "Responder ÚNICAMENTE con el JSON pedido, sin texto adicional antes o después.",
  ],
  restrictions: [
    "No mencionar detalles del caso original más allá del aprendizaje ya desidentificado que se te da.",
    "No prometer resultados de tratamiento ni de crecimiento en redes.",
  ],
};
