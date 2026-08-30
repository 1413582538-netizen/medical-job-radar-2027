import { findDuplicate } from "./normalize.mjs";

function restHeaders(serviceRoleKey) {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
  };
}

function appendUrl(urls, url) {
  return url && !urls.includes(url) ? [...urls, url] : urls;
}

export function createSupabaseWriter({ url, serviceRoleKey, fetchImpl = fetch }) {
  if (!url || !serviceRoleKey) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for crawling");
  const baseUrl = new URL(url);
  const headers = restHeaders(serviceRoleKey);

  async function request(path, init = {}) {
    const response = await fetchImpl(new URL(path, baseUrl), {
      ...init,
      headers: { ...headers, ...(init.headers ?? {}) },
    });
    if (!response.ok) throw new Error(`Supabase request failed: ${init.method ?? "GET"} ${path} (${response.status})`);
    return response.json();
  }

  async function findCompany(companyName) {
    const query = new URLSearchParams({ select: "id", name: `eq.${companyName}`, limit: "1" });
    const rows = await request(`/rest/v1/companies?${query}`, { method: "GET" });
    return rows[0] ?? null;
  }

  async function createCompany(company) {
    const rows = await request("/rest/v1/companies", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        name: company.name,
        industry: company.industry,
        company_type: company.companyType,
        company_size: company.companySize,
        location: company.location,
        description: company.description,
        website_url: company.websiteUrl,
        careers_url: company.careersUrl,
      }),
    });
    if (!rows[0]?.id) throw new Error("Supabase did not return the created company ID");
    return rows[0];
  }

  async function jobsForCandidate(candidate) {
    const select = "id,title,official_url,source_name,source_job_id,source_url,dedupe_key,source_urls,first_discovered_at";
    const queries = [];
    if (candidate.job.officialUrl) queries.push({ official_url: `eq.${candidate.job.officialUrl}` });
    if (candidate.job.sourceJobId) queries.push({ source_name: `eq.${candidate.job.sourceName}`, source_job_id: `eq.${candidate.job.sourceJobId}` });
    queries.push({ source_url: `eq.${candidate.job.sourceUrl}` });
    queries.push({ dedupe_key: `eq.${candidate.job.dedupeKey}` });

    for (const params of queries) {
      const rows = await request(`/rest/v1/jobs?${new URLSearchParams({ select, ...params })}`, { method: "GET" });
      if (params.source_url && rows[0]) return rows[0];
      const duplicate = findDuplicate(rows, candidate);
      if (duplicate) return duplicate;
    }
    return null;
  }

  async function upsertCandidate(candidate) {
    let company = await findCompany(candidate.company.name);
    const newCompany = !company;
    if (!company) company = await createCompany(candidate.company);

    const existingJob = await jobsForCandidate(candidate);
    if (existingJob) {
      let sourceUrls = Array.isArray(existingJob.source_urls) ? existingJob.source_urls : [];
      sourceUrls = appendUrl(sourceUrls, candidate.job.sourceUrl);
      sourceUrls = appendUrl(sourceUrls, candidate.job.officialUrl);
      const update = { source_urls: sourceUrls, source_url: candidate.job.sourceUrl };
      if (!existingJob.official_url && candidate.job.officialUrl) update.official_url = candidate.job.officialUrl;
      if (!existingJob.source_job_id && candidate.job.sourceJobId) update.source_job_id = candidate.job.sourceJobId;
      if (existingJob.title && existingJob.title !== candidate.job.title) update.title = candidate.job.title;
      await request(`/rest/v1/jobs?${new URLSearchParams({ id: `eq.${existingJob.id}` })}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(update),
      });
      return { newCompany, newJob: false };
    }

    const sourceUrls = appendUrl(appendUrl([], candidate.job.sourceUrl), candidate.job.officialUrl);
    await request("/rest/v1/jobs", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        company_id: company.id,
        title: candidate.job.title,
        job_direction: candidate.job.jobDirection,
        industry: candidate.job.industry,
        location: candidate.job.location,
        published_at: candidate.job.publishedAt,
        source_name: candidate.job.sourceName,
        source_url: candidate.job.sourceUrl,
        official_url: candidate.job.officialUrl,
        status: candidate.job.status,
        source_job_id: candidate.job.sourceJobId,
        source_urls: sourceUrls,
        dedupe_key: candidate.job.dedupeKey,
      }),
    });
    return { newCompany, newJob: true };
  }

  async function finishRun(summary) {
    await request("/rest/v1/crawl_logs", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        status: summary.status,
        discovered_job_count: summary.discoveredJobCount,
        new_job_count: summary.newJobCount,
        new_company_count: summary.newCompanyCount,
        error_message: summary.errorMessage,
      }),
    });
  }

  return { upsertCandidate, finishRun };
}
