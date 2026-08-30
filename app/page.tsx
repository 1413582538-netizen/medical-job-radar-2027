import React from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { loadDashboardData } from "@/lib/dashboard-jobs";

export default async function Home() {
  const data = await loadDashboardData();

  return <DashboardShell {...data} />;
}
