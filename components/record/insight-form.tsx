"use client";

import { useState, type FormEvent } from "react";
import { FIELD, FormActions } from "@/components/record/entry-forms";
import { cn } from "@/lib/cn";
import { createInsightId, INSIGHT_TEXT_MAX } from "@/lib/domain/insight";
import type { Insight, Tag } from "@/lib/domain/types";

const LABEL = "mb-2 block text-xs tracking-[0.18em] text-ink-soft";

/** 入力中の一行。保存する前の形で、タグは付けた id だけを持つ */
interface InsightDraft {
  key: string;
  id: string;
  text: string;
  tags: string[];
}

function createDraft(insight?: Insight): InsightDraft {
  return {
    key: createInsightId(),
    id: insight?.id ?? createInsightId(),
    text: insight?.text ?? "",
    tags: insight?.tags ?? [],
  };
}

/**
 * 考察の箇条書きフォーム。一行ずつ記し、行ごとにタグを付けられる。
 * Enter で次の行を足し、空の行は保存されない。タグの種類は設定画面で決める。
 */
export function InsightForm({
  initial,
  tags,
  onSave,
  onCancel,
}: {
  initial: Insight[];
  tags: readonly Tag[];
  onSave: (value: Insight[]) => void;
  onCancel: () => void;
}) {
  const [drafts, setDrafts] = useState<InsightDraft[]>(() =>
    initial.length > 0 ? initial.map((insight) => createDraft(insight)) : [createDraft()],
  );
  // 新しく足した行に、入力のカーソルを移すための印
  const [focusKey, setFocusKey] = useState<string | null>(null);

  const updateText = (key: string, text: string) =>
    setDrafts((previous) => previous.map((draft) => (draft.key === key ? { ...draft, text } : draft)));

  const toggleTag = (key: string, tagId: string) =>
    setDrafts((previous) =>
      previous.map((draft) => {
        if (draft.key !== key) return draft;
        const has = draft.tags.includes(tagId);
        return { ...draft, tags: has ? draft.tags.filter((id) => id !== tagId) : [...draft.tags, tagId] };
      }),
    );

  const removeDraft = (key: string) =>
    setDrafts((previous) => {
      const next = previous.filter((draft) => draft.key !== key);
      return next.length > 0 ? next : [createDraft()];
    });

  const addAfter = (key: string) => {
    const created = createDraft();
    setFocusKey(created.key);
    setDrafts((previous) => {
      const index = previous.findIndex((draft) => draft.key === key);
      const next = [...previous];
      next.splice(index + 1, 0, created);
      return next;
    });
  };

  const addAtEnd = () => {
    const created = createDraft();
    setFocusKey(created.key);
    setDrafts((previous) => [...previous, created]);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const known = new Set(tags.map((tag) => tag.id));
    const value = drafts.flatMap((draft): Insight[] => {
      const text = draft.text.trim();
      if (!text) return [];
      return [{ id: draft.id, text: text.slice(0, INSIGHT_TEXT_MAX), tags: draft.tags.filter((id) => known.has(id)) }];
    });
    onSave(value);
  };

  return (
    <form onSubmit={submit}>
      <span className={LABEL}>考察（こうすればこうなるかも）</span>
      <ul className="space-y-5">
        {drafts.map((draft, index) => (
          <li key={draft.key} className="border-b border-line pb-5 last:border-b-0 last:pb-0">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="shrink-0 text-gilt-deep">
                ・
              </span>
              <input
                type="text"
                value={draft.text}
                maxLength={INSIGHT_TEXT_MAX}
                placeholder="例：夜の散歩をすると、翌朝の濁りが澄みやすい"
                aria-label={`考察 ${index + 1}`}
                autoFocus={draft.key === focusKey}
                onChange={(event) => updateText(draft.key, event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    addAfter(draft.key);
                  }
                }}
                className={FIELD}
              />
              <button
                type="button"
                onClick={() => removeDraft(draft.key)}
                aria-label={`考察 ${index + 1} を消す`}
                className="shrink-0 text-xs text-ink-soft underline decoration-line-strong underline-offset-4 hover:text-ink"
              >
                消す
              </button>
            </div>

            {tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 pl-6" role="group" aria-label={`考察 ${index + 1} のタグ`}>
                {tags.map((tag) => {
                  const active = draft.tags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleTag(draft.key, tag.id)}
                      className={cn(
                        "border px-3 py-1 text-xs tracking-[0.08em] transition-colors duration-200",
                        active
                          ? "border-amethyst bg-amethyst text-vellum"
                          : "border-line-strong text-ink-soft hover:border-gilt hover:bg-gilt-mist/50",
                      )}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            )}
          </li>
        ))}
      </ul>

      <button type="button" onClick={addAtEnd} className="btn btn-ghost mt-6 w-full">
        項目を足す
      </button>
      <p className="mt-3 text-xs leading-6 text-ink-soft">
        Enter で次の行を足せます。空の行は保存されません。
        {tags.length === 0 && "タグは、設定の「タグの種類」で作れます。"}
      </p>

      <FormActions
        onCancel={onCancel}
        onClear={initial.length > 0 ? () => onSave([]) : undefined}
        clearLabel="考察を消す"
      />
    </form>
  );
}
