import { formatMinutes } from "./format";
import { normalizeInsight } from "./insight";
import { MEAL_RATING_LABELS, MOOD_LABELS, emptyRecord } from "./record";
import type { DailyRecord, ISODate, LifestyleItem, LifestyleKind } from "./types";

/** 段階評価の呼び名（食事・気分以外の自作項目で使う、既定の5段階） */
export const DEFAULT_SCALE: readonly string[] = ["低い", "やや低い", "ふつう", "やや高い", "高い"];

/** 設定画面で、ワンタップで追加できるおすすめの項目 */
export interface LifestylePreset {
  id: string;
  label: string;
  kind: LifestyleKind;
  scale?: readonly string[];
}

export const LIFESTYLE_PRESETS: readonly LifestylePreset[] = [
  { id: "reading", label: "読書", kind: "minutes" },
  { id: "digital", label: "デジタル利用", kind: "minutes" },
  { id: "meal", label: "食事評価", kind: "rating", scale: MEAL_RATING_LABELS },
  { id: "mood", label: "気分", kind: "rating", scale: MOOD_LABELS },
];

/** 初めて使うとき既定で入っている項目。読書などは「入れる人は入れる」ため含めない */
const DEFAULT_PRESET_IDS = ["meal", "mood"];

/** 旧版で固定だった項目（記録の欄名 → 項目 id）。古い記録を移すために使う */
const LEGACY_FIELDS: readonly { field: string; id: string }[] = [
  { field: "reading", id: "reading" },
  { field: "voiceTraining", id: "voice" },
  { field: "digitalUse", id: "digital" },
  { field: "mealRating", id: "meal" },
  { field: "mood", id: "mood" },
];

function presetToItem(preset: LifestylePreset, enabled: boolean): LifestyleItem {
  return {
    id: preset.id,
    label: preset.label,
    kind: preset.kind,
    scale: preset.scale,
    enabled,
  };
}

/** 項目の段階評価の呼び名。自作の項目でも必ず5段階を返す */
export function scaleOf(item: LifestyleItem): readonly string[] {
  return item.scale ?? DEFAULT_SCALE;
}

/** 記録の値を、画面に出す文字にする */
export function formatLifestyleValue(item: LifestyleItem, value: number): string {
  if (item.kind === "minutes") return formatMinutes(value);
  return scaleOf(item)[value - 1] ?? String(value);
}

/**
 * 初回・移行時の項目一覧。
 * 食事評価と気分を入れ、読書などは、古い記録にその値があるときだけ入れる。
 */
export function initialLifestyleItems(
  records: readonly { lifestyle?: Partial<Record<string, number>> }[],
): LifestyleItem[] {
  const items = LIFESTYLE_PRESETS.map((preset) =>
    presetToItem(preset, DEFAULT_PRESET_IDS.includes(preset.id)),
  );
  return items.map((item) => {
    if (item.enabled) return item;
    const used = records.some((record) => record.lifestyle?.[item.id] !== undefined);
    return used ? { ...item, enabled: true } : item;
  });
}

/** プリセットから項目を作る（id はプリセットの固定 id を使う） */
export function presetItem(preset: LifestylePreset): LifestyleItem {
  return presetToItem(preset, true);
}

/**
 * 保存されていた記録を、現在の形に直す。
 * 旧版の固定欄（reading など）は lifestyle の値として移し、欠けている欄は既定値で埋める。
 */
export function normalizeRecord(raw: Partial<DailyRecord> & { date: ISODate }): DailyRecord {
  const legacy = raw as unknown as Record<string, unknown>;
  const lifestyle: Partial<Record<string, number>> = {};

  for (const { field, id } of LEGACY_FIELDS) {
    const value = legacy[field];
    if (typeof value === "number" && Number.isFinite(value)) lifestyle[id] = value;
  }
  for (const [id, value] of Object.entries(raw.lifestyle ?? {})) {
    if (typeof value === "number" && Number.isFinite(value)) lifestyle[id] = value;
  }

  const base = emptyRecord(raw.date);
  return {
    ...base,
    turbidity: raw.turbidity ?? base.turbidity,
    sleep: raw.sleep ?? base.sleep,
    meals: raw.meals ?? base.meals,
    exercises: raw.exercises ?? base.exercises,
    insights: Array.isArray(raw.insights)
      ? raw.insights.flatMap((item: unknown) => {
          const insight = normalizeInsight(item);
          return insight ? [insight] : [];
        })
      : base.insights,
    lifestyle,
  };
}
