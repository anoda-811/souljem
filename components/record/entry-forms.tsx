"use client";

import { useState, type FormEvent } from "react";
import { QualityPips } from "@/components/ui/quality-pips";
import { cn } from "@/lib/cn";
import { EXERCISE_PRESETS } from "@/lib/domain/presets";
import { MEAL_SLOTS } from "@/lib/domain/record";
import type {
  ExerciseEntry,
  ExerciseMode,
  JournalEntry,
  MealRecords,
  SleepRecord,
} from "@/lib/domain/types";

export const FIELD =
  "w-full border border-line-strong bg-parchment/50 px-4 py-3 text-[0.98rem] leading-7 text-ink placeholder:text-mist focus:border-gilt focus:bg-vellum focus:outline-none focus-visible:ring-2 focus-visible:ring-gilt/40";

const LABEL = "mb-2 block text-xs tracking-[0.18em] text-ink-soft";

const QUALITY_LABELS = ["とても浅い", "浅い", "ふつう", "良い", "とても良い"] as const;

/** 保存・消去・やめるの操作列。すべての記録フォームで共通に使う */
export function FormActions({
  onCancel,
  onClear,
  clearLabel,
}: {
  onCancel: () => void;
  onClear?: () => void;
  clearLabel?: string;
}) {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
      {onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="text-sm text-ink-soft underline decoration-line-strong underline-offset-4 hover:text-ink"
        >
          {clearLabel ?? "消去する"}
        </button>
      ) : (
        <span />
      )}
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="btn btn-ghost">
          やめる
        </button>
        <button type="submit" className="btn btn-primary">
          保存する
        </button>
      </div>
    </div>
  );
}

export function SleepForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: SleepRecord | null;
  onSave: (value: SleepRecord | null) => void;
  onCancel: () => void;
}) {
  const [hours, setHours] = useState(initial ? String(initial.hours) : "7");
  const [quality, setQuality] = useState<SleepRecord["quality"]>(initial?.quality ?? 3);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = Number(hours);
    if (!Number.isFinite(value) || value < 0) return;
    onSave({ hours: Math.round(value * 10) / 10, quality });
  };

  return (
    <form onSubmit={submit}>
      <label className="block">
        <span className={LABEL}>睡眠時間（時間）</span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          max={24}
          step={0.5}
          required
          value={hours}
          onChange={(event) => setHours(event.target.value)}
          className={FIELD}
        />
      </label>

      <fieldset className="mt-7">
        <legend className={LABEL}>睡眠の質</legend>
        <div className="grid grid-cols-5 gap-2">
          {QUALITY_LABELS.map((label, i) => {
            const value = (i + 1) as SleepRecord["quality"];
            const active = value === quality;
            return (
              <button
                key={label}
                type="button"
                aria-pressed={active}
                onClick={() => setQuality(value)}
                className={cn(
                  "flex flex-col items-center gap-2.5 border px-1 py-3 text-center transition-colors duration-200",
                  active
                    ? "border-amethyst bg-amethyst-mist text-amethyst-deep"
                    : "border-line-strong text-ink-soft hover:border-gilt hover:bg-gilt-mist/50",
                )}
              >
                <QualityPips value={value} className="gap-[3px]" />
                <span className="text-[0.68rem] leading-4">{label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <FormActions
        onCancel={onCancel}
        onClear={initial ? () => onSave(null) : undefined}
        clearLabel="記録を消す"
      />
    </form>
  );
}

/** 食事は朝食・昼食・夕食・間食の4枠に分けて記す */
export function MealForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: MealRecords;
  onSave: (value: MealRecords) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<MealRecords>(initial);
  const hasSaved = MEAL_SLOTS.some(({ slot }) => Boolean(initial[slot]));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleaned: MealRecords = {};
    for (const { slot } of MEAL_SLOTS) {
      const text = draft[slot]?.trim();
      if (text) cleaned[slot] = text;
    }
    onSave(cleaned);
  };

  return (
    <form onSubmit={submit}>
      <div className="space-y-6">
        {MEAL_SLOTS.map(({ slot, label, placeholder }) => (
          <label key={slot} className="block">
            <span className={LABEL}>{label}</span>
            <textarea
              rows={2}
              value={draft[slot] ?? ""}
              placeholder={placeholder}
              onChange={(event) =>
                setDraft((previous) => ({ ...previous, [slot]: event.target.value }))
              }
              className={cn(FIELD, "resize-y")}
            />
          </label>
        ))}
      </div>
      <p className="mt-4 text-xs leading-6 text-ink-soft">
        食べなかった枠は空のままで構いません。
      </p>

      <FormActions
        onCancel={onCancel}
        onClear={hasSaved ? () => onSave({}) : undefined}
        clearLabel="食事の記録を消す"
      />
    </form>
  );
}

/** 運動は複数の項目を並べられる。各項目は回数か時間（分）のどちらかで数える */
interface ExerciseDraft {
  key: string;
  kind: string;
  mode: ExerciseMode;
  amount: string;
}

const MODE_OPTIONS: readonly { mode: ExerciseMode; label: string; unit: string; step: number; max: number }[] = [
  { mode: "reps", label: "回数", unit: "回", step: 1, max: 999 },
  { mode: "minutes", label: "時間（分）", unit: "分", step: 5, max: 600 },
];

function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function createDraft(entry?: ExerciseEntry): ExerciseDraft {
  if (entry) {
    return { key: entry.id, kind: entry.kind, mode: entry.mode, amount: String(entry.amount) };
  }
  return { key: newId(), kind: "", mode: "reps", amount: "10" };
}

export function ExerciseForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: ExerciseEntry[];
  onSave: (value: ExerciseEntry[]) => void;
  onCancel: () => void;
}) {
  const [drafts, setDrafts] = useState<ExerciseDraft[]>(() =>
    initial.length > 0 ? initial.map(createDraft) : [createDraft()],
  );

  const updateDraft = (key: string, patch: Partial<ExerciseDraft>) =>
    setDrafts((previous) =>
      previous.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft)),
    );

  const removeDraft = (key: string) =>
    setDrafts((previous) => previous.filter((draft) => draft.key !== key));

  const addDraft = () => setDrafts((previous) => [...previous, createDraft()]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const entries = drafts.flatMap((draft): ExerciseEntry[] => {
      const kind = draft.kind.trim();
      const amount = Math.round(Number(draft.amount));
      if (!kind || !Number.isFinite(amount) || amount <= 0) return [];
      return [{ id: draft.key, kind, mode: draft.mode, amount }];
    });
    onSave(entries);
  };

  return (
    <form onSubmit={submit}>
      <datalist id="exercise-presets">
        {EXERCISE_PRESETS.map((preset) => (
          <option key={preset} value={preset} />
        ))}
      </datalist>

      <ul className="space-y-4">
        {drafts.map((draft, index) => {
          const option = MODE_OPTIONS.find((o) => o.mode === draft.mode) ?? MODE_OPTIONS[0];
          return (
            <li key={draft.key} className="border border-line-strong bg-parchment/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-body text-xs tracking-[0.14em] text-ink-soft">
                  項目 {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeDraft(draft.key)}
                  className="text-xs text-ink-soft underline decoration-line-strong underline-offset-4 hover:text-ink"
                >
                  この項目を消す
                </button>
              </div>

              <input
                type="text"
                list="exercise-presets"
                value={draft.kind}
                placeholder="例：剣術の型稽古"
                aria-label={`項目 ${index + 1} の運動内容`}
                onChange={(event) => updateDraft(draft.key, { kind: event.target.value })}
                className={cn(FIELD, "mt-3")}
              />

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="inline-flex border border-line-strong" role="group" aria-label="数え方">
                  {MODE_OPTIONS.map(({ mode, label }) => {
                    const active = draft.mode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        aria-pressed={active}
                        onClick={() => updateDraft(draft.key, { mode })}
                        className={cn(
                          "px-4 py-2 text-sm transition-colors duration-200",
                          active
                            ? "bg-amethyst text-vellum"
                            : "text-ink-soft hover:bg-gilt-mist/60",
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={option.max}
                    step={option.step}
                    value={draft.amount}
                    aria-label={`${option.label}`}
                    onChange={(event) => updateDraft(draft.key, { amount: event.target.value })}
                    className="w-28 border border-line-strong bg-parchment/50 px-3 py-2 text-[0.98rem] text-ink focus:border-gilt focus:bg-vellum focus:outline-none"
                  />
                  <span className="text-sm text-ink-soft">{option.unit}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <button type="button" onClick={addDraft} className="btn btn-ghost mt-5 w-full">
        運動を追加する
      </button>
      <p className="mt-3 text-xs leading-6 text-ink-soft">
        運動内容が空の項目や、0 の項目は保存されません。すべて消して保存すると、運動は未記録に戻ります。
      </p>

      <FormActions
        onCancel={onCancel}
        onClear={initial.length > 0 ? () => onSave([]) : undefined}
        clearLabel="運動の記録を消す"
      />
    </form>
  );
}

function TextForm({
  initial,
  placeholder,
  rows,
  onSave,
  onCancel,
  clearLabel,
}: {
  initial: string | null;
  placeholder: string;
  rows: number;
  onSave: (value: string | null) => void;
  onCancel: () => void;
  clearLabel: string;
}) {
  const [text, setText] = useState(initial ?? "");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave(text.trim() || null);
      }}
    >
      <label className="block">
        <span className={LABEL}>内容</span>
        <textarea
          rows={rows}
          value={text}
          placeholder={placeholder}
          onChange={(event) => setText(event.target.value)}
          className={cn(FIELD, "resize-y")}
        />
      </label>
      <FormActions
        onCancel={onCancel}
        onClear={initial ? () => onSave(null) : undefined}
        clearLabel={clearLabel}
      />
    </form>
  );
}

export function NoteForm(props: {
  initial: string | null;
  onSave: (value: string | null) => void;
  onCancel: () => void;
}) {
  return (
    <TextForm
      {...props}
      rows={5}
      placeholder="体の重さ、心の動き、ふと思ったことなど"
      clearLabel="メモを消す"
    />
  );
}

export function JournalForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: JournalEntry | null;
  onSave: (title: string, body: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave(title, body);
      }}
    >
      <label className="block">
        <span className={LABEL}>題名</span>
        <input
          type="text"
          value={title}
          placeholder="例：霧の晴れた朝"
          onChange={(event) => setTitle(event.target.value)}
          className={FIELD}
        />
      </label>

      <label className="mt-6 block">
        <span className={LABEL}>本文</span>
        <textarea
          rows={10}
          value={body}
          placeholder="今日、心に残ったことを、そのまま書いてみましょう。"
          onChange={(event) => setBody(event.target.value)}
          className={cn(FIELD, "resize-y")}
        />
      </label>
      <p className="mt-3 text-xs leading-6 text-ink-soft">
        題名と本文を両方空にして保存すると、この日の頁は消えます。
      </p>

      <FormActions
        onCancel={onCancel}
        onClear={
          initial
            ? () => {
                if (window.confirm("この頁を破きます。よろしいですか？")) onSave("", "");
              }
            : undefined
        }
        clearLabel="この頁を破く"
      />
    </form>
  );
}
