import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const CORNER_POSITIONS = [
  "-top-1.5 -left-1.5",
  "-top-1.5 -right-1.5",
  "-bottom-1.5 -left-1.5",
  "-bottom-1.5 -right-1.5",
];

/** 札の四隅に打つ菱形の飾り。ダイアログなど札以外の面でも使う */
export function CornerOrnaments() {
  return (
    <>
      {CORNER_POSITIONS.map((position) => (
        <span
          key={position}
          aria-hidden
          className={cn(
            "absolute h-2.5 w-2.5 rotate-45 border border-gilt bg-vellum",
            position,
          )}
        />
      ))}
    </>
  );
}

interface ManuscriptCardProps {
  children?: ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
  /** 余白を詰めたい場合に指定する */
  compact?: boolean;
}

/** 古書の札。二重罫と四隅の菱飾りを持つ、アプリの基本の面 */
export function ManuscriptCard({
  children,
  className,
  as: Tag = "section",
  compact = false,
}: ManuscriptCardProps) {
  return (
    <Tag className={cn("manuscript", compact ? "p-5 sm:p-6" : "p-6 sm:p-9", className)}>
      <CornerOrnaments />
      <div className="relative">{children}</div>
    </Tag>
  );
}
