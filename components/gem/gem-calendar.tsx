import { Icon } from "@/components/icons/icon";
import { SoulGem } from "@/components/soul-gem/soul-gem";
import { ManuscriptCard } from "@/components/ui/manuscript-card";
import { SectionHeading } from "@/components/ui/section-heading";
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
import { TIME_SLOTS, averageTurbidity } from "@/lib/domain/record";
import { getGemPalette, getTurbidityStage } from "@/lib/domain/turbidity";
import type { ISODate, TurbidityReadings } from "@/lib/domain/types";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

/** 濁り度の数字を入れる丸い宝玉。色は濁り度から決まり、濁るほど暗くなる */
function Orb({ value }: { value: number }) {
  const palette = getGemPalette(value);
  // 暗い宝玉の上では文字を明るくする
  const dark = palette.ratio > 0.5;
  return (
    <span
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full font-body text-[0.9rem] font-semibold sm:h-11 sm:w-11 sm:text-base",
        dark ? "text-vellum" : "text-ink",
      )}
      style={{
        background: `radial-gradient(circle at 35% 30%, ${palette.hi}, ${palette.mid} 55%, ${palette.lo} 100%)`,
        boxShadow: `0 0 ${Math.round((1 - palette.ratio) * 10)}px ${palette.aura}`,
      }}
    >
      {value}
    </span>
  );
}

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

interface GemCalendarProps {
  month: YearMonth;
  today: ISODate;
  selected: ISODate;
  /** 日付 → その日の平均濁り度（記録のある日だけ） */
  values: ReadonlyMap<ISODate, number>;
  /** 日付 → その日の朝・昼・晩の濁り度 */
  readingsByDate: ReadonlyMap<ISODate, TurbidityReadings>;
  onSelect: (date: ISODate) => void;
  onShiftMonth: (delta: number) => void;
  onToday: () => void;
}

/** 歴代の濁り度を、月ごとに数字つきで並べるカレンダー。日を選ぶと、朝・昼・晩の内訳を見られる */
export function GemCalendar({
  month,
  today,
  selected,
  values,
  readingsByDate,
  onSelect,
  onShiftMonth,
  onToday,
}: GemCalendarProps) {
  const cells = getMonthGrid(month);
  const monthKey = toMonthKey(month);
  const canGoNext = compareYearMonth(month, toYearMonth(today)) < 0;
  const isViewingToday = monthKey === today.slice(0, 7);

  const selectedValue = values.get(selected) ?? null;
  const selectedReadings = readingsByDate.get(selected) ?? {};
  const selectedAverage = averageTurbidity(selectedReadings);

  return (
    <ManuscriptCard>
      <SectionHeading
        eyebrow="Archive"
        title={`${formatYearMonthJa(month)}の濁り`}
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

      <div className="mt-7 grid grid-cols-7 text-center text-xs tracking-[0.1em]">
        {WEEKDAYS.map((weekday, i) => (
          <span key={weekday} className={cn("pb-2", i === 0 ? "text-gilt-deep" : "text-ink-soft")}>
            {weekday}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {cells.map((date) => {
          const inMonth = date.startsWith(monthKey);
          const isFuture = date > today;
          const isSelected = date === selected;
          const isToday = date === today;
          const value = values.get(date);
          const day = Number(date.slice(8));

          return (
            <button
              key={date}
              type="button"
              disabled={isFuture}
              aria-label={`${formatShortDate(date)}${value !== undefined ? `、濁り度 ${value}` : "、記録なし"}`}
              aria-pressed={isSelected}
              aria-current={isToday ? "date" : undefined}
              onClick={() => onSelect(date)}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center gap-1 transition-colors duration-200 disabled:cursor-not-allowed",
                inMonth ? "text-ink" : "text-mist",
                isSelected
                  ? "bg-amethyst-mist ring-1 ring-amethyst"
                  : "hover:bg-gilt-mist/60",
                isToday && !isSelected && "outline-1 -outline-offset-2 outline-gilt outline",
                isFuture && "opacity-35",
              )}
            >
              <span className="absolute top-1 left-1.5 text-[0.7rem] leading-none text-ink-soft">{day}</span>
              {value !== undefined ? <Orb value={value} /> : <span className="h-px w-3 bg-line-strong" aria-hidden />}
            </button>
          );
        })}
      </div>

      <div className="mt-6 border-t border-line pt-5">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <div className="flex items-center gap-4">
            <div className="w-24 shrink-0">
              {selectedAverage !== null ? (
                <SoulGem turbidity={selectedAverage} idPrefix="cal-gem" />
              ) : (
                <div className="aspect-square w-full rounded-full border border-dashed border-line-strong" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs tracking-[0.14em] text-ink-soft">{formatShortDate(selected)}</p>
              {selectedAverage !== null ? (
                <>
                  <p className="mt-1 font-display text-3xl font-semibold text-ink">
                    {selectedAverage}
                    <span className="ml-1 font-body text-sm font-normal text-ink-soft">/ 100</span>
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">{getTurbidityStage(selectedAverage).label}</p>
                </>
              ) : (
                <p className="mt-2 text-sm leading-7 text-ink-soft">この日は、濁り度が記されていません。</p>
              )}
            </div>
          </div>

          {selectedValue !== null && (
            <dl className="grid flex-1 grid-cols-3 gap-2 text-center sm:min-w-[16rem]">
              {TIME_SLOTS.map(({ slot, label }) => (
                <div key={slot} className="border border-line py-2">
                  <dt className="text-[0.7rem] tracking-[0.12em] text-ink-soft">{label}</dt>
                  <dd className="mt-1 font-body text-base text-ink">{selectedReadings[slot] ?? "—"}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        <div className="mt-6 flex items-center gap-3 text-xs text-ink-soft">
          <span className="shrink-0 tracking-[0.1em]">澄</span>
          <span
            aria-hidden
            className="h-2 flex-1 border border-line-strong"
            style={{
              background: `linear-gradient(90deg, ${getGemPalette(0).mid}, ${getGemPalette(50).mid}, ${getGemPalette(100).mid})`,
            }}
          />
          <span className="shrink-0 tracking-[0.1em]">濁</span>
        </div>
      </div>
    </ManuscriptCard>
  );
}