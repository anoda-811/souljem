"use client";

import { useMemo, useState } from "react";
import { useArchive, type RecordPatch } from "@/components/archive/archive-provider";
import { CalendarCard, type DayMarker } from "@/components/record/calendar-card";
import { EntryTile } from "@/components/record/entry-tile";
import {
  ExerciseForm,
  JournalForm,
  MealForm,
  NoteForm,
  SleepForm,
} from "@/components/record/entry-forms";
import { GemForm } from "@/components/record/gem-form";
import { RecordDialog } from "@/components/record/record-dialog";
import { SoulGem } from "@/components/soul-gem/soul-gem";
import { ManuscriptCard } from "@/components/ui/manuscript-card";
import { QualityPips } from "@/components/ui/quality-pips";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  compareYearMonth,
  shiftYearMonth,
  toYearMonth,
  type YearMonth,
} from "@/lib/domain/calendar";
import { diffDays, formatShortDate, parseISODate } from "@/lib/domain/date";
import {
  averageTurbidity,
  formatExerciseAmount,
  hasRecordContent,
  MEAL_SLOTS,
  TIME_SLOTS,
} from "@/lib/domain/record";
import type {
  ArchiveData,
  DailyRecord,
  ExerciseEntry,
  ISODate,
  MealRecords,
  TurbidityReadings,
} from "@/lib/domain/types";

type DialogKind = "gem" | "sleep" | "meal" | "exercise" | "note" | "journal";

const DIALOG_META: Record<DialogKind, { eyebrow: string; title: string }> = {
  gem: { eyebrow: "Soul Gem", title: "ソウルジェムを記す" },
  sleep: { eyebrow: "Sleep", title: "睡眠を記す" },
  meal: { eyebrow: "Meal", title: "食事を記す" },
  exercise: { eyebrow: "Exercise", title: "運動を記す" },
  note: { eyebrow: "Notes", title: "体調・生活メモ" },
  journal: { eyebrow: "Journal", title: "日記を綴る" },
};

/** カレンダーの印を、日ごとにまとめる */
function buildMarkers(archive: ArchiveData | null): Map<ISODate, DayMarker> {
  const markers = new Map<ISODate, DayMarker>();
  if (!archive) return markers;

  const ensure = (date: ISODate): DayMarker => {
    let marker = markers.get(date);
    if (!marker) {
      marker = { turbidity: null, hasRecord: false, hasJournal: false };
      markers.set(date, marker);
    }
    return marker;
  };

  for (const record of archive.records) {
    if (!hasRecordContent(record)) continue;
    const marker = ensure(record.date);
    marker.hasRecord = true;
    marker.turbidity = averageTurbidity(record.turbidity);
  }

  for (const entry of archive.journal) {
    ensure(entry.date).hasJournal = true;
  }

  return markers;
}

function RecordSkeleton() {
  return (
    <div aria-busy="true" aria-label="読み込み中" className="space-y-10">
      <div className="space-y-4 border-b border-line-strong pb-8">
        <div className="h-5 w-40 bg-line/70" />
        <div className="h-14 w-72 bg-line/70" />
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <ManuscriptCard className="h-[26rem] lg:col-span-5" />
        <ManuscriptCard className="h-[26rem] lg:col-span-7" />
      </div>
    </div>
  );
}

/** ソウルジェムの欄。平均を大きく、朝・昼・晩を小さく添える */
function GemSummary({ readings }: { readings: TurbidityReadings }) {
  const average = averageTurbidity(readings);
  return (
    <div className="flex items-center gap-6">
      {average !== null && (
        <div className="w-24 shrink-0">
          <SoulGem turbidity={average} idPrefix="tile-gem" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline gap-2">
          <span className="font-display text-4xl leading-none text-ink">{average ?? "—"}</span>
          <span className="font-display text-base text-ink-soft">/ 100 ・ 平均</span>
        </p>
        <dl className="mt-4 grid grid-cols-3 gap-2">
          {TIME_SLOTS.map(({ slot, label }) => (
            <div key={slot} className="border-t border-line pt-2">
              <dt className="text-xs tracking-[0.14em] text-ink-soft">{label}</dt>
              <dd className="mt-1 font-body text-lg text-ink">{readings[slot] ?? "—"}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

/** 食事の欄。記された枠だけを並べる */
function MealSummary({ meals }: { meals: MealRecords }) {
  return (
    <ul className="space-y-2">
      {MEAL_SLOTS.filter(({ slot }) => meals[slot]).map(({ slot, label }) => (
        <li key={slot} className="flex gap-3">
          <span className="w-11 shrink-0 pt-0.5 text-xs tracking-[0.1em] text-ink-soft">{label}</span>
          <span className="line-clamp-1 min-w-0 text-[0.95rem] leading-6 text-ink">{meals[slot]}</span>
        </li>
      ))}
    </ul>
  );
}

/** 運動の欄。項目ごとに、回数か分を添える */
function ExerciseSummary({ exercises }: { exercises: ExerciseEntry[] }) {
  const shown = exercises.slice(0, 3);
  return (
    <ul className="space-y-1.5">
      {shown.map((entry) => (
        <li key={entry.id} className="flex items-baseline justify-between gap-3">
          <span className="min-w-0 truncate text-[0.97rem] text-ink">{entry.kind}</span>
          <span className="shrink-0 text-sm text-ink-soft">{formatExerciseAmount(entry)}</span>
        </li>
      ))}
      {exercises.length > shown.length && (
        <li className="text-xs text-ink-soft">ほか {exercises.length - shown.length} 件</li>
      )}
    </ul>
  );
}

/** 今日の記録ページ本体。カレンダーで日付を選び、項目ごとに記録と日記を書く */
export function RecordWorkspace() {
  const { today, archive, updateRecord, saveJournal } = useArchive();
  const [selected, setSelected] = useState<ISODate | null>(null);
  const [viewMonth, setViewMonth] = useState<YearMonth | null>(null);
  const [dialog, setDialog] = useState<DialogKind | null>(null);

  const markers = useMemo(() => buildMarkers(archive), [archive]);

  if (!today || !archive) return <RecordSkeleton />;

  const activeDate = selected ?? today;
  const month = viewMonth ?? toYearMonth(today);
  const record: DailyRecord | null = archive.records.find((r) => r.date === activeDate) ?? null;
  const journal = archive.journal.find((entry) => entry.date === activeDate) ?? null;
  const readings = record?.turbidity ?? {};
  const meals = record?.meals ?? {};
  const exercises = record?.exercises ?? [];
  const hasMeal = MEAL_SLOTS.some(({ slot }) => Boolean(meals[slot]));
  const gemAverage = averageTurbidity(readings);
  const daysAgo = diffDays(today, activeDate);
  const isToday = daysAgo === 0;
  const { year, month: monthNumber, day, weekday } = parseISODate(activeDate);
  const meta = DIALOG_META[dialog ?? "sleep"];
  const canGoNext = compareYearMonth(month, toYearMonth(today)) < 0;

  const selectDate = (date: ISODate) => {
    setSelected(date);
    setViewMonth(toYearMonth(date));
  };

  const goToday = () => {
    setSelected(null);
    setViewMonth(null);
  };

  const closeDialog = () => setDialog(null);

  const saveRecord = (patch: RecordPatch) => {
    updateRecord(activeDate, patch);
    setDialog(null);
  };

  const saveDiary = (title: string, body: string) => {
    saveJournal(activeDate, title, body);
    setDialog(null);
  };

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Daily Log"
        title={
          <>
            {monthNumber}月{day}日
            <span className="ml-3 align-middle text-2xl font-medium text-ink-soft sm:text-3xl">
              （{weekday}）
            </span>
          </>
        }
        lead={`${year}年 ・ ${
          isToday
            ? "今日の眠り、食事、動き、そして心の声を記します。"
            : `${daysAgo} 日前の頁を振り返っています。`
        }`}
        aside={
          isToday ? (
            <span className="block text-right font-display text-sm italic tracking-[0.14em] text-gilt-deep">
              今日の頁
            </span>
          ) : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <CalendarCard
          className="lg:col-span-5"
          month={month}
          selected={activeDate}
          today={today}
          markers={markers}
          readings={readings}
          canGoNext={canGoNext}
          onSelect={selectDate}
          onShiftMonth={(delta) => setViewMonth(shiftYearMonth(month, delta))}
          onToday={goToday}
        />

        <section className="lg:col-span-7">
          <SectionHeading
            eyebrow={isToday ? "Today" : "Look Back"}
            title="この日の頁"
          />

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <EntryTile
              icon="gem"
              label="ソウルジェム"
              wide
              empty={gemAverage === null}
              emptyText="朝・昼・晩の濁り度を、ゲージを動かして記す"
              onOpen={() => setDialog("gem")}
            >
              <GemSummary readings={readings} />
            </EntryTile>

            <EntryTile
              icon="moon"
              label="睡眠"
              empty={!record?.sleep}
              emptyText="睡眠時間と、その質を記す"
              onOpen={() => setDialog("sleep")}
            >
              {record?.sleep && (
                <>
                  <p className="font-body text-3xl leading-none text-ink">
                    {record.sleep.hours.toFixed(1)}
                    <span className="ml-1.5 font-body text-sm text-ink-soft">時間</span>
                  </p>
                  <QualityPips value={record.sleep.quality} className="mt-3" />
                </>
              )}
            </EntryTile>

            <EntryTile
              icon="chalice"
              label="食事"
              empty={!hasMeal}
              emptyText="朝食・昼食・夕食・間食を、それぞれ記す"
              onOpen={() => setDialog("meal")}
            >
              <MealSummary meals={meals} />
            </EntryTile>

            <EntryTile
              icon="boot"
              label="運動"
              empty={exercises.length === 0}
              emptyText="動いたことを、回数や時間で記す"
              onOpen={() => setDialog("exercise")}
            >
              <ExerciseSummary exercises={exercises} />
            </EntryTile>

            <EntryTile
              icon="scroll"
              label="体調・生活メモ"
              empty={!record?.note}
              emptyText="体の重さや心の動きを記す"
              onOpen={() => setDialog("note")}
            >
              {record?.note && (
                <p className="line-clamp-3 font-display text-[1.05rem] italic leading-7 text-ink">
                  {record.note}
                </p>
              )}
            </EntryTile>

            <EntryTile
              icon="quill"
              label="日記"
              wide
              actionLabel="綴る"
              empty={!journal}
              emptyText={
                isToday
                  ? "今日の頁はまだ白紙です。今日、心に残ったことを綴りましょう。"
                  : "この日の頁は白紙です。"
              }
              onOpen={() => setDialog("journal")}
            >
              {journal && (
                <>
                  <p className="font-display text-xl font-semibold text-ink">{journal.title}</p>
                  <p className="mt-2 line-clamp-2 text-[0.95rem] leading-7 text-ink-soft">
                    {journal.body}
                  </p>
                </>
              )}
            </EntryTile>
          </div>

          <p className="mt-6 text-xs tracking-[0.08em] text-ink-soft">
            {formatShortDate(activeDate)} の頁。項目を選ぶと、記録の札が開きます。
          </p>
        </section>
      </div>

      <RecordDialog
        open={dialog !== null}
        onDismiss={closeDialog}
        eyebrow={meta.eyebrow}
        dateLabel={formatShortDate(activeDate)}
        title={meta.title}
      >
        {dialog === "gem" && (
          <GemForm
            initial={readings}
            onSave={(value) => saveRecord({ turbidity: value })}
            onCancel={closeDialog}
          />
        )}
        {dialog === "sleep" && (
          <SleepForm
            initial={record?.sleep ?? null}
            onSave={(sleep) => saveRecord({ sleep })}
            onCancel={closeDialog}
          />
        )}
        {dialog === "meal" && (
          <MealForm
            initial={meals}
            onSave={(value) => saveRecord({ meals: value })}
            onCancel={closeDialog}
          />
        )}
        {dialog === "exercise" && (
          <ExerciseForm
            initial={exercises}
            onSave={(value) => saveRecord({ exercises: value })}
            onCancel={closeDialog}
          />
        )}
        {dialog === "note" && (
          <NoteForm
            initial={record?.note ?? null}
            onSave={(note) => saveRecord({ note })}
            onCancel={closeDialog}
          />
        )}
        {dialog === "journal" && (
          <JournalForm initial={journal} onSave={saveDiary} onCancel={closeDialog} />
        )}
      </RecordDialog>
    </div>
  );
}
