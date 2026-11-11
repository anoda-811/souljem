import type { ReactNode } from "react";
import { OrnamentDivider } from "@/components/ui/ornament-divider";
import { BrandMark } from "@/components/layout/brand-mark";
import { SiteNav } from "@/components/layout/site-nav";

/**
 * 全画面共通の枠組み。
 * デスクトップは目次つきのサイドバー、モバイルは上部の表紙と下部のタブバー。
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17.5rem_minmax(0,1fr)]">
      <aside className="hidden border-r border-line-strong bg-vellum/60 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:py-10">
        <div className="px-7">
          <BrandMark />
          <OrnamentDivider className="mt-8" />
          <p className="mt-6 font-display text-sm italic tracking-[0.14em] text-amethyst">
            Contents
          </p>
        </div>
        <nav aria-label="主要メニュー" className="mt-3 flex-1 overflow-y-auto pr-3">
          <SiteNav variant="sidebar" />
        </nav>
        <p className="mx-7 border-t border-line pt-5 text-[0.72rem] leading-6 tracking-[0.06em] text-ink-soft">
          観測は、ただ積み重ねるほど深くなる。
        </p>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col">
        <header className="flex items-center justify-between border-b border-line-strong px-5 py-4 lg:hidden">
          <BrandMark compact />
          <span className="font-display text-sm italic tracking-[0.12em] text-ink-soft">
            Observation Log
          </span>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 pt-8 pb-32 sm:px-8 lg:px-12 lg:pt-14 lg:pb-20">
          {children}
        </main>
      </div>

      <nav
        aria-label="主要メニュー（モバイル）"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line-strong bg-vellum/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden"
      >
        <SiteNav variant="tabbar" />
      </nav>
    </div>
  );
}
