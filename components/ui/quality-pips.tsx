import { cn } from "@/lib/cn";

/** 段階評価を菱形の並びで表す（例：睡眠の質 5段階中 4） */
export function QualityPips({
  value,
  max = 5,
  className,
}: {
  value: number;
  max?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      role="img"
      aria-label={`${max}段階中 ${value}`}
    >
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-2 w-2 rotate-45 border",
            i < value ? "border-amethyst bg-amethyst" : "border-line-strong bg-transparent",
          )}
        />
      ))}
    </span>
  );
}
