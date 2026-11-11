import type { CategoryBar, Sample, VariableDef } from "@/lib/domain/analysis";
import { formatShortDate } from "@/lib/domain/date";

const WIDTH = 640;
const HEIGHT = 340;
const MARGIN = { top: 20, right: 22, bottom: 56, left: 62 };
const INNER_W = WIDTH - MARGIN.left - MARGIN.right;
const INNER_H = HEIGHT - MARGIN.top - MARGIN.bottom;

const TURBIDITY_TICKS = [0, 20, 40, 60, 80, 100];

interface Scale {
  min: number;
  max: number;
  ticks: number[];
}

/** 数値の範囲を、きりの良い目盛りに広げる */
export function niceScale(min: number, max: number, count = 5): Scale {
  let low = min;
  let high = max;
  if (low === high) {
    const pad = low === 0 ? 1 : Math.abs(low) * 0.2;
    low -= pad;
    high += pad;
  }

  const rawStep = (high - low) / count;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const step =
    (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10) *
    magnitude;

  const first = Math.floor(low / step) * step;
  const last = Math.ceil(high / step) * step;
  const ticks: number[] = [];
  for (let value = first; value <= last + step / 2; value += step) {
    ticks.push(Number(value.toFixed(6)));
  }
  return { min: first, max: last, ticks };
}

function formatTick(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/** 散布図。Y は濁り度（0〜100）、X は選んだ習慣の値。点を押すとその日を選ぶ */
export function ScatterPlot({
  samples,
  variable,
  fit,
  showFit,
  selectedDate,
  onSelect,
}: {
  samples: readonly Sample[];
  variable: VariableDef;
  fit: { slope: number; intercept: number } | null;
  showFit: boolean;
  selectedDate: string | null;
  onSelect: (date: string) => void;
}) {
  const xs = samples.map((sample) => sample.x);
  const xScale = xs.length > 0 ? niceScale(Math.min(...xs), Math.max(...xs)) : niceScale(0, 10);

  const px = (x: number) =>
    MARGIN.left + ((x - xScale.min) / (xScale.max - xScale.min)) * INNER_W;
  const py = (y: number) => MARGIN.top + (1 - y / 100) * INNER_H;

  const fitLine =
    showFit && fit
      ? {
          x1: px(xScale.min),
          x2: px(xScale.max),
          y1: py(Math.min(100, Math.max(0, fit.slope * xScale.min + fit.intercept))),
          y2: py(Math.min(100, Math.max(0, fit.slope * xScale.max + fit.intercept))),
        }
      : null;

  return (
    <figure>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="block h-auto w-full"
        role="img"
        aria-label={`${variable.axisLabel}と濁り度の散布図。${samples.length} 日分`}
      >
        {TURBIDITY_TICKS.map((tick) => (
          <g key={`y-${tick}`}>
            <line
              x1={MARGIN.left}
              x2={WIDTH - MARGIN.right}
              y1={py(tick)}
              y2={py(tick)}
              stroke="var(--color-line-strong)"
              strokeDasharray="2 4"
              strokeWidth="1"
            />
            <text
              x={MARGIN.left - 10}
              y={py(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="12"
              fill="var(--color-ink-soft)"
            >
              {tick}
            </text>
          </g>
        ))}

        {xScale.ticks.map((tick) => (
          <g key={`x-${tick}`}>
            <line
              x1={px(tick)}
              x2={px(tick)}
              y1={MARGIN.top}
              y2={MARGIN.top + INNER_H}
              stroke="var(--color-line)"
              strokeWidth="1"
            />
            <text
              x={px(tick)}
              y={MARGIN.top + INNER_H + 18}
              textAnchor="middle"
              fontSize="12"
              fill="var(--color-ink-soft)"
            >
              {formatTick(tick)}
            </text>
          </g>
        ))}

        <line
          x1={MARGIN.left}
          x2={WIDTH - MARGIN.right}
          y1={MARGIN.top + INNER_H}
          y2={MARGIN.top + INNER_H}
          stroke="var(--color-mist)"
          strokeWidth="1"
        />

        <text
          x={MARGIN.left + INNER_W / 2}
          y={HEIGHT - 10}
          textAnchor="middle"
          fontSize="12.5"
          fill="var(--color-ink-soft)"
        >
          {variable.axisLabel}（{variable.unit}）
        </text>
        <text
          x={16}
          y={MARGIN.top + INNER_H / 2}
          textAnchor="middle"
          fontSize="12.5"
          fill="var(--color-ink-soft)"
          transform={`rotate(-90 16 ${MARGIN.top + INNER_H / 2})`}
        >
          濁り度
        </text>

        {fitLine && (
          <line
            x1={fitLine.x1}
            y1={fitLine.y1}
            x2={fitLine.x2}
            y2={fitLine.y2}
            stroke="var(--color-gilt-deep)"
            strokeWidth="1.6"
            strokeDasharray="7 5"
            strokeLinecap="round"
          />
        )}

        {samples.map((sample) => {
          const selected = sample.date === selectedDate;
          const label = `${formatShortDate(sample.date)}：濁り度 ${Math.round(sample.y)}`;
          return (
            <circle
              key={sample.date}
              cx={px(sample.x)}
              cy={py(sample.y)}
              r={selected ? 7 : 5}
              fill={selected ? "var(--color-gilt)" : "var(--color-amethyst)"}
              fillOpacity={selected ? 1 : 0.72}
              stroke={selected ? "var(--color-amethyst-deep)" : "var(--color-vellum)"}
              strokeWidth={selected ? 2 : 1}
              role="button"
              tabIndex={0}
              aria-label={label}
              aria-pressed={selected}
              className="cursor-pointer"
              onClick={() => onSelect(sample.date)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(sample.date);
                }
              }}
            >
              <title>{label}</title>
            </circle>
          );
        })}
      </svg>
    </figure>
  );
}

/** 分類データの棒グラフ。段階ごとに濁り度の平均を示し、件数を添える */
export function CategoryBars({
  bars,
  variable,
}: {
  bars: readonly CategoryBar[];
  variable: VariableDef;
}) {
  const band = INNER_W / Math.max(bars.length, 1);
  const barWidth = band * 0.5;
  const py = (y: number) => MARGIN.top + (1 - y / 100) * INNER_H;

  return (
    <figure>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="block h-auto w-full"
        role="img"
        aria-label={`${variable.axisLabel}ごとの濁り度の平均`}
      >
        {TURBIDITY_TICKS.map((tick) => (
          <g key={`y-${tick}`}>
            <line
              x1={MARGIN.left}
              x2={WIDTH - MARGIN.right}
              y1={py(tick)}
              y2={py(tick)}
              stroke="var(--color-line-strong)"
              strokeDasharray="2 4"
              strokeWidth="1"
            />
            <text
              x={MARGIN.left - 10}
              y={py(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="12"
              fill="var(--color-ink-soft)"
            >
              {tick}
            </text>
          </g>
        ))}

        {bars.map((bar, index) => {
          const cx = MARGIN.left + band * index + band / 2;
          const hasValue = bar.mean !== null;
          return (
            <g key={bar.level}>
              {hasValue ? (
                <rect
                  x={cx - barWidth / 2}
                  y={py(bar.mean ?? 0)}
                  width={barWidth}
                  height={py(0) - py(bar.mean ?? 0)}
                  fill="var(--color-amethyst)"
                  fillOpacity="0.8"
                  stroke="var(--color-amethyst-deep)"
                  strokeWidth="1"
                />
              ) : (
                <line
                  x1={cx - barWidth / 2}
                  x2={cx + barWidth / 2}
                  y1={py(0)}
                  y2={py(0)}
                  stroke="var(--color-mist)"
                  strokeDasharray="3 3"
                />
              )}
              {hasValue && (
                <text
                  x={cx}
                  y={py(bar.mean ?? 0) - 8}
                  textAnchor="middle"
                  fontSize="13"
                  fill="var(--color-ink)"
                >
                  {Math.round(bar.mean ?? 0)}
                </text>
              )}
              <text
                x={cx}
                y={MARGIN.top + INNER_H + 18}
                textAnchor="middle"
                fontSize="12"
                fill="var(--color-ink)"
              >
                {bar.label}
              </text>
              <text
                x={cx}
                y={MARGIN.top + INNER_H + 36}
                textAnchor="middle"
                fontSize="11"
                fill="var(--color-ink-soft)"
              >
                {bar.n === 0 ? "記録なし" : `${bar.n} 日`}
              </text>
            </g>
          );
        })}

        <line
          x1={MARGIN.left}
          x2={WIDTH - MARGIN.right}
          y1={py(0)}
          y2={py(0)}
          stroke="var(--color-mist)"
          strokeWidth="1"
        />
        <text
          x={16}
          y={MARGIN.top + INNER_H / 2}
          textAnchor="middle"
          fontSize="12.5"
          fill="var(--color-ink-soft)"
          transform={`rotate(-90 16 ${MARGIN.top + INNER_H / 2})`}
        >
          濁り度の平均
        </text>
      </svg>
    </figure>
  );
}
