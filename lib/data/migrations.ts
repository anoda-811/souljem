/**
 * 保存データの版番号と、版をまたぐ変換。
 *
 * - 版番号を付ける前に保存されていたデータは、LEGACY_VERSION として扱う。
 *   （今の記録の形がそれにあたる。移行前の既存データはこの形のまま読める）
 * - 記録の形を変えるときは、CURRENT_SCHEMA_VERSION を 1 上げ、
 *   その下の段（from → from+1）の変換を MIGRATIONS に足す。
 *   古い版のデータは、開いたときに順番に変換されてから画面に渡る。
 */

/** 版番号を付ける前のデータの版（体調・生活メモが note の文章だった形） */
export const LEGACY_VERSION = 2;

/** いまの保存形式の版（考察の一行がタグを持つ形） */
export const CURRENT_SCHEMA_VERSION = 4;

/** from の版の形を、from + 1 の版の形に変える */
type Migration = (body: unknown) => unknown;

/** 箇条書きの記号（・ - * • など）と、行頭の空白を外す */
const BULLET_PREFIX = /^\s*[・\-*•]\s*/;

/**
 * 体調・生活メモの文章を、考察の箇条書きに分ける。
 * 改行ごとに一項目にし、空の行は捨てる。
 */
function splitNoteIntoInsights(note: unknown): string[] {
  if (typeof note !== "string") return [];
  return note
    .split(/\r?\n/)
    .map((line) => line.replace(BULLET_PREFIX, "").trim())
    .filter((line) => line.length > 0);
}

/** 版 2 → 3: 記録の note（メモの文章）を insights（考察の箇条書き）に移す */
const migrateNoteToInsights: Migration = (body) => {
  if (typeof body !== "object" || body === null) return body;
  const archive = body as { records?: unknown };
  if (!Array.isArray(archive.records)) return body;

  return {
    ...archive,
    records: archive.records.map((record: unknown) => {
      if (typeof record !== "object" || record === null) return record;
      const { note, ...rest } = record as Record<string, unknown>;
      return { ...rest, insights: splitNoteIntoInsights(note) };
    }),
  };
};

/**
 * 版 3 → 4: 考察の一行（文字）を、id・本文・タグの欄を持つ形に変える。
 * タグはまだ無いので、移した行はすべて空のタグで始まる。
 */
const migrateInsightsToObjects: Migration = (body) => {
  if (typeof body !== "object" || body === null) return body;
  const archive = body as { records?: unknown };
  if (!Array.isArray(archive.records)) return body;

  return {
    ...archive,
    records: archive.records.map((record: unknown) => {
      if (typeof record !== "object" || record === null) return record;
      const { date, insights, ...rest } = record as Record<string, unknown>;
      const lines = Array.isArray(insights) ? insights : [];
      return {
        ...rest,
        date,
        insights: lines.flatMap((line: unknown, index: number) =>
          typeof line === "string" && line.trim() !== ""
            ? [{ id: `ins-${String(date)}-${index}`, text: line.trim(), tags: [] }]
            : [],
        ),
      };
    }),
  };
};

/** 版ごとの変換。キーは変換元の版 */
const MIGRATIONS: Record<number, Migration> = {
  2: migrateNoteToInsights,
  3: migrateInsightsToObjects,
};

/**
 * 保存データを現在の版まで順に変換する。
 * 知らない版（新しすぎるデータ）や、変換の無い段があるときは例外を投げ、呼び出し側で退避する。
 */
export function migrateToCurrent(body: unknown, fromVersion: number): unknown {
  if (fromVersion > CURRENT_SCHEMA_VERSION) {
    throw new Error(`新しい版のデータです（版 ${fromVersion}）`);
  }
  let current = body;
  for (let version = fromVersion; version < CURRENT_SCHEMA_VERSION; version += 1) {
    const step = MIGRATIONS[version];
    if (!step) throw new Error(`版 ${version} から先への変換がありません`);
    current = step(current);
  }
  return current;
}
