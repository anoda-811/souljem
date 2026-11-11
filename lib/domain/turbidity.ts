/**
 * 濁り度（0〜100）に関するドメインロジック。
 * 表示用の段階名・変化の説明・ソウルジェムの配色を一箇所で管理する。
 */

export function clampTurbidity(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

interface TurbidityStage {
  min: number;
  label: string;
  caption: string;
}

const STAGES: TurbidityStage[] = [
  {
    min: 0,
    label: "澄明",
    caption: "光がまっすぐ通る。内側の静けさが見えている。",
  },
  {
    min: 20,
    label: "淡い霞",
    caption: "水面に薄い靄。穏やかだが、少しだけ霞んでいる。",
  },
  {
    min: 40,
    label: "薄曇り",
    caption: "小さな澱が、底にゆっくりと沈み始めている。",
  },
  {
    min: 60,
    label: "濁り",
    caption: "重たい靄が広がっている。負担の原因を探したい。",
  },
  {
    min: 80,
    label: "深い濁り",
    caption: "ほとんど光が届かない。まずは休息を優先する。",
  },
];

export function getTurbidityStage(value: number): TurbidityStage {
  const v = clampTurbidity(value);
  return STAGES.reduce((current, stage) => (v >= stage.min ? stage : current));
}

/** 前日との差を、読みやすい日本語の一文にする */
export function describeTurbidityChange(
  current: number,
  previous: number | null,
): string | null {
  if (previous === null) return null;
  const diff = clampTurbidity(current) - clampTurbidity(previous);
  if (diff === 0) return "昨日と同じ濁り度です。";
  if (diff < 0) return `昨日より ${-diff} 澄んでいます。`;
  return `昨日より ${diff} 濁っています。`;
}

export interface GemPalette {
  hi: string;
  mid: string;
  lo: string;
  deep: string;
  edge: string;
  cloud: string;
  aura: string;
  /** 0〜1。濁るほど不透明になる */
  bodyOpacity: number;
  /** 0〜1。内部の濁り（雲）の濃さ */
  cloudOpacity: number;
  /** 0〜1。0 に近いほど内側の輝きが強い */
  ratio: number;
}

interface Swatch {
  hi: string;
  mid: string;
  lo: string;
  deep: string;
  edge: string;
  cloud: string;
  aura: string;
}

/** 澄明（0）・霞（50）・深い濁り（100）の3点で配色を補間する */
const CLEAR: Swatch = {
  hi: "#fbf7ff",
  mid: "#c9b9f2",
  lo: "#7d66c4",
  deep: "#3b2c6b",
  edge: "#eadfff",
  cloud: "#2b2238",
  aura: "#c4b2f0",
};

const HAZE: Swatch = {
  hi: "#e6dcef",
  mid: "#9d8cbf",
  lo: "#5f4f88",
  deep: "#2f2648",
  edge: "#cbbfe0",
  cloud: "#2b2238",
  aura: "#a893d6",
};

/** 深い濁り。光を吸うような、暗く沈んだ紫黒 */
const MURK: Swatch = {
  hi: "#6e6274",
  mid: "#33293a",
  lo: "#1d1724",
  deep: "#080609",
  edge: "#4a3f52",
  cloud: "#030205",
  aura: "#2a2233",
};

function mixHex(from: string, to: string, t: number): string {
  const a = parseInt(from.slice(1), 16);
  const b = parseInt(to.slice(1), 16);
  const channel = (shift: number) => {
    const x = (a >> shift) & 255;
    const y = (b >> shift) & 255;
    return Math.round(x + (y - x) * t);
  };
  return `#${[16, 8, 0]
    .map((s) => channel(s).toString(16).padStart(2, "0"))
    .join("")}`;
}

export function getGemPalette(value: number): GemPalette {
  const ratio = clampTurbidity(value) / 100;
  const [from, to, local] =
    ratio <= 0.5
      ? [CLEAR, HAZE, ratio / 0.5]
      : [HAZE, MURK, (ratio - 0.5) / 0.5];

  const mixed = (key: keyof Swatch) => mixHex(from[key], to[key], local);

  return {
    hi: mixed("hi"),
    mid: mixed("mid"),
    lo: mixed("lo"),
    deep: mixed("deep"),
    edge: mixed("edge"),
    cloud: mixed("cloud"),
    aura: mixed("aura"),
    bodyOpacity: 0.78 + 0.2 * ratio,
    cloudOpacity: Math.pow(ratio, 1.2) * 0.8,
    ratio,
  };
}
