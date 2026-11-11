import { clampTurbidity, getGemPalette } from "@/lib/domain/turbidity";

/** 0（澄明）〜100（濁り）の位置を示す横のゲージ */
export function TurbidityGauge({ value }: { value: number }) {
  const position = clampTurbidity(value);
  const clear = getGemPalette(0).mid;
  const haze = getGemPalette(50).mid;
  const murk = getGemPalette(100).mid;

  return (
    <div className="mt-6" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={position} aria-label="濁り度">
      <div className="relative h-2">
        <div
          className="absolute inset-0 border border-line-strong"
          style={{ background: `linear-gradient(90deg, ${clear}, ${haze}, ${murk})` }}
        />
        <span
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-vellum bg-gilt-deep shadow-[0_0_0_1px_var(--color-gilt)]"
          style={{ left: `${position}%` }}
        />
      </div>
      <div className="mt-2.5 flex justify-between text-xs tracking-[0.15em] text-ink-soft">
        <span>澄</span>
        <span>濁</span>
      </div>
    </div>
  );
}
