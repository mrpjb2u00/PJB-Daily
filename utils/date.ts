export function formatCalendarDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function getLocalTodayDateString(date = new Date()): string {
  return formatCalendarDate(date.getFullYear(), date.getMonth(), date.getDate());
}

export function parseCalendarDate(dateStr: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function daysBetweenCalendarDates(start: Date, target: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const startTime = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const targetTime = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((targetTime - startTime) / msPerDay);
}

export function formatCalendarDateLabel(
  dateStr: string,
  options: Intl.DateTimeFormatOptions,
): string {
  const date = parseCalendarDate(dateStr);
  return date ? date.toLocaleDateString('en-US', options) : '';
}

export function addCalendarMonths(date: Date, months: number): Date {
  const targetMonth = date.getMonth() + months;
  const targetYear = date.getFullYear() + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const targetDay = Math.min(date.getDate(), getDaysInMonth(targetYear, normalizedMonth));

  return new Date(
    targetYear,
    normalizedMonth,
    targetDay,
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );
}
