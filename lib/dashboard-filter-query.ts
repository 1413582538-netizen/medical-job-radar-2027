import type { DashboardJobFilters } from "./dashboard-jobs";

type SearchParamsLike = Pick<URLSearchParams, "get">;

const FILTER_QUERY_KEYS = {
  industry: "industry",
  jobDirection: "jobDirection",
  location: "location",
  companyType: "companyType",
  publishedFrom: "publishedFrom",
  publishedTo: "publishedTo",
};

export function filtersFromSearchParams(searchParams: SearchParamsLike): DashboardJobFilters {
  return Object.fromEntries(
    Object.entries(FILTER_QUERY_KEYS)
      .map(([filter, queryKey]) => [filter, searchParams.get(queryKey) || undefined])
      .filter(([, value]) => value),
  ) as DashboardJobFilters;
}

export function dashboardFilterHref(
  pathname: string,
  searchParams: SearchParamsLike & { toString(): string },
  filters: DashboardJobFilters,
) {
  const next = new URLSearchParams(searchParams.toString());
  for (const [filter, queryKey] of Object.entries(FILTER_QUERY_KEYS)) {
    const value = filters[filter as keyof DashboardJobFilters];
    if (value) next.set(queryKey, value);
    else next.delete(queryKey);
  }
  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
}
