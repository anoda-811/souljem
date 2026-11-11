"use client";

import { ManuscriptCard } from "@/components/ui/manuscript-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Icon } from "@/components/icons/icon";
import { cn } from "@/lib/cn";
import {
  compareYearMonth,
  formatYearMonthJa,
  getMonthGrid,
  toMonthKey,
  toYearMonth,
  type YearMonth,
} from "@/lib/domain/calendar";
import { formatShortDate } from "@/lib/domain/date";
import type { ISODate } from "@/lib/domain/types";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function NavButton({
  label,
  disabled,
  onClick,
  next,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  next?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center border border-line-strong text-ink transition-colors hover:border-gilt hover:bg-gilt-mist disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-line-strong disabled:hover:bg-transparent"
    >
      <Icon name="arrow" className={cn("h-4 w-4", !next && "rotate-180")} />
    </button>
  );
}

interface JournalCalendarProps {
  month: YearMonth;
  today: ISODate;
  selected: ISODate;
  /** 頁を綴った日の一覧 */
  entryDates: ReadonlySet<ISODate>;
  /** この月に綴った頁の数 */
  monthCount: number;
  onSelect: (date: ISODate) => void;
  onShiftMonth: (delta: number) => void;
  onToday: () => void;
}

/** 日記のカレンダー。頁を綴った日には、金の印がつく */
export function JournalCalendar({
  month,
  today,
  selected,
  entryDates,
  monthCount,
  onSelect,
  onShiftMonth,
  onToday,
}: JournalCalendarProps) {
  const cells = getMonthGrid(month);
  const monthKey = toMonthKey(month);
  const canGoNext = compareYearMonth(month, toYearMonth(today)) < 0;
  const isViewingToday = monthKey === today.slice(0, 7);

  return (
    <ManuscriptCard compact>
      <SectionHeading
        eyebrow="Calendar"
        title={formatYearMonthJa(month)}
        titleFont="body"
        action={
          <div className="flex items-center gap-2">
            {!isViewingToday && (
              <button type="button" onClick={onToday} className="btn btn-ghost min-h-9 px-3 py-1 text-xs">
                今日
              </button>
            )}
            <NavButton label="前の月" onClick={() => onShiftMonth(-1)} />
            <NavButton label="次の月" disabled={!canGoNext} onClick={() => onShiftMonth(1)} next />
          </div>
        }
      />
      <p className="mt-3 text-xs tracking-[0.06em] text-ink-soft">この月に綴った頁　{monthCount} 枚</p>

      <div className="mt-5 grid grid-cols-7 text-center text-xs tracking-[0.1em]">
        {WEEKDAYS.map((weekday, i) => (
          <span key={weekday} className={cn("pb-2", i === 0 ? "text-gilt-deep" : "text-ink-soft")}>
            {weekday}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date) => {
          const inMonth = date.startsWith(monthKey);
          const isFuture = date > today;
          const isSelected = date === selected;
          const isToday = date === today;
          const hasEntry = entryDates.has(date);

          return (
            <button
              key={date}
              type="button"
              disabled={isFuture}
              aria-label={`${formatShortDate(date)}${hasEntry ? "、頁あり" : ""}`}
              aria-pressed={isSelected}
              aria-current={isToday ? "date" : undefined}
              onClick={() => onSelect(date)}
              className={cn(
                "relative flex aspect-square items-center justify-center font-body text-sm transition-colors duration-200 disabled:cursor-not-allowed",
                inMonth ? "text-ink" : "text-mist",
                isSelected ? "bg-amethyst-mist ring-1 ring-amethyst" : "hover:bg-gilt-mist/60",
                isToday && !isSelected && "outline-1 -outline-offset-2 outline-gilt outline",
                isFuture && "opacity-35",
              )}
            >
              {Number(date.slice(8))}
              {hasEntry && (
                <span aria-hidden className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-gilt" />
              )}
            </button>
          );
        })}
      </div>
    </ManuscriptCard>
  );
}
