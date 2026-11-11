"use client";

import { useMemo, useState } from "react";
import { useArchive } from "@/components/archive/archive-provider";
import { DiaryEditor, UNTITLED } from "@/components/journal/diary-editor";
import { JournalCalendar } from "@/components/journal/journal-calendar";
import { FIELD } from "@/components/record/entry-forms";
import { ManuscriptCard } from "@/components/ui/manuscript-card";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/cn";
import { shiftYearMonth, toMonthKey, toYearMonth, type YearMonth } from "@/lib/domain/calendar";
import { formatShortDate } from "@/lib/domain/date";
import { averageTurbidity } from "@/lib/domain/record";
import type { ISODate, JournalEntry } from "@/lib/domain/types";

const LEAD =
  "その日の出来事と心の動きを、一枚の頁に綴ります。書き終えた頁は、カレンダーや検索からめくり返せます。";

const EXCERPT_LENGTH = 60;

function JournalSkeleton() {
  return (
    <div aria-busy="true" aria-label="読み込み中" className="space-y-10">
      <div className="space-y-4 border-b border-line-strong pb-8">
        <div className="h-5 w-40 bg-line/70" />
        <div className="h-14 w-72 bg-line/70" />
      </div>
      <ManuscriptCard className="h-[32rem]" />
    </div>
  );
}

/** 一覧に出す本文の要約。改行を詰めて、先頭だけを見せる */
function excerpt(body: string): string {
  const flat = body.replace(/\s+/g, " ").trim();
  return flat.length > EXCERPT_LENGTH ? `${flat.slice(0, EXCERPT_LENGTH)}…` : flat;
}

/** 日記ページ本体。左に一枚の頁、右にカレンダーと頁の一覧を置く */
export function JournalView() {
  const { today, archive, saveJournal } = useArchive();
  const [selected, setSelected] = useState<ISODate | null>(null);
  const [viewMonth, setViewMonth] = useState<YearMonth | null>(null);
  const [query, setQuery] = useState("");

  const entries = useMemo<JournalEntry[]>(
    () => [...(archive?.journal ?? [])].sort((a, b) => b.date.localeCompare(a.date)),
    [archive],
  );

  const turbidityByDate = useMemo(() => {
    const map = new Map<ISODate, number>();
    for (const record of archive?.records ?? []) {
      const average = averageTurbidity(record.turbidity);
      if (average !== null) map.set(record.date, average);
    }
    return map;
  }, [archive]);

  if (!today || !archive) return <JournalSkeleton />;

  const current: ISODate = selected ?? today;
  const month = viewMonth ?? toYearMonth(today);
  const monthKey = toMonthKey(month);

  const entryByDate = new Map(entries.map((entry) => [entry.date, entry]));
  const entryDates = new Set(entries.map((entry) => entry.date));
  const monthEntries = entries.filter((entry) => entry.date.startsWith(monthKey));

  const trimmed = query.trim();
  const listEntries = trimmed
    ? entries.filter((entry) => entry.title.includes(trimmed) || entry.body.includes(trimmed))
    : monthEntries;

  // 日を選ぶと、その日の月もカレンダーに出す（検索結果から別の月の頁を開いたときのため）
  const openDate = (date: ISODate) => {
    setSelected(date);
    setViewMonth(toYearMonth(date));
  };

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Journal" title="日記" lead={LEAD} />

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <div className="min-w-0 lg:col-span-7">
          <DiaryEditor
            key={current}
            date={current}
            today={today}
            entry={entryByDate.get(current) ?? null}
            turbidity={turbidityByDate.get(current) ?? null}
            onSave={(title, body) => saveJournal(current, title, body)}
          />
        </div>

        <div className="min-w-0 space-y-6 lg:col-span-5">
          <JournalCalendar
            month={month}
            today={today}
            selected={current}
            entryDates={entryDates}
            monthCount={monthEntries.length}
            onSelect={openDate}
            onShiftMonth={(delta) => setViewMonth(shiftYearMonth(month, delta))}
            onToday={() => {
              setViewMonth(null);
              setSelected(today);
            }}
          />

          <ManuscriptCard compact>
            <SectionHeading
              eyebrow="Pages"
              title={trimmed ? "検索の結果" : "この月の頁"}
              titleFont="body"
            />
            <input
              type="search"
              value={query}
              placeholder="題名や本文で探す"
              aria-label="頁を探す"
              onChange={(event) => setQuery(event.target.value)}
              className={cn(FIELD, "mt-5 py-2.5")}
            />

            {listEntries.length === 0 ? (
              <p className="mt-6 font-display text-[1.02rem] italic leading-8 text-ink-soft">
                {trimmed ? "見つかりませんでした。" : "この月には、まだ頁がありません。"}
              </p>
            ) : (
              <ul className="mt-4 max-h-[26rem] overflow-y-auto pr-1">
                {listEntries.map((entry) => {
                  const isCurrent = entry.date === current;
                  return (
                    <li key={entry.date}>
                      <button
                        type="button"
                        aria-pressed={isCurrent}
                        onClick={() => openDate(entry.date)}
                        className={cn(
                          "w-full border-b border-line py-4 text-left transition-colors duration-200 hover:bg-gilt-mist/40",
                          isCurrent && "bg-amethyst-mist/60",
                        )}
                      >
                        <p className="flex items-baseline justify-between gap-3 text-xs tracking-[0.12em] text-ink-soft">
                          <span>{formatShortDate(entry.date)}</span>
                          {turbidityByDate.has(entry.date) && (
                            <span>濁り {turbidityByDate.get(entry.date)}</span>
                          )}
                        </p>
                        <p className="mt-1 font-display text-lg text-ink">
                          {entry.title === UNTITLED ? "無題" : entry.title}
                        </p>
                        <p className="mt-1 truncate text-sm text-ink-soft">{excerpt(entry.body)}</p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </ManuscriptCard>
        </div>
      </div>
    </div>
  );
}
