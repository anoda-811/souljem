import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * 各ページの大見出し（h1）。ページ名でも日付でも、この一つの定義を使って
 * 大きさ・書体・行間を全ページで揃える。
 */
export function PageTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h1
      className={cn(
        "mt-3 font-body text-4xl leading-[1.2] font-semibold tracking-[0.03em] text-ink sm:text-5xl",
        className,
      )}
    >
      {children}
    </h1>
  );
}
