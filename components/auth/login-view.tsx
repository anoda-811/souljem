"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { BrandMark } from "@/components/layout/brand-mark";
import { FIELD } from "@/components/record/entry-forms";
import { ManuscriptCard } from "@/components/ui/manuscript-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { ACCOUNT_NAME_MAX, PASSWORD_MIN, SYSTEM_ACCOUNT_NAME } from "@/lib/auth/accounts";
import { cn } from "@/lib/cn";

type Mode = "login" | "register";

const LABEL = "mb-2 block text-xs tracking-[0.18em] text-ink-soft";

const TEXT_BUTTON =
  "text-sm text-ink-soft underline decoration-line-strong underline-offset-4 hover:text-ink";

const MODE_TEXT: Record<Mode, { title: string; submit: string; pending: string; hint: string }> = {
  login: {
    title: "ログイン",
    submit: "ログインする",
    pending: "確かめています…",
    hint: "system（仮データ）はパスワード無しで入れます。ほかのアカウントは、作るときに決めたパスワードで入ります。",
  },
  register: {
    title: "新しく作る",
    submit: "作って入る",
    pending: "作っています…",
    hint: `パスワードは${PASSWORD_MIN}文字以上。記録はこのブラウザの中だけに保存され、サーバーには送られません。同じブラウザを使う人を分ける程度の仕組みです。`,
  },
};

/** ログイン前に出す画面。ログインか、新しいアカウントの作成を選ぶ */
export function LoginView() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const text = MODE_TEXT[mode];

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setPassword("");
    setConfirm("");
  };

  // 成功したときは AuthGate が画面を切り替えるので、失敗したときだけ状態を戻す
  const run = async (task: () => Promise<string | null>) => {
    if (pending) return;
    setPending(true);
    setError(null);
    const problem = await task();
    if (problem) {
      setError(problem);
      setPending(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void run(() =>
      mode === "login" ? login(name, password) : register(name, password, confirm),
    );
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <BrandMark />
        </div>

        <ManuscriptCard>
          <SectionHeading eyebrow="Sign in" title={text.title} />

          <div
            className="mt-6 flex border border-line-strong"
            role="group"
            aria-label="ログインの方法"
          >
            {(["login", "register"] as const).map((option) => {
              const active = mode === option;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={active}
                  onClick={() => switchMode(option)}
                  className={cn(
                    "flex-1 px-4 py-2.5 text-sm transition-colors duration-200",
                    active ? "bg-amethyst text-vellum" : "text-ink-soft hover:bg-gilt-mist/60",
                  )}
                >
                  {option === "login" ? "ログイン" : "新しく作る"}
                </button>
              );
            })}
          </div>

          <form onSubmit={submit} className="mt-8 space-y-6">
            <label className="block">
              <span className={LABEL}>名前</span>
              <input
                type="text"
                value={name}
                maxLength={ACCOUNT_NAME_MAX}
                autoComplete="username"
                required
                onChange={(event) => {
                  setError(null);
                  setName(event.target.value);
                }}
                className={FIELD}
              />
            </label>

            <label className="block">
              <span className={LABEL}>
                パスワード{mode === "register" && `（${PASSWORD_MIN}文字以上）`}
              </span>
              <input
                type="password"
                value={password}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required={mode === "register"}
                onChange={(event) => {
                  setError(null);
                  setPassword(event.target.value);
                }}
                className={FIELD}
              />
            </label>

            {mode === "register" && (
              <label className="block">
                <span className={LABEL}>パスワードを、もう一度</span>
                <input
                  type="password"
                  value={confirm}
                  autoComplete="new-password"
                  required
                  onChange={(event) => {
                    setError(null);
                    setConfirm(event.target.value);
                  }}
                  className={FIELD}
                />
              </label>
            )}

            {error && (
              <p role="alert" className="text-sm leading-6 text-gilt-deep">
                {error}
              </p>
            )}

            <button type="submit" disabled={pending} className="btn btn-primary w-full">
              {pending ? text.pending : text.submit}
            </button>
          </form>

          {mode === "login" && (
            <div className="mt-6 border-t border-line pt-6 text-center">
              <button
                type="button"
                disabled={pending}
                onClick={() => void run(() => login(SYSTEM_ACCOUNT_NAME, ""))}
                className={TEXT_BUTTON}
              >
                {SYSTEM_ACCOUNT_NAME}（仮データ）で入る
              </button>
            </div>
          )}
        </ManuscriptCard>

        <p className="text-xs leading-6 tracking-[0.04em] text-ink-soft">{text.hint}</p>
      </div>
    </div>
  );
}
