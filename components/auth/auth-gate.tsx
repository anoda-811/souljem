"use client";

import { useMemo, type ReactNode } from "react";
import { ArchiveProvider } from "@/components/archive/archive-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { LoginView } from "@/components/auth/login-view";
import { AppShell } from "@/components/layout/app-shell";
import { createRepository } from "@/lib/data";

/**
 * ログインしている人の記録だけを見せる。
 * アカウントが変わるたびに、そのアカウントの記録を読み直す（key で作り直す）。
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const storageKey = user?.storageKey ?? null;
  const repository = useMemo(
    () => (storageKey ? createRepository(storageKey) : null),
    [storageKey],
  );

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
