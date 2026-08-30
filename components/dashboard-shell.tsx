import React, { Suspense } from "react";
import { DashboardJobsTable } from "@/components/dashboard-jobs-table";
import { JobsTableSkeleton } from "@/components/jobs-table-skeleton";
import { DASHBOARD_COLUMNS } from "@/lib/constants";
import type { DashboardData } from "@/lib/dashboard-jobs";

export function DashboardShell({ jobs, weekNewCount, error }: DashboardData) {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-6 py-10 sm:px-8 lg:px-10">
      <section className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            个人医疗健康行业校招岗位信息雷达
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
            医疗行业 2027 秋招岗位情报
          </h1>
        </div>
        <div className="w-fit rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-sm font-medium text-slate-600">
            本周新增 {weekNewCount} 条
          </p>
        </div>
        {error ? (
          <p className="text-sm text-amber-700" role="status">
            {error}
          </p>
        ) : null}
      </section>

      <Suspense fallback={<JobsTableSkeleton columns={DASHBOARD_COLUMNS} />}>
        <DashboardJobsTable jobs={jobs} />
      </Suspense>
    </main>
  );
}
