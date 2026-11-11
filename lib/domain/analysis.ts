/**
 * 研究ページの分析ロジック。
 * 濁り度（その日の朝・昼・晩の平均）を Y 軸に、生活習慣の値を X 軸に取り、
 * 当日・前日・2日前の組み合わせで2軸の関係を調べる。
 *
 * ここで出す値はあくまで「一緒に動く傾向」の要約であり、因果関係は示さない。
 */

import { addDays } from "./date";
import { scaleOf } from "./lifestyle";
import { averageTurbidity } from "./record";
import { calculateStreak } from "./streak";
import type { DailyRecord, Habit, ISODate, LifestyleItem } from "./types";

/** 何日前の生活習慣と比べるか（0 = 当日） */
export type LagDays = 0 | 1 | 2;

/** 集計する期間。数字は直近の日数、all は記録のある全期間 */
export type PeriodDays = 7 | 30 | 90 | "all";

/** 変数の大分類。研究ページで、タブをまとめて見せるために使う */
export type VariableGroup = "daily" | "lifestyle" | "habit";

export const GROUP_LABELS: Record<VariableGroup, string> = {
  daily: "生活・睡眠",
  lifestyle: "行動・気分",
  habit: "習慣の継続",
};

export interface VariableDef {
  /** 選択に使う id。習慣は "habit:" で始め、記録項目の id と区別する */
  id: string;
  group: VariableGroup;
  /** 切り替えボタン・見出しに使う名前 */
  label: string;
  /** X 軸の名前（「〜が多い日ほど」などの文に使う） */
  axisLabel: string;
  /** 数値（散布図）か、段階の分類（平均の棒グラフ）か */
  kind: "numeric" | "category";
  /** 分類データの段階名（1 から順に） */
  categories?: readonly string[];
  unit: string;
  /**
   * 日付 date の X の値を返す。未記録なら null。
   * record は、その日の記録（無ければ undefined）。習慣の継続日数のように記録が無い日も値を出せる。
   */
  extract(date: ISODate, record: DailyRecord | undefined): number | null;
}

/** 睡眠・運動など、常に使える変数と、設定で有効にした行動・気分、記録中の習慣から変数の一覧を作る */
export function buildVariables(
  lifestyleItems: readonly LifestyleItem[],
  habits: readonly Habit[],
): VariableDef[] {
  const daily: VariableDef[] = [
    {
      id: "sleep",
      group: "daily",
      label: "睡眠時間",
      axisLabel: "睡眠時間",
      kind: "numeric",
      unit: "時間",
      extract: (_date, record) => record?.sleep?.hours ?? null,
    },
    {
      id: "exercise",
      group: "daily",
      label: "運動時間",
      axisLabel: "運動時間",
      kind: "numeric",
      unit: "分",
      // 時間（分）で記した運動だけを合計する。回数だけの日は対象外
      extract: (_date, record) => {
        const minutes = record?.exercises.filter((entry) => entry.mode === "minutes") ?? [];
        if (minutes.length === 0) return null;
        return minutes.reduce((sum, entry) => sum + entry.amount, 0);
      },
    },
  ];

  const lifestyle = lifestyleItems
    .filter((item) => item.enabled)
    .map((item): VariableDef => {
      const base = {
        id: item.id,
        group: "lifestyle" as const,
        label: item.label,
        axisLabel: item.label,
      };
      if (item.kind === "minutes") {
        return {
          ...base,
          kind: "numeric",
          unit: "分",
          extract: (_date, record) => record?.lifestyle[item.id] ?? null,
        };
      }
      return {
        ...base,
        kind: "category",
        categories: scaleOf(item),
        unit: "段階",
        extract: (_date, record) => record?.lifestyle[item.id] ?? null,
      };
    });

  // 習慣の継続日数。開始日より前は値を出さない（まだ始めていない日）
  const habitVariables = habits.map((habit): VariableDef => ({
    id: `habit:${habit.id}`,
    group: "habit",
    label: `${habit.name}の継続`,
    axisLabel: `「${habit.name}」の継続日数`,
    kind: "numeric",
    unit: "日",
    extract: (date) => (date < habit.startDate ? null : calculateStreak(habit.marks, date, habit.startDate)),
  }));

  return [...daily, ...lifestyle, ...habitVariables];
}

/** 指定 id の変数を探す。無ければ先頭の変数（選んでいた項目を消したときの戻り先） */
export function findVariable(variables: readonly VariableDef[], id: string): VariableDef {
  return variables.find((variable) => variable.id === id) ?? variables[0];
}

/** 1点の観測。日付 date の濁り度 y と、lag 日前の生活習慣 x を組にする */
export interface Sample {
  date: ISODate;
  xDate: ISODate;
  x: number;
  y: number;
}

/**
 * 期間内で、濁り度と X（lag 日前）の両方が記されている日の組を集める。
 * 未来の日は含めない。X は記録が無い日でも、習慣の継続日数のように値があれば使う。
 */
export function collectSamples(
  records: readonly DailyRecord[],
  variable: VariableDef,
  lag: LagDays,
  period: PeriodDays,
  today: ISODate,
): Sample[] {
  const byDate = new Map(records.map((record) => [record.date, record]));
  const start = period === "all" ? null : addDays(today, -(period - 1));
  const samples: Sample[] = [];

  for (const record of records) {
    if (record.date > today) continue;
    if (start !== null && record.date < start) continue;

    const y = averageTurbidity(record.turbidity);
    if (y === null) continue;

    const xDate = addDays(record.date, -lag);
    const x = variable.extract(xDate, byDate.get(xDate));
    if (x === null) continue;

    samples.push({ date: record.date, xDate, x, y });
  }

  return samples.sort((a, b) => a.date.localeCompare(b.date));
}

/** ピアソンの積率相関係数。分散がなければ計算できないため null */
export function pearson(xs: readonly number[], ys: readonly number[]): number | null {
  const n = xs.length;
  if (n < 2 || n !== ys.length) return null;

  const meanX = xs.reduce((sum, value) => sum + value, 0) / n;
  const meanY = ys.reduce((sum, value) => sum + value, 0) / n;

  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }

  if (sxx === 0 || syy === 0) return null;
  return sxy / Math.sqrt(sxx * syy);
}

/** 最小二乗法による近似直線。x の分散がなければ null */
export function fitLine(
  xs: readonly number[],
  ys: readonly number[],
): { slope: number; intercept: number } | null {
  const n = xs.length;
  if (n < 2 || n !== ys.length) return null;

  const meanX = xs.reduce((sum, value) => sum + value, 0) / n;
  const meanY = ys.reduce((sum, value) => sum + value, 0) / n;

  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < n; i += 1) {
    sxy += (xs[i] - meanX) * (ys[i] - meanY);
    sxx += (xs[i] - meanX) ** 2;
  }

  if (sxx === 0) return null;
  const slope = sxy / sxx;
  return { slope, intercept: meanY - slope * meanX };
}

/**
 * データ数に応じた信頼の段階。
 * - none: 5日未満。相関係数は出さず、データ不足を伝える
 * - tentative: 5〜9日。数値は出すが参考値に留める
 * - reported: 10日以上。傾向として述べるが、断定はしない
 */
export type Reliability = "none" | "tentative" | "reported";

export function reliabilityOf(n: number): Reliability {
  if (n < 5) return "none";
  if (n < 10) return "tentative";
  return "reported";
}

export interface Stats {
  n: number;
  /** 相関係数。データ不足や分散なしのときは null */
  r: number | null;
  reliability: Reliability;
  fit: { slope: number; intercept: number } | null;
}

export function computeStats(samples: readonly Sample[]): Stats {
  const xs = samples.map((sample) => sample.x);
  const ys = samples.map((sample) => sample.y);
  const n = samples.length;
  const reliability = reliabilityOf(n);

  return {
    n,
    r: reliability === "none" ? null : pearson(xs, ys),
    reliability,
    fit: reliability === "none" ? null : fitLine(xs, ys),
  };
}

/** 相関係数の強さを、言葉にする */
export function describeStrength(r: number): string {
  const size = Math.abs(r);
  if (size < 0.1) return "ほとんど見られない";
  if (size < 0.3) return "弱い";
  if (size < 0.5) return "中程度の";
  return "強い";
}

/** 分類データの段階ごとの件数と濁り度の平均 */
export interface CategoryBar {
  level: number;
  label: string;
  n: number;
  mean: number | null;
}

export function categoryBars(samples: readonly Sample[], variable: VariableDef): CategoryBar[] {
  const labels = variable.categories ?? [];
  return labels.map((label, index) => {
    const level = index + 1;
    const group = samples.filter((sample) => sample.x === level);
    const mean =
      group.length === 0
        ? null
        : group.reduce((sum, sample) => sum + sample.y, 0) / group.length;
    return { level, label, n: group.length, mean };
  });
}

/**
 * 結果を、断定しない日本語の一文にする。
 * 相関であり因果ではないことを、必ず添える。
 */
export function interpret(variable: VariableDef, stats: Stats): string {
  if (stats.n === 0) {
    return "この期間に、濁り度と比べられる記録がありません。";
  }
  if (stats.reliability === "none") {
    return `比べられた日は ${stats.n} 日だけです。データが少ないため、関係はまだ読み取れません。5 日以上の記録が集まると、相関係数を出します。`;
  }
  if (stats.r === null) {
    return "値にばらつきがないため、相関係数は計算できません。";
  }

  const { r } = stats;
  // 評価（段階）は「多い・少ない」より「高い・低い」が自然
  const [more, less] = variable.kind === "category" ? ["高い", "低い"] : ["多い", "少ない"];
  const direction =
    r > 0
      ? `${variable.axisLabel}が${more}日ほど濁り度が高い傾向`
      : `${variable.axisLabel}が${less}日ほど濁り度が高い傾向`;
  const strength = describeStrength(r);

  if (stats.reliability === "tentative") {
    return `${stats.n} 日分の参考値です。データが少ないため断定はできませんが、${direction}が${strength === "ほとんど見られない" ? "ほとんど見られません" : "うっすら見えます"}。`;
  }

  if (strength === "ほとんど見られない") {
    return `${stats.n} 日分の記録では、${variable.axisLabel}と濁り度の関係はほとんど見られません。`;
  }
  return `${stats.n} 日分の記録では、${direction}が見られ、${strength}相関があります。ただし、一緒に動く傾向であり、原因と結果を示すものではありません。`;
}
