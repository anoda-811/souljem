"use client";

import { useArchive } from "@/components/archive/archive-provider";
import { ManuscriptCard } from "@/components/ui/manuscript-card";
import { formatShortDate } from "@/lib/domain/date";

/** 削除した習慣の小さな一覧。元に戻すか、完全に消せる */
export function HabitTrash() {
  const { archive, restoreHabit, purgeTrashedHabit } = useArchive();
  const trashed = archive?.trashedHabits ?? [];

  if (trashed.length === 0) return null;

  return (
    <ManuscriptCard compact>
      <p className="text-xs tracking-[0.14em] text-ink-soft">
        削除した習慣（{trashed.length} 件）
      </p>
      <ul className="mt-4 divide-y divide-line">
        {trashed.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0 text-sm">
              <span className="text-ink">{item.name}</span>
              <span className="ml-3 text-xs text-ink-soft">{formatShortDate(item.deletedOn)} に削除</span>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={() => restoreHabit(item.id)}
                className="btn btn-ghost min-h-9 px-3 py-1 text-xs"
              >
                元に戻す
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`「${item.name}」の記録を完全に消しますか？ 元に戻せなくなります。`)) {
                    purgeTrashedHabit(item.id);
                  }
                }}
                className="text-xs text-ink-soft underline underline-offset-4 hover:text-ink"
              >
                完全に消す
              </button>
            </div>
          </li>
        ))}
      </ul>
    </ManuscriptCard>
  );
}
