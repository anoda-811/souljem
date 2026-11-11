import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
  className?: string;
  /** ページの見出しとして使う場合は h1 にする */
  level?: "h1" | "h2" | "h3";
  /** 日付など数字が多い見出しは body（游明朝の数字）にする */
  titleFont?: "display" | "body";
}

/** 欧文の小見出し（eyebrow）と明朝の見出しを組み合わせたセクション見出し */
export function SectionHeading({
  eyebrow,
  title,
  action,
  className,
  level: Heading = "h2",
  titleFont = "display",
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-x-4 gap-y-3",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="font-display text-[0.95rem] italic tracking-[0.12em] text-amethyst">
            {eyebrow}
          </p>
        )}
        <Heading
          className={cn(
            "mt-1 text-2xl font-semibold tracking-[0.04em] text-ink sm:text-[1.7rem]",
            titleFont === "display" ? "font-display" : "font-body",
          )}
        >
          {title}
        </Heading>
      </div>
      {action}
    </div>
  );
}
