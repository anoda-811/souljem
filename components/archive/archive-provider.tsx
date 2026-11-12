"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ManuscriptCard } from "@/components/ui/manuscript-card";
import { SectionHeading } from "@/components/ui/section-heading";
import type { SoulArchiveRepository } from "@/lib/data";
import { toISODate } from "@/lib/domain/date";
import { emptyRecord } from "@/lib/domain/record";
import { createTagId, TAG_NAME_MAX } from "@/lib/domain/tags";
import type {
  ArchiveData,
  DailyRecord,
  HabitMark,
  ISODate,
  JournalEntry,
  LifestyleItem,
} from "@/lib/domain/types";

/** 1日分の記録のうち、画面から編集できる項目。lifestyle は項目ごとの値の全体を渡す */
export type RecordPatch = Partial<
  Pick<DailyRecord, "turbidity" | "sleep" | "meals" | "exercises" | "insights" | "lifestyle">
>;

/** 行動・気分の項目の、後から変えられる内容 */
export type LifestyleItemPatch = Partial<Pick<LifestyleItem, "label" | "enabled">>;

/** 習慣名の最大文字数（追加と名前変更で共通） */
export const HABIT_NAME_MAX = 40;

/** 行動・気分の項目名の最大文字数 */
export const LIFESTYLE_LABEL_MAX = 20;

interface ArchiveSnapshot {
  today: ISODate;
  archive: ArchiveData;
}

interface ArchiveContextValue {
  /** 読み込み前は null。クライアントでのみ確定する */
  today: ISODate | null;
  archive: ArchiveData | null;
  updateRecord(date: ISODate, patch: RecordPatch): void;
  /** 題名と本文が両方空の場合は、その日の頁を削除する */
  saveJournal(date: ISODate, title: string, body: string): void;
  /** 開始日を指定して習慣を追加する。空の名前は無視し、追加した習慣の id を返す */
  addHabit(name: string, startDate: ISODate): string | null;
  /** 習慣を削除の箱に移す。元に戻せる */
  removeHabit(id: string): void;
  restoreHabit(id: string): void;
  /** 削除の箱から完全に消す */
  purgeTrashedHabit(id: string): void;
  setHabitStartDate(id: string, date: ISODate): void;
  /** 指定日の ○ × を記す。null にすると未記入（-）に戻す */
  setHabitMark(id: string, date: ISODate, mark: HabitMark | null): void;
  /** 習慣の名前を変える。空の名前は無視する */
  renameHabit(id: string, name: string): void;
  /** 行動・気分の項目を追加する。同じ id があれば何もしない */
  addLifestyleItem(item: LifestyleItem): void;
  updateLifestyleItem(id: string, patch: LifestyleItemPatch): void;
  /** 項目を消し、すべての記録からその値も消す。取り消しはできない */
  removeLifestyleItem(id: string): void;
  /** タグを追加する。空の名前や同じ名前は無視し、追加したタグの id を返す */
  addTag(name: string): string | null;
  /** タグの名前を変える。空の名前は無視する */
  renameTag(id: string, name: string): void;
  /** タグを消し、すべての考察からも外す。取り消しはできないため、呼び出し側で確認する */
  removeTag(id: string): void;
}

const ArchiveContext = createContext<ArchiveContextValue | null>(null);

function createId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
  );
}

/**
 * 記録データをアプリ全体で共有する。
 * 「今日」の判定と読み書きはクライアントで行うため、サーバー側の事前描画では扱わない。
 */
export function ArchiveProvider({
  children,
  repository,
}: {
  children: ReactNode;
  /** このアカウントの記録の保存先。アカウントが変わるときは作り直す */
  repository: SoulArchiveRepository;
}) {
  const [snapshot, setSnapshot] = useState<ArchiveSnapshot | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // イベントハンドラから常に最新の値を読むための参照
  const latest = useRef<ArchiveSnapshot | null>(null);

  const commit = useCallback(
    (next: ArchiveSnapshot) => {
      latest.current = next;
      setSnapshot(next);
      void repository.save(next.archive);
    },
    [repository],
  );

  useEffect(() => {
    let active = true;
    const today = toISODate(new Date());

    repository
      .load()
      .then((archive) => {
        if (!active) return;
        const next = { today, archive };
        latest.current = next;
        setSnapshot(next);
      })
      .catch((error: unknown) => {
        // 読めなかったときは何も保存しない（空の記録で上書きしないため）
        if (active) setLoadError(error instanceof Error ? error.message : "記録を読み込めませんでした。");
      });

    return () => {
      active = false;
    };
  }, [repository]);

  /** 記録データを書き換える共通処理。読み込み前は何もしない */
  const mutateArchive = useCallback(
    (update: (archive: ArchiveData, today: ISODate) => ArchiveData) => {
      const current = latest.current;
      if (!current) return;
      commit({ today: current.today, archive: update(current.archive, current.today) });
    },
    [commit],
  );

  const updateRecord = useCallback(
    (date: ISODate, patch: RecordPatch) => {
      mutateArchive((archive) => {
        const existing = archive.records.find((r) => r.date === date);
        const updated: DailyRecord = { ...(existing ?? emptyRecord(date)), ...patch };

        const records = existing
          ? archive.records.map((r) => (r.date === date ? updated : r))
          : [...archive.records, updated].sort((a, b) => a.date.localeCompare(b.date));

        return { ...archive, records };
      });
    },
    [mutateArchive],
  );

  const saveJournal = useCallback(
    (date: ISODate, title: string, body: string) => {
      mutateArchive((archive) => {
        const trimmedTitle = title.trim();
        const trimmedBody = body.trim();
        const others = archive.journal.filter((entry) => entry.date !== date);

        const journal: JournalEntry[] =
          trimmedTitle || trimmedBody
            ? [
                ...others,
                { date, title: trimmedTitle || "無題", body: trimmedBody },
              ].sort((a, b) => b.date.localeCompare(a.date))
            : others;

        return { ...archive, journal };
      });
    },
    [mutateArchive],
  );

  const addHabit = useCallback(
    (name: string, startDate: ISODate): string | null => {
      const trimmed = name.trim().slice(0, HABIT_NAME_MAX);
      if (!trimmed || !latest.current) return null;

      const id = createId();
      mutateArchive((archive) => ({
        ...archive,
        habits: [...archive.habits, { id, name: trimmed, startDate, marks: {} }],
      }));
      return id;
    },
    [mutateArchive],
  );

  const removeHabit = useCallback(
    (id: string) => {
      mutateArchive((archive, today) => {
        const target = archive.habits.find((habit) => habit.id === id);
        if (!target) return archive;
        return {
          ...archive,
          habits: archive.habits.filter((habit) => habit.id !== id),
          trashedHabits: [{ ...target, deletedOn: today }, ...archive.trashedHabits],
        };
      });
    },
    [mutateArchive],
  );

  const restoreHabit = useCallback(
    (id: string) => {
      mutateArchive((archive) => {
        const target = archive.trashedHabits.find((habit) => habit.id === id);
        if (!target) return archive;
        return {
          ...archive,
          habits: [
            ...archive.habits,
            { id: target.id, name: target.name, startDate: target.startDate, marks: target.marks },
          ],
          trashedHabits: archive.trashedHabits.filter((habit) => habit.id !== id),
        };
      });
    },
    [mutateArchive],
  );

  const purgeTrashedHabit = useCallback(
    (id: string) => {
      mutateArchive((archive) => ({
        ...archive,
        trashedHabits: archive.trashedHabits.filter((habit) => habit.id !== id),
      }));
    },
    [mutateArchive],
  );

  const setHabitStartDate = useCallback(
    (id: string, date: ISODate) => {
      mutateArchive((archive) => ({
        ...archive,
        habits: archive.habits.map((habit) =>
          habit.id === id ? { ...habit, startDate: date } : habit,
        ),
      }));
    },
    [mutateArchive],
  );

  const setHabitMark = useCallback(
    (id: string, date: ISODate, mark: HabitMark | null) => {
      mutateArchive((archive) => ({
        ...archive,
        habits: archive.habits.map((habit) => {
          if (habit.id !== id) return habit;
          const marks = { ...habit.marks };
          if (mark) {
            marks[date] = mark;
          } else {
            delete marks[date];
          }
          return { ...habit, marks };
        }),
      }));
    },
    [mutateArchive],
  );

  const renameHabit = useCallback(
    (id: string, name: string) => {
      const trimmed = name.trim().slice(0, HABIT_NAME_MAX);
      if (!trimmed) return;
      mutateArchive((archive) => ({
        ...archive,
        habits: archive.habits.map((habit) =>
          habit.id === id ? { ...habit, name: trimmed } : habit,
        ),
      }));
    },
    [mutateArchive],
  );

  const addLifestyleItem = useCallback(
    (item: LifestyleItem) => {
      mutateArchive((archive) => {
        if (archive.lifestyleItems.some((existing) => existing.id === item.id)) return archive;
        return { ...archive, lifestyleItems: [...archive.lifestyleItems, item] };
      });
    },
    [mutateArchive],
  );

  const updateLifestyleItem = useCallback(
    (id: string, patch: LifestyleItemPatch) => {
      mutateArchive((archive) => ({
        ...archive,
        lifestyleItems: archive.lifestyleItems.map((item) => {
          if (item.id !== id) return item;
          const label = patch.label?.trim().slice(0, LIFESTYLE_LABEL_MAX);
          return {
            ...item,
            label: label || item.label,
            enabled: patch.enabled ?? item.enabled,
          };
        }),
      }));
    },
    [mutateArchive],
  );

  /** 項目を消し、すべての記録からその値も消す。取り消しはできないため、呼び出し側で確認する */
  const removeLifestyleItem = useCallback(
    (id: string) => {
      mutateArchive((archive) => ({
        ...archive,
        lifestyleItems: archive.lifestyleItems.filter((item) => item.id !== id),
        records: archive.records.map((record) => {
          if (!(id in record.lifestyle)) return record;
          const lifestyle = { ...record.lifestyle };
          delete lifestyle[id];
          return { ...record, lifestyle };
        }),
      }));
    },
    [mutateArchive],
  );

  const addTag = useCallback(
    (name: string): string | null => {
      const trimmed = name.trim().slice(0, TAG_NAME_MAX);
      if (!trimmed || !latest.current) return null;
      if (latest.current.archive.tags.some((tag) => tag.name === trimmed)) return null;

      const id = createTagId();
      mutateArchive((archive) => ({ ...archive, tags: [...archive.tags, { id, name: trimmed }] }));
      return id;
    },
    [mutateArchive],
  );

  const renameTag = useCallback(
    (id: string, name: string) => {
      const trimmed = name.trim().slice(0, TAG_NAME_MAX);
      if (!trimmed) return;
      mutateArchive((archive) => ({
        ...archive,
        tags: archive.tags.map((tag) => (tag.id === id ? { ...tag, name: trimmed } : tag)),
      }));
    },
    [mutateArchive],
  );

  const removeTag = useCallback(
    (id: string) => {
      mutateArchive((archive) => ({
        ...archive,
        tags: archive.tags.filter((tag) => tag.id !== id),
        records: archive.records.map((record) => {
          const touched = record.insights.some((insight) => insight.tags.includes(id));
          if (!touched) return record;
          return {
            ...record,
            insights: record.insights.map((insight) =>
              insight.tags.includes(id)
                ? { ...insight, tags: insight.tags.filter((tagId) => tagId !== id) }
                : insight,
            ),
          };
        }),
      }));
    },
    [mutateArchive],
  );

  const value = useMemo<ArchiveContextValue>(
    () => ({
      today: snapshot?.today ?? null,
      archive: snapshot?.archive ?? null,
      updateRecord,
      saveJournal,
      addHabit,
      removeHabit,
      restoreHabit,
      purgeTrashedHabit,
      setHabitStartDate,
      setHabitMark,
      renameHabit,
      addLifestyleItem,
      updateLifestyleItem,
      removeLifestyleItem,
      addTag,
      renameTag,
      removeTag,
    }),
    [
      snapshot,
      updateRecord,
      saveJournal,
      addHabit,
      removeHabit,
      restoreHabit,
      purgeTrashedHabit,
      setHabitStartDate,
      setHabitMark,
      renameHabit,
      addLifestyleItem,
      updateLifestyleItem,
      removeLifestyleItem,
      addTag,
      renameTag,
      removeTag,
    ],
  );

  if (loadError) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-5 py-12">
        <ManuscriptCard compact className="max-w-md">
          <SectionHeading eyebrow="Error" title="記録を開けません" titleFont="body" />
          <p role="alert" className="mt-5 text-sm leading-7 text-gilt-deep">
            {loadError}
          </p>
          <button type="button" onClick={() => window.location.reload()} className="btn btn-ghost mt-6">
            再読み込みする
          </button>
        </ManuscriptCard>
      </div>
    );
  }

  return (
    <ArchiveContext.Provider value={value}>{children}</ArchiveContext.Provider>
  );
}

export function useArchive(): ArchiveContextValue {
  const context = useContext(ArchiveContext);
  if (!context) {
    throw new Error("useArchive は ArchiveProvider の内側で使ってください。");
  }
  return context;
}
