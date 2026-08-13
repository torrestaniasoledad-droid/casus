import type { PromptDefinition } from "./types";
import { BASE_CLINICAL_RULES } from "./types";

/**
 * A diferencia de lo que sugiere la sección 12 del brief (un prompt de
 * estrategia separado, llamado antes del generador de formato), acá la
 * estrategia se resuelve DENTRO de cada prompt de formato (reel/carrusel/
 * post/stories), no como una llamada extra a la IA.
 *
 * Motivo: la estrategia ("qué ángulo tomar según el objetivo") solo tiene
 * sentido en función del formato final — el ángulo de un Reel y el de un
 * Carrusel para el mismo objetivo se escriben distinto desde el principio.
 * Encadenar dos llamadas (estrategia -> generación) duplicaría costo y
 * latencia sin mejorar el resultado para el MVP. Este archivo queda como
 * la fuente única de verdad de "qué significa cada objetivo", y los
 * generadores de formato la importan.
 */
export const OBJECTIVE_GUIDANCE: Record<string, string> = {
  EDUCAR:
    "Priorizá claridad y un aprendizaje concreto y accionable. El cierre invita a guardar o compartir, no a vender.",
  AUTORIDAD:
    "Mostrá criterio profesional y experiencia sin sonar arrogante. El cierre invita a seguir la cuenta o guardar para más contenido así.",
  CONSULTAS:
    "El aprendizaje debe dejar en claro que un profesional puede ayudar con esto. El cierre invita, sin prometer resultados, a consultar.",
  INTERACCION:
    "Formulá el contenido de forma que invite a comentar o responder (una pregunta, una encuesta implícita). El cierre pide la interacción explícitamente.",
  CONFIANZA:
    "Priorizá cercanía y honestidad profesional por sobre la perfección. El cierre refuerza que este profesional entiende lo que la audiencia está viviendo.",
};

export const contentStrategyPrompt: PromptDefinition = {
  id: "contentStrategy.v1",
  objective:
    "Definir, para cada objetivo de contenido posible, qué ángulo y tono debe tomar el contenido generado — usado como framing compartido por todos los generadores de formato.",
  instructions:
    "Ver OBJECTIVE_GUIDANCE en este archivo: cada generador de formato inyecta la guía correspondiente al objetivo elegido por el usuario dentro de su propio prompt.",
  inputShape: "objective: EDUCAR | AUTORIDAD | CONSULTAS | INTERACCION | CONFIANZA",
  outputShape: "(no aplica — no es un prompt que se llame solo)",
  rules: BASE_CLINICAL_RULES,
  restrictions: [
    "No prometer resultados clínicos ni de crecimiento en redes.",
    "No usar el objetivo como excusa para exagerar el caso.",
  ],
};
