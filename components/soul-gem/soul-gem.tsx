import { cn } from "@/lib/cn";
import { clampTurbidity, getGemPalette } from "@/lib/domain/turbidity";

/*
 * ソウルジェム本体。濁り度に応じて
 *  - 色（澄明な紫白 → 霞んだ紫 → 灰褐色の濁り）
 *  - 不透明度（澄むほど透け、濁るほど重くなる）
 *  - 内部の雲（濁りが増えるほど濃くなる）
 * を変化させる。純粋な表示コンポーネントで、状態は持たない。
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
  };

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
          <stop offset="0" stopColor={palette.hi} />
          <stop offset="0.38" stopColor={palette.mid} />
          <stop offset="0.78" stopColor={palette.lo} />
          <stop offset="1" stopColor={palette.deep} />
        </linearGradient>
        <radialGradient id={ids.aura}>
          <stop offset="0.55" stopColor={palette.aura} stopOpacity={0.2 + (1 - ratio) * 0.4} />
          <stop offset="1" stopColor={palette.aura} stopOpacity="0" />
        </radialGradient>
        {/* 濁るほど、ジェムの周りに暗い靄がまとわりつく */}
        <radialGradient id={ids.smoke}>
          <stop offset="0.4" stopColor={palette.cloud} stopOpacity={0.1 + ratio * 0.7} />
          <stop offset="1" stopColor={palette.cloud} stopOpacity="0" />
        </radialGradient>
        {/* 澄むほど、ジェムの周りが白く輝く */}
        <radialGradient id={ids.glow}>
          <stop offset="0.45" stopColor="#ffffff" stopOpacity={(1 - ratio) * 0.7} />
          <stop offset="1" stopColor={palette.aura} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={ids.core}>
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
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

      {/* 本体 */}
      <path
        d={GEM_OUTLINE}
        fill={`url(#${ids.body})`}
        fillOpacity={palette.bodyOpacity}
      />

      <g clipPath={`url(#${ids.clip})`}>
        {/* 内部の濁り（雲）。濁り度に比例して濃くなる */}
        <g filter={`url(#${ids.blur})`}>
          {CLOUDS.map((cloud, i) => (
            <ellipse
              key={`${cloud.cx}-${cloud.cy}`}
              cx={cloud.cx}
              cy={cloud.cy}
              rx={cloud.rx}
              ry={cloud.ry}
              fill={palette.cloud}
              opacity={palette.cloudOpacity * (i % 2 === 0 ? 1 : 0.7)}
              className="gem-cloud"
              style={{ animationDelay: `${-i * 1.6}s` }}
            />
          ))}
        </g>

        {/* 面による光の反射（テーブル・左右の面で明暗を変える） */}
        <path d="M52 22 L148 22 L128 62 L72 62 Z" fill="#ffffff" opacity={0.2 - ratio * 0.1} />
        <path d="M14 86 L52 22 L72 86 Z" fill="#ffffff" opacity={0.12 - ratio * 0.06} />
        <path d="M148 22 L186 86 L128 86 Z" fill="#000000" opacity={0.1} />
        <path d="M14 86 L72 86 L100 216 Z" fill="#000000" opacity={0.1} />
        <path d="M128 86 L186 86 L100 216 Z" fill="#000000" opacity={0.2} />

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
