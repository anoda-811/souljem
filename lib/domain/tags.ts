import type { Tag } from "./types";

/** タグ名の最大文字数（追加と名前変更で共通） */
export const TAG_NAME_MAX = 12;

/** 初めて使うとき入っているタグ。消しても、ほかのタグには影響しない */
export const DEFAULT_TAGS: readonly Tag[] = [
  { id: "tag-sleep", name: "睡眠" },
  { id: "tag-meal", name: "食事" },
  { id: "tag-exercise", name: "運動" },
  { id: "tag-mood", name: "気分" },
  { id: "tag-body", name: "体調" },
];

/** 新しく作るタグの id。画面で作ったものは、重ならないよう時刻と乱数を混ぜる */
export function createTagId(): string {
  return `tag-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
