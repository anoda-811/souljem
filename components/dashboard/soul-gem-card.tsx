import { ButtonLink } from "@/components/ui/button-link";
import { ManuscriptCard } from "@/components/ui/manuscript-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { SoulGemStage } from "@/components/soul-gem/soul-gem-stage";
import { TurbidityGauge } from "@/components/soul-gem/turbidity-gauge";
import { TurbiditySparkline } from "@/components/soul-gem/turbidity-sparkline";
import type { DashboardSnapshot } from "@/lib/domain/dashboard";
import {
  describeTurbidityChange,
  getTurbidityStage,
} from "@/lib/domain/turbidity";

interface SoulGemCardProps {
  gem: DashboardSnapshot["gem"];
}

/** 今日のソウルジェムと、濁り度の要約 */
export function SoulGemCard({ gem }: SoulGemCardProps) {
  const header = (
    <SectionHeading
      eyebrow="Soul Gem ・ Today"
      title="今日のソウルジェム"
      action={
        <span className="font-display text-sm italic tracking-[0.12em] text-ink-soft">
          過去 14 日の推移
        </span>
      }
    />
  );

  if (gem.turbidity === null) {
    return (
      <ManuscriptCard className="lg:col-span-7">
        {header}
        <div className="mt-10 flex flex-col items-center gap-6 py-6 text-center">
          <p className="font-display text-xl text-ink">今日の濁りは、まだ記されていません。</p>
          <ButtonLink href="/record" withArrow>
            濁りを記録する
          </ButtonLink>
        </div>
      </ManuscriptCard>
    );
  }

  const stage = getTurbidityStage(gem.turbidity);
  const change = describeTurbidityChange(gem.turbidity, gem.previousTurbidity);

  return (
    <ManuscriptCard className="lg:col-span-7">
      {header}

      <div className="mt-8 grid gap-10 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-center">
        <SoulGemStage
          turbidity={gem.turbidity}
          idPrefix="home-gem"
          className="mx-auto w-full max-w-[18rem]"
        />

        <div className="min-w-0">
          <p className="text-xs tracking-[0.2em] text-ink-soft">濁り度</p>
          <p className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-7xl leading-none font-medium text-ink">
              {gem.turbidity}
            </span>
            <span className="font-display text-xl text-ink-soft">/ 100</span>
          </p>

          <p className="mt-5 font-display text-xl font-semibold text-amethyst-deep">
            {stage.label}
          </p>
          <p className="mt-1.5 text-sm leading-7 text-ink-soft">{stage.caption}</p>
          {change && <p className="mt-3 text-sm text-ink">{change}</p>}

          <TurbidityGauge value={gem.turbidity} />

          <div className="mt-7 border-t border-line pt-5">
            <TurbiditySparkline points={gem.history} />
          </div>

          <ButtonLink href="/record" variant="ghost" className="mt-7" withArrow>
            今日の濁りを記す
          </ButtonLink>
        </div>
      </div>
    </ManuscriptCard>
  );
}
