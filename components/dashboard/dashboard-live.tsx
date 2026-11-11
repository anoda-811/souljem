"use client";

import { useArchive } from "@/components/archive/archive-provider";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { buildDashboardSnapshot } from "@/lib/domain/dashboard";

/** 保存済みの記録からダッシュボードを組み立てる。読み込み前は骨組みを出す */
export function DashboardLive() {
  const { today, archive } = useArchive();

  if (!today || !archive) return <DashboardSkeleton />;

  return <DashboardView snapshot={buildDashboardSnapshot(archive, today)} />;
}
