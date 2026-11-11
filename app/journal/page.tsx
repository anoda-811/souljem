import type { Metadata } from "next";
import { JournalView } from "@/components/journal/journal-view";

export const metadata: Metadata = {
  title: "日記",
};

export default function JournalPage() {
  return <JournalView />;
}
