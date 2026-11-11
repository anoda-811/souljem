import type { ISODate } from "./types";

const TIME_ZONE = "Asia/Tokyo";
const DAY_MS = 86_400_000;
const WEEKDAYS_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** 任意の瞬間を、日本時間の "YYYY-MM-DD" に変換する */
export function toISODate(date: Date): ISODate {
  return dateKeyFormatter.format(date);
}

/** 日付に日数を加算する（タイムゾーンの影響を受けない純粋な日付計算） */
export function addDays(date: ISODate, days: number): ISODate {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/** a - b の日数差 */
export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round(
    (Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / DAY_MS,
  );
}

export function getWeekdayJa(date: ISODate): string {
  return WEEKDAYS_JA[new Date(`${date}T00:00:00Z`).getUTCDay()];
}

export function parseISODate(date: ISODate) {
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day, weekday: getWeekdayJa(date) };
}

/** 例: 2026-11-11 → "2026/11/11" */
export function formatShortDate(date: ISODate): string {
  const { year, month, day } = parseISODate(date);
  return `${year}/${month}/${day}`;
}
