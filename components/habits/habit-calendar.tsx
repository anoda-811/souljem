import { Icon } from "@/components/icons/icon";
import { ManuscriptCard } from "@/components/ui/manuscript-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/cn";
import {
  formatYearMonthJa,
  getMonthGrid,
  toMonthKey,
  type YearMonth,
} from "@/lib/domain/calendar";
import { formatShortDate } from "@/lib/domain/date";
import type { Habit, HabitMark, ISODate } from "@/lib/domain/types";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

type CellState = HabitMark | "none";

const SYMBOL: Record<CellState, string> = { done: "○", missed: "×", none: "-" };
const LABEL: Record<CellState, string> = { done: "達成", missed: "未達成", none: "未記入" };

const NAV_BUTTON =
  "flex h-9 w-9 items-center justify-center border border-line-strong text-ink transition-colors hover:border-gilt hover:bg-gilt-mist disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent";

interface HabitCalendarProps {
  habit: Habit;
  month: YearMonth;
  today: ISODate;
  selected: ISODate;
  canGoNext: boolean;
  showToday: boolean;
  onSelect: (date: ISODate) => void;
  onShiftMonth: (delta: number) => void;
  onToday: () => void;
}

/** 習慣ごとの月カレンダー。各日に ○ × - を表示し、切り替えると表示も切り替わる */
export function HabitCalendar({
  habit,
  month,
  today,
  selected,
  canGoNext,
  showToday,
  onSelect,
  onShiftMonth,
  onToday,
}: HabitCalendarProps) {
  const cells = getMonthGrid(month);
  const monthKey = toMonthKey(month);

  return (
    <ManuscriptCard compact>
      <SectionHeading
        eyebrow="Calendar"
        title={formatYearMonthJa(month)}
        titleFont="body"
        action={
          <div className="flex items-center gap-2">
            {showToday && (
              <button type="button" onClick={onToday} className="btn btn-ghost min-h-9 px-3 py-1 text-xs">
                今日
              </button>
            )}
            <button type="button" aria-label="前の月" onClick={() => onShiftMonth(-1)} className={NAV_BUTTON}>
              <Icon name="arrow" className="h-4 w-4 rotate-180" />
            </button>
            <button
              type="button"
              aria-label="次の月"
              disabled={!canGoNext}
              onClick={() => onShiftMonth(1)}
              className={NAV_BUTTON}
            >
              <Icon name="arrow" className="h-4 w-4" />
            </button>
          </div>
        }
      />

      <div className="mt-7 grid grid-cols-7 text-center text-xs tracking-[0.1em]">
        {WEEKDAYS.map((weekday, i) => (
          <span key={weekday} className={cn("pb-2", i === 0 ? "text-gilt-deep" : "text-ink-soft")}>
            {weekday}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date) => {
          const inMonth = date.startsWith(monthKey);
          const isToday = date === today;
          const isSelected = date === selected;
          // 開始日より前と、未来の日には記せない
          const disabled = date > today || date < habit.startDate;
          const state: CellState = habit.marks[date] ?? "none";

          return (
            <button
              key={date}
              type="button"
              disabled={disabled}
              aria-pressed={isSelected}
              aria-current={isToday ? "date" : undefined}
              aria-label={`${formatShortDate(date)} ${LABEL[state]}`}
              onClick={() => onSelect(date)}
              className={cn(
                "flex aspect-square flex-col items-center justify-center font-body transition-colors duration-200 disabled:cursor-not-allowed",
                inMonth ? "text-ink" : "text-mist",
                isSelected
                  ? "bg-amethyst text-vellum shadow-[0_8px_16px_-10px_rgb(91_75_125_/_0.8)]"
                  : "hover:bg-gilt-mist/70",
                isToday && !isSelected && "outline-1 -outline-offset-4 outline-gilt outline",
                disabled && "opacity-35",
              )}
            >
              <span className="text-[0.95rem] leading-none">{Number(date.slice(8))}</span>
              <span
                aria-hidden
                className={cn(
                  "mt-1 text-base leading-none",
                  state === "done" && (isSelected ? "text-vellum" : "text-amethyst-deep"),
                  state === "missed" && (isSelected ? "text-vellum" : "text-ink-soft"),
                  state === "none" && (isSelected ? "text-vellum/70" : "text-mist"),
                )}
              >
                {SYMBOL[state]}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-soft">
        <span>○ 達成</span>
        <span>× 未達成</span>
        <span>- 未記入</span>
      </p>
    </ManuscriptCard>
  );
}
