import type { ISODate } from "@/lib/domain/types";
import { formatShortDate } from "@/lib/domain/date";

interface TurbiditySparklineProps {
  points: { date: ISODate; turbidity: number }[];
}

const WIDTH = 320;
const HEIGHT = 96;
const PAD_X = 10;
const PAD_Y = 10;

/**
 * 濁り度の推移を示す小さな折れ線。
 * 上が澄明（0）、下が濁り（100）になる。
 */
export function TurbiditySparkline({ points }: TurbiditySparklineProps) {
  if (points.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-ink-soft">
        まだ推移を描く記録がありません。
      </p>
    );
  }

  const innerWidth = WIDTH - PAD_X * 2;
  const innerHeight = HEIGHT - PAD_Y * 2;
  const x = (i: number) =>
    points.length === 1 ? WIDTH / 2 : PAD_X + (i * innerWidth) / (points.length - 1);
  const y = (t: number) => PAD_Y + (t / 100) * innerHeight;

  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(p.turbidity).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${x(points.length - 1).toFixed(1)} ${HEIGHT - PAD_Y} L${x(0).toFixed(1)} ${HEIGHT - PAD_Y} Z`;

  const last = points[points.length - 1];
  const first = points[0];

  return (
    <figure>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="block h-auto w-full overflow-visible"
        role="img"
        aria-label={`過去 ${points.length} 日間の濁り度の推移`}
      >
        <defs>
          <linearGradient id="sparkline-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-amethyst)" stopOpacity="0.22" />
            <stop offset="1" stopColor="var(--color-amethyst)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 50, 100].map((mark) => (
          <line
            key={mark}
            x1={PAD_X}
            x2={WIDTH - PAD_X}
            y1={y(mark)}
            y2={y(mark)}
            stroke="var(--color-line-strong)"
            strokeDasharray="2 4"
            strokeWidth="1"
          />
        ))}

        <path d={area} fill="url(#sparkline-area)" />
        <path
          d={line}
          fill="none"
          stroke="var(--color-amethyst)"
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p, i) => (
          <circle
            key={p.date}
            cx={x(i)}
            cy={y(p.turbidity)}
            r={i === points.length - 1 ? 4 : 1.8}
            fill={i === points.length - 1 ? "var(--color-gilt)" : "var(--color-amethyst)"}
          />
        ))}
      </svg>
      <figcaption className="mt-2 flex justify-between text-xs tracking-[0.06em] text-ink-soft">
        <span>{formatShortDate(first.date)}</span>
        <span>{formatShortDate(last.date)}</span>
      </figcaption>
    </figure>
  );
}
