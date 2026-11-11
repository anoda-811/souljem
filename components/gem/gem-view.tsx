"use client";

import { useMemo, useState } from "react";
import { useArchive } from "@/components/archive/archive-provider";
import { GemCalendar } from "@/components/gem/gem-calendar";
import { GemHero } from "@/components/gem/gem-hero";
import { RANGE_LABELS, TurbidityTrend } from "@/components/gem/turbidity-trend";
import { ManuscriptCard } from "@/components/ui/manuscript-card";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/cn";
import {
  shiftYearMonth,
  toMonthKey,
  toYearMonth,
  type YearMonth,
} from "@/lib/domain/calendar";
import { addDays, formatShortDate } from "@/lib/domain/date";
import {
  buildSeries,
  filterRange,
  rollingAverage,
  summarize,
  type TrendRange,
  type TurbidityPoint,
} from "@/lib/domain/gem-history";
import { describeTurbidityChange, getTurbidityStage } from "@/lib/domain/turbidity";
import type { ISODate } from "@/lib/domain/types";

const LEAD =
  "濁りは、色と輝きで眺めるもの。ジェムをタップすると光が広がり、「試してみる」で濁り度を動かして、色の移ろいを確かめられます。";

const RANGE_OPTIONS: readonly TrendRange[] = [7, 30, 90, "all"];

function GemSkeleton() {
  return (
    <div aria-busy="true" aria-label="読み込み中" className="space-y-10">
      <div className="space-y-4 border-b border-line-strong pb-8">
        <div className="h-5 w-40 bg-line/70" />
        <div className="h-14 w-72 bg-line/70" />
      </div>
      <ManuscriptCard className="h-[26rem]" />
    </div>
  );
}

/** 期間を選ぶ、細い枠のボタン群（研究ページと同じ見た目） */
function RangeTabs({ value, onChange }: { value: TrendRange; onChange: (value: TrendRange) => void }) {
  return (
    <div className="inline-flex border border-line-strong" role="group" aria-label="期間">
      {RANGE_OPTIONS.map((option) => {
        const active = option === value;
        return (
          <button
            key={String(option)}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option)}
            className={cn(
              "px-3.5 py-2 text-sm transition-colors duration-200",
              active ? "bg-amethyst text-vellum" : "text-ink-soft hover:bg-gilt-mist/60",
            )}
          >
            {RANGE_LABELS[option]}
          </button>
        );
      })}
    </div>
  );
}

/** 記録の要約を、小さな項目の並びで見せる */
function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-w-0 border-t border-line pt-4">
      <p className="text-xs tracking-[0.12em] text-ink-soft">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-ink">{value}</p>
      {sub && <p className="mt-0.5 truncate text-xs text-ink-soft">{sub}</p>}
    </div>
  );
}

function pointLabel(point: TurbidityPoint | null): string {
  return point ? `${point.value}・${formatShortDate(point.date)}` : "—";
}

/** ソウルジェムのページ本体。今日の輝き、歴代の数字、推移の三つを、上から順に見せる */
export function GemView() {
  const { today, archive } = useArchive();
  const [viewMonth, setViewMonth] = useState<YearMonth | null>(null);
  const [selectedDate, setSelectedDate] = useState<ISODate | null>(null);
  const [range, setRange] = useState<TrendRange>(30);

  const series = useMemo(
    () => (today && archive ? buildSeries(archive.records, today) : []),
    [archive, today],
  );

  if (!today || !archive) return <GemSkeleton />;

  const yesterday = addDays(today, -1);
  const values = new Map(series.map((point) => [point.date, point.value]));
  const readingsByDate = new Map(archive.records.map((record) => [record.date, record.turbidity]));

  const todayValue = values.get(today) ?? null;
  const todayReadings = readingsByDate.get(today) ?? {};
  const previousValue = values.get(yesterday) ?? null;
  const change = todayValue === null ? null : describeTurbidityChange(todayValue, previousValue);

  const month = viewMonth ?? toYearMonth(today);
  const monthKey = toMonthKey(month);
  const monthSummary = summarize(series.filter((point) => point.date.startsWith(monthKey)));

  const trendPoints = filterRange(series, range, today);
  const domainStart =
    range === "all" ? (series[0]?.date ?? today) : addDays(today, -(range - 1));
  const smoothed = rollingAverage(series, 7).filter((point) => point.date >= domainStart);
  const trendSummary = summarize(trendPoints);

  const selected = selectedDate ?? today;

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Soul Gem" title="ソウルジェム" lead={LEAD} />

      <ManuscriptCard>
        <SectionHeading eyebrow="Today" title="今日の輝き" />
        <div className="mt-8">
          <GemHero turbidity={todayValue} readings={todayReadings} change={change} />
        </div>
      </ManuscriptCard>

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-7">
          <GemCalendar
            month={month}
            today={today}
            selected={selected}
            values={values}
            readingsByDate={readingsByDate}
            onSelect={setSelectedDate}
            onShiftMonth={(delta) => setViewMonth(shiftYearMonth(month, delta))}
            onToday={() => {
              setViewMonth(null);
              setSelectedDate(today);
            }}
          />
        </div>

        <ManuscriptCard compact className="lg:col-span-5">
          <SectionHeading
            eyebrow="Monthly"
            title={`${monthKey.replace("-", "年")}月の振り返り`}
            titleFont="body"
          />
          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5">
            <Stat
              label="月の平均"
              value={monthSummary.mean === null ? "—" : String(monthSummary.mean)}
              sub={monthSummary.mean === null ? undefined : getTurbidityStage(monthSummary.mean).label}
            />
            <Stat label="記録した日" value={`${monthSummary.count} 日`} />
            <Stat label="もっとも澄んだ日" value={pointLabel(monthSummary.clearest)} />
            <Stat label="もっとも濁った日" value={pointLabel(monthSummary.murkiest)} />
          </div>
          <p className="mt-6 text-xs leading-6 text-ink-soft">
            カレンダーの数字は、その日の朝・昼・晩の平均です。日を押すと、3つの時間帯の内訳が下に出ます。
          </p>
        </ManuscriptCard>
      </div>

      <ManuscriptCard>
        <SectionHeading
          eyebrow="Trend"
          title="濁り度の推移"
          action={<RangeTabs value={range} onChange={setRange} />}
        />

        <div className="mt-8">
          <TurbidityTrend
            points={trendPoints}
            smoothed={smoothed}
            domainStart={domainStart}
            domainEnd={today}
          />
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-4">
          <Stat label="記録した日" value={`${trendSummary.count} 日`} />
          <Stat
            label="期間の平均"
            value={trendSummary.mean === null ? "—" : String(trendSummary.mean)}
            sub={trendSummary.mean === null ? undefined : getTurbidityStage(trendSummary.mean).label}
          />
          <Stat label="もっとも澄んだ日" value={pointLabel(trendSummary.clearest)} />
          <Stat label="もっとも濁った日" value={pointLabel(trendSummary.murkiest)} />
        </div>

        <p className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-soft">
          <span className="flex items-center gap-2">
            <span className="h-px w-6 bg-amethyst" />
            その日の濁り度
          </span>
          <span className="flex items-center gap-2">
            <span className="h-px w-6 border-t border-dashed border-gilt-deep" />
            7日移動平均
          </span>
          <span>線が途切れているところは、記録のない日です。</span>
        </p>
      </ManuscriptCard>
    </div>
  );
}
