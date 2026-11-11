import { initialLifestyleItems, normalizeRecord } from "@/lib/domain/lifestyle";
import type { ArchiveData, DailyRecord, LifestyleItem, TrashedHabit } from "@/lib/domain/types";
import type { SoulArchiveRepository } from "./repository";

/**
 * v2 で記録の形を作り直したため、キーを分けている。
 * 旧 v1 の仮データは読み込まない。
 */
const STORAGE_KEY = "soul-archive:v2";

/** 保存されている形。後から足した欄は無い場合があるため、任意項目にしている */
type StoredArchive = Pick<ArchiveData, "habits" | "journal"> & {
  records: (Partial<DailyRecord> & { date: DailyRecord["date"] })[];
  trashedHabits?: TrashedHabit[];
  lifestyleItems?: LifestyleItem[];
};

function createEmptyArchive(): ArchiveData {
  return {
    records: [],
    habits: [],
    journal: [],
    trashedHabits: [],
    lifestyleItems: initialLifestyleItems([]),
  };
}

function isStoredArchive(value: unknown): value is StoredArchive {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    Array.isArray(candidate.records) &&
    Array.isArray(candidate.habits) &&
    Array.isArray(candidate.journal)
  );
}

function readStorage(): ArchiveData | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredArchive(parsed)) return null;

    // 古い記録の欄（読書など）は行動・気分の値に移し、欠けている欄は既定値で埋める
    const records = parsed.records.map(normalizeRecord);
    return {
      records,
      habits: parsed.habits,
      journal: parsed.journal,
      trashedHabits: parsed.trashedHabits ?? [],
      lifestyleItems: parsed.lifestyleItems ?? initialLifestyleItems(records),
    };
  } catch {
    return null;
  }
}

function writeStorage(data: ArchiveData): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // 保存できない環境（容量超過・プライベートブラウズ等）では、表示のみ継続する
  }
}

/** ブラウザの localStorage に記録を保存する実装。初回は空の記録から始まる */
export const localStorageRepository: SoulArchiveRepository = {
  async load() {
    return readStorage() ?? createEmptyArchive();
  },

  async save(data) {
    writeStorage(data);
  },
};
