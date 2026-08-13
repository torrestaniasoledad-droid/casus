// ETAPA 2: detección + desidentificación + riesgo + aprendizaje clínico,
// unificados en un solo prompt (ver analysis.ts para el porqué).
export { analysisPrompt } from "./analysis";

// ETAPA 3: generación de contenido por objetivo/formato. La "estrategia"
// (contentStrategy) no es una llamada aparte — cada generador de formato
// la importa como framing (ver contentStrategy.ts para el porqué).
export { contentStrategyPrompt, OBJECTIVE_GUIDANCE } from "./contentStrategy";
export { reelGeneratorPrompt } from "./reelGenerator";
export { carouselGeneratorPrompt } from "./carouselGenerator";
export { storyGeneratorPrompt } from "./storyGenerator";
export { postGeneratorPrompt } from "./postGenerator";
