import { toCalendarDateString, type CalendarDateString } from "./dateOnly";

/**
 * Arma la grilla de un mes para la vista de calendario: semanas completas
 * (arranca en lunes, convención local), incluyendo los días de relleno del
 * mes anterior/siguiente para completar la primera y última semana.
 *
 * `date` es un Date en medianoche LOCAL — sirve para layout de la grilla
 * (día de la semana, número de día) pero NUNCA para comparar contra
 * `scheduledFor` (que vive en medianoche UTC, ver lib/dateOnly.ts). Para
 * esa comparación usar `dateStr`, que es el mismo "YYYY-MM-DD" canónico
 * que devuelve dateColumnToCalendarDateString — así la comparación es un
 * simple `===` de strings, sin ningún Date ni huso horario de por medio.
 */
export interface CalendarDay {
  date: Date;
  dateStr: CalendarDateString;
  inMonth: boolean;
}

export function getMonthGrid(year: number, month: number): CalendarDay[][] {
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);

  // getDay(): 0 = domingo ... 6 = sábado. Convertimos a "días desde el lunes".
  const leadingDays = (firstOfMonth.getDay() + 6) % 7;
  const trailingDays = (7 - ((lastOfMonth.getDay() + 6) % 7) - 1 + 7) % 7;

  function makeDay(day: number, inMonth: boolean): CalendarDay {
    const date = new Date(year, month, day);
    return { date, dateStr: toCalendarDateString(date.getFullYear(), date.getMonth(), date.getDate()), inMonth };
  }

  const days: CalendarDay[] = [];

  for (let i = leadingDays; i > 0; i--) {
    days.push(makeDay(1 - i, false));
  }
  for (let d = 1; d <= lastOfMonth.getDate(); d++) {
    days.push(makeDay(d, true));
  }
  for (let i = 1; i <= trailingDays; i++) {
    days.push(makeDay(lastOfMonth.getDate() + i, false));
  }

  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
