"use client";

import { useMemo, useState } from "react";
import { useArchive } from "@/components/archive/archive-provider";
import { CategoryBars, ScatterPlot } from "@/components/research/analysis-chart";
import { ManuscriptCard } from "@/components/ui/manuscript-card";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/cn";
import {
  GROUP_LABELS,
  buildVariables,
  categoryBars,
  collectSamples,
  computeStats,
  describeStrength,
  findVariable,
  interpret,
  type LagDays,
  type PeriodDays,
  type Reliability,
  type Sample,
  type VariableDef,
  type VariableGroup,
} from "@/lib/domain/analysis";
import { addDays, formatShortDate } from "@/lib/domain/date";
import { formatMinutes } from "@/lib/domain/format";
import { averageTurbidity } from "@/lib/domain/record";
import type { ISODate } from "@/lib/domain/types";

const LEAD =
  "睡眠や行動・気分、習慣の継続と、濁りの関係を観測から読み解きます。ここで見えるのは一緒に動く傾向であり、原因かどうかは別に考える必要があります。";

/** 項目のまとまりに、一つも無いときの案内 */
const EMPTY_GROUP_TEXT: Record<VariableGroup, string> = {
  daily: "",
  lifestyle: "設定で行動・気分の項目を追加すると、ここに並びます。",
  habit: "習慣を追加すると、その継続日数で比べられます。",
};

const PERIOD_OPTIONS: readonly { value: PeriodDays; label: string }[] = [
  { value: 7, label: "7日" },
  { value: 30, label: "30日" },
  { value: 90, label: "90日" },
  { value: "all", label: "全期間" },
];

const LAG_OPTIONS: readonly { value: LagDays; label: string; caption: string }[] = [
  { value: 0, label: "当日", caption: "その日の習慣と、その日の濁り度" },
  { value: 1, label: "前日", caption: "前日の習慣と、その日の濁り度" },
  { value: 2, label: "2日前", caption: "2日前の習慣と、その日の濁り度" },
];

const RELIABILITY_TEXT: Record<Reliability, string> = {
  none: "データ不足",
  tentative: "参考値（データが少ない）",
  reported: "傾向として読める範囲",
};

function ResearchSkeleton() {
  return (
    <div aria-busy="true" aria-label="読み込み中" className="space-y-10">
      <div className="space-y-4 border-b border-line-strong pb-8">
        <div className="h-5 w-40 bg-line/70" />
        <div className="h-14 w-72 bg-line/70" />
      </div>
      <ManuscriptCard className="h-[30rem]" />
    </div>
  );
}

/** 選択肢の並び。ボタン群は記録ページや習慣ページと同じ細い枠で揃える */
function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs tracking-[0.18em] text-ink-soft">{label}</span>
      <div className="inline-flex flex-wrap border border-line-strong" role="group" aria-label={label}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={String(option.value)}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className={cn(
                "px-4 py-2 text-sm transition-colors duration-200",
                active ? "bg-amethyst text-vellum" : "text-ink-soft hover:bg-gilt-mist/60",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** X の値を、読みやすい単位つきの文字にする */
function formatValue(variable: VariableDef, x: number): string {
  if (variable.kind === "category") {
    return `${variable.categories?.[x - 1] ?? x}（${x} / 5）`;
  }
  if (variable.id === "sleep") return `${x.toFixed(1)} 時間`;
  if (variable.unit === "分") return formatMinutes(Math.round(x));
  return `${x} ${variable.unit}`;
}

function formatR(r: number | null): string {
  return r === null ? "—" : r.toFixed(2);
}

/** 分類データで、段階ごとに選べる日の一覧 */
function DayChips({
  samples,
  selectedDate,
  onSelect,
  variable,
}: {
  samples: readonly Sample[];
  selectedDate: ISODate | null;
  onSelect: (date: ISODate) => void;
  variable: VariableDef;
}) {
  const levels = variable.categories ?? [];
  return (
    <ul className="mt-6 space-y-3">
      {levels.map((label, index) => {
        const level = index + 1;
        const days = samples.filter((sample) => sample.x === level);
        return (
          <li key={label} className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
            <span className="w-28 shrink-0 text-sm text-ink-soft">{label}</span>
            {days.length === 0 ? (
              <span className="text-xs text-ink-soft">該当する日はありません</span>
            ) : (
              days.map((sample) => (
                <button
                  key={sample.date}
                  type="button"
                  aria-pressed={sample.date === selectedDate}
                  onClick={() => onSelect(sample.date)}
                  className={cn(
                    "border px-2.5 py-1 text-xs transition-colors",
                    sample.date === selectedDate
                      ? "border-amethyst bg-amethyst-mist text-amethyst-deep"
                      : "border-line-strong text-ink hover:border-gilt hover:bg-gilt-mist/50",
                  )}
                >
                  {formatShortDate(sample.date)} ・ {Math.round(sample.y)}
                </button>
              ))
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** 研究ページ本体。生活習慣と濁り度の2軸の関係を、期間と時間差を切り替えて見る */
export function ResearchView() {
  const { today, archive } = useArchive();
  const [variableId, setVariableId] = useState("sleep");
  const [period, setPeriod] = useState<PeriodDays>(30);
  const [lag, setLag] = useState<LagDays>(0);
  const [showFit, setShowFit] = useState(true);
  const [selectedDate, setSelectedDate] = useState<ISODate | null>(null);
  const variables = useMemo(
    () => (archive ? buildVariables(archive.lifestyleItems, archive.habits) : []),
    [archive],
  );

  if (!today || !archive) return <ResearchSkeleton />;

  const variable = findVariable(variables, variableId);
  const samples = collectSamples(archive.records, variable, lag, period, today);
  const stats = computeStats(samples);
  const bars = variable.kind === "category" ? categoryBars(samples, variable) : [];

  const lagRows = LAG_OPTIONS.map((option) => ({
    ...option,
    stats: computeStats(collectSamples(archive.records, variable, option.value, period, today)),
  }));

  const turbidityDays = archive.records.filter(
    (record) => record.date <= today && averageTurbidity(record.turbidity) !== null,
  ).length;

  const selected = samples.find((sample) => sample.date === selectedDate) ?? null;
  const selectedRecord = selected
    ? archive.records.find((record) => record.date === selected.date) ?? null
    : null;
  const lagCaption = LAG_OPTIONS.find((option) => option.value === lag)?.caption ?? "";

  const changeVariable = (id: string) => {
    setVariableId(id);
    setSelectedDate(null);
  };
  const changePeriod = (value: PeriodDays) => {
    setPeriod(value);
    setSelectedDate(null);
  };
  const changeLag = (value: LagDays) => {
    setLag(value);
    setSelectedDate(null);
  };

  const periodStart = period === "all" ? null : addDays(today, -(period - 1));

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Research" title="研究" lead={LEAD} />

      <ManuscriptCard compact>
        <div className="space-y-6">
          <div className="space-y-5">
            <span className="block text-xs tracking-[0.18em] text-ink-soft">分析する項目（X 軸）</span>
            {(Object.keys(GROUP_LABELS) as VariableGroup[]).map((group) => {
              const groupVariables = variables.filter((item) => item.group === group);
              if (groupVariables.length === 0) {
                return (
                  <p key={group} className="text-sm leading-7 text-ink-soft">
                    <span className="text-ink">{GROUP_LABELS[group]}：</span>
                    {EMPTY_GROUP_TEXT[group]}
                  </p>
                );
              }
              return (
                <Segmented
                  key={group}
                  label={GROUP_LABELS[group]}
                  options={groupVariables.map((item) => ({ value: item.id, label: item.label }))}
                  value={variable.id}
                  onChange={changeVariable}
                />
              );
            })}
          </div>

          <div className="flex flex-wrap items-end gap-x-8 gap-y-5">
            <Segmented
              label="期間"
              options={PERIOD_OPTIONS}
              value={period}
              onChange={changePeriod}
            />
            <Segmented
              label="時間差"
              options={LAG_OPTIONS.map(({ value, label }) => ({ value, label }))}
              value={lag}
              onChange={changeLag}
            />
            {variable.kind === "numeric" && (
              <label className="flex items-center gap-2.5 pb-2.5 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={showFit && stats.fit !== null}
                  disabled={stats.fit === null}
                  onChange={(event) => setShowFit(event.target.checked)}
                  className="h-4 w-4 accent-amethyst"
                />
                近似直線を表示
              </label>
            )}
          </div>

          <p className="text-xs leading-6 tracking-[0.04em] text-ink-soft">
            {periodStart ? `${formatShortDate(periodStart)} 〜 ${formatShortDate(today)}` : "記録のある全期間"}
            　・　濁り度を記した日は全体で {turbidityDays} 日
          </p>
        </div>
      </ManuscriptCard>

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <ManuscriptCard className="lg:col-span-8">
          <SectionHeading
            eyebrow={variable.kind === "numeric" ? "Scatter" : "Average"}
            title={`${variable.axisLabel} と 濁り度`}
            action={<span className="text-sm text-ink-soft">{lagCaption}</span>}
          />

          <div className="mt-7">
            {samples.length === 0 ? (
              <p className="py-16 text-center font-display text-[1.05rem] italic leading-8 text-ink-soft">
                この条件で比べられる日がありません。
                <br />
                今日の記録で{variable.axisLabel}と濁り度を記すと、ここに点が並びます。
              </p>
            ) : variable.kind === "numeric" ? (
              <ScatterPlot
                samples={samples}
                variable={variable}
                fit={stats.fit}
                showFit={showFit}
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
              />
            ) : (
              <>
                <CategoryBars bars={bars} variable={variable} />
                <DayChips
                  samples={samples}
                  selectedDate={selectedDate}
                  onSelect={setSelectedDate}
                  variable={variable}
                />
              </>
            )}
          </div>

          {variable.kind === "numeric" && samples.length > 0 && (
            <p className="mt-5 text-xs leading-6 text-ink-soft">
              点を押すと、その日の内容が右に出ます。金の破線は近似直線で、傾きの目安にすぎません。
            </p>
          )}
        </ManuscriptCard>

        <div className="space-y-6 lg:col-span-4">
          <ManuscriptCard compact>
            <p className="text-xs tracking-[0.14em] text-ink-soft">比べられた日</p>
            <p className="mt-1 font-display text-3xl font-semibold text-ink">
              {stats.n}
              <span className="ml-1.5 font-body text-sm font-normal text-ink-soft">日</span>
            </p>

            <div className="mt-5 flex items-end justify-between gap-4 border-t border-line pt-5">
              <div>
                <p className="text-xs tracking-[0.14em] text-ink-soft">相関係数 r</p>
                <p className="mt-1 font-display text-4xl font-semibold text-ink">{formatR(stats.r)}</p>
              </div>
              <p className="text-right text-xs leading-5 text-ink-soft">
                {stats.r === null
                  ? "5日以上で表示"
                  : Math.abs(stats.r) < 0.1
                    ? "ほとんど相関なし"
                    : `${describeStrength(stats.r)}${stats.r > 0 ? "正の相関" : "負の相関"}`}
              </p>
            </div>

            <p className="mt-4 inline-block border border-line-strong px-2.5 py-1 text-xs text-ink-soft">
              {RELIABILITY_TEXT[stats.reliability]}
            </p>

            <p className="mt-5 text-[0.95rem] leading-7 text-ink">{interpret(variable, stats)}</p>
          </ManuscriptCard>

          <ManuscriptCard compact>
            <p className="text-xs tracking-[0.14em] text-ink-soft">時間差で比べる</p>
            <table className="mt-4 w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs tracking-[0.08em] text-ink-soft">
                  <th className="py-2 font-normal">時間差</th>
                  <th className="py-2 text-right font-normal">日数</th>
                  <th className="py-2 text-right font-normal">r</th>
                </tr>
              </thead>
              <tbody>
                {lagRows.map((row) => (
                  <tr
                    key={row.value}
                    className={cn(
                      "border-b border-line last:border-0",
                      row.value === lag && "bg-amethyst-mist/70 text-amethyst-deep",
                    )}
                  >
                    <td className="py-2.5">{row.label}</td>
                    <td className="py-2.5 text-right">{row.stats.n}</td>
                    <td className="py-2.5 text-right font-display text-base">{formatR(row.stats.r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-xs leading-6 text-ink-soft">
              前日や2日前の習慣が、後の濁り度と結びつくかを並べて見ます。どの時間差が強いかは、日数が増えてから読んでください。
            </p>
          </ManuscriptCard>

          <ManuscriptCard compact>
            <p className="text-xs tracking-[0.14em] text-ink-soft">選んだ日</p>
            {selected ? (
              <dl className="mt-4 space-y-3">
                <div>
                  <dt className="text-xs text-ink-soft">日付</dt>
                  <dd className="mt-0.5 font-body text-lg text-ink">{formatShortDate(selected.date)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-soft">
                    {lag === 0 ? variable.label : `${formatShortDate(selected.xDate)} の${variable.label}`}
                  </dt>
                  <dd className="mt-0.5 text-[0.98rem] text-ink">{formatValue(variable, selected.x)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-soft">濁り度（朝・昼・晩の平均）</dt>
                  <dd className="mt-0.5 font-display text-2xl text-ink">{Math.round(selected.y)}</dd>
                </div>
                {selectedRecord && selectedRecord.note && (
                  <div>
                    <dt className="text-xs text-ink-soft">この日のメモ</dt>
                    <dd className="mt-1 line-clamp-3 font-display text-[0.98rem] italic leading-7 text-ink">
                      {selectedRecord.note}
                    </dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="mt-4 text-sm leading-7 text-ink-soft">
                {samples.length === 0
                  ? "比べられる日が増えると、ここに選んだ日の内容が出ます。"
                  : "点（または下の日付）を押すと、その日の内容がここに出ます。"}
              </p>
            )}
          </ManuscriptCard>
        </div>
      </div>

      <ManuscriptCard compact>
        <SectionHeading eyebrow="Notes" title="読むときの注意" />
        <ul className="mt-6 space-y-3 text-[0.95rem] leading-7 text-ink-soft">
          <li>相関は「一緒に動く傾向」です。関係があっても、どちらかが原因だとは限りません。</li>
          <li>データが5日未満のときは相関係数を出しません。10日未満の数値は参考にとどめてください。</li>
          <li>未記入の日は分析の対象外です。0 と記した日は、0 として数えます。</li>
          <li>分類データ（行動・気分の評価）は、段階ごとの平均で比べています。</li>
          <li>習慣の継続日数は、その日までに○が続いた日数です。未記入の日は、前日までの続きで数えます。</li>
        </ul>
      </ManuscriptCard>
    </div>
  );
}