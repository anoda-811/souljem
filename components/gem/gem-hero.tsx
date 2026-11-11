"use client";

import { useState, type CSSProperties } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import { MagicCircle } from "@/components/soul-gem/soul-gem-stage";
import { SoulGem } from "@/components/soul-gem/soul-gem";
import { TurbidityGauge } from "@/components/soul-gem/turbidity-gauge";
import { cn } from "@/lib/cn";
import { TIME_SLOTS, averageTurbidity } from "@/lib/domain/record";
import { getGemPalette, getTurbidityStage } from "@/lib/domain/turbidity";
import type { TurbidityReadings } from "@/lib/domain/types";

/** タップの閃光で散る光の粒。角度ごとに行き先を決める */
const SPARKS = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2;
  return {
    key: i,
    dx: `${(Math.cos(angle) * 150).toFixed(0)}px`,
    dy: `${(Math.sin(angle) * 150).toFixed(0)}px`,
  };
});

/** タップしたときの閃光。キーを変えるたびに一度だけ再生される */
function Burst() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      <span className="gem-burst-ring absolute inset-[16%] rounded-full border-2 border-gilt bg-gilt-mist/30" />
      {SPARKS.map((spark) => (
        <span
          key={spark.key}
          className="gem-burst-spark absolute top-1/2 left-1/2 h-2 w-2 -mt-1 -ml-1 rotate-45 bg-gilt"
          style={{ "--dx": spark.dx, "--dy": spark.dy } as CSSProperties}
        />
      ))}
    </span>
  );
}

interface GemHeroProps {
  /** 今日の濁り度。未記録なら null */
  turbidity: number | null;
  readings: TurbidityReadings;
  /** 昨日との違いの一文（無ければ null） */
  change: string | null;
}

/** 今日のソウルジェム。タップで光らせ、「試す」で濁り度を動かして見られる（保存はしない） */
export function GemHero({ turbidity, readings, change }: GemHeroProps) {
  const [preview, setPreview] = useState<number | null>(null);
  const [burst, setBurst] = useState(0);

  const isPreview = preview !== null;
  const shown = preview ?? turbidity ?? 0;
  const stage = getTurbidityStage(shown);
  const average = averageTurbidity(readings);

  return (
    <div className="grid gap-10 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:items-center">
      <div className="relative mx-auto aspect-square w-full max-w-[22rem]">
        <MagicCircle />
        <button
          type="button"
          onClick={() => setBurst((count) => count + 1)}
          aria-label="ソウルジェムを輝かせる"
          className="gem-float absolute top-1/2 left-1/2 w-[58%] -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-gilt"
        >
          <span
            className={cn(
              "gem-breathe block transition-[filter,opacity] duration-700",
              turbidity === null && !isPreview && "opacity-40 grayscale",
            )}
          >
            <SoulGem turbidity={shown} idPrefix="hero-gem" />
          </span>
          {burst > 0 && <Burst key={burst} />}
        </button>
      </div>

      <div className="min-w-0">
        <p className="text-xs tracking-[0.2em] text-ink-soft">
          {isPreview ? "試している濁り度" : "今日の濁り度"}
        </p>
        <p className="mt-2 flex items-baseline gap-2">
          <span className="font-display text-7xl leading-none font-medium text-ink">
            {turbidity === null && !isPreview ? "—" : shown}
          </span>
          <span className="font-display text-xl text-ink-soft">/ 100</span>
        </p>

        <p
          className="mt-5 font-display text-xl font-semibold"
          style={{ color: getGemPalette(shown).lo }}
        >
          {turbidity === null && !isPreview ? "未記録" : stage.label}
        </p>
        <p className="mt-1.5 text-sm leading-7 text-ink-soft">
          {turbidity === null && !isPreview
            ? "今日の濁りはまだ記されていません。記録すると、ここでジェムの色が変わります。"
            : stage.caption}
        </p>

        {!isPreview && change && <p className="mt-3 text-sm text-ink">{change}</p>}

        {!isPreview && (
          <dl className="mt-6 grid grid-cols-4 gap-2 text-center">
            {TIME_SLOTS.map(({ slot, label }) => (
              <div key={slot} className="border border-line py-2">
                <dt className="text-[0.7rem] tracking-[0.12em] text-ink-soft">{label}</dt>
                <dd className="mt-1 font-body text-base text-ink">{readings[slot] ?? "—"}</dd>
              </div>
            ))}
            <div className="border border-gilt/60 bg-gilt-mist/50 py-2">
              <dt className="text-[0.7rem] tracking-[0.12em] text-gilt-deep">平均</dt>
              <dd className="mt-1 font-body text-base font-semibold text-amethyst-deep">
                {average ?? "—"}
              </dd>
            </div>
          </dl>
        )}

        <TurbidityGauge value={shown} />

        <div className="mt-7 space-y-3 border-t border-line pt-6">
          <label className="block">
            <span className="flex items-baseline justify-between text-xs tracking-[0.14em] text-ink-soft">
              <span>試してみる（保存されません）</span>
              {isPreview && (
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="underline underline-offset-4 hover:text-ink"
                >
                  元に戻す
                </button>
              )}
            </span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={shown}
              onChange={(event) => setPreview(Number(event.target.value))}
              aria-label="試す濁り度"
              className="mt-3 w-full accent-amethyst"
            />
          </label>
        </div>

        <ButtonLink href="/record" variant="ghost" className="mt-7" withArrow>
          今日の濁りを記す
        </ButtonLink>
      </div>
    </div>
  );
}
