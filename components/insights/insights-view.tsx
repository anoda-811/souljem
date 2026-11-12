"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useArchive } from "@/components/archive/archive-provider";
import { ButtonLink } from "@/components/ui/button-link";
import { ManuscriptCard } from "@/components/ui/manuscript-card";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/cn";
import { formatShortDate, parseISODate } from "@/lib/domain/date";
import type { Insight, Tag } from "@/lib/domain/types";

const LEAD =
  "「こうすればこうなるかも」を、日付ごとに並べています。タグで絞り込めます。日付を押すと、その日の今日の記録が開きます。";

/** 日付ごとにまとめた、表示する考察の一覧 */
interface InsightDay {
  date: string;
  insights: Insight[];
}

function InsightsSkeleton() {
  return (
    <div aria-busy="true" aria-label="読み込み中" className="space-y-10">
      <div className="space-y-4 border-b border-line-strong pb-8">
        <div className="h-5 w-40 bg-line/70" />
        <div className="h-14 w-72 bg-line/70" />
      </div>
      <ManuscriptCard className="h-[24rem]" />
    </div>
  );
}

/** 1日分の考察。日付の見出しを押すと、その日の今日の記録に移る */
function InsightDayCard({ day, tags }: { day: InsightDay; tags: readonly Tag[] }) {
  const { month, day: dayOfMonth, weekday } = parseISODate(day.date);

  return (
    <ManuscriptCard compact>
      <Link
        href={`/record?date=${day.date}`}
        className="group flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-3 transition-colors duration-200"
      >
        <span className="font-display text-xl text-ink transition-colors duration-200 group-hover:text-amethyst">
          {month}月{dayOfMonth}日（{weekday}）
        </span>
        <span className="text-xs tracking-[0.12em] text-ink-soft">
          {formatShortDate(day.date)} ・ 今日の記録へ
        </span>
      </Link>

      <ul className="mt-4 space-y-3">
        {day.insights.map((insight) => {
          const names = tags.filter((tag) => insight.tags.includes(tag.id));
          return (
            <li key={insight.id} className="flex gap-2 font-display text-[1.02rem] leading-7 text-ink">
              <span aria-hidden="true" className="shrink-0 text-gilt-deep">
                ・
              </span>
              <span className="min-w-0">
                {insight.text}
                {names.length > 0 && (
                  <span className="ml-3 font-body text-xs tracking-[0.06em] text-amethyst">
                    {names.map((tag) => `#${tag.name}`).join(" ")}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </ManuscriptCard>
  );
}

/** 考察ページ本体。考察のある日を新しい日から並べ、タグで絞り込める */
export function InsightsView() {
  const { archive } = useArchive();
  const [filterTagId, setFilterTagId] = useState<string | null>(null);

  const days = useMemo<InsightDay[]>(() => {
    const result: InsightDay[] = [];
    for (const record of archive?.records ?? []) {
      const insights = record.insights.filter(
        (insight) => filterTagId === null || insight.tags.includes(filterTagId),
      );
      if (insights.length > 0) result.push({ date: record.date, insights });
    }
    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [archive, filterTagId]);

  if (!archive) return <InsightsSkeleton />;

  const total = days.reduce((sum, day) => sum + day.insights.length, 0);
  const tags = archive.tags;

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Insights"
        title="考察"
        lead={LEAD}
        aside={
          <span className="block text-right font-display text-sm italic tracking-[0.14em] text-gilt-deep">
            {total} 件 ・ {days.length} 日
          </span>
        }
      />

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="タグで絞り込む">
          {[{ id: null, name: "すべて" }, ...tags].map((option) => {
            const active = filterTagId === option.id;
            return (
              <button
                key={option.id ?? "all"}
                type="button"
                aria-pressed={active}
                onClick={() => setFilterTagId(option.id)}
                className={cn(
                  "border px-4 py-1.5 text-sm tracking-[0.06em] transition-colors duration-200",
                  active
                    ? "border-amethyst bg-amethyst text-vellum"
                    : "border-line-strong text-ink-soft hover:border-gilt hover:bg-gilt-mist/50",
                )}
              >
                {option.name}
              </button>
            );
          })}
        </div>
      )}

      {days.length === 0 ? (
        <ManuscriptCard compact>
          <p className="font-display text-[1.02rem] italic leading-8 text-ink-soft">
            {filterTagId
              ? "このタグの考察はまだありません。"
              : "まだ考察はありません。今日の記録の「考察」に、こうすればこうなるかも、を記してみましょう。"}
          </p>
          {!filterTagId && (
            <ButtonLink href="/record" variant="ghost" className="mt-6" withArrow>
              今日の記録を開く
            </ButtonLink>
          )}
        </ManuscriptCard>
      ) : (
        <div className="space-y-6">
          {days.map((day) => (
            <InsightDayCard key={day.date} day={day} tags={tags} />
          ))}
        </div>
      )}
    </div>
  );
}
