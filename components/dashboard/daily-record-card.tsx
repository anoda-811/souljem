import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons/icon";
import { ButtonLink } from "@/components/ui/button-link";
import { ManuscriptCard } from "@/components/ui/manuscript-card";
import { QualityPips } from "@/components/ui/quality-pips";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/cn";
import { formatExerciseAmount, MEAL_SLOTS } from "@/lib/domain/record";
import type { DailyRecord } from "@/lib/domain/types";

interface DailyRecordCardProps {
  record: DailyRecord | null;
}

function RecordRow({
  icon,
  label,
  children,
  muted = false,
}: {
  icon: IconName;
  label: string;
  children: ReactNode;
  muted?: boolean;
}) {
  return (
    <li className="flex gap-4 border-b border-line py-4 last:border-b-0">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-gilt/60 bg-gilt-mist/50 text-amethyst">
        <Icon name={icon} className="h-[1.15rem] w-[1.15rem]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs tracking-[0.18em] text-ink-soft">{label}</p>
        <div className={cn("mt-1 text-[0.97rem] leading-7", muted ? "text-ink-soft" : "text-ink")}>
          {children}
        </div>
      </div>
    </li>
  );
}

/** 今日の睡眠・食事・運動・体調メモの概要 */
export function DailyRecordCard({ record }: DailyRecordCardProps) {
  const meals = MEAL_SLOTS.filter(({ slot }) => record?.meals[slot]);
  const exercises = record?.exercises ?? [];

  return (
    <ManuscriptCard className="lg:col-span-5">
      <SectionHeading eyebrow="Daily Log" title="今日の記録" />

      <ul className="mt-7">
        <RecordRow icon="moon" label="睡眠">
          {record?.sleep ? (
            <>
              <span className="font-body">{record.sleep.hours.toFixed(1)} 時間</span>
              <QualityPips value={record.sleep.quality} className="ml-3 align-middle" />
            </>
          ) : (
            <span className="text-ink-soft">未記録</span>
          )}
        </RecordRow>

        <RecordRow icon="chalice" label="食事" muted={meals.length === 0}>
          {meals.length > 0 ? (
            <ul className="space-y-1">
              {meals.map(({ slot, label }) => (
                <li key={slot} className="flex gap-3">
                  <span className="w-11 shrink-0 text-xs tracking-[0.1em] text-ink-soft">{label}</span>
                  <span className="min-w-0">{record?.meals[slot]}</span>
                </li>
              ))}
            </ul>
          ) : (
            "未記録"
          )}
        </RecordRow>

        <RecordRow icon="boot" label="運動" muted={exercises.length === 0}>
          {exercises.length > 0 ? (
            <ul className="space-y-1">
              {exercises.map((entry) => (
                <li key={entry.id}>
                  {entry.kind} ・ {formatExerciseAmount(entry)}
                </li>
              ))}
            </ul>
          ) : (
            "休息日（未記録）"
          )}
        </RecordRow>

        <RecordRow icon="scroll" label="体調・生活メモ" muted={!record?.note}>
          {record?.note ? (
            <span className="font-display text-[1.05rem] italic">{record.note}</span>
          ) : (
            "未記録"
          )}
        </RecordRow>
      </ul>

      <ButtonLink href="/record" variant="ghost" className="mt-6 w-full" withArrow>
        今日の記録を開く
      </ButtonLink>
    </ManuscriptCard>
  );
}
