"use client";

import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { clampTurbidity, getGemPalette } from "@/lib/domain/turbidity";

interface TurbiditySliderProps {
  /** 時間帯の名前（朝・昼・晩） */
  label: string;
  /** null は未記録 */
  value: number | null;
  onChange: (value: number) => void;
  onClear: () => void;
}

const TRACK_GRADIENT = `linear-gradient(90deg, ${getGemPalette(0).mid}, ${getGemPalette(50).mid}, ${getGemPalette(100).mid})`;

/**
 * 0（澄明）〜 100（深い濁り）を、ゲージの上で左右にドラッグして決める。
 * キーボードでも、矢印キーで1ずつ（Shift と一緒なら10ずつ）動かせる。
 */
export function TurbiditySlider({ label, value, onChange, onClear }: TurbiditySliderProps) {
  const track = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const valueAt = (clientX: number): number | null => {
    const rect = track.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return null;
    return clampTurbidity(((clientX - rect.left) / rect.width) * 100);
  };

  const handlePointer = (event: PointerEvent<HTMLDivElement>) => {
    const next = valueAt(event.clientX);
    if (next !== null) onChange(next);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragging.current = true;
    handlePointer(event);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) handlePointer(event);
  };

  const endDrag = () => {
    dragging.current = false;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const base = value ?? 50;
    const step = event.shiftKey ? 10 : 1;
    let next: number;
    switch (event.key) {
      case "ArrowLeft":
      case "ArrowDown":
        next = base - step;
        break;
      case "ArrowRight":
      case "ArrowUp":
        next = base + step;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = 100;
        break;
      default:
        return;
    }
    event.preventDefault();
    onChange(clampTurbidity(next));
  };

  return (
    <div className="grid grid-cols-[3rem_minmax(0,1fr)_4.5rem] items-center gap-4">
      <span className="font-display text-base text-ink-soft">{label}</span>

      <div
        ref={track}
        role="slider"
        tabIndex={0}
        aria-label={`${label}の濁り度`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value ?? undefined}
        aria-valuetext={value === null ? "未記録" : `${value} / 100`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={handleKeyDown}
        className="relative h-9 cursor-ew-resize touch-none select-none focus-visible:outline-offset-4"
      >
        <div
          className="absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 border border-line-strong"
          style={{ background: TRACK_GRADIENT }}
        />
        {value !== null && (
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-vellum bg-gilt-deep shadow-[0_0_0_1px_var(--color-gilt)]"
            style={{ left: `${value}%` }}
          />
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        <span className="font-body text-lg text-ink">{value ?? "—"}</span>
        {value !== null && (
          <button
            type="button"
            onClick={onClear}
            aria-label={`${label}の濁り度を消す`}
            className="flex h-6 w-6 items-center justify-center text-sm text-ink-soft hover:text-ink"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
