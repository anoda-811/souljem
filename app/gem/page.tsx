import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/coming-soon";

export const metadata: Metadata = {
  title: "ソウルジェム",
};

export default function GemPage() {
  return (
    <ComingSoon
      eyebrow="Soul Gem"
      title="ソウルジェム"
      lead="今日の濁りを、0〜100 の数で主観的に記す場所。ジェムの色と透明度が、その数に応じて移ろいます。"
      icon="gem"
      planned={[
        "朝・昼・晩の濁り度は、今日の記録から入力できます",
        "ジェムの色・透明度・内部の濁りの変化",
        "過去の濁り度の推移グラフ",
      ]}
    />
  );
}
