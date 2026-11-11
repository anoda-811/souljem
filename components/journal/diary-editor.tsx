"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons/icon";
import { ManuscriptCard } from "@/components/ui/manuscript-card";
import { parseISODate } from "@/lib/domain/date";
import { getTurbidityStage } from "@/lib/domain/turbidity";
import type { ISODate, JournalEntry } from "@/lib/domain/types";

/** 題名が空のまま保存されたときに、保存先へ入る題名 */
export const UNTITLED = "無題";

/** 書き終えてから、この時間だけ待って保存する */
const SAVE_DELAY_MS = 700;

/** 罫線の間隔。本文の1行の高さと揃える */
const LINE = "2.1rem";

const RULED_PAPER = `repeating-linear-gradient(to bottom, transparent 0, transparent calc(${LINE} - 1px), var(--color-line-strong) calc(${LINE} - 1px), var(--color-line-strong) ${LINE})`;

function displayTitle(entry: JournalEntry | null): string {
  return entry && entry.title !== UNTITLED ? entry.title : "";
}

function formatJaDate(date: ISODate): string {
  const { year, month, day, weekday } = parseISODate(date);
  return `${year}年${month}月${day}日（${weekday}）`;
}

interface DiaryEditorProps {
  date: ISODate;
  today: ISODate;
  entry: JournalEntry | null;
  /** その日の濁り度（記録が無ければ null） */
  turbidity: number | null;
  onSave: (title: string, body: string) => void;
}

/**
 * 日記の一枚の頁。日付が変わるたびに、呼び出し側が key を変えて作り直す。
 * 書きかけは少し待つと自動で保存し、日付を変えたり画面を離れたりした時にも保存する。
 */
export function DiaryEditor({ date, today, entry, turbidity, onSave }: DiaryEditorProps) {
  const [title, setTitle] = useState(() => displayTitle(entry));
  const [body, setBody] = useState(() => entry?.body ?? "");
  const [saved, setSaved] = useState(() => ({
    title: displayTitle(entry),
    body: entry?.body ?? "",
  }));

  const dirty = title !== saved.title || body !== saved.body;

  // 保存の関数と、書きかけの内容は、常に最新を参照する
  const onSaveRef = useRef(onSave);
  const latest = useRef({ title, body, saved, dirty });
  useEffect(() => {
    onSaveRef.current = onSave;
    latest.current = { title, body, saved, dirty };
  });

  // 書くのを少し止めたら保存する
  useEffect(() => {
    if (!dirty) return;
    const timer = window.setTimeout(() => {
      onSaveRef.current(title, body);
      setSaved({ title, body });
    }, SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [dirty, title, body]);

  // 日付を変える・画面を離れるときは、待っている書きかけも保存する
  useEffect(() => {
    return () => {
      const current = latest.current;
      if (current.dirty) onSaveRef.current(current.title, current.body);
    };
  }, []);

  const hasSaved = saved.title !== "" || saved.body !== "";

  const remove = () => {
    if (!window.confirm("この頁を消します。書いた内容は元に戻せません。よろしいですか？")) return;
    onSave("", "");
    setTitle("");
    setBody("");
    setSaved({ title: "", body: "" });
  };

  const status = dirty
    ? "書きかけです。少し待つと綴じられます。"
    : hasSaved
      ? "綴じてあります。"
      : "まだ白紙です。";

  return (
    <ManuscriptCard>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-gilt/60 bg-gilt-mist/50 text-amethyst">
            <Icon name="quill" className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-base italic tracking-[0.12em] text-amethyst">
              {date === today ? "Today" : "Past page"}
            </p>
            <p className="mt-1 font-display text-2xl font-semibold text-ink">{formatJaDate(date)}</p>
          </div>
        </div>
        {turbidity !== null && (
          <p className="text-xs leading-6 text-ink-soft">
            この日の濁り
            <span className="ml-2 font-display text-xl text-ink">{turbidity}</span>
            <span className="ml-2">{getTurbidityStage(turbidity).label}</span>
          </p>
        )}
      </div>

      <div className="mt-8 border-l-2 border-double border-gilt/50 pl-5 sm:pl-8">
        <label className="block">
          <span className="sr-only">題名</span>
          <input
            type="text"
            value={title}
            maxLength={40}
            placeholder="題名（空のままでもかまいません）"
            onChange={(event) => setTitle(event.target.value)}
            className="w-full border-b border-line bg-transparent pb-3 font-display text-2xl font-semibold text-ink placeholder:text-mist focus:border-gilt focus:outline-none"
          />
        </label>

        <label className="mt-2 block">
          <span className="sr-only">本文</span>
          <textarea
            value={body}
            rows={14}
            placeholder="今日あったこと、感じたこと、気になったこと……"
            onChange={(event) => setBody(event.target.value)}
            style={{
              backgroundImage: RULED_PAPER,
              backgroundAttachment: "local",
              lineHeight: LINE,
            }}
            className="w-full resize-y bg-transparent pt-0 font-body text-[1.02rem] text-ink placeholder:text-mist focus:outline-none"
          />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-ink-soft">
        <p>{status}</p>
        <div className="flex items-center gap-5">
          <span>{[...body].length} 字</span>
          {hasSaved && (
            <button
              type="button"
              onClick={remove}
              className="text-gilt-deep underline decoration-line-strong underline-offset-4 hover:text-ink"
            >
              この頁を消す
            </button>
          )}
        </div>
      </div>
    </ManuscriptCard>
  );
}
