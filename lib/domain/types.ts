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

/** 1〜5 の段階評価 */
export type Rating = 1 | 2 | 3 | 4 | 5;

export interface SleepRecord {
  hours: number;
  quality: 1 | 2 | 3 | 4 | 5;
}

/**
 * 行動・気分の項目の種類。
 * - minutes: 時間（分）。0 以上の整数
 * - rating: 1〜5 の段階評価
 */
export type LifestyleKind = "minutes" | "rating";

/** 行動・気分の項目の定義。ユーザーが設定画面で増やし、名前や使う・使わないを変えられる */
export interface LifestyleItem {
  id: string;
  label: string;
  kind: LifestyleKind;
  /** 段階評価の 1〜5 の呼び名。minutes では使わない */
  scale?: readonly string[];
  /** オフのときは記録画面と分析に出さない（記録した値は残す） */
  enabled: boolean;
}

/** 1日分の観測記録 */
export interface DailyRecord {
  date: ISODate;
  /** 朝・昼・晩の濁り度。その日の数値はこの平均になる */
  turbidity: TurbidityReadings;
  sleep: SleepRecord | null;
  meals: MealRecords;
  exercises: ExerciseEntry[];
  /** 考察。「こうすればこうなるかも」を一項目ずつ箇条書きで記す。記していない日は空の配列 */
  insights: Insight[];
  /**
   * 行動・気分の値。キーは LifestyleItem の id。
   * 記していない項目はキーを持たない（画面では未記録として扱う）。
   */
  lifestyle: Partial<Record<string, number>>;
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

/** タグ。考察の一行ごとに付ける印で、種類は設定画面で増やしたり名前を変えたりできる */
export interface Tag {
  id: string;
  name: string;
}

/** 考察の一行。タグは ArchiveData.tags の id を持つ */
export interface Insight {
  id: string;
  text: string;
  /** 付いているタグの id。付けていない行は空の配列 */
  tags: string[];
}

/** 保存層から取り出す、アプリ全体の記録データ */
export interface ArchiveData {
  records: DailyRecord[];
  /** タグの種類（設定画面で編集する） */
  tags: Tag[];
  habits: Habit[];
  journal: JournalEntry[];
  trashedHabits: TrashedHabit[];
  /** 行動・気分の項目の定義（設定画面で編集する） */
  lifestyleItems: LifestyleItem[];
}
