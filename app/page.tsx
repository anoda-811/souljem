import type { Metadata } from "next";
import { DashboardLive } from "@/components/dashboard/dashboard-live";

export const metadata: Metadata = {
  title: "ホーム",
};

export default function HomePage() {
  return <DashboardLive />;
}
