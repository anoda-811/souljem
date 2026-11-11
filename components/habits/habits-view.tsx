"use client";

import { useState, type FormEvent } from "react";
import { useArchive } from "@/components/archive/archive-provider";
import { FIELD } from "@/components/record/entry-forms";
import { HabitCalendar } from "@/components/habits/habit-calendar";
import { HabitTrash } from "@/components/habits/habit-trash";
import { Icon } from "@/components/icons/icon";
import { ManuscriptCard } from "@/components/ui/manuscript-card";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/cn";
import {
  compareYearMonth,
  toYearMonth,
  type YearMonth,
} from "@/lib/domain/calendar";
import { diffDays, formatShortDate } from "@/lib/domain/date";
import { calculateStreak } from "@/lib/domain/streak";
import type { HabitMark, ISODate } from "@/lib/domain/types";

const LEAD =
  "続けたい小さな行いに、開始の日を刻みます。毎日の達成は、連なる印として積み上がっていきます。";

const STATUS_TEXT: Record<HabitMark | "none", string> = {
  done: "○ 達成",
  missed: "× 未達成",
  none: "未記入（-）",
};

function HabitsSkeleton() {
  return (
    <div aria-busy="true" aria-label="読み込み中" className="space-y-10">
      <div className="space-y-4 border-b border-line-strong pb-8">
        <div className="h-5 w-40 bg-line/70" />
        <div className="h-14 w-72 bg-line/70" />
      </div>
    </div>
  );
}

/** 今日の○×を一番上で記せるようにし、選んだ習慣の詳細とカレンダーを下に並べる */
export function HabitsView() {
  const {
    today,
    archive,
    addHabit,
    removeHabit,
    setHabitStartDate,
    setHabitMark,
  } = useArchive();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<ISODate | null>(null);
  const [viewMonth, setViewMonth] = useState<YearMonth | null>(null);
  const [draft, setDraft] = useState("");
  const [draftStart, setDraftStart] = useState<ISODate | null>(null);
  /** 開始日を編集中のみ値を持つ。null のときは通常表示 */
  const [editingStart, setEditingStart] = useState<ISODate | null>(null);

  if (!today || !archive) return <HabitsSkeleton />;

  const startValue = draftStart ?? today;

  const habits = archive.habits;
  const habit = habits.find((h) => h.id === selectedId) ?? habits[0] ?? null;
  const activeDate = selectedDate ?? today;
  const month = viewMonth ?? toYearMonth(today);
  const canGoNext = compareYearMonth(month, toYearMonth(today)) < 0;
  const showToday = selectedDate !== null || viewMonth !== null;
  const doneToday = habits.filter((h) => h.marks[today] === "done").length;

  const selectDate = (date: ISODate) => {
    setSelectedDate(date);
    setViewMonth(toYearMonth(date));
  };

  const goToday = () => {
    setSelectedDate(null);
    setViewMonth(null);
  };

  /** 選んでいた日が習慣の開始日より前なら、記せない日なので今日に戻す */
  const fitDateTo = (startDate: ISODate) => {
    if (selectedDate !== null && selectedDate < startDate) goToday();
  };

  const selectHabit = (id: string) => {
    const next = habits.find((h) => h.id === id);
    setSelectedId(id);
    setEditingStart(null);
    if (next) fitDateTo(next.startDate);
  };

  const handleAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!startValue || startValue > today) return;
    const id = addHabit(draft, startValue);
    if (!id) return;
    setDraft("");
    setDraftStart(null);
    setSelectedId(id);
    fitDateTo(startValue);
  };

  /** 同じ印をもう一度押すと未記入に戻す */
  const toggleToday = (id: string, current: HabitMark | "none", mark: HabitMark) => {
    setHabitMark(id, today, current === mark ? null : mark);
  };

  const handleSaveStart = () => {
    if (!habit || !editingStart || editingStart > today) return;
    setHabitStartDate(habit.id, editingStart);
    setEditingStart(null);
    fitDateTo(editingStart);
  };

  /** 削除は「削除した習慣」へ移すだけなので、確認は挟まない */
  const handleRemove = () => {
    if (!habit) return;
    removeHabit(habit.id);
    setSelectedId(null);
    setEditingStart(null);
  };

  const streak = habit ? calculateStreak(habit.marks, today, habit.startDate) : 0;
  const canMark = habit !== null && activeDate >= habit.startDate && activeDate <= today;
  const currentState: HabitMark | "none" = habit?.marks[activeDate] ?? "none";

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Habits" title="習慣" lead={LEAD} />

      <ManuscriptCard>
        <SectionHeading
          eyebrow="Today"
          title="今日の達成"
          action={
            habits.length > 0 ? (
              <span className="text-sm text-ink-soft">
                本日 {doneToday} / {habits.length} 達成
              </span>
            ) : undefined
          }
        />

        {habits.length === 0 ? (
          <p className="mt-6 text-sm text-ink-soft">
            まだ習慣は記されていません。下の「新しい習慣」から追加できます。
          </p>
        ) : (
          <>
            <ul className="mt-6 divide-y divide-line">
              {habits.map((item) => {
                const state: HabitMark | "none" = item.marks[today] ?? "none";
                const itemStreak = calculateStreak(item.marks, today, item.startDate);
                return (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[0.98rem] font-medium text-ink">{item.name}</p>
                      <p className="mt-1 text-xs text-ink-soft">{itemStreak} 日連続</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        aria-pressed={state === "done"}
                        onClick={() => toggleToday(item.id, state, "done")}
                        className={cn(
                          "btn min-w-[7.5rem]",
                          state === "done" ? "btn-primary" : "btn-ghost",
                        )}
                      >
                        ○ 達成
                      </button>
                      <button
                        type="button"
                        aria-pressed={state === "missed"}
                        onClick={() => toggleToday(item.id, state, "missed")}
                        className={cn(
                          "btn min-w-[7.5rem]",
                          state === "missed" ? "btn-primary" : "btn-ghost",
                        )}
                      >
                        × 未達成
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-5 text-xs text-ink-soft">
              同じ印をもう一度押すと、未記入（-）に戻ります。
            </p>
          </>
        )}
      </ManuscriptCard>

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <ManuscriptCard className="lg:col-span-5">
          <SectionHeading
            eyebrow="List"
            title="続けている習慣"
            action={<span className="text-sm text-ink-soft">{habits.length} 件</span>}
          />

          {habits.length > 0 && (
            <ul className="mt-6 divide-y divide-line">
              {habits.map((item) => {
                const active = item.id === habit?.id;
                const itemStreak = calculateStreak(item.marks, today, item.startDate);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => selectHabit(item.id)}
                      className={cn(
                        "flex w-full items-center gap-4 py-4 text-left transition-colors",
                        active ? "text-ink" : "text-ink-soft hover:text-ink",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "h-2 w-2 shrink-0 rotate-45 border",
                          active ? "border-amethyst bg-amethyst" : "border-line-strong",
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate text-[0.98rem] font-medium">
                        {item.name}
                      </span>
                      <span className="flex w-20 shrink-0 items-baseline justify-end gap-1">
                        <span className="font-display text-lg font-semibold text-ink">{itemStreak}</span>
                        <span className="text-xs">日連続</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <form onSubmit={handleAdd} className="mt-7 space-y-3 border-t border-line pt-6">
            <label htmlFor="habit-name" className="block text-xs tracking-[0.18em] text-ink-soft">
              新しい習慣
            </label>
            <input
              id="habit-name"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="例：朝に水を一杯飲む"
              maxLength={40}
              className={FIELD}
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex flex-1 flex-col gap-2 text-xs tracking-[0.18em] text-ink-soft">
                開始日（この日から○×を記せます）
                <input
                  type="date"
                  value={startValue}
                  max={today}
                  onChange={(event) => setDraftStart(event.target.value || null)}
                  className={FIELD}
                />
              </label>
              <button
                type="submit"
                disabled={!draft.trim() || !startValue || startValue > today}
                className="btn btn-primary"
              >
                追加する
              </button>
            </div>
          </form>
        </ManuscriptCard>

        <div className="space-y-6 lg:col-span-7">
          {habit ? (
            <>
              <ManuscriptCard compact>
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div className="min-w-0">
                    <p className="font-display text-sm italic tracking-[0.14em] text-amethyst">Habit</p>
                    <p className="mt-1 text-xl font-semibold text-ink">{habit.name}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs tracking-[0.06em] text-ink-soft">
                      <span>
                        開始日 {formatShortDate(habit.startDate)} ・ 開始から{" "}
                        {diffDays(today, habit.startDate) + 1} 日
                      </span>
                      {editingStart === null && (
                        <button
                          type="button"
                          onClick={() => setEditingStart(habit.startDate)}
                          className="underline underline-offset-4 hover:text-ink"
                        >
                          開始日を変更
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs tracking-[0.12em] text-ink-soft">今日時点の連続</p>
                    <p className="mt-1 flex items-center justify-end gap-1.5">
                      <Icon name="flame" className="h-4 w-4 text-gilt-deep" />
                      <span className="font-display text-4xl font-semibold text-ink">{streak}</span>
                      <span className="text-sm text-ink-soft">日</span>
                    </p>
                  </div>
                </div>

                {editingStart !== null && (
                  <div className="mt-5 space-y-3 border-t border-line pt-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <label className="flex flex-1 flex-col gap-2 text-xs tracking-[0.18em] text-ink-soft">
                        新しい開始日
                        <input
                          type="date"
                          value={editingStart}
                          max={today}
                          onChange={(event) => setEditingStart(event.target.value)}
                          className={FIELD}
                        />
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={!editingStart || editingStart > today}
                          onClick={handleSaveStart}
                          className="btn btn-primary"
                        >
                          保存する
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingStart(null)}
                          className="btn btn-ghost"
                        >
                          やめる
                        </button>
                      </div>
                    </div>
                    <p className="text-xs leading-6 text-ink-soft">
                      開始日より前の○×は消えずに残ります。開始日を戻すと、また見えるようになります。
                    </p>
                  </div>
                )}
              </ManuscriptCard>

              <HabitCalendar
                habit={habit}
                month={month}
                today={today}
                selected={activeDate}
                canGoNext={canGoNext}
                showToday={showToday}
                onSelect={selectDate}
                onShiftMonth={(delta) => {
                  setViewMonth((current) => {
                    const base = current ?? toYearMonth(today);
                    const index = base.year * 12 + (base.month - 1) + delta;
                    return { year: Math.floor(index / 12), month: (index % 12) + 1 };
                  });
                }}
                onToday={goToday}
              />

              <ManuscriptCard compact>
                <p className="text-xs tracking-[0.14em] text-ink-soft">
                  {formatShortDate(activeDate)} の記録
                </p>
                <p className="mt-2 font-display text-lg text-ink">{STATUS_TEXT[currentState]}</p>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={!canMark}
                    onClick={() => setHabitMark(habit.id, activeDate, "done")}
                    className={cn("btn", currentState === "done" ? "btn-primary" : "btn-ghost")}
                  >
                    ○ 達成
                  </button>
                  <button
                    type="button"
                    disabled={!canMark}
                    onClick={() => setHabitMark(habit.id, activeDate, "missed")}
                    className={cn("btn", currentState === "missed" ? "btn-primary" : "btn-ghost")}
                  >
                    × 未達成
                  </button>
                  <button
                    type="button"
                    disabled={!canMark}
                    onClick={() => setHabitMark(habit.id, activeDate, null)}
                    className="btn btn-ghost"
                  >
                    記入を消す
                  </button>
                </div>
                {!canMark && (
                  <p className="mt-3 text-xs text-ink-soft">開始日より前、または未来の日には記せません。</p>
                )}
              </ManuscriptCard>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleRemove}
                  className="text-xs text-ink-soft underline underline-offset-4 hover:text-ink"
                >
                  この習慣を削除する（下から元に戻せます）
                </button>
              </div>
            </>
          ) : (
            <ManuscriptCard>
              <p className="text-sm text-ink-soft">習慣を追加すると、ここで日ごとの ○ × を記せます。</p>
            </ManuscriptCard>
          )}
        </div>
      </div>

      <HabitTrash />
    </div>
  );
}
