import { Icon } from "@/components/icons/icon";
import { ButtonLink } from "@/components/ui/button-link";
import { ManuscriptCard } from "@/components/ui/manuscript-card";
import { SectionHeading } from "@/components/ui/section-heading";
import type { HabitStatus } from "@/lib/domain/dashboard";
import { cn } from "@/lib/cn";

interface HabitStreakCardProps {
  habits: HabitStatus[];
}

/** 直近7日の達成を菱形で並べる。一つ一つが、積み上げた印になる */
function WeekMarks({ marks }: { marks: boolean[] }) {
  return (
    <span className="flex items-center gap-1.5" aria-label={`過去7日のうち ${marks.filter(Boolean).length} 日達成`}>
      {marks.map((done, i) => (
        <span
          key={i}
          className={cn(
            "h-2 w-2 rotate-45 border",
            done ? "border-gilt-deep bg-gilt" : "border-line-strong bg-transparent",
          )}
        />
      ))}
    </span>
  );
}

/** 継続中の習慣と、その継続日数 */
export function HabitStreakCard({ habits }: HabitStreakCardProps) {
  const doneCount = habits.filter((h) => h.doneToday).length;

  return (
    <ManuscriptCard className="lg:col-span-7">
      <SectionHeading
        eyebrow="Habits"
        title="継続中の習慣"
        action={
          <span className="font-display text-sm italic tracking-[0.12em] text-ink-soft">
            本日 {doneCount} / {habits.length} 達成
          </span>
        }
      />

      {habits.length === 0 ? (
        <p className="mt-8 text-sm text-ink-soft">まだ習慣は記されていません。</p>
      ) : (
        <ul className="mt-7 divide-y divide-line">
          {habits.map((habit) => (
            <li key={habit.id} className="flex flex-wrap items-center gap-x-5 gap-y-3 py-4 first:pt-0 last:pb-0">
              <span
                aria-label={habit.doneToday ? "本日達成" : "本日未達成"}
                className={cn(
                  "flex h-7 w-7 shrink-0 rotate-45 items-center justify-center border",
                  habit.doneToday ? "border-gilt-deep bg-gilt text-vellum" : "border-line-strong bg-transparent",
                )}
              >
                {habit.doneToday && <Icon name="check" className="-rotate-45 h-3.5 w-3.5" />}
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-[0.98rem] font-medium text-ink">{habit.name}</p>
                <p className="mt-0.5 text-xs tracking-[0.06em] text-ink-soft">
                  開始から {habit.daysSinceStart} 日
                </p>
              </div>

              <WeekMarks marks={habit.recentWeek} />

              <p className="flex w-24 items-center justify-end gap-1.5 text-right">
                <Icon name="flame" className="h-4 w-4 text-gilt-deep" />
                <span className="font-display text-xl font-semibold text-ink">{habit.streak}</span>
                <span className="text-xs text-ink-soft">日連続</span>
              </p>
            </li>
          ))}
        </ul>
      )}

      <ButtonLink href="/habits" variant="ghost" className="mt-8" withArrow>
        習慣を管理する
      </ButtonLink>
    </ManuscriptCard>
  );
}
