import type { Metadata } from "next";
import { HabitsView } from "@/components/habits/habits-view";

export const metadata: Metadata = {
  title: "習慣",
};

export default function HabitsPage() {
  return <HabitsView />;
}
