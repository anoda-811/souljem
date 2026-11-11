"use client";

import { useMemo, type ReactNode } from "react";
import { ArchiveProvider } from "@/components/archive/archive-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { LoginView } from "@/components/auth/login-view";
import { SetupNotice } from "@/components/auth/setup-notice";
import { AppShell } from "@/components/layout/app-shell";
import { createSupabaseRepository } from "@/lib/data";

/**
 * ログインしている人の記録だけを見せる。
 * ログインしていない間は、ログイン画面を出す。アカウントが変わるたびに、記録を読み直す。
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { status, user, configured } = useAuth();
  const userId = user?.id ?? null;
  const repository = useMemo(
    () => (userId ? createSupabaseRepository(userId) : null),
    [userId],
  );

  if (!configured) return <SetupNotice />;

  if (status === "loading") {
    return <div aria-busy="true" aria-label="読み込み中" className="min-h-dvh" />;
  }

  if (status === "signed-out" || !user || !repository) {
    return <LoginView />;
  }

  return (
    <ArchiveProvider key={user.id} repository={repository}>
      <AppShell>{children}</AppShell>
    </ArchiveProvider>
  );
}
