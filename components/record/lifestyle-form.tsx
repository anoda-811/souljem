"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { FIELD, FormActions } from "@/components/record/entry-forms";
import { QualityPips } from "@/components/ui/quality-pips";
import { cn } from "@/lib/cn";
import { scaleOf } from "@/lib/domain/lifestyle";
import type { LifestyleItem, Rating } from "@/lib/domain/types";

/** 項目 id → 値。記していない項目はキーを持たない */
export type LifestyleMap = Partial<Record<string, number>>;

const LABEL = "mb-2 block text-xs tracking-[0.18em] text-ink-soft";

const MAX_MINUTES = 1440;

/** 入力欄の文字を分の数に直す。空欄は未記入（null）、不正な入力は undefined */
function parseMinutes(text: string): number | null | undefined {
  const trimmed = text.trim();
  if (trimmed === "") return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) return undefined;
  return Math.min(MAX_MINUTES, Math.round(value));
}

/** 1〜5 の段階評価。同じ札をもう一度押すと未記入に戻る */
function RatingPicker({
  label,
  labels,
  value,
  onChange,
}: {
  label: string;
  labels: readonly string[];
  value: Rating | null;
  onChange: (value: Rating | null) => void;
}) {
  return (
    <fieldset>
      <legend className={LABEL}>{label}</legend>
      <div className="grid grid-cols-5 gap-2">
        {labels.map((text, i) => {
          const rating = (i + 1) as Rating;
          const active = value === rating;
          return (
            <button
              key={`${i}-${text}`}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? null : rating)}
              className={cn(
                "flex flex-col items-center gap-2.5 border px-1 py-3 text-center transition-colors duration-200",
                active
                  ? "border-amethyst bg-amethyst-mist text-amethyst-deep"
                  : "border-line-strong text-ink-soft hover:border-gilt hover:bg-gilt-mist/50",
              )}
            >
              <QualityPips value={rating} className="gap-[3px]" />
              <span className="text-[0.68rem] leading-4">{text}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** 画面で編集する値（文字）。分は入力欄の文字、評価は 1〜5 の文字（未記入は空） */
type Draft = Record<string, string>;

function toDraft(items: readonly LifestyleItem[], initial: LifestyleMap): Draft {
  const draft: Draft = {};
  for (const item of items) {
    const value = initial[item.id];
    draft[item.id] = value === undefined ? "" : String(value);
  }
  return draft;
}

/** 初期値から、今回編集する項目の値を取り除く（隠している項目の値は残す） */
function withoutItems(initial: LifestyleMap, items: readonly LifestyleItem[]): LifestyleMap {
  const next: LifestyleMap = { ...initial };
  for (const item of items) delete next[item.id];
  return next;
}

/**
 * 行動・気分の記録フォーム。表示するのは有効な項目だけ。
 * 隠している項目の値は変えずに残す。
 */
export function LifestyleForm({
  items,
  initial,
  onSave,
  onCancel,
}: {
  /** 有効な項目（設定でオフにしたものは含めない） */
  items: readonly LifestyleItem[];
  /** その日の記録に入っている値の全体 */
  initial: LifestyleMap;
  /** 有効な項目の値を反映した、全体の値を返す */
  onSave: (values: LifestyleMap) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(items, initial));
  const [invalid, setInvalid] = useState(false);

  const hasSaved = items.some((item) => initial[item.id] !== undefined);

  const setValue = (id: string, text: string) => {
    setInvalid(false);
    setDraft((previous) => ({ ...previous, [id]: text }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = withoutItems(initial, items);
    let hasInvalid = false;

    for (const item of items) {
      const text = draft[item.id] ?? "";
      if (item.kind === "minutes") {
        const minutes = parseMinutes(text);
        if (minutes === undefined) {
          hasInvalid = true;
          continue;
        }
        if (minutes !== null) next[item.id] = minutes;
      } else if (text !== "") {
        next[item.id] = Number(text);
      }
    }

    if (hasInvalid) {
      setInvalid(true);
      return;
    }
    onSave(next);
  };

  const clear = () => onSave(withoutItems(initial, items));

  if (items.length === 0) {
    return (
      <div>
        <p className="text-sm leading-7 text-ink-soft">
          記録できる項目がありません。設定で読書やボイトレなどを追加すると、ここに並びます。
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="btn btn-ghost">
            閉じる
          </button>
          <Link href="/settings" className="btn btn-primary">
            設定を開く
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <div className="grid gap-5 sm:grid-cols-3">
        {items
          .filter((item) => item.kind === "minutes")
          .map((item) => (
            <label key={item.id} className="block">
              <span className={LABEL}>{item.label}（分）</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={MAX_MINUTES}
                step={5}
                value={draft[item.id] ?? ""}
                placeholder="例：30"
                onChange={(event) => setValue(item.id, event.target.value)}
                className={FIELD}
              />
            </label>
          ))}
      </div>

      <div className="mt-7 grid gap-7">
        {items
          .filter((item) => item.kind === "rating")
          .map((item) => {
            const text = draft[item.id] ?? "";
            return (
              <RatingPicker
                key={item.id}
                label={item.label}
                labels={scaleOf(item)}
                value={text === "" ? null : (Number(text) as Rating)}
                onChange={(rating) => setValue(item.id, rating === null ? "" : String(rating))}
              />
            );
          })}
      </div>

      <p className="mt-5 text-xs leading-6 text-ink-soft">
        空欄は未記入として扱われ、分析の対象外になります。0 と記せば「しなかった」として数えます。
        {invalid && <span className="block text-gilt-deep">分は 0 以上の数字で記してください。</span>}
      </p>

      <FormActions
        onCancel={onCancel}
        onClear={hasSaved ? clear : undefined}
        clearLabel="この日の行動と気分を消す"
      />
    </form>
  );
}
