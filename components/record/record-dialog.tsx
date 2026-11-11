"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { CornerOrnaments } from "@/components/ui/manuscript-card";
import { OrnamentDivider } from "@/components/ui/ornament-divider";

interface RecordDialogProps {
  open: boolean;
  onDismiss: () => void;
  eyebrow: string;
  /** 対象の日付。数字は游明朝で読みやすく出す */
  dateLabel: string;
  title: string;
  children: ReactNode;
}

/**
 * 記録を編集するための modal ダイアログ。
 * ネイティブの <dialog> を使うため、Esc で閉じる・フォーカスの閉じ込めが標準で働く。
 */
export function RecordDialog({
  open,
  onDismiss,
  eyebrow,
  dateLabel,
  title,
  children,
}: RecordDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onDismiss}
      onClick={(event) => {
        // 背景（ダイアログ自身）をクリックしたときだけ閉じる
        if (event.target === ref.current) onDismiss();
      }}
      className="record-dialog manuscript m-auto h-fit w-[min(calc(100%-2rem),34rem)] overflow-visible p-0 text-ink"
    >
      {/* 飾りは札の外側に出るため、スクロールする領域の外に置く */}
      <CornerOrnaments />
      <div className="relative max-h-[88dvh] overflow-y-auto p-6 sm:p-9">
        <p className="font-display text-sm italic tracking-[0.16em] text-amethyst">
          {eyebrow}
          <span className="ml-3 font-body text-xs not-italic tracking-[0.08em] text-ink-soft">
            {dateLabel}
          </span>
        </p>
        <h2 className="mt-1 font-display text-2xl font-semibold text-ink">{title}</h2>
        <OrnamentDivider className="my-6" />
        {children}
      </div>
    </dialog>
  );
}
