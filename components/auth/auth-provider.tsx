"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  readSessionId,
  registerAccount,
  sessionUserFor,
  subscribeSession,
  validateRegistration,
  verifyLogin,
  writeSession,
  type Account,
  type SessionUser,
} from "@/lib/auth/accounts";

type AuthStatus = "loading" | "signed-out" | "signed-in";

interface AuthContextValue {
  /** 保存状態を読むまでは loading。サーバー描画では必ず loading になる */
  status: AuthStatus;
  user: SessionUser | null;
  /** 成功なら null、失敗なら画面に出す説明を返す */
  login(name: string, password: string): Promise<string | null>;
  register(name: string, password: string, confirm: string): Promise<string | null>;
  logout(): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** サーバー描画の間は、保存状態を読めないので undefined（loading 扱い） */
const getServerSnapshot = (): undefined => undefined;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "予期しないエラーが起きました。";
}

/** 簡易ログインの状態を配る。ログインしていなければ AuthGate がログイン画面を出す */
export function AuthProvider({ children }: { children: ReactNode }) {
  const sessionId = useSyncExternalStore<string | null | undefined>(
    subscribeSession,
    readSessionId,
    getServerSnapshot,
  );

  const user = useMemo(
    () => (sessionId ? sessionUserFor(sessionId) : null),
    [sessionId],
  );

  const status: AuthStatus =
    sessionId === undefined ? "loading" : user ? "signed-in" : "signed-out";

  const login = useCallback(async (name: string, password: string): Promise<string | null> => {
    try {
      const result = await verifyLogin(name, password);
      if (!result.ok) return result.error;
      writeSession(result.account.id);
      return null;
    } catch (error) {
      return errorMessage(error);
    }
  }, []);

  const register = useCallback(
    async (name: string, password: string, confirm: string): Promise<string | null> => {
      const problem = validateRegistration(name, password, confirm);
      if (problem) return problem;
      try {
        const account: Account = await registerAccount(name, password);
        writeSession(account.id);
        return null;
      } catch (error) {
        return errorMessage(error);
      }
    },
    [],
  );

  const logout = useCallback(() => {
    writeSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, register, logout }),
    [status, user, login, register, logout],
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
