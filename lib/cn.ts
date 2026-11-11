/** 条件付きで class 名を結合する小さなユーティリティ */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
