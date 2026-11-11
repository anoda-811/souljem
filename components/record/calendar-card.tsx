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
import { averageTurbidity, TIME_SLOTS } from "@/lib/domain/record";
import { getGemPalette } from "@/lib/domain/turbidity";
import type { ISODate, TurbidityReadings } from "@/lib/domain/types";

export interface DayMarker {
  /** その日の平均濁り度。記録がなければ null */
  turbidity: number | null;
  hasRecord: boolean;
  hasJournal: boolean;
}

interface CalendarCardProps {
  className?: string;
  month: YearMonth;
  selected: ISODate;
  today: ISODate;
  markers: ReadonlyMap<ISODate, DayMarker>;
  /** 選んでいる日の朝・昼・晩の濁り度 */
  readings: TurbidityReadings;
  canGoNext: boolean;
  onSelect: (date: ISODate) => void;
  onShiftMonth: (delta: number) => void;
  onToday: () => void;
}

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
      className="flex h-9 w-9 items-center justify-center border border-line-strong text-ink transition-colors hover:border-gilt hover:bg-gilt-mist disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:border-line-strong"
    >
      <Icon name="arrow" className={cn("h-4 w-4", !next && "rotate-180")} />
    </button>
  );
}

function DayCell({
  date,
  monthKey,
  today,
  selected,
  marker,
  onSelect,
}: {
  date: ISODate;
  monthKey: string;
  today: ISODate;
  selected: ISODate;
  marker: DayMarker | undefined;
  onSelect: (date: ISODate) => void;
}) {
  const day = Number(date.slice(8));
  const inMonth = date.startsWith(monthKey);
  const isFuture = date > today;
  const isSelected = date === selected;
  const isToday = date === today;

  const label = [
    formatShortDate(date),
    marker?.hasRecord && "記録あり",
    marker?.hasJournal && "日記あり",
  ]
    .filter(Boolean)
    .join("・");

  return (
    <button
      type="button"
      disabled={isFuture}
      aria-label={label}
      aria-pressed={isSelected}
      aria-current={isToday ? "date" : undefined}
      onClick={() => onSelect(date)}
      className={cn(
        "relative flex aspect-square flex-col items-center justify-center font-body text-[0.95rem] transition-colors duration-200 disabled:cursor-not-allowed",
        inMonth ? "text-ink" : "text-mist",
        isSelected
          ? "bg-amethyst text-vellum shadow-[0_8px_16px_-10px_rgb(91_75_125_/_0.8)]"
          : "hover:bg-gilt-mist/70",
        isToday && !isSelected && "outline-1 -outline-offset-4 outline-gilt outline",
        isFuture && "opacity-35",
      )}
    >
      <span className="leading-none">{day}</span>
      <span className="absolute bottom-1.5 flex items-center gap-1" aria-hidden>
        {marker?.turbidity != null && (
          <span
            className="h-1.5 w-1.5 rotate-45"
            style={{ background: getGemPalette(marker.turbidity).mid }}
          />
        )}
        {marker?.hasJournal && (
          <span className={cn("h-px w-2.5", isSelected ? "bg-vellum" : "bg-gilt-deep")} />
        )}
      </span>
    </button>
  );
}

/** 選んでいる日の朝・昼・晩と、その平均 */
function DayReadings({ readings }: { readings: TurbidityReadings }) {
  const average = averageTurbidity(readings);
  return (
    <dl className="grid grid-cols-4 gap-2 text-center">
      {TIME_SLOTS.map(({ slot, label }) => (
        <div key={slot} className="border border-line py-2">
          <dt className="text-[0.7rem] tracking-[0.12em] text-ink-soft">{label}</dt>
          <dd className="mt-1 font-body text-base text-ink">{readings[slot] ?? "—"}</dd>
        </div>
      ))}
      <div className="border border-gilt/60 bg-gilt-mist/50 py-2">
        <dt className="text-[0.7rem] tracking-[0.12em] text-gilt-deep">平均</dt>
        <dd className="mt-1 font-body text-base font-semibold text-amethyst-deep">
          {average ?? "—"}
        </dd>
      </div>
    </dl>
  );
}

/** 月単位のカレンダー。過去の日を選んで、振り返って記録できる */
export function CalendarCard({
  className,
  month,
  selected,
  today,
  markers,
  readings,
  canGoNext,
  onSelect,
  onShiftMonth,
  onToday,
}: CalendarCardProps) {
  const cells = getMonthGrid(month);
  const monthKey = toMonthKey(month);
  const isViewingToday = monthKey === today.slice(0, 7) && selected === today;

  return (
    <ManuscriptCard compact className={cn("lg:sticky lg:top-10", className)}>
      <SectionHeading
        eyebrow="Calendar"
        title={formatYearMonthJa(month)}
        titleFont="body"
        action={
          <div className="flex items-center gap-2">
            {!isViewingToday && (
              <button
                type="button"
                onClick={onToday}
                className="btn btn-ghost min-h-9 px-3 py-1 text-xs"
              >
                今日
              </button>
            )}
            <NavButton label="前の月" onClick={() => onShiftMonth(-1)} />
            <NavButton label="次の月" disabled={!canGoNext} onClick={() => onShiftMonth(1)} next />
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
        {cells.map((date) => (
          <DayCell
            key={date}
            date={date}
            monthKey={monthKey}
            today={today}
            selected={selected}
            marker={markers.get(date)}
            onSelect={onSelect}
          />
        ))}
      </div>

      <div className="mt-6 border-t border-line pt-5">
        <p className="mb-3 flex items-baseline justify-between gap-3 text-xs tracking-[0.14em] text-ink-soft">
          <span>{formatShortDate(selected)} の濁り</span>
        </p>
        <DayReadings readings={readings} />
      </div>

      <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rotate-45 bg-amethyst" />
          濁り度の色
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-px w-2.5 bg-gilt-deep" />
          日記あり
        </span>
      </p>
    </ManuscriptCard>
  );
}
