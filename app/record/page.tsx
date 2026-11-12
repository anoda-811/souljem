import type { Metadata } from "next";
import { RecordWorkspace } from "@/components/record/record-workspace";

export const metadata: Metadata = {
  title: "今日の記録",
};

/** 考察ページなどから「この日を開く」ときは ?date=YYYY-MM-DD で渡される */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default async function RecordPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string | string[] }>;
}) {
  const { date } = await searchParams;
  const initialDate = typeof date === "string" && DATE_PATTERN.test(date) ? date : undefined;

  return <RecordWorkspace initialDate={initialDate} />;
}
