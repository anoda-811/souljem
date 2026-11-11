import { initialLifestyleItems, normalizeRecord } from "@/lib/domain/lifestyle";
import type { ArchiveData, DailyRecord, LifestyleItem, TrashedHabit } from "@/lib/domain/types";
import { CURRENT_SCHEMA_VERSION, LEGACY_VERSION, migrateToCurrent } from "./migrations";
import type { SoulArchiveRepository } from "./repository";

/** 保存されている形。後から足した欄は無い場合があるため、任意項目にしている */
type StoredArchive = Pick<ArchiveData, "habits" | "journal"> & {
  records: (Partial<DailyRecord> & { date: DailyRecord["date"] })[];
  trashedHabits?: TrashedHabit[];
  lifestyleItems?: LifestyleItem[];
};

/** 版番号つきの保存形式。版番号の無い古いデータは、中身がそのまま archive の形になっている */
interface StoredEnvelope {
  schemaVersion: number;
  archive: unknown;
}

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

function isEnvelope(value: unknown): value is StoredEnvelope {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.schemaVersion === "number" && "archive" in candidate;
}

/**
 * 保存データを読む。何も無ければ null。
 * 読めないデータ（壊れている・新しすぎる版）は消さずに退避してから null を返す。
 */
function readArchive(storageKey: string): ArchiveData | null {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    const version = isEnvelope(parsed) ? parsed.schemaVersion : LEGACY_VERSION;
    const body = isEnvelope(parsed) ? parsed.archive : parsed;
    const migrated = migrateToCurrent(body, version);
    if (!isStoredArchive(migrated)) throw new Error("記録の形が合いません");

    // 古い記録の欄（読書など）は行動・気分の値に移し、欠けている欄は既定値で埋める
    const records = migrated.records.map(normalizeRecord);
    return {
      records,
      habits: migrated.habits,
      journal: migrated.journal,
      trashedHabits: migrated.trashedHabits ?? [],
      lifestyleItems: migrated.lifestyleItems ?? initialLifestyleItems(records),
    };
  } catch {
    // 読めなかった元のデータは、次の保存で上書きされないよう別の鍵に残す
    if (raw) {
      try {
        window.localStorage.setItem(`${storageKey}:backup:${Date.now()}`, raw);
      } catch {
        // 退避もできない環境では、ここでは何もしない
      }
    }
    return null;
  }
}

function writeArchive(storageKey: string, data: ArchiveData): void {
  const envelope: StoredEnvelope = { schemaVersion: CURRENT_SCHEMA_VERSION, archive: data };
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(envelope));
  } catch {
    // 保存できない環境（容量超過・プライベートブラウズ等）では、表示のみ継続する
  }
}

/**
 * 指定した鍵の localStorage に記録を保存する実装。
 * アカウントごとに鍵を分けるため、呼び出し側で鍵を渡す。
 */
export function createLocalStorageRepository(storageKey: string): SoulArchiveRepository {
  return {
    async load() {
      return readArchive(storageKey) ?? createEmptyArchive();
    },

    async save(data) {
      writeArchive(storageKey, data);
    },
  };
}
