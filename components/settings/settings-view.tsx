"use client";

import { useState, type FormEvent } from "react";
import { LIFESTYLE_LABEL_MAX, useArchive } from "@/components/archive/archive-provider";
import { FIELD } from "@/components/record/entry-forms";
import { ManuscriptCard } from "@/components/ui/manuscript-card";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/cn";
import { DEFAULT_SCALE, LIFESTYLE_PRESETS, presetItem } from "@/lib/domain/lifestyle";
import type { LifestyleItem, LifestyleKind } from "@/lib/domain/types";

const LEAD =
  "記録と研究で使う「行動・気分」の項目を、自分の暮らしに合わせて整えます。読書やボイトレなどは、使う人だけ追加してください。";

const LABEL = "mb-2 block text-xs tracking-[0.18em] text-ink-soft";

const KIND_TEXT: Record<LifestyleKind, string> = {
  minutes: "時間（分）",
  rating: "5段階の評価",
};

/** 下の文字列ボタン。枠の無い控えめな操作に使う */
const TEXT_BUTTON =
  "text-sm text-ink-soft underline decoration-line-strong underline-offset-4 hover:text-ink";

function SettingsSkeleton() {
  return (
    <div aria-busy="true" aria-label="読み込み中" className="space-y-10">
      <div className="space-y-4 border-b border-line-strong pb-8">
        <div className="h-5 w-40 bg-line/70" />
        <div className="h-14 w-72 bg-line/70" />
      </div>
      <ManuscriptCard className="h-[30rem]" />
    </div>
  );
}

function createCustomId(): string {
  return `custom-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** 項目の一行。名前の変更・表示の切り替え・削除を、その場で行う */
function LifestyleRow({
  item,
  editing,
  draft,
  onDraftChange,
  onStartRename,
  onSaveRename,
  onCancelRename,
  onToggle,
  onRemove,
}: {
  item: LifestyleItem;
  editing: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onStartRename: () => void;
  onSaveRename: () => void;
  onCancelRename: () => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <li className="flex flex-col gap-3 border-b border-line py-5 first:pt-0 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        {editing ? (
          <form
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              onSaveRename();
            }}
            className="flex flex-wrap items-center gap-3"
          >
            <input
              type="text"
              value={draft}
              maxLength={LIFESTYLE_LABEL_MAX}
              aria-label={`${item.label} の新しい名前`}
              onChange={(event) => onDraftChange(event.target.value)}
              className={cn(FIELD, "w-56")}
            />
            <button type="submit" className="btn btn-primary">
              変える
            </button>
            <button type="button" onClick={onCancelRename} className="btn btn-ghost">
              やめる
            </button>
          </form>
        ) : (
          <>
            <p className="flex flex-wrap items-baseline gap-x-3">
              <span className="font-display text-lg font-semibold text-ink">{item.label}</span>
              <span className="text-xs text-ink-soft">{KIND_TEXT[item.kind]}</span>
            </p>
            <p className="mt-1 text-xs text-ink-soft">
              {item.enabled ? "記録の札と研究に出ています" : "隠れています（記録した値は残っています）"}
            </p>
          </>
        )}
      </div>

      {!editing && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <button type="button" onClick={onToggle} className={TEXT_BUTTON}>
            {item.enabled ? "隠す" : "表示する"}
          </button>
          <button type="button" onClick={onStartRename} className={TEXT_BUTTON}>
            名前を変える
          </button>
          <button type="button" onClick={onRemove} className={cn(TEXT_BUTTON, "text-gilt-deep")}>
            消す
          </button>
        </div>
      )}
    </li>
  );
}

/** 一覧にまだ無いおすすめ項目を、ワンタップで足す */
function PresetButtons({ ids, onAdd }: { ids: readonly string[]; onAdd: (id: string) => void }) {
  const missing = LIFESTYLE_PRESETS.filter((preset) => !ids.includes(preset.id));
  if (missing.length === 0) {
    return <p className="text-sm text-ink-soft">おすすめの項目は、すべて並んでいます。</p>;
  }
  return (
    <div className="flex flex-wrap gap-3">
      {missing.map((preset) => (
        <button
          key={preset.id}
          type="button"
          onClick={() => onAdd(preset.id)}
          className="border border-line-strong px-4 py-2 text-sm text-ink transition-colors hover:border-gilt hover:bg-gilt-mist/50"
        >
          {preset.label} を追加
        </button>
      ))}
    </div>
  );
}

/** 自分で項目を作る。段階評価は 1〜5 の既定の呼び名で記す */
function CustomItemForm({
  existingLabels,
  onAdd,
}: {
  existingLabels: readonly string[];
  onAdd: (item: LifestyleItem) => void;
}) {
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<LifestyleKind>("minutes");
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = label.trim();
    if (!trimmed) {
      setError("項目の名前を入れてください。");
      return;
    }
    if (existingLabels.includes(trimmed)) {
      setError("同じ名前の項目があります。");
      return;
    }
    onAdd({
      id: createCustomId(),
      label: trimmed.slice(0, LIFESTYLE_LABEL_MAX),
      kind,
      scale: kind === "rating" ? DEFAULT_SCALE : undefined,
      enabled: true,
    });
    setLabel("");
    setError(null);
  };

  return (
    <form onSubmit={submit} className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
      <label className="block">
        <span className={LABEL}>項目の名前</span>
        <input
          type="text"
          value={label}
          maxLength={LIFESTYLE_LABEL_MAX}
          placeholder="例：散歩、瞑想、お酒"
          onChange={(event) => {
            setError(null);
            setLabel(event.target.value);
          }}
          className={FIELD}
        />
      </label>

      <div>
        <span className={LABEL}>記し方</span>
        <div className="inline-flex border border-line-strong" role="group" aria-label="記し方">
          {(Object.keys(KIND_TEXT) as LifestyleKind[]).map((option) => {
            const active = kind === option;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                onClick={() => setKind(option)}
                className={cn(
                  "px-4 py-2.5 text-sm transition-colors duration-200",
                  active ? "bg-amethyst text-vellum" : "text-ink-soft hover:bg-gilt-mist/60",
                )}
              >
                {KIND_TEXT[option]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs leading-6 text-ink-soft">
          {kind === "minutes"
            ? "時間（分）は、分の数を記します。研究では数値の散布図になります。"
            : "5段階の評価は、低い〜高いの呼び名で記します。研究では段階ごとの平均になります。"}
          {error && <span className="block text-gilt-deep">{error}</span>}
        </p>
        <button type="submit" className="btn btn-primary">
          項目を追加する
        </button>
      </div>
    </form>
  );
}

/** 設定ページ本体。行動・気分の項目を、名前・表示・追加・削除で整える */
export function SettingsView() {
  const { archive, addLifestyleItem, updateLifestyleItem, removeLifestyleItem } = useArchive();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  if (!archive) return <SettingsSkeleton />;

  const items = archive.lifestyleItems;
  const ids = items.map((item) => item.id);
  const labels = items.map((item) => item.label);

  const startRename = (item: LifestyleItem) => {
    setEditingId(item.id);
    setDraft(item.label);
  };

  const finishRename = () => {
    if (editingId === null) return;
    updateLifestyleItem(editingId, { label: draft });
    setEditingId(null);
  };

  const handleRemove = (item: LifestyleItem) => {
    const confirmed = window.confirm(
      `「${item.label}」を消します。すべての日の記録からも、この項目の値が消え、元に戻せません。\n\n記録は残したまま表示しないだけなら「隠す」を選んでください。消してもよろしいですか？`,
    );
    if (confirmed) removeLifestyleItem(item.id);
  };

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Settings" title="設定" lead={LEAD} />

      <ManuscriptCard>
        <SectionHeading eyebrow="Lifestyle" title="行動・気分の項目" />
        <p className="mt-4 text-sm leading-7 text-ink-soft">
          ここで並べた項目が、今日の記録の「行動・気分」と、研究の分析項目になります。隠した項目は記録と研究に出なくなりますが、すでに記した値は残ります。
        </p>

        {items.length === 0 ? (
          <p className="mt-8 font-display text-[1.05rem] italic leading-8 text-ink-soft">
            まだ項目がありません。下から追加してください。
          </p>
        ) : (
          <ul className="mt-8">
            {items.map((item) => (
              <LifestyleRow
                key={item.id}
                item={item}
                editing={editingId === item.id}
                draft={draft}
                onDraftChange={setDraft}
                onStartRename={() => startRename(item)}
                onSaveRename={finishRename}
                onCancelRename={() => setEditingId(null)}
                onToggle={() => updateLifestyleItem(item.id, { enabled: !item.enabled })}
                onRemove={() => handleRemove(item)}
              />
            ))}
          </ul>
        )}
      </ManuscriptCard>

      <ManuscriptCard>
        <SectionHeading eyebrow="Add" title="項目を足す" />

        <div className="mt-6 space-y-3">
          <p className={LABEL}>おすすめから足す</p>
          <PresetButtons
            ids={ids}
            onAdd={(id) => {
              const preset = LIFESTYLE_PRESETS.find((candidate) => candidate.id === id);
              if (preset) addLifestyleItem(presetItem(preset));
            }}
          />
        </div>

        <div className="mt-8 border-t border-line pt-8">
          <p className={LABEL}>自分で作る</p>
          <CustomItemForm existingLabels={labels} onAdd={addLifestyleItem} />
        </div>
      </ManuscriptCard>

      <p className="text-xs leading-6 tracking-[0.04em] text-ink-soft">
        習慣の名前は、習慣ページの詳細から変えられます。
      </p>
    </div>
  );
}
