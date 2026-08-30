import { expect, it } from "vitest";

import { normalizeCandidate } from "../crawler/normalize.mjs";
import { createSupabaseWriter } from "../crawler/supabase-writer.mjs";

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}

it("首次发现时创建公司和岗位，并写入结束日志", async () => {
  const requests = [];
  const writer = createSupabaseWriter({
    url: "https://project.supabase.co",
    serviceRoleKey: "service-role-key",
    fetchImpl: async (input, init = {}) => {
      const url = new URL(input);
      requests.push({ url, init });
      if (url.pathname.endsWith("/companies") && init.method === "GET") return jsonResponse([]);
      if (url.pathname.endsWith("/companies") && init.method === "POST") return jsonResponse([{ id: "company-1" }], 201);
      if (url.pathname.endsWith("/jobs") && init.method === "GET") return jsonResponse([]);
      if (url.pathname.endsWith("/jobs") && init.method === "POST") return jsonResponse([{ id: "job-1" }], 201);
      if (url.pathname.endsWith("/crawl_logs") && init.method === "POST") return jsonResponse([{ id: "log-1" }], 201);
      throw new Error(`Unexpected request: ${init.method} ${url.pathname}`);
    },
  });
  const candidate = normalizeCandidate({
    companyName: "示例医疗",
    title: "研发工程师",
    sourceName: "官网",
    sourceUrl: "https://source.example/job",
    officialUrl: "https://career.example/job",
    location: "深圳",
    companyIndustry: "医疗器械",
  });

  expect(await writer.upsertCandidate(candidate)).toEqual({ newCompany: true, newJob: true });
  await writer.finishRun({ status: "success", discoveredJobCount: 1, newJobCount: 1, newCompanyCount: 1, errorMessage: null });

  const companyPost = requests.find((request) => request.url.pathname.endsWith("/companies") && request.init.method === "POST");
  const jobPost = requests.find((request) => request.url.pathname.endsWith("/jobs") && request.init.method === "POST");
  const logPost = requests.find((request) => request.url.pathname.endsWith("/crawl_logs") && request.init.method === "POST");
  expect(companyPost.init.headers.Authorization).toBe("Bearer service-role-key");
  expect(JSON.parse(jobPost.init.body)).toEqual({
    company_id: "company-1", title: "研发工程师", job_direction: null, industry: null, location: "深圳", published_at: null,
    source_name: "官网", source_url: "https://source.example/job", official_url: "https://career.example/job", status: "unknown", source_job_id: null,
    source_urls: ["https://source.example/job", "https://career.example/job"], dedupe_key: "示例医疗|研发工程师|深圳",
  });
  expect(JSON.parse(logPost.init.body)).toEqual({
    status: "success", discovered_job_count: 1, new_job_count: 1, new_company_count: 1, error_message: null,
  });
});

it("重复岗位合并来源而不创建新岗位或公司", async () => {
  const requests = [];
  const existingJob = {
    id: "job-existing", official_url: null, source_name: "官网", source_job_id: null,
    title: "研发工程师", dedupe_key: "示例医疗|研发工程师|深圳", source_urls: ["https://first.example/job"], first_discovered_at: "2026-08-20T00:00:00Z",
  };
  const writer = createSupabaseWriter({
    url: "https://project.supabase.co",
    serviceRoleKey: "service-role-key",
    fetchImpl: async (input, init = {}) => {
      const url = new URL(input);
      requests.push({ url, init });
      if (url.pathname.endsWith("/companies") && init.method === "GET") return jsonResponse([{ id: "company-1" }]);
      if (url.pathname.endsWith("/jobs") && init.method === "GET") return jsonResponse([existingJob]);
      if (url.pathname.endsWith("/jobs") && init.method === "PATCH") return jsonResponse([existingJob]);
      throw new Error(`Unexpected request: ${init.method} ${url.pathname}`);
    },
  });
  const candidate = normalizeCandidate({ companyName: "示例医疗", title: "研发工程师", sourceName: "官网", sourceUrl: "https://new.example/job", location: "深圳" });

  expect(await writer.upsertCandidate(candidate)).toEqual({ newCompany: false, newJob: false });
  const patchRequest = requests.find((request) => request.url.pathname.endsWith("/jobs") && request.init.method === "PATCH");
  expect(patchRequest.url.searchParams.get("id")).toBe("eq.job-existing");
  expect(JSON.parse(patchRequest.init.body)).toEqual({
    source_urls: ["https://first.example/job", "https://new.example/job"], source_url: "https://new.example/job",
  });
});

it("同一来源公告 URL 即使岗位标题更新也合并到已有岗位", async () => {
  const existingJob = {
    id: "job-existing", official_url: null, source_name: "华中科技大学就业信息网", source_job_id: null,
    source_url: "https://job.hust.edu.cn/zpinfo1/2409266.htm", dedupe_key: "旧标题", source_urls: [],
  };
  const writer = createSupabaseWriter({
    url: "https://project.supabase.co",
    serviceRoleKey: "service-role-key",
    fetchImpl: async (input, init = {}) => {
      const url = new URL(input);
      if (url.pathname.endsWith("/companies") && init.method === "GET") return jsonResponse([{ id: "company-1" }]);
      if (url.pathname.endsWith("/jobs") && init.method === "GET") return jsonResponse([existingJob]);
      if (url.pathname.endsWith("/jobs") && init.method === "PATCH") return jsonResponse([existingJob]);
      throw new Error(`Unexpected request: ${init.method} ${url.pathname}`);
    },
  });
  const candidate = normalizeCandidate({
    companyName: "邯郸制药股份有限公司", title: "2027届校园招聘", sourceName: "华中科技大学就业信息网",
    sourceUrl: "https://job.hust.edu.cn/zpinfo1/2409266.htm", sourceJobId: "2409266",
  });

  await expect(writer.upsertCandidate(candidate)).resolves.toEqual({ newCompany: false, newJob: false });
});
