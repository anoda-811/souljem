import { initialLifestyleItems, normalizeRecord } from "@/lib/domain/lifestyle";
import type { ArchiveData, DailyRecord, LifestyleItem, TrashedHabit } from "@/lib/domain/types";
import { CURRENT_SCHEMA_VERSION, LEGACY_VERSION, migrateToCurrent } from "./migrations";

/** 保存されている形。後から足した欄は無い場合があるため、任意項目にしている */
type StoredArchive = Pick<ArchiveData, "habits" | "journal"> & {
  records: (Partial<DailyRecord> & { date: DailyRecord["date"] })[];
  trashedHabits?: TrashedHabit[];
  lifestyleItems?: LifestyleItem[];
};

/** 版番号つきの保存形式。版番号の無い古いデータは、中身がそのまま archive の形になっている */
export interface StoredEnvelope {
  schemaVersion: number;
  archive: unknown;
}

export function createEmptyArchive(): ArchiveData {
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
 * 保存されているデータを、画面で使う記録の形に直す。
 * 版を上げながら読み、読めないもの（壊れている・新しすぎる版）は null を返す。
 */
export function decodeArchive(value: unknown): ArchiveData | null {
  try {
    const version = isEnvelope(value) ? value.schemaVersion : LEGACY_VERSION;
    const body = isEnvelope(value) ? value.archive : value;
    const migrated = migrateToCurrent(body, version);
    if (!isStoredArchive(migrated)) return null;

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
    return null;
  }
}

/** 保存する形（現在の版番号つき）に包む */
export function encodeArchive(data: ArchiveData): StoredEnvelope {
  return { schemaVersion: CURRENT_SCHEMA_VERSION, archive: data };
}
