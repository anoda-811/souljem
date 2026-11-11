/** "YYYY-MM-DD" 形式の日付キー（日本時間基準） */
export type ISODate = string;

/** 濁り度。0（澄明）〜 100（深い濁り）の主観入力値 */
export type Turbidity = number;

/** 濁り度を測る時間帯 */
export type TimeSlot = "morning" | "noon" | "evening";

/** 時間帯ごとの濁り度。記していない時間帯は含まない */
export type TurbidityReadings = Partial<Record<TimeSlot, Turbidity>>;

/** 食事の枠 */
export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

/** 枠ごとの食事の内容。記していない枠は含まない */
export type MealRecords = Partial<Record<MealSlot, string>>;

/** 運動の数え方。回数で数えるか、時間（分）で数えるか */
export type ExerciseMode = "reps" | "minutes";

/** 1日の中の、運動1項目 */
export interface ExerciseEntry {
  id: string;
  kind: string;
  mode: ExerciseMode;
  /** mode が reps なら回数、minutes なら分 */
  amount: number;
}

export interface SleepRecord {
  hours: number;
  quality: 1 | 2 | 3 | 4 | 5;
}

/** 1日分の観測記録 */
export interface DailyRecord {
  date: ISODate;
  /** 朝・昼・晩の濁り度。その日の数値はこの平均になる */
  turbidity: TurbidityReadings;
  sleep: SleepRecord | null;
  meals: MealRecords;
  exercises: ExerciseEntry[];
  note: string | null;
}

/** 習慣の1日の記録。done は ○（達成）、missed は ×（未達成） */
export type HabitMark = "done" | "missed";

export interface Habit {
  id: string;
  name: string;
  startDate: ISODate;
  /** 日付ごとの ○ × 。記入していない日はキーを持たない（画面では - と表示） */
  marks: Partial<Record<ISODate, HabitMark>>;
}

export interface JournalEntry {
  date: ISODate;
  title: string;
  body: string;
}

/** 削除した習慣。元に戻せるよう、削除した日と記録をそのまま残す */
export interface TrashedHabit extends Habit {
  deletedOn: ISODate;
}

/** 保存層から取り出す、アプリ全体の記録データ */
export interface ArchiveData {
  records: DailyRecord[];
  habits: Habit[];
  journal: JournalEntry[];
  trashedHabits: TrashedHabit[];
}
