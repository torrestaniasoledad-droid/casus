import type { PromptDefinition } from "./types";
import { BASE_CLINICAL_RULES } from "./types";

/**
 * Un único prompt hace detección + desidentificación + riesgo + extracción
 * del aprendizaje en una sola llamada a la IA (en vez de 4 llamadas
 * separadas). Motivo: las cuatro tareas dependen del mismo análisis del
 * texto, encadenarlas como 4 llamadas multiplicaría costo y latencia sin
 * beneficio real para el MVP. Si en el futuro alguna tarea necesita un
 * modelo o una lógica distinta, se separa entonces.
 */
export const analysisPrompt: PromptDefinition = {
  id: "analysis.v1",
  objective:
    "Detectar información potencialmente identificable en el relato de un profesional de la salud, desidentificarla, evaluar el nivel de riesgo residual y extraer el aprendizaje clínico general, en un solo paso.",
  instructions: `
Vas a recibir el relato de un profesional de la salud (primer nicho: fonoaudiología)
sobre una situación de su práctica profesional. Tu tarea tiene cuatro partes:

1. DETECCIÓN: identificá cualquier fragmento que podría ayudar a identificar a un
   paciente o tercero real: nombres propios, edades exactas, nombres de instituciones
   (escuelas, clínicas, consultorios), ubicaciones específicas, fechas concretas,
   relaciones familiares con nombres, y cualquier otro dato contextual muy específico.

2. DESIDENTIFICACIÓN: por cada dato detectado, decidí una acción:
   - "eliminado": el dato se quita sin reemplazo (ej: nombres propios).
   - "generalizado": el dato se reemplaza por una versión genérica que preserva el
     sentido clínico (ej: "7 años" -> "una niña en edad escolar";
     "Colonia Caroya" -> "una localidad del interior").
   Generá también el texto completo ya desidentificado ("deidentifiedText"),
   preservando el resto del relato intacto y coherente en español.

3. RIESGO: asigná un nivel de riesgo RESIDUAL después de la desidentificación
   ("BAJO", "REVISAR" o "ALTO") y una explicación breve y amigable, en un lenguaje
   que un profesional no técnico entienda. "ALTO" es para cuando, incluso después de
   desidentificar, la combinación de detalles restantes podría seguir permitiendo
   identificar a alguien (por ejemplo, un caso muy inusual o público).

4. APRENDIZAJE CLÍNICO: extraé, en 1-3 oraciones y ya sobre el texto desidentificado,
   cuál es el aprendizaje o insight profesional general que se puede compartir como
   contenido educativo (no el caso en sí, sino la enseñanza detrás).
`.trim(),
  inputShape: `{
  "profession": string,       // ej: "fonoaudiologia"
  "specialty": string | null, // ej: "lenguaje infantil"
  "rawInput": string          // el relato del usuario, tal cual lo escribió
}`,
  outputShape: `{
  "detected_information": [
    { "category": "nombre"|"edad"|"institucion"|"ubicacion"|"fecha"|"relacion"|"otro",
      "original_excerpt": string, "action": "eliminado"|"generalizado", "replacement": string | null }
  ],
  "deidentified_text": string,
  "risk_level": "BAJO" | "REVISAR" | "ALTO",
  "risk_explanation": string,
  "clinical_learning": string
}`,
  rules: [
    ...BASE_CLINICAL_RULES,
    "Nunca incluir el fragmento original identificable en ningún campo que no sea 'original_excerpt', usado solo para que el usuario vea qué se detectó — igualmente se descarta antes de guardar en base de datos.",
    "Si no se detecta ningún dato identificable, 'detected_information' debe ser un array vacío y 'deidentified_text' debe ser igual al texto original.",
    "Responder ÚNICAMENTE con el JSON pedido, sin texto adicional antes o después.",
  ],
  restrictions: [
    "No diagnosticar al paciente descrito.",
    "No agregar detalles clínicos que el usuario no haya mencionado.",
    "No suavizar ni exagerar el nivel de riesgo para quedar bien con el usuario.",
  ],
};
