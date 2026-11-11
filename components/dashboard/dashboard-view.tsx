import { ArchiveShortcuts } from "@/components/dashboard/archive-shortcuts";
import { DailyRecordCard } from "@/components/dashboard/daily-record-card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { HabitStreakCard } from "@/components/dashboard/habit-streak-card";
import { JournalCard } from "@/components/dashboard/journal-card";
import { SoulGemCard } from "@/components/dashboard/soul-gem-card";
import type { DashboardSnapshot } from "@/lib/domain/dashboard";

interface DashboardViewProps {
  snapshot: DashboardSnapshot;
}

/**
 * ダッシュボードの配置だけを担う。
 * データの取得や加工は行わず、受け取った snapshot を各カードに振り分ける。
 */
export function DashboardView({ snapshot }: DashboardViewProps) {
  return (
    <div className="space-y-10">
      <DashboardHeader
        today={snapshot.today}
        researchDay={snapshot.researchDay}
        quote={snapshot.quote}
      />

      <div className="grid gap-6 lg:grid-cols-12">
        <SoulGemCard gem={snapshot.gem} />
        <DailyRecordCard record={snapshot.todayRecord} />
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <HabitStreakCard habits={snapshot.habits} />
        <JournalCard journal={snapshot.journal} />
      </div>

      <ArchiveShortcuts
        recordedDays={snapshot.archive.recordedDays}
        journalEntries={snapshot.journal.totalEntries}
        habitCount={snapshot.habits.length}
      />
    </div>
  );
}
