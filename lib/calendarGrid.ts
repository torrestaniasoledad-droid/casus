/**
 * Arma la grilla de un mes para la vista de calendario: semanas completas
 * (arranca en lunes, convención local), incluyendo los días de relleno del
 * mes anterior/siguiente para completar la primera y última semana.
 */
export interface CalendarDay {
  date: Date;
  inMonth: boolean;
}

export function getMonthGrid(year: number, month: number): CalendarDay[][] {
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);

  // getDay(): 0 = domingo ... 6 = sábado. Convertimos a "días desde el lunes".
  const leadingDays = (firstOfMonth.getDay() + 6) % 7;
  const trailingDays = (7 - ((lastOfMonth.getDay() + 6) % 7) - 1 + 7) % 7;

  const days: CalendarDay[] = [];

  for (let i = leadingDays; i > 0; i--) {
    days.push({ date: new Date(year, month, 1 - i), inMonth: false });
  }
  for (let d = 1; d <= lastOfMonth.getDate(); d++) {
    days.push({ date: new Date(year, month, d), inMonth: true });
  }
  for (let i = 1; i <= trailingDays; i++) {
    days.push({ date: new Date(year, month, lastOfMonth.getDate() + i), inMonth: false });
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
