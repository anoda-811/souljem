import { cn } from "@/lib/cn";

/** 金の細線と菱形で区切る装飾罫 */
export function OrnamentDivider({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("flex items-center gap-3 text-gilt", className)}
    >
      <span className="h-px flex-1 bg-linear-to-r from-transparent to-gilt/70" />
      <span className="h-1.5 w-1.5 rotate-45 border border-gilt" />
      <span className="h-px flex-1 bg-linear-to-l from-transparent to-gilt/70" />
    </div>
  );
}
