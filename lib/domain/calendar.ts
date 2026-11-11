import { addDays, parseISODate } from "./date";
import type { ISODate } from "./types";

export interface YearMonth {
  year: number;
  month: number;
}

export function toYearMonth(date: ISODate): YearMonth {
  const { year, month } = parseISODate(date);
  return { year, month };
}

export function shiftYearMonth(ym: YearMonth, delta: number): YearMonth {
  const index = ym.year * 12 + (ym.month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

/** 負の値なら ym の方が前、正の値なら後 */
export function compareYearMonth(a: YearMonth, b: YearMonth): number {
  return a.year * 12 + a.month - (b.year * 12 + b.month);
}

/** "YYYY-MM" 形式。日付が月に属するか判定する際に使う */
export function toMonthKey(ym: YearMonth): string {
  return `${ym.year}-${String(ym.month).padStart(2, "0")}`;
}

export function formatYearMonthJa(ym: YearMonth): string {
  return `${ym.year}年${ym.month}月`;
}

/** 日曜始まりの6週間（42日）を返す。前後の月の日も含む */
export function getMonthGrid(ym: YearMonth): ISODate[] {
  const first = `${toMonthKey(ym)}-01`;
  const weekday = new Date(`${first}T00:00:00Z`).getUTCDay();
  const start = addDays(first, -weekday);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}
