import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/coming-soon";

export const metadata: Metadata = {
  title: "日記",
};

export default function JournalPage() {
  return (
    <ComingSoon
      eyebrow="Journal"
      title="日記"
      lead="その日の出来事と心の動きを、一枚の頁に綴ります。過去の頁は書架からいつでもめくれます。"
      icon="quill"
      planned={[
        "日付ごとの日記の保存",
        "カレンダーから過去の日記を閲覧",
        "書きやすいシンプルな入力画面",
      ]}
    />
  );
}
