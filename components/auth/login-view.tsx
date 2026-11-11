"use client";

import { useState, type FormEvent } from "react";
import { useAuth, PASSWORD_MIN } from "@/components/auth/auth-provider";
import { BrandMark } from "@/components/layout/brand-mark";
import { FIELD } from "@/components/record/entry-forms";
import { ManuscriptCard } from "@/components/ui/manuscript-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/cn";

type Mode = "login" | "register";

const LABEL = "mb-2 block text-xs tracking-[0.18em] text-ink-soft";

const MODE_TEXT: Record<Mode, { title: string; submit: string; pending: string; hint: string }> = {
  login: {
    title: "ログイン",
    submit: "ログインする",
    pending: "確かめています…",
    hint: "記録は、登録したメールアドレスのアカウントに保存され、PC でもスマホでも同じ記録を見られます。",
  },
  register: {
    title: "新しく作る",
    submit: "登録する",
    pending: "登録しています…",
    hint: `パスワードは${PASSWORD_MIN}文字以上です。登録後、確認のメールが届く設定になっている場合は、メール内のリンクを開いてからログインしてください。`,
  },
};

/** ログイン前に出す画面。メールアドレスでログインか、新しく登録を選ぶ */
export function LoginView() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const text = MODE_TEXT[mode];

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setNotice(null);
    setPassword("");
    setConfirm("");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    setNotice(null);

    const result =
      mode === "login"
        ? await login(email, password)
        : await register(email, password, confirm);

    // 成功してログインできた場合は、AuthGate が画面を切り替える
    if (result.ok) {
      if (result.notice) setNotice(result.notice);
    } else {
      setError(result.error);
    }
    setPending(false);
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <BrandMark />
        </div>

        <ManuscriptCard>
          <SectionHeading eyebrow="Sign in" title={text.title} />

          <div className="mt-6 flex border border-line-strong" role="group" aria-label="ログインの方法">
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
              <span className={LABEL}>メールアドレス</span>
              <input
                type="email"
                value={email}
                autoComplete="email"
                required
                onChange={(event) => {
                  setError(null);
                  setEmail(event.target.value);
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
                required
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
            {notice && (
              <p role="status" className="text-sm leading-6 text-amethyst-deep">
                {notice}
              </p>
            )}

            <button type="submit" disabled={pending} className="btn btn-primary w-full">
              {pending ? text.pending : text.submit}
            </button>
          </form>
        </ManuscriptCard>

        <p className="text-xs leading-6 tracking-[0.04em] text-ink-soft">{text.hint}</p>
      </div>
    </div>
  );
}
