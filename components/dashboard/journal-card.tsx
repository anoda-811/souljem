import { Icon } from "@/components/icons/icon";
import { ButtonLink } from "@/components/ui/button-link";
import { ManuscriptCard } from "@/components/ui/manuscript-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { OrnamentDivider } from "@/components/ui/ornament-divider";
import type { DashboardSnapshot } from "@/lib/domain/dashboard";
import { formatShortDate } from "@/lib/domain/date";

interface JournalCardProps {
  journal: DashboardSnapshot["journal"];
}

/** 今日の頁の有無と、直近の日記への導線 */
export function JournalCard({ journal }: JournalCardProps) {
  const { today, latest, totalEntries } = journal;

  return (
    <ManuscriptCard className="lg:col-span-5">
      <SectionHeading eyebrow="Journal" title="今日の頁" />

      {today ? (
        <div className="mt-7">
          <p className="text-xs tracking-[0.18em] text-gilt-deep">綴られています</p>
          <p className="mt-2 font-display text-2xl font-semibold text-ink">{today.title}</p>
          <p className="mt-3 line-clamp-3 text-[0.95rem] leading-8 text-ink-soft">{today.body}</p>
        </div>
      ) : (
        <div className="mt-7">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-gilt/60 bg-gilt-mist/50 text-amethyst">
              <Icon name="quill" className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-xl text-ink">今日の頁は、まだ白紙です。</p>
              <p className="mt-2 text-sm leading-7 text-ink-soft">
                今日、いちばん心に残ったことは何でしたか？
              </p>
            </div>
          </div>
          <ButtonLink href="/journal" className="mt-7 w-full">
            今日の頁を綴る
          </ButtonLink>
        </div>
      )}

      <OrnamentDivider className="my-7" />

      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs tracking-[0.18em] text-ink-soft">直近の頁</p>
          {latest ? (
            <p className="mt-1.5 truncate text-[0.95rem] text-ink">
              {formatShortDate(latest.date)} 「{latest.title}」
            </p>
          ) : (
            <p className="mt-1.5 text-sm text-ink-soft">まだ頁はありません。</p>
          )}
        </div>
        <p className="shrink-0 text-right">
          <span className="font-display text-2xl font-semibold text-ink">{totalEntries}</span>
          <span className="ml-1 text-xs text-ink-soft">枚</span>
        </p>
      </div>

      <ButtonLink href="/journal" variant="ghost" className="mt-6 w-full" withArrow>
        過去の頁をめくる
      </ButtonLink>
    </ManuscriptCard>
  );
}
