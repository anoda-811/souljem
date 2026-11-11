import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { clampTurbidity, getGemPalette } from "@/lib/domain/turbidity";

/*
 * ソウルジェム本体。濁り度に応じて
 *  - 色（澄明な紫白 → 霞んだ紫 → 灰褐色の濁り）
 *  - 不透明度（澄むほど透け、濁るほど重くなる）
 *  - 内部の雲（濁りが増えるほど濃くなり、ゆっくり渦を巻く）
 *  - 表面の光の筋（澄むほど強く走る）
 *  - まとわりつく靄（濁るほど立ち昇る）／ 星屑（澄むほど瞬く）
 * を変化させる。純粋な表示コンポーネントで、状態は持たない。
 * 粒子の位置は番号から決めるので、サーバーとクライアントで同じ絵になる。
 */

const GEM_OUTLINE = "M52 22 L148 22 L186 86 L100 216 L14 86 Z";

const GEM_FACETS = [
  "M14 86 H186",
  "M52 22 L72 86",
  "M100 22 L72 86",
  "M100 22 L128 86",
  "M148 22 L128 86",
  "M72 86 L100 216",
  "M128 86 L100 216",
].join(" ");

const CLOUDS = [
  { cx: 74, cy: 62, rx: 18, ry: 11 },
  { cx: 126, cy: 76, rx: 22, ry: 13 },
  { cx: 100, cy: 118, rx: 30, ry: 16 },
  { cx: 66, cy: 152, rx: 16, ry: 12 },
  { cx: 134, cy: 156, rx: 20, ry: 12 },
  { cx: 100, cy: 190, rx: 14, ry: 9 },
];

const INCLUSIONS = [
  { x: 60, y: 42, r: 1.6 },
  { x: 142, y: 52, r: 1.2 },
  { x: 96, y: 100, r: 1.4 },
  { x: 76, y: 134, r: 1.1 },
  { x: 122, y: 170, r: 1.3 },
];

/** 粒子の最大数。濁り度に比例して、靄か星屑のどちらかを増やす */
const MAX_PARTICLES = 9;

/** 0〜1 の決まった擬似乱数（番号と種から毎回同じ値を返す） */
function unit(index: number, seed: number): number {
  const x = Math.sin((index + 1) * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** CSS の変数を渡すための型 */
function cssVars(vars: Record<string, string | number>): CSSProperties {
  return vars as CSSProperties;
}

interface SoulGemProps {
  turbidity: number;
  /** 同一ページに複数置く場合の SVG 内部 ID の接頭辞 */
  idPrefix: string;
  className?: string;
}

export function SoulGem({ turbidity, idPrefix, className }: SoulGemProps) {
  const value = clampTurbidity(turbidity);
  const palette = getGemPalette(value);
  const { ratio } = palette;

  const ids = {
    body: `${idPrefix}-body`,
    aura: `${idPrefix}-aura`,
    core: `${idPrefix}-core`,
    clip: `${idPrefix}-clip`,
    blur: `${idPrefix}-blur`,
    smoke: `${idPrefix}-smoke`,
    glow: `${idPrefix}-glow`,
    sheen: `${idPrefix}-sheen`,
  };

  // 濁るほど靄が多く、澄むほど星屑が多い
  const smokeCount = Math.round(ratio * MAX_PARTICLES);
  const sparkCount = Math.round((1 - ratio) * MAX_PARTICLES);

  return (
    <svg
      viewBox="-24 -14 248 262"
      overflow="visible"
      className={cn("block h-auto w-full", className)}
      role="img"
      aria-label={`ソウルジェム、濁り度 ${value} / 100`}
    >
      <defs>
        <linearGradient id={ids.body} x1="0" y1="0" x2="0.45" y2="1">
          <stop className="gem-tone" offset="0" style={{ stopColor: palette.hi }} />
          <stop className="gem-tone" offset="0.38" style={{ stopColor: palette.mid }} />
          <stop className="gem-tone" offset="0.78" style={{ stopColor: palette.lo }} />
          <stop className="gem-tone" offset="1" style={{ stopColor: palette.deep }} />
        </linearGradient>
        <radialGradient id={ids.aura}>
          <stop
            className="gem-tone"
            offset="0.55"
            style={{ stopColor: palette.aura }}
            stopOpacity={0.2 + (1 - ratio) * 0.4}
          />
          <stop className="gem-tone" offset="1" style={{ stopColor: palette.aura }} stopOpacity="0" />
        </radialGradient>
        {/* 濁るほど、ジェムの周りに暗い靄がまとわりつく */}
        <radialGradient id={ids.smoke}>
          <stop
            className="gem-tone"
            offset="0.4"
            style={{ stopColor: palette.cloud }}
            stopOpacity={0.1 + ratio * 0.7}
          />
          <stop className="gem-tone" offset="1" style={{ stopColor: palette.cloud }} stopOpacity="0" />
        </radialGradient>
        {/* 澄むほど、ジェムの周りが白く輝く */}
        <radialGradient id={ids.glow}>
          <stop offset="0.45" stopColor="#ffffff" stopOpacity={(1 - ratio) * 0.7} />
          <stop offset="1" className="gem-tone" style={{ stopColor: palette.aura }} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={ids.core}>
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        {/* 表面を走る光の筋。中央だけ明るい帯 */}
        <linearGradient id={ids.sheen} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={ids.clip}>
          <path d={GEM_OUTLINE} />
        </clipPath>
        <filter id={ids.blur} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
      </defs>

      {/* 外側の光の靄（澄むほど白く輝き、濁るほど暗い靄に包まれる） */}
      <ellipse
        cx="100"
        cy="118"
        rx="116"
        ry="128"
        fill={`url(#${ids.aura})`}
        className="gem-breathe"
      />
      <ellipse cx="100" cy="118" rx="124" ry="136" fill={`url(#${ids.glow})`} className="gem-breathe" />
      <ellipse cx="100" cy="118" rx="122" ry="134" fill={`url(#${ids.smoke})`} />

      {/* 濁りの靄。ジェムの周りを、下から上へ立ち昇る */}
      {Array.from({ length: smokeCount }, (_, i) => {
        const x = 30 + unit(i, 1) * 140;
        const y = 150 + unit(i, 2) * 70;
        const size = 7 + unit(i, 3) * 9;
        const duration = 5 + unit(i, 4) * 4;
        return (
          <circle
            key={`smoke-${i}`}
            cx={x}
            cy={y}
            r={size}
            fill={palette.cloud}
            className="gem-rise gem-tone"
            style={cssVars({
              "--dur": `${duration.toFixed(2)}s`,
              "--delay": `${(-unit(i, 5) * duration).toFixed(2)}s`,
              "--peak": (0.22 + unit(i, 6) * 0.3).toFixed(2),
            })}
          />
        );
      })}

      {/* 本体 */}
      <path
        d={GEM_OUTLINE}
        fill={`url(#${ids.body})`}
        fillOpacity={palette.bodyOpacity}
      />

      <g clipPath={`url(#${ids.clip})`}>
        {/* 内部の濁り（雲）。濁り度に比例して濃くなり、全体がゆっくり渦を巻く */}
        <g className="gem-swirl">
          <g filter={`url(#${ids.blur})`}>
            {CLOUDS.map((cloud, i) => (
              <ellipse
                key={`${cloud.cx}-${cloud.cy}`}
                cx={cloud.cx}
                cy={cloud.cy}
                rx={cloud.rx}
                ry={cloud.ry}
                opacity={palette.cloudOpacity * (i % 2 === 0 ? 1 : 0.7)}
                className="gem-cloud gem-tone"
                style={{ animationDelay: `${-i * 1.6}s`, fill: palette.cloud }}
              />
            ))}
          </g>
        </g>

        {/* 面による光の反射（テーブル・左右の面で明暗を変える） */}
        <path d="M52 22 L148 22 L128 62 L72 62 Z" fill="#ffffff" opacity={0.2 - ratio * 0.1} />
        <path d="M14 86 L52 22 L72 86 Z" fill="#ffffff" opacity={0.12 - ratio * 0.06} />
        <path d="M148 22 L186 86 L128 86 Z" fill="#000000" opacity={0.1} />
        <path d="M14 86 L72 86 L100 216 Z" fill="#000000" opacity={0.1} />
        <path d="M128 86 L186 86 L100 216 Z" fill="#000000" opacity={0.2} />

        {/* 光の筋が表面を横切る（澄んでいるほど強い） */}
        <rect
          x="-60"
          y="-20"
          width="46"
          height="260"
          fill={`url(#${ids.sheen})`}
          opacity={0.25 + (1 - ratio) * 0.5}
          className="gem-sheen"
        />

        {/* 澄んだ輝き（濁るほど消える） */}
        <ellipse
          cx="76"
          cy="62"
          rx="50"
          ry="30"
          fill={`url(#${ids.core})`}
          opacity={1 - ratio * 0.75}
        />
        {INCLUSIONS.map((spark) => (
          <circle
            key={`${spark.x}-${spark.y}`}
            cx={spark.x}
            cy={spark.y}
            r={spark.r}
            fill="#ffffff"
            opacity={(1 - ratio) * 0.9}
          />
        ))}
      </g>

      {/* ファセット（カット面）の線 */}
      <path
        d={GEM_FACETS}
        fill="none"
        stroke="#ffffff"
        strokeOpacity={0.38 - ratio * 0.22}
        strokeWidth={0.9}
        strokeLinejoin="round"
      />
      <path
        d={GEM_OUTLINE}
        fill="none"
        stroke={palette.edge}
        strokeOpacity={0.75}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />

      {/* 澄んだ日の星屑。ジェムの縁で瞬く */}
      {Array.from({ length: sparkCount }, (_, i) => {
        const x = 10 + unit(i, 7) * 180;
        const y = 10 + unit(i, 8) * 220;
        return (
          <circle
            key={`spark-${i}`}
            cx={x}
            cy={y}
            r={0.9 + unit(i, 9) * 1.4}
            fill="#ffffff"
            className="gem-twinkle"
            style={cssVars({
              "--dur": `${(2.6 + unit(i, 10) * 3).toFixed(2)}s`,
              "--delay": `${(-unit(i, 11) * 4).toFixed(2)}s`,
            })}
          />
        );
      })}

      {/* 四芒の反射光 */}
      <g transform="translate(64 50)" opacity={1 - ratio * 0.6}>
        <path
          d="M0 -11 L2.6 -2.6 L11 0 L2.6 2.6 L0 11 L-2.6 2.6 L-11 0 L-2.6 -2.6 Z"
          fill="#ffffff"
          className="gem-twinkle"
        />
      </g>
    </svg>
  );
}
