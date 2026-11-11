import { PageHeader } from "@/components/ui/page-header";
import { parseISODate } from "@/lib/domain/date";
import type { ISODate } from "@/lib/domain/types";

interface DashboardHeaderProps {
  today: ISODate;
  /** 最初の記録の日が1日目。まだ記録がなければ null */
  researchDay: number | null;
  quote: string;
}

/** 今日の日付と、本日の一節を示す見出し帯（共通の PageHeader を使う） */
export function DashboardHeader({ today, researchDay, quote }: DashboardHeaderProps) {
  const { year, month, day, weekday } = parseISODate(today);

  return (
    <PageHeader
      eyebrow={
        <>
          Observation Log
          <span className="ml-3 font-body text-sm not-italic tracking-[0.06em] text-ink-soft">
            {researchDay === null ? "研究はまだ始まっていません" : `研究 第 ${researchDay} 日`}
          </span>
        </>
      }
      title={
        <>
          {month}月{day}日
          <span className="ml-3 align-middle text-2xl font-medium text-ink-soft sm:text-3xl">
            （{weekday}）
          </span>
        </>
      }
      lead={`${year}年。今日の自分を、静かに観測しましょう。`}
      aside={
        <figure className="border-l border-gilt pl-6">
          <figcaption className="font-display text-sm italic tracking-[0.16em] text-gilt-deep">
            本日の一節
          </figcaption>
          <blockquote className="mt-2 font-display text-xl leading-relaxed text-ink">
            「{quote}」
          </blockquote>
        </figure>
      }
    />
  );
}
