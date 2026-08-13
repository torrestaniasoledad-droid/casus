/**
 * Quita eventuales fences ```json ... ``` (o ``` sueltos) antes de parsear.
 * Los modelos de lenguaje a veces envuelven el JSON en un bloque de código
 * aunque se les pida explícitamente no hacerlo.
 */
export function extractJson(text: string): unknown {
  const cleaned = text.replace(/^```json\s*|^```\s*|```\s*$/gm, "").trim();
  return JSON.parse(cleaned);
}
