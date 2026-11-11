import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/coming-soon";

export const metadata: Metadata = {
  title: "研究",
};

export default function ResearchPage() {
  return (
    <ComingSoon
      eyebrow="Research"
      title="研究"
      lead="睡眠・運動・習慣と、濁りの関係を観測から読み解きます。何が負担になり、何が濁りを解くのかを、自分の言葉で残します。"
      icon="flask"
      planned={[
        "睡眠時間と濁り度の関係",
        "運動と濁り度の関係",
        "習慣と精神状態の変化",
        "自分なりの浄化方法の記録",
      ]}
    />
  );
}
