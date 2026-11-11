import type { IconName } from "@/components/icons/icon";

export interface NavItem {
  href: string;
  label: string;
  sub: string;
  icon: IconName;
  numeral: string;
}

/** 手帳の目次として並べる、アプリ全体のナビゲーション定義 */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "ホーム", sub: "今日の観測", icon: "book", numeral: "I" },
  { href: "/gem", label: "ソウルジェム", sub: "濁りを記す", icon: "gem", numeral: "II" },
  { href: "/record", label: "今日の記録", sub: "睡眠・食事・運動", icon: "scroll", numeral: "III" },
  { href: "/habits", label: "習慣", sub: "継続の印", icon: "compass", numeral: "IV" },
  { href: "/journal", label: "日記", sub: "頁と書架", icon: "quill", numeral: "V" },
  { href: "/research", label: "研究", sub: "関係の分析", icon: "flask", numeral: "VI" },
];
