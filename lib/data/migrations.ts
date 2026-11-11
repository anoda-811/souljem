/**
 * 保存データの版番号と、版をまたぐ変換。
 *
 * - 版番号を付ける前に保存されていたデータは、LEGACY_VERSION として扱う。
 *   （今の記録の形がそれにあたる。移行前の既存データはこの形のまま読める）
 * - 記録の形を変えるときは、CURRENT_SCHEMA_VERSION を 1 上げ、
 *   その下の段（from → from+1）の変換を MIGRATIONS に足す。
 *   古い版のデータは、開いたときに順番に変換されてから画面に渡る。
 */

/** 版番号を付ける前のデータの版 */
export const LEGACY_VERSION = 2;

/** いまの保存形式の版 */
export const CURRENT_SCHEMA_VERSION = 2;

/** from の版の形を、from + 1 の版の形に変える */
type Migration = (body: unknown) => unknown;

/** 版ごとの変換。キーは変換元の版。現在は変換が無い（版 2 のまま） */
const MIGRATIONS: Record<number, Migration> = {};

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
