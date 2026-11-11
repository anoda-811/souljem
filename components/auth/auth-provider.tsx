"use client";

import type { Session } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getSupabase } from "@/lib/supabase/client";

/** パスワードの最短文字数 */
export const PASSWORD_MIN = 8;

type AuthStatus = "loading" | "signed-out" | "signed-in";

export interface SessionUser {
  id: string;
  email: string;
}

/** 成功なら、画面に出す補足（確認メールの案内など）を返す。失敗なら説明を返す */
export type AuthResult = { ok: true; notice: string | null } | { ok: false; error: string };

interface AuthContextValue {
  status: AuthStatus;
  user: SessionUser | null;
  /** Supabase の設定があるか。無ければ、設定の案内を出す */
  configured: boolean;
  login(email: string, password: string): Promise<AuthResult>;
  register(email: string, password: string, confirm: string): Promise<AuthResult>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const NOT_CONFIGURED: AuthResult = {
  ok: false,
  error: "Supabase の設定がありません。README の手順で環境変数を入れてください。",
};

function loginMessage(message: string): string {
  if (/invalid login/i.test(message)) return "メールアドレスかパスワードが違います。";
  if (/not confirmed/i.test(message)) {
    return "メールアドレスの確認が済んでいません。届いたメールのリンクを開いてください。";
  }
  return "ログインできませんでした。通信の状態を確かめて、もう一度お試しください。";
}

function signupMessage(message: string): string {
  if (/already/i.test(message)) return "このメールアドレスは、すでに登録されています。ログインしてください。";
  if (/valid.*email|invalid.*email/i.test(message)) return "メールアドレスの形を確かめてください。";
  return "登録できませんでした。時間をおいて、もう一度お試しください。";
}

/** 新規登録の入力の確認。問題があれば、その説明を返す */
export function validateRegistration(email: string, password: string, confirm: string): string | null {
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "メールアドレスを入力してください。";
  if (password.length < PASSWORD_MIN) return `パスワードは${PASSWORD_MIN}文字以上にしてください。`;
  if (password !== confirm) return "確認用のパスワードが一致しません。";
  return null;
}

/** Supabase のログイン状態を配る。ログインしていなければ AuthGate がログイン画面を出す */
export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => getSupabase(), []);
  // undefined は、まだ保存された状態を確かめていないこと
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setSession(data.session);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      if (active) setSession(next);
    });
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [supabase]);

  const user = useMemo<SessionUser | null>(
    () =>
      session?.user ? { id: session.user.id, email: session.user.email ?? "" } : null,
    [session],
  );

  const status: AuthStatus = !supabase
    ? "signed-out"
    : session === undefined
      ? "loading"
      : user
        ? "signed-in"
        : "signed-out";

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      if (!supabase) return NOT_CONFIGURED;
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      return error ? { ok: false, error: loginMessage(error.message) } : { ok: true, notice: null };
    },
    [supabase],
  );

  const register = useCallback(
    async (email: string, password: string, confirm: string): Promise<AuthResult> => {
      if (!supabase) return NOT_CONFIGURED;
      const problem = validateRegistration(email, password, confirm);
      if (problem) return { ok: false, error: problem };

      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
      if (error) return { ok: false, error: signupMessage(error.message) };
      // メールの確認が有効な設定では、確認が済むまでセッションは作られない
      if (!data.session) {
        return {
          ok: true,
          notice: "確認のメールを送りました。メール内のリンクを開いてから、ログインしてください。",
        };
      }
      return { ok: true, notice: null };
    },
    [supabase],
  );

  const logout = useCallback(async () => {
    await supabase?.auth.signOut();
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, configured: supabase !== null, login, register, logout }),
    [status, user, supabase, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth は AuthProvider の内側で使ってください。");
  }
  return context;
}
