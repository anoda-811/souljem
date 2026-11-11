import { clampTurbidity } from "./turbidity";
import { formatMinutes } from "./format";
import type {
  DailyRecord,
  ExerciseEntry,
  ISODate,
  MealSlot,
  TimeSlot,
  TurbidityReadings,
} from "./types";

/** 濁り度を測る時間帯（表示順） */
export const TIME_SLOTS: readonly { slot: TimeSlot; label: string }[] = [
  { slot: "morning", label: "朝" },
  { slot: "noon", label: "昼" },
  { slot: "evening", label: "晩" },
];

/** 食事の枠（表示順）と、入力欄の例文 */
export const MEAL_SLOTS: readonly { slot: MealSlot; label: string; placeholder: string }[] = [
  { slot: "breakfast", label: "朝食", placeholder: "例：雑穀米と味噌汁、焼き魚" },
  { slot: "lunch", label: "昼食", placeholder: "例：パンとスープ、少しの果物" },
  { slot: "dinner", label: "夕食", placeholder: "例：鍋料理、蒸し野菜と卵" },
  { slot: "snack", label: "間食", placeholder: "例：ナッツ、ほうじ茶" },
];

/** 食事評価と気分の段階名（1〜5の順） */
export const MEAL_RATING_LABELS: readonly string[] = [
  "乱れた",
  "少し乱れた",
  "ふつう",
  "整っていた",
  "とても整っていた",
];

export const MOOD_LABELS: readonly string[] = [
  "沈んでいる",
  "やや沈む",
  "ふつう",
  "穏やか",
  "晴れやか",
];

export function emptyRecord(date: ISODate): DailyRecord {
  return {
    date,
    turbidity: {},
    sleep: null,
    meals: {},
    exercises: [],
    note: null,
    lifestyle: {},
  };
}

/** 朝・昼・晩のうち記されたものの平均。1つも記していなければ null */
export function averageTurbidity(readings: TurbidityReadings): number | null {
  const values = TIME_SLOTS.map(({ slot }) => readings[slot]).filter(
    (value): value is number => typeof value === "number",
  );
  if (values.length === 0) return null;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return clampTurbidity(mean);
}

/** 何か一項目でも記されているか（研究の起点や、カレンダーの印に使う） */
export function hasRecordContent(record: DailyRecord): boolean {
  return (
    averageTurbidity(record.turbidity) !== null ||
    record.sleep !== null ||
    MEAL_SLOTS.some(({ slot }) => Boolean(record.meals[slot])) ||
    record.exercises.length > 0 ||
    Boolean(record.note) ||
    Object.keys(record.lifestyle).length > 0
  );
}

/** 運動の量を、数え方に合わせた表記にする */
export function formatExerciseAmount(entry: ExerciseEntry): string {
  return entry.mode === "reps" ? `${entry.amount} 回` : formatMinutes(entry.amount);
}
