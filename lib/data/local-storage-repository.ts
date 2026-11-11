import type { ArchiveData, TrashedHabit } from "@/lib/domain/types";
import type { SoulArchiveRepository } from "./repository";

/**
 * v2 で記録の形を作り直したため、キーを分けている。
 * 旧 v1 の仮データは読み込まない。
 */
const STORAGE_KEY = "soul-archive:v2";

/** 保存されている形。削除した習慣の欄は後から足したため、無い場合がある */
type StoredArchive = Pick<ArchiveData, "records" | "habits" | "journal"> & {
  trashedHabits?: TrashedHabit[];
};

function createEmptyArchive(): ArchiveData {
  return { records: [], habits: [], journal: [], trashedHabits: [] };
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
    return {
      records: parsed.records,
      habits: parsed.habits,
      journal: parsed.journal,
      trashedHabits: parsed.trashedHabits ?? [],
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
