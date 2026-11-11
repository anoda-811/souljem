"use client";

import { useState, type PointerEvent } from "react";
import { cn } from "@/lib/cn";
import { addDays, diffDays, formatShortDate } from "@/lib/domain/date";
import type { TrendRange, TurbidityPoint } from "@/lib/domain/gem-history";
import { getGemPalette, getTurbidityStage } from "@/lib/domain/turbidity";
import type { ISODate } from "@/lib/domain/types";

const WIDTH = 720;
const HEIGHT = 300;
const PAD_LEFT = 44;
const PAD_RIGHT = 18;
const PAD_TOP = 18;
const PAD_BOTTOM = 36;
const INNER_WIDTH = WIDTH - PAD_LEFT - PAD_RIGHT;
const INNER_HEIGHT = HEIGHT - PAD_TOP - PAD_BOTTOM;

/** 澄明〜深い濁りの境目（背景の帯に使う） */
const BANDS = [0, 20, 40, 60, 80, 100];

interface TurbidityTrendProps {
  points: readonly TurbidityPoint[];
  /** 7日移動平均。points と同じ日付で並ぶ */
  smoothed: readonly TurbidityPoint[];
  /** 横軸の始まりと終わり（記録がなくても期間の全体を見せる） */
  domainStart: ISODate;
  domainEnd: ISODate;
}

/** 日付を横の位置にする。記録のない日も間隔どおりに置くので、空白がそのまま見える */
function xOf(date: ISODate, domainStart: ISODate, domainEnd: ISODate): number {
  const span = diffDays(domainEnd, domainStart);
  if (span <= 0) return PAD_LEFT + INNER_WIDTH / 2;
  return PAD_LEFT + (diffDays(date, domainStart) / span) * INNER_WIDTH;
}

/** 濁り度を縦の位置にする。上が澄明（0）、下が濁り（100） */
function yOf(value: number): number {
  return PAD_TOP + (value / 100) * INNER_HEIGHT;
}

/** 記録が飛んだところで線を切る（間を直線で結んで、無い記録を作らないため） */
function linePath(points: readonly TurbidityPoint[], xs: (date: ISODate) => number): string {
  let path = "";
  points.forEach((point, i) => {
    const prev = points[i - 1];
    const connected = prev !== undefined && diffDays(point.date, prev.date) <= 1;
    path += `${connected ? "L" : "M"}${xs(point.date).toFixed(1)} ${yOf(point.value).toFixed(1)} `;
  });
  return path.trim();
}

/** 期間の表示名（一覧用の短い文字） */
export const RANGE_LABELS: Record<TrendRange, string> = {
  7: "7日",
  30: "30日",
  90: "90日",
  all: "全期間",
};

/** 濁り度の推移。背景は濁りの段階の帯、線は記録のある日の値 */
export function TurbidityTrend({ points, smoothed, domainStart, domainEnd }: TurbidityTrendProps) {
  const [hover, setHover] = useState<number | null>(null);

  if (points.length === 0) {
    return (
      <p className="py-16 text-center font-display text-[1.05rem] italic leading-8 text-ink-soft">
        この期間に、濁り度の記録がありません。
        <br />
        記録すると、ここに推移の線が引かれます。
      </p>
    );
  }

  const xs = (date: ISODate) => xOf(date, domainStart, domainEnd);
  const mid = addDays(domainStart, Math.floor(diffDays(domainEnd, domainStart) / 2));
  const hovered = hover === null ? null : points[hover];

  const handleMove = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const svgX = ((event.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let best = Infinity;
    points.forEach((point, i) => {
      const distance = Math.abs(xs(point.date) - svgX);
      if (distance < best) {
        best = distance;
        nearest = i;
      }
    });
    setHover(nearest);
  };

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="block h-auto w-full touch-none select-none"
        role="img"
        aria-label={`濁り度の推移。${points.length} 日分の記録`}
        onPointerMove={handleMove}
        onPointerDown={handleMove}
        onPointerLeave={() => setHover(null)}
      >
        {/* 濁りの段階の帯 */}
        {BANDS.slice(0, -1).map((low, i) => {
          const high = BANDS[i + 1];
          return (
            <rect
              key={low}
              x={PAD_LEFT}
              y={yOf(low)}
              width={INNER_WIDTH}
              height={yOf(high) - yOf(low)}
              fill={getGemPalette((low + high) / 2).mid}
              opacity={0.13}
            />
          );
        })}

        {/* 目盛り */}
        {BANDS.map((value) => (
          <g key={value}>
            <line
              x1={PAD_LEFT}
              x2={WIDTH - PAD_RIGHT}
              y1={yOf(value)}
              y2={yOf(value)}
              stroke="var(--color-line-strong)"
              strokeDasharray="2 4"
              strokeWidth={1}
            />
            <text x={PAD_LEFT - 8} y={yOf(value) + 4} textAnchor="end" fontSize={11} fill="var(--color-ink-soft)">
              {value}
            </text>
          </g>
        ))}

        {/* 日付の目盛り（始まり・真ん中・終わり） */}
        {[domainStart, mid, domainEnd]
          .filter((date, i, all) => all.indexOf(date) === i)
          .map((date, i, all) => (
            <text
              key={date}
              x={xs(date)}
              y={HEIGHT - 10}
              textAnchor={i === 0 ? "start" : i === all.length - 1 ? "end" : "middle"}
              fontSize={11}
              fill="var(--color-ink-soft)"
            >
              {formatShortDate(date)}
            </text>
          ))}

        {/* 7日移動平均（金の破線） */}
        <path
          d={linePath(smoothed, xs)}
          fill="none"
          stroke="var(--color-gilt-deep)"
          strokeWidth={1.4}
          strokeDasharray="5 4"
          strokeLinejoin="round"
          opacity={0.85}
        />

        {/* 日々の値の線 */}
        <path
          d={linePath(points, xs)}
          fill="none"
          stroke="var(--color-amethyst)"
          strokeWidth={1.8}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* 各日の点（その日の濁りの色で） */}
        {points.map((point, i) => {
          const active = i === hover;
          return (
            <circle
              key={point.date}
              cx={xs(point.date)}
              cy={yOf(point.value)}
              r={active ? 6 : 3.4}
              fill={getGemPalette(point.value).mid}
              stroke="var(--color-vellum)"
              strokeWidth={1.4}
            />
          );
        })}

        {/* 選んだ日の補助線 */}
        {hovered && (
          <line
            x1={xs(hovered.date)}
            x2={xs(hovered.date)}
            y1={PAD_TOP}
            y2={HEIGHT - PAD_BOTTOM}
            stroke="var(--color-gilt-deep)"
            strokeWidth={1}
            opacity={0.6}
          />
        )}
      </svg>

      {hovered && hover !== null && (
        <div
          className={cn(
            "pointer-events-none absolute top-2 z-10 -translate-x-1/2 border border-gilt bg-vellum px-3 py-2 text-xs text-ink shadow-[0_8px_18px_-12px_rgb(91_75_125_/_0.7)]",
          )}
          style={{ left: `${Math.min(86, Math.max(14, (xs(hovered.date) / WIDTH) * 100))}%` }}
        >
          <p className="font-body text-ink-soft">{formatShortDate(hovered.date)}</p>
          <p className="mt-0.5 font-display text-lg font-semibold" style={{ color: getGemPalette(hovered.value).lo }}>
            {hovered.value}
            <span className="ml-1.5 font-body text-xs font-normal text-ink-soft">{getTurbidityStage(hovered.value).label}</span>
          </p>
        </div>
      )}
    </div>
  );
}
