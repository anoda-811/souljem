"use client";

import { useState, type FormEvent } from "react";
import { FormActions } from "@/components/record/entry-forms";
import { TurbiditySlider } from "@/components/record/turbidity-slider";
import { SoulGem } from "@/components/soul-gem/soul-gem";
import { averageTurbidity, TIME_SLOTS } from "@/lib/domain/record";
import { getTurbidityStage } from "@/lib/domain/turbidity";
import type { TimeSlot, TurbidityReadings } from "@/lib/domain/types";

/**
 * 朝・昼・晩の濁り度を、ゲージのドラッグで入れる。
 * ジェムは入力に合わせてその場で色が変わり、1日の平均を示す。
 */
export function GemForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: TurbidityReadings;
  onSave: (value: TurbidityReadings) => void;
  onCancel: () => void;
}) {
  const [readings, setReadings] = useState<TurbidityReadings>(initial);
  const average = averageTurbidity(readings);
  const hasSaved = Object.keys(initial).length > 0;

  const setSlot = (slot: TimeSlot, value: number | null) =>
    setReadings((previous) => {
      const next = { ...previous };
      if (value === null) {
        delete next[slot];
      } else {
        next[slot] = value;
      }
      return next;
    });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave(readings);
  };

  return (
    <form onSubmit={submit}>
      <div className="flex flex-col items-center gap-5 border-b border-line pb-6 sm:flex-row sm:gap-6">
        <div className="w-28 shrink-0">
          {average !== null ? (
            <SoulGem turbidity={average} idPrefix="form-gem" />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center border border-dashed border-line-strong p-3 text-center text-xs leading-5 text-ink-soft">
              ゲージを動かすと、ジェムに色が宿る
            </div>
          )}
        </div>

        <div className="text-center sm:text-left">
          <p className="text-xs tracking-[0.18em] text-ink-soft">1日の平均</p>
          <p className="mt-1 font-body text-4xl leading-none text-ink">{average ?? "—"}</p>
          {average !== null && (
            <p className="mt-2 font-display text-base italic text-amethyst-deep">
              {getTurbidityStage(average).label}
            </p>
          )}
        </div>
      </div>

      <div className="mt-7 space-y-6">
        {TIME_SLOTS.map(({ slot, label }) => (
          <TurbiditySlider
            key={slot}
            label={label}
            value={readings[slot] ?? null}
            onChange={(value) => setSlot(slot, value)}
            onClear={() => setSlot(slot, null)}
          />
        ))}
      </div>

      <p className="mt-6 text-xs leading-6 text-ink-soft">
        ゲージを左右にドラッグして決めます。0 が澄明、100 が深い濁り。記していない時間帯は平均に含みません。
      </p>

      <FormActions
        onCancel={onCancel}
        onClear={hasSaved ? () => onSave({}) : undefined}
        clearLabel="濁りの記録を消す"
      />
    </form>
  );
}
