import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons/icon";
import { cn } from "@/lib/cn";

interface EntryTileProps {
  icon: IconName;
  label: string;
  /** 未記録のとき true。emptyText を表示する */
  empty: boolean;
  emptyText: string;
  actionLabel?: string;
  wide?: boolean;
  onOpen: () => void;
  children?: ReactNode;
}

/**
 * 記録項目を一つ示すタイル。
 * ホバーで浮き上がり、クリックで編集ダイアログを開く。
 */
export function EntryTile({
  icon,
  label,
  empty,
  emptyText,
  actionLabel = "記す",
  wide = false,
  onOpen,
  children,
}: EntryTileProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "manuscript group flex min-h-[10.5rem] w-full flex-col p-6 text-left transition duration-300 ease-out",
        "hover:-translate-y-1.5 hover:border-gilt hover:shadow-[0_26px_40px_-22px_rgb(66_59_53_/_0.6)]",
        "focus-visible:-translate-y-1.5 focus-visible:border-gilt",
        wide && "sm:col-span-2",
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-gilt/60 bg-gilt-mist/50 text-amethyst transition-colors duration-300 group-hover:bg-gilt-mist">
          <Icon name={icon} className="h-[1.15rem] w-[1.15rem]" />
        </span>
        <span className="font-display text-sm italic tracking-[0.12em] text-ink-soft">{label}</span>
      </div>

      <div className="mt-5 flex-1">
        {empty ? (
          <p className="font-display text-[1.05rem] italic leading-7 text-ink-soft">{emptyText}</p>
        ) : (
          children
        )}
      </div>

      <span className="mt-4 flex items-center gap-2 text-xs tracking-[0.14em] text-gilt-deep opacity-60 transition duration-300 group-hover:translate-x-0.5 group-hover:opacity-100 group-focus-visible:opacity-100">
        {actionLabel}
        <Icon name="arrow" className="h-3.5 w-3.5" />
      </span>
    </button>
  );
}
