import type { Metadata } from "next";
import { InsightsView } from "@/components/insights/insights-view";

export const metadata: Metadata = {
  title: "考察",
};

export default function InsightsPage() {
  return <InsightsView />;
}
