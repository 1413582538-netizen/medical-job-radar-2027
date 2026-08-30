export type SupabaseCompanyRow = {
  id: string;
  name: string;
  industry: string | null;
  company_type: string | null;
  company_size: string | null;
  location: string | null;
  description: string | null;
};

export type SupabaseJobRow = {
  id: string;
  title: string;
  job_direction: string | null;
  industry: string | null;
  location: string | null;
  published_at: string | null;
  first_discovered_at: string;
  source_name: string;
  source_url: string;
  official_url: string | null;
  status: "active" | "closed" | "unknown";
  companies: SupabaseCompanyRow | null;
};

export type DashboardJob = {
  id: string;
  companyName: string;
  companyType: string | null;
  industry: string | null;
  companySize: string | null;
  location: string | null;
  publishedAt: string | null;
  firstDiscoveredAt: string;
  title: string;
  jobDirection: string | null;
  companyDescription: string | null;
  url: string;
  officialUrl?: string;
};

export type DashboardJobFilters = {
  industry?: string;
  jobDirection?: string;
  location?: string;
  companyType?: string;
  publishedFrom?: string;
  publishedTo?: string;
};

export type DashboardData = {
  jobs: DashboardJob[];
  weekNewCount: number;
  error: string | null;
};

type LoadDashboardDataOptions = {
  supabaseUrl?: string;
  anonKey?: string;
  fetchImpl?: typeof fetch;
  now?: Date;
};

const JOBS_SELECT =
  "id,title,job_direction,industry,location,published_at,first_discovered_at,source_name,source_url,official_url,status,companies(id,name,industry,company_type,company_size,location,description)";

export function displayJobValue(value: string | null | undefined) {
  return value ?? "未知";
}

function descendingDate(left: string | null, right: string | null) {
  return new Date(right ?? 0).getTime() - new Date(left ?? 0).getTime();
}

export function toDashboardJobs(rows: SupabaseJobRow[]): DashboardJob[] {
  return rows
    .map((row) => ({
      id: row.id,
      companyName: row.companies?.name ?? "未知",
      companyType: row.companies?.company_type ?? null,
      industry: row.industry ?? row.companies?.industry ?? null,
      companySize: row.companies?.company_size ?? null,
      location: row.location ?? row.companies?.location ?? null,
      publishedAt: row.published_at,
      firstDiscoveredAt: row.first_discovered_at,
      title: row.title,
      jobDirection: row.job_direction,
      companyDescription: row.companies?.description ?? null,
      url: row.official_url ?? row.source_url,
      ...(row.official_url ? { officialUrl: row.official_url } : {}),
    }))
    .sort(
      (left, right) =>
        descendingDate(left.firstDiscoveredAt, right.firstDiscoveredAt) ||
        descendingDate(left.publishedAt, right.publishedAt),
    );
}

function startOfShanghaiDate(date: string) {
  return new Date(`${date}T00:00:00+08:00`).getTime();
}

function isWithinPublishedRange(
  publishedAt: string | null,
  publishedFrom?: string,
  publishedTo?: string,
) {
  if (!publishedAt) return !publishedFrom && !publishedTo;

  const timestamp = new Date(publishedAt).getTime();
  if (publishedFrom && timestamp < startOfShanghaiDate(publishedFrom)) return false;
  if (publishedTo && timestamp >= startOfShanghaiDate(publishedTo) + 86_400_000) {
    return false;
  }

  return true;
}

export function filterDashboardJobs(
  jobs: DashboardJob[],
  filters: DashboardJobFilters,
) {
  return jobs.filter(
    (job) =>
      (!filters.industry || job.industry === filters.industry) &&
      (!filters.jobDirection || job.jobDirection === filters.jobDirection) &&
      (!filters.location || job.location === filters.location) &&
      (!filters.companyType || job.companyType === filters.companyType) &&
      isWithinPublishedRange(
        job.publishedAt,
        filters.publishedFrom,
        filters.publishedTo,
      ),
  );
}

const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000;
const WEEK_MS = 7 * 86_400_000;

export function getShanghaiWeekRange(now = new Date()) {
  const shanghaiNow = new Date(now.getTime() + SHANGHAI_OFFSET_MS);
  const daysSinceMonday = (shanghaiNow.getUTCDay() + 6) % 7;
  const weekStart = Date.UTC(
    shanghaiNow.getUTCFullYear(),
    shanghaiNow.getUTCMonth(),
    shanghaiNow.getUTCDate() - daysSinceMonday,
  );
  const start = new Date(weekStart - SHANGHAI_OFFSET_MS);

  return { start, end: new Date(start.getTime() + WEEK_MS) };
}

export function countNewJobsThisShanghaiWeek(
  jobs: Pick<DashboardJob, "firstDiscoveredAt">[],
  now = new Date(),
) {
  const { start, end } = getShanghaiWeekRange(now);
  return jobs.filter((job) => {
    const discoveredAt = new Date(job.firstDiscoveredAt).getTime();
    return discoveredAt >= start.getTime() && discoveredAt < end.getTime();
  }).length;
}

function unavailableDashboardData(): DashboardData {
  return { jobs: [], weekNewCount: 0, error: "岗位数据暂不可用" };
}

export async function loadDashboardData(
  options: LoadDashboardDataOptions = {},
): Promise<DashboardData> {
  const supabaseUrl = options.supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = options.anonKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return unavailableDashboardData();

  const endpoint = new URL("/rest/v1/jobs", supabaseUrl);
  endpoint.search = new URLSearchParams({
    select: JOBS_SELECT,
    status: "neq.closed",
    order: "first_discovered_at.desc,published_at.desc",
  }).toString();

  try {
    const response = await (options.fetchImpl ?? fetch)(endpoint, {
      headers: {
        Accept: "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });
    if (!response.ok) return unavailableDashboardData();

    const rows: unknown = await response.json();
    if (!Array.isArray(rows)) return unavailableDashboardData();

    const jobs = toDashboardJobs(rows as SupabaseJobRow[]);
    return {
      jobs,
      weekNewCount: countNewJobsThisShanghaiWeek(jobs, options.now),
      error: null,
    };
  } catch {
    return unavailableDashboardData();
  }
}
