import type { Metadata } from "next";
import { GemView } from "@/components/gem/gem-view";

export const metadata: Metadata = {
  title: "ソウルジェム",
};

export default function GemPage() {
  return <GemView />;
}
