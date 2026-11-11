import { addDays, diffDays } from "./date";
import { getDailyQuote, type Quote } from "./quotes";
import { averageTurbidity, hasRecordContent } from "./record";
import { calculateStreak } from "./streak";
import type {
  ArchiveData,
  DailyRecord,
  ISODate,
  JournalEntry,
} from "./types";

export interface HabitStatus {
  id: string;
  name: string;
  startDate: ISODate;
  streak: number;
  doneToday: boolean;
  daysSinceStart: number;
  /** 過去7日分の達成状況（古い順） */
  recentWeek: boolean[];
}

export interface DashboardSnapshot {
  today: ISODate;
  /** 最初の記録の日を1日目とする研究日数。まだ記録がなければ null */
  researchDay: number | null;
  quote: Quote;
  gem: {
    /** 今日の濁り度（朝・昼・晩の平均） */
    turbidity: number | null;
    previousTurbidity: number | null;
    /** 直近14日の濁り度（古い順） */
    history: { date: ISODate; turbidity: number }[];
  };
  todayRecord: DailyRecord | null;
  habits: HabitStatus[];
  journal: {
    today: JournalEntry | null;
    latest: JournalEntry | null;
    totalEntries: number;
  };
  archive: {
    recordedDays: number;
  };
}

const HISTORY_DAYS = 14;

export function buildDashboardSnapshot(
  archive: ArchiveData,
  today: ISODate,
): DashboardSnapshot {
  const recordsByDate = new Map(archive.records.map((r) => [r.date, r]));

  // 研究の起点は、最初に何か記された日（記録または日記）
  const firstEntryDate =
    [
      ...archive.records.filter(hasRecordContent).map((r) => r.date),
      ...archive.journal.map((entry) => entry.date),
    ]
      .sort()[0] ?? null;

  const history = archive.records
    .filter((r) => r.date <= today && r.date > addDays(today, -HISTORY_DAYS))
    .map((r) => ({ date: r.date, turbidity: averageTurbidity(r.turbidity) }))
    .filter(
      (point): point is { date: ISODate; turbidity: number } => point.turbidity !== null,
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  const habits: HabitStatus[] = archive.habits.map((habit) => ({
    id: habit.id,
    name: habit.name,
    startDate: habit.startDate,
    streak: calculateStreak(habit.marks, today, habit.startDate),
    doneToday: habit.marks[today] === "done",
    daysSinceStart: diffDays(today, habit.startDate) + 1,
    recentWeek: Array.from(
      { length: 7 },
      (_, i) => habit.marks[addDays(today, i - 6)] === "done",
    ),
  }));

  const todayJournal =
    archive.journal.find((entry) => entry.date === today) ?? null;
  const latestJournal =
    [...archive.journal]
      .filter((entry) => entry.date < today)
      .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;

  const todayRecord = recordsByDate.get(today) ?? null;
  const previousRecord = recordsByDate.get(addDays(today, -1)) ?? null;

  return {
    today,
    researchDay: firstEntryDate ? diffDays(today, firstEntryDate) + 1 : null,
    quote: getDailyQuote(today),
    gem: {
      turbidity: todayRecord ? averageTurbidity(todayRecord.turbidity) : null,
      previousTurbidity: previousRecord ? averageTurbidity(previousRecord.turbidity) : null,
      history,
    },
    todayRecord,
    habits,
    journal: {
      today: todayJournal,
      latest: latestJournal,
      totalEntries: archive.journal.length,
    },
    archive: {
      recordedDays: archive.records.filter(hasRecordContent).length,
    },
  };
}
