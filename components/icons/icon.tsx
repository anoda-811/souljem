import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * ファンタジー・RPG 調の線画アイコン。
 * すべて 24×24 のストローク描画で統一し、太さ・角の処理を揃えている。
 */
export type IconName =
  | "book"
  | "gem"
  | "scroll"
  | "compass"
  | "quill"
  | "flask"
  | "moon"
  | "chalice"
  | "boot"
  | "archive"
  | "check"
  | "arrow"
  | "sparkle"
  | "flame";

const PATHS: Record<IconName, ReactNode> = {
  // 開いた魔導書（ホーム）
  book: (
    <>
      <path d="M2.8 5.6c2.6-1.1 5.6-1 9.2 1.3 3.6-2.3 6.6-2.4 9.2-1.3v13.2c-2.6-1.1-5.6-1-9.2 1.3-3.6-2.3-6.6-2.4-9.2-1.3z" />
      <path d="M12 6.9v13.2" />
    </>
  ),
  // 魔法の宝石（ソウルジェム）
  gem: (
    <>
      <path d="M7.2 4h9.6l4.2 5.6L12 20.4 3 9.6z" />
      <path d="M3 9.6h18" />
      <path d="M9.6 4 8.2 9.6 12 20.4l3.8-10.8L14.4 4" />
    </>
  ),
  // 巻物（今日の記録）
  scroll: (
    <>
      <path d="M5.5 6.5c0-1.6 1.2-3 2.7-3h9.3v14.2c0 1.5-1 2.8-2.6 2.8H7.8c-1.3 0-2.3-1.1-2.3-2.4" />
      <path d="M9.5 8h5M9.5 11.5h5M9.5 15h3" />
    </>
  ),
  // 方位磁針（習慣）
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 6.4v2.2M12 15.4v2.2M6.4 12h2.2M15.4 12h2.2" />
      <path d="M12 8.2 13.9 12 12 15.8 10.1 12z" />
    </>
  ),
  // 羽根ペン（日記）
  quill: (
    <>
      <path d="M19.6 4.4C13.4 4.6 9 9 7.8 15.2L6.1 19.8l4.6-1.6c6.1-1.2 8.8-6.2 8.9-13.8z" />
      <path d="M6.1 19.8 13.6 12.2" />
    </>
  ),
  // 錬金術の蒸留フラスコ（研究）
  flask: (
    <>
      <path d="M9.5 3.5h5" />
      <path d="M10.4 3.5v5.4L5.6 17.2a2.4 2.4 0 0 0 2.1 3.6h8.6a2.4 2.4 0 0 0 2.1-3.6l-4.8-8.3V3.5" />
      <path d="M7.6 14.6h8.8" />
    </>
  ),
  // 三日月（睡眠）
  moon: (
    <>
      <path d="M14.6 3.9a8.2 8.2 0 1 0 5.5 13.6 6.9 6.9 0 0 1-5.5-13.6z" />
      <path d="M18.6 3.2v3.4M16.9 4.9h3.4" />
    </>
  ),
  // 聖杯（食事）
  chalice: (
    <>
      <path d="M6.8 3.5h10.4c0 4.4-2.3 7.4-5.2 7.4S6.8 7.9 6.8 3.5z" />
      <path d="M6.8 6.2h10.4" />
      <path d="M12 10.9v7.6" />
      <path d="M8.2 20.5h7.6" />
    </>
  ),
  // 旅人の長靴（運動）
  boot: (
    <>
      <path d="M8.2 3.5h5.2v9.3l5.6 2.6c1 .5 1.6 1.4 1.6 2.5v1.6H8.2z" />
      <path d="M8.2 9.5h5.2" />
    </>
  ),
  // 書架（過去の記録）
  archive: (
    <>
      <path d="M4.5 6.5h3v13h-3z" />
      <path d="M8.5 3.5h3.2v16H8.5z" />
      <path d="M12.7 7.5h3.2v12h-3.2z" />
      <path d="M3 20.5h17.5" />
    </>
  ),
  check: <path d="M5 12.6 9.6 17 19 7.4" />,
  arrow: (
    <>
      <path d="M4.5 12h14.5" />
      <path d="M13.2 6.5 18.7 12l-5.5 5.5" />
    </>
  ),
  // 四芒の輝き
  sparkle: (
    <path d="M12 3.5c.7 4.6 2.9 6.8 7.5 7.5-4.6.7-6.8 2.9-7.5 7.5-.7-4.6-2.9-6.8-7.5-7.5 4.6-.7 6.8-2.9 7.5-7.5z" />
  ),
  // 灯火（継続）
  flame: (
    <path d="M12.4 3.2c.8 3.4 4.6 5.2 4.6 9.6a5 5 0 0 1-10 0c0-2.2 1-3.7 2.2-4.8.2 1.6.8 2.7 2 3.4-.4-2.8.1-5.6 1.2-8.2z" />
  ),
};

interface IconProps {
  name: IconName;
  className?: string;
  /** 指定するとアクセシブルな画像として読み上げられる */
  label?: string;
}

export function Icon({ name, className, label }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5 shrink-0", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {PATHS[name]}
    </svg>
  );
}
