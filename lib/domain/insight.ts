import type { Insight } from "./types";

/** 考察の一行の最大文字数 */
export const INSIGHT_TEXT_MAX = 200;

/** 考察の一行の id。画面で足したものは、重ならないよう時刻と乱数を混ぜる */
export function createInsightId(): string {
  return `ins-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 保存されていた考察の一行を、今の形に直す。
 * 文字だけの古い形（版 3 まで）も、タグ付きの形も読める。読めないものは捨てる。
 */
export function normalizeInsight(raw: unknown): Insight | null {
  if (typeof raw === "string") {
    const text = raw.trim();
    return text ? { id: createInsightId(), text, tags: [] } : null;
  }
  if (typeof raw !== "object" || raw === null) return null;

  const candidate = raw as Record<string, unknown>;
  if (typeof candidate.text !== "string" || candidate.text.trim() === "") return null;
  return {
    id: typeof candidate.id === "string" ? candidate.id : createInsightId(),
    text: candidate.text.trim(),
    tags: Array.isArray(candidate.tags)
      ? candidate.tags.filter((tagId): tagId is string => typeof tagId === "string")
      : [],
  };
}
