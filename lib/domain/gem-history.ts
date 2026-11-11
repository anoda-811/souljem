/**
 * ソウルジェムの履歴（濁り度の推移・統計）を作る純粋な関数。
 * 画面に依存しないので、表示を変えても計算は変わらない。
 */

import { addDays } from "./date";
import { averageTurbidity } from "./record";
import type { DailyRecord, ISODate } from "./types";

/** 1日分の濁り度（朝・昼・晩の平均） */
export interface TurbidityPoint {
  date: ISODate;
  value: number;
}

/** 推移の表示期間。数字は直近の日数、all は記録のある全期間 */
export type TrendRange = 7 | 30 | 90 | "all";

/** 濁り度を記した日だけを、日付の古い順に並べる。未来の日は含めない */
export function buildSeries(records: readonly DailyRecord[], today: ISODate): TurbidityPoint[] {
  const points: TurbidityPoint[] = [];
  for (const record of records) {
    if (record.date > today) continue;
    const value = averageTurbidity(record.turbidity);
    if (value !== null) points.push({ date: record.date, value });
  }
  return points.sort((a, b) => a.date.localeCompare(b.date));
}

/** 期間内の点だけを残す */
export function filterRange(
  series: readonly TurbidityPoint[],
  range: TrendRange,
  today: ISODate,
): TurbidityPoint[] {
  if (range === "all") return [...series];
  const start = addDays(today, -(range - 1));
  return series.filter((point) => point.date >= start);
}

/**
 * 直近 window 日（暦日）の平均。各点について、その日を含む直近 window 日の記録の平均を出す。
 * 記録が飛んでいても、記録のある日だけで平均する。
 */
export function rollingAverage(
  series: readonly TurbidityPoint[],
  window = 7,
): TurbidityPoint[] {
  return series.map((point) => {
    const start = addDays(point.date, -(window - 1));
    const within = series.filter((other) => other.date >= start && other.date <= point.date);
    const mean = within.reduce((sum, other) => sum + other.value, 0) / within.length;
    return { date: point.date, value: Math.round(mean * 10) / 10 };
  });
}

export interface SeriesSummary {
  count: number;
  /** 平均。記録がなければ null */
  mean: number | null;
  /** もっとも澄んでいた日（同点なら新しい日） */
  clearest: TurbidityPoint | null;
  /** もっとも濁っていた日（同点なら新しい日） */
  murkiest: TurbidityPoint | null;
}

export function summarize(series: readonly TurbidityPoint[]): SeriesSummary {
  if (series.length === 0) {
    return { count: 0, mean: null, clearest: null, murkiest: null };
  }
  const total = series.reduce((sum, point) => sum + point.value, 0);
  // 同点のときは新しい日を選ぶ（後ろから見て、より新しい点を優先する）
  let clearest = series[0];
  let murkiest = series[0];
  for (const point of series) {
    if (point.value <= clearest.value) clearest = point;
    if (point.value >= murkiest.value) murkiest = point;
  }
  return {
    count: series.length,
    mean: Math.round((total / series.length) * 10) / 10,
    clearest,
    murkiest,
  };
}
