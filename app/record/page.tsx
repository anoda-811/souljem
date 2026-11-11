import type { Metadata } from "next";
import { RecordWorkspace } from "@/components/record/record-workspace";

export const metadata: Metadata = {
  title: "今日の記録",
};

export default function RecordPage() {
  return <RecordWorkspace />;
}
