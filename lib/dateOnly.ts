/**
 * Utilidades para manejar "fechas puras" (un día del calendario, sin hora
 * ni huso horario — hoy, exclusivamente Content.scheduledFor).
 *
 * Por qué existe este módulo: un Date de JS siempre representa un instante
 * (ligado, para leerlo, a un huso horario). Una fecha pura no tiene huso
 * horario — "24 de agosto" es 24 de agosto en cualquier parte del mundo.
 * El bug real que motivó este archivo fue justamente mezclar ambos
 * conceptos: se guardaba `scheduledFor` como medianoche UTC, pero se leía
 * de vuelta con getters de huso horario LOCAL (`getFullYear`, `getMonth`,
 * `getDate`, `toLocaleDateString` sin `timeZone`) — en cualquier huso con
 * offset negativo (como Argentina, UTC-3), medianoche UTC del 24 cae en la
 * noche del 23 en hora local, y la fecha se mostraba un día antes.
 *
 * Regla para evitar que vuelva a pasar: todo el código de la app que lee o
 * muestra `scheduledFor` pasa por las funciones de acá, nunca por
 * `new Date(x).getDate()`/`toLocaleDateString()` directo.
 */

export type CalendarDateString = string; // "YYYY-MM-DD"

const CALENDAR_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidCalendarDateString(value: string): value is CalendarDateString {
  if (!CALENDAR_DATE_RE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

/** Arma "YYYY-MM-DD" a partir de año/mes(0-indexado)/día — sin pasar por Date ni por ningún huso horario. */
export function toCalendarDateString(year: number, month: number, day: number): CalendarDateString {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Extrae "YYYY-MM-DD" de un Date que viene de una columna `@db.Date` de
 * Prisma. Postgres devuelve esos valores como medianoche UTC — leerlos con
 * getUTC* acá es lo correcto porque así es como el driver los representa,
 * no una elección arbitraria de huso horario.
 */
export function dateColumnToCalendarDateString(date: Date): CalendarDateString {
  return toCalendarDateString(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/** Convierte "YYYY-MM-DD" a un Date en medianoche UTC, listo para guardar en una columna `@db.Date`. */
export function calendarDateStringToDate(value: CalendarDateString): Date {
  if (!isValidCalendarDateString(value)) {
    throw new Error(`Fecha inválida: "${value}" (formato esperado: YYYY-MM-DD).`);
  }
  return new Date(`${value}T00:00:00.000Z`);
}

/**
 * Formatea "YYYY-MM-DD" para mostrarla, sin que el resultado dependa del
 * huso horario de quien la mira (navegador) ni de dónde corre el server.
 */
export function formatCalendarDateString(
  value: CalendarDateString,
  options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" }
): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("es-AR", {
    ...options,
    timeZone: "UTC",
  });
}
