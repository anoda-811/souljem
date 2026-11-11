import { cn } from "@/lib/cn";
import { SoulGem } from "@/components/soul-gem/soul-gem";

const TICK_COUNT = 48;
const RUNE_POINTS = 8;

function polar(radius: number, index: number, total: number) {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  return {
    x: 200 + radius * Math.cos(angle),
    y: 200 + radius * Math.sin(angle),
  };
}

function hexagonPoints(radius: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const p = polar(radius, i, 6);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(" ");
}

/** 背景に描く魔法陣。外周の目盛り・菱形・六芒の内環で構成する */
export function MagicCircle() {
  const ticks = Array.from({ length: TICK_COUNT }, (_, i) => {
    const outer = polar(188, i, TICK_COUNT);
    const inner = polar(i % 4 === 0 ? 174 : 180, i, TICK_COUNT);
    return { outer, inner, key: i };
  });

  const diamonds = Array.from({ length: RUNE_POINTS }, (_, i) => {
    const p = polar(168, i, RUNE_POINTS);
    return { ...p, key: i };
  });

  return (
    <svg
      viewBox="0 0 400 400"
      aria-hidden
      className="absolute inset-0 h-full w-full text-gilt"
    >
      <g className="magic-spin">
        <circle cx="200" cy="200" r="196" fill="none" stroke="currentColor" strokeOpacity="0.5" />
        <circle
          cx="200"
          cy="200"
          r="184"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.45"
          strokeDasharray="1.5 6"
        />
        {ticks.map((tick) => (
          <line
            key={tick.key}
            x1={tick.outer.x}
            y1={tick.outer.y}
            x2={tick.inner.x}
            y2={tick.inner.y}
            stroke="currentColor"
            strokeOpacity="0.55"
            strokeWidth="1"
          />
        ))}
        {diamonds.map((d) => (
          <rect
            key={d.key}
            x={d.x - 3.5}
            y={d.y - 3.5}
            width="7"
            height="7"
            transform={`rotate(45 ${d.x.toFixed(1)} ${d.y.toFixed(1)})`}
            fill="var(--color-vellum)"
            stroke="currentColor"
            strokeWidth="1"
          />
        ))}
      </g>
      <circle cx="200" cy="200" r="150" fill="none" stroke="var(--color-amethyst)" strokeOpacity="0.55" />
      <polygon points={hexagonPoints(138)} fill="none" stroke="var(--color-amethyst)" strokeOpacity="0.45" />
      <polygon
        points={hexagonPoints(138)}
        fill="none"
        stroke="var(--color-amethyst)"
        strokeOpacity="0.3"
        transform="rotate(30 200 200)"
      />
    </svg>
  );
}

interface SoulGemStageProps {
  turbidity: number;
  idPrefix: string;
  className?: string;
}

/** 魔法陣の上にソウルジェムを置いた展示用の表示 */
export function SoulGemStage({ turbidity, idPrefix, className }: SoulGemStageProps) {
  return (
    <div className={cn("relative aspect-square w-full", className)}>
      <MagicCircle />
      <div className="gem-breathe absolute top-1/2 left-1/2 w-[58%] -translate-x-1/2 -translate-y-1/2">
        <SoulGem turbidity={turbidity} idPrefix={idPrefix} />
      </div>
    </div>
  );
}
