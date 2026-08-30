"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DASHBOARD_COLUMNS } from "@/lib/constants";
import {
  dashboardFilterHref,
  filtersFromSearchParams,
} from "@/lib/dashboard-filter-query";
import {
  displayJobValue,
  filterDashboardJobs,
  type DashboardJob,
  type DashboardJobFilters,
} from "@/lib/dashboard-jobs";

type DashboardJobsTableProps = {
  jobs: DashboardJob[];
};

type FilterKey = keyof DashboardJobFilters;

function optionsFor(jobs: DashboardJob[], key: keyof DashboardJob) {
  return [...new Set(jobs.map((job) => job[key]).filter((value): value is string => typeof value === "string" && value.length > 0))].sort();
}

function publishedDate(value: string | null) {
  return value ? value.slice(0, 10) : "未知";
}

function jobTitle(job: DashboardJob) {
  return `${job.title}（${displayJobValue(job.jobDirection)}）`;
}

type CompanyRow = {
  id: string;
  companyName: string;
  companyType: string | null;
  industry: string | null;
  companySize: string | null;
  location: string | null;
  publishedAt: string | null;
  jobSummary: string;
  companyDescription: string | null;
  url: string;
};

function uniqueValues(values: (string | null | undefined)[]) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function joinValues(values: (string | null | undefined)[]) {
  const unique = uniqueValues(values);
  return unique.length ? unique.join("、") : null;
}

function latestPublishedAt(jobs: DashboardJob[]) {
  return [...jobs]
    .filter((job) => job.publishedAt)
    .sort((left, right) => new Date(right.publishedAt ?? 0).getTime() - new Date(left.publishedAt ?? 0).getTime())[0]
    ?.publishedAt ?? null;
}

function firstKnown(jobs: DashboardJob[], key: "companyType" | "companySize" | "companyDescription") {
  return jobs.map((job) => job[key]).find((value) => value) ?? null;
}

function groupJobsByCompany(jobs: DashboardJob[]): CompanyRow[] {
  const grouped = new Map<string, DashboardJob[]>();
  for (const job of jobs) {
    const companyJobs = grouped.get(job.companyName) ?? [];
    companyJobs.push(job);
    grouped.set(job.companyName, companyJobs);
  }

  return [...grouped.values()].map((companyJobs) => {
    const primaryJob = companyJobs.find((job) => job.officialUrl) ?? companyJobs[0];
    return {
      id: primaryJob.id,
      companyName: primaryJob.companyName,
      companyType: firstKnown(companyJobs, "companyType"),
      industry: joinValues(companyJobs.map((job) => job.industry)),
      companySize: firstKnown(companyJobs, "companySize"),
      location: joinValues(companyJobs.map((job) => job.location)),
      publishedAt: latestPublishedAt(companyJobs),
      jobSummary: uniqueValues(companyJobs.map(jobTitle)).join("；"),
      companyDescription: firstKnown(companyJobs, "companyDescription"),
      url: primaryJob.url,
    };
  });
}

export function DashboardJobsTable({ jobs }: DashboardJobsTableProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<DashboardJobFilters>(() =>
    filtersFromSearchParams(searchParams),
  );
  const filteredJobs = useMemo(() => filterDashboardJobs(jobs, filters), [filters, jobs]);
  const companyRows = useMemo(() => groupJobsByCompany(filteredJobs), [filteredJobs]);
  const industries = useMemo(() => optionsFor(jobs, "industry"), [jobs]);
  const directions = useMemo(() => optionsFor(jobs, "jobDirection"), [jobs]);
  const locations = useMemo(() => optionsFor(jobs, "location"), [jobs]);
  const companyTypes = useMemo(() => optionsFor(jobs, "companyType"), [jobs]);

  useEffect(() => {
    setFilters(filtersFromSearchParams(searchParams));
  }, [searchParams]);

  function updateFilter(key: FilterKey, value: string) {
    const nextFilters = { ...filters, [key]: value || undefined };
    setFilters(nextFilters);
    router.replace(dashboardFilterHref(pathname, searchParams, nextFilters));
  }

  return (
    <section className="flex flex-col gap-4" aria-label="岗位列表">
      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6">
        <FilterSelect id="industry" label="行业" values={industries} value={filters.industry ?? ""} onChange={(value) => updateFilter("industry", value)} />
        <FilterSelect id="direction" label="岗位方向" values={directions} value={filters.jobDirection ?? ""} onChange={(value) => updateFilter("jobDirection", value)} />
        <FilterSelect id="location" label="城市" values={locations} value={filters.location ?? ""} onChange={(value) => updateFilter("location", value)} />
        <FilterSelect id="company-type" label="公司性质" values={companyTypes} value={filters.companyType ?? ""} onChange={(value) => updateFilter("companyType", value)} />
        <FilterDate id="published-from" label="发布时间（起）" value={filters.publishedFrom ?? ""} onChange={(value) => updateFilter("publishedFrom", value)} />
        <FilterDate id="published-to" label="发布时间（止）" value={filters.publishedTo ?? ""} onChange={(value) => updateFilter("publishedTo", value)} />
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {DASHBOARD_COLUMNS.map((column) => (
                <th className="whitespace-nowrap px-4 py-3 font-medium" key={column} scope="col">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {companyRows.map((company) => (
              <tr key={company.id}>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-950">{company.companyName}</td>
                <td className="whitespace-nowrap px-4 py-3">{displayJobValue(company.companyType)}</td>
                <td className="whitespace-nowrap px-4 py-3">{displayJobValue(company.industry)}</td>
                <td className="whitespace-nowrap px-4 py-3">{displayJobValue(company.companySize)}</td>
                <td className="whitespace-nowrap px-4 py-3">{displayJobValue(company.location)}</td>
                <td className="whitespace-nowrap px-4 py-3">{publishedDate(company.publishedAt)}</td>
                <td className="min-w-52 px-4 py-3">{company.jobSummary}</td>
                <td className="min-w-52 px-4 py-3">{displayJobValue(company.companyDescription)}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <a className="font-medium text-sky-700 underline underline-offset-2 hover:text-sky-900" href={company.url} rel="noreferrer" target="_blank">
                    查看岗位
                  </a>
                </td>
              </tr>
            ))}
            {companyRows.length === 0 ? (
              <tr>
                <td className="px-4 py-12 text-center text-slate-500" colSpan={DASHBOARD_COLUMNS.length}>
                  {jobs.length === 0 ? "暂无已收录岗位" : "暂无符合筛选条件的岗位"}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

type FilterSelectProps = {
  id: string;
  label: string;
  values: string[];
  value: string;
  onChange: (value: string) => void;
};

function FilterSelect({ id, label, values, value, onChange }: FilterSelectProps) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-sm font-medium text-slate-700" htmlFor={id}>
      {label}
      <select className="min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 font-normal text-slate-900" id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">全部</option>
        {values.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

type FilterDateProps = Omit<FilterSelectProps, "values">;

function FilterDate({ id, label, value, onChange }: FilterDateProps) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-sm font-medium text-slate-700" htmlFor={id}>
      {label}
      <input className="min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 font-normal text-slate-900" id={id} type="date" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
