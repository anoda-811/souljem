import Link from "next/link";
import { Icon } from "@/components/icons/icon";
import { cn } from "@/lib/cn";

/** 手帳の表紙に入る紋章とタイトル */
export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-3" aria-label="Soul Archive ホームへ">
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gilt bg-vellum text-amethyst transition-colors group-hover:bg-gilt-mist">
        <span className="absolute inset-[3px] rounded-full border border-gilt/40" aria-hidden />
        <Icon name="gem" className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            "block font-display font-semibold leading-none tracking-[0.06em] text-ink",
            compact ? "text-xl" : "text-2xl",
          )}
        >
          Soul Archive
        </span>
        {!compact && (
          <span className="mt-1.5 block text-[0.7rem] tracking-[0.2em] text-ink-soft">
            自己観測と研究の手帳
          </span>
        )}
      </span>
    </Link>
  );
}
