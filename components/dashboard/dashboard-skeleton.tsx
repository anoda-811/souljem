import { ManuscriptCard } from "@/components/ui/manuscript-card";

/** データ読み込み中に表示する、レイアウトを崩さない骨組み */
export function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="読み込み中" className="space-y-10">
      <div className="space-y-4 border-b border-line-strong pb-9">
        <div className="h-5 w-72 bg-line/70" />
        <div className="h-14 w-80 bg-line/70 sm:h-16" />
        <div className="h-4 w-56 bg-line/50" />
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <ManuscriptCard className="h-[30rem] lg:col-span-7" />
        <ManuscriptCard className="h-[30rem] lg:col-span-5" />
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <ManuscriptCard className="h-[24rem] lg:col-span-7" />
        <ManuscriptCard className="h-[24rem] lg:col-span-5" />
      </div>
    </div>
  );
}
