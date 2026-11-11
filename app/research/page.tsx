import type { Metadata } from "next";
import { ResearchView } from "@/components/research/research-view";

export const metadata: Metadata = {
  title: "研究",
};

export default function ResearchPage() {
  return <ResearchView />;
}
