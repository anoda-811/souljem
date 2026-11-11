import { BrandMark } from "@/components/layout/brand-mark";
import { ManuscriptCard } from "@/components/ui/manuscript-card";
import { SectionHeading } from "@/components/ui/section-heading";

const STEPS = [
  "Supabase でプロジェクトを作り、SQL エディタで supabase/schema.sql を実行する。",
  "Project Settings → API で、Project URL と anon public キーを控える。",
  ".env.local に NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を書く（.env.example を参考に）。",
  "開発サーバーか、ビルドし直したアプリを起動し直す。",
];

/** Supabase の設定が無いときに出す案内。記録は読まず、何も保存しない */
export function SetupNotice() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <BrandMark />
        </div>
        <ManuscriptCard>
          <SectionHeading eyebrow="Setup" title="保存先の設定が必要です" titleFont="body" />
          <p className="mt-5 text-sm leading-7 text-ink-soft">
            記録は、Supabase のデータベースに保存されます。まだ接続先が設定されていないため、ここでは何も読み書きしません。
          </p>
          <ol className="mt-6 space-y-3">
            {STEPS.map((step, i) => (
              <li key={step} className="flex gap-4 text-sm leading-7 text-ink">
                <span className="font-display italic text-gilt-deep">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </ManuscriptCard>
      </div>
    </div>
  );
}
