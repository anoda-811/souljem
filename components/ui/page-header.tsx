import type { ReactNode } from "react";
import { OrnamentDivider } from "@/components/ui/ornament-divider";
import { PageTitle } from "@/components/ui/page-title";
import { cn } from "@/lib/cn";

interface PageHeaderProps {
  eyebrow: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  /** 見出しの右側に添える要素（引用や状態表示など）。全ページ共通の見出し帯の中に置く */
  aside?: ReactNode;
}

/**
 * 全ページ共通の見出し帯。
 * eyebrow → 見出し → 説明文 → 飾り罫 の順で、縦の位置と余白を全ページで揃える。
 */
export function PageHeader({ eyebrow, title, lead, aside }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "pb-2",
        aside ? "grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:items-end" : undefined,
      )}
    >
      <div className="min-w-0">
        <p className="font-display text-base italic tracking-[0.14em] text-amethyst">
          {eyebrow}
        </p>
        <PageTitle>{title}</PageTitle>
        {lead && (
          <p className="mt-5 max-w-2xl text-[0.98rem] leading-8 text-ink-soft">{lead}</p>
        )}
        <OrnamentDivider className="mt-5 max-w-md" />
      </div>
      {aside && <div>{aside}</div>}
    </header>
  );
}
