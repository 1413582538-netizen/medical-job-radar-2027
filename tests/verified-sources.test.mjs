import { expect, it } from "vitest";

import { verifiedCandidates } from "../crawler/sources/verified-2027-campus.mjs";

it("首批已验证来源只提供具备公司、岗位和公开链接的候选记录", () => {
  const candidates = verifiedCandidates();

  expect(candidates.length).toBeGreaterThanOrEqual(8);
  for (const candidate of candidates) {
    expect(candidate.company.name).toBeTruthy();
    expect(candidate.job.title).toBeTruthy();
    expect(candidate.job.sourceUrl).toMatch(/^https:\/\//);
  }
  expect(candidates.some((candidate) => candidate.company.name === "深圳市新产业生物医学工程股份有限公司" && candidate.job.title === "试剂研发工程师")).toBe(true);
});

it("补充近期可核验的目标企业 2027 招聘记录", () => {
  const candidates = verifiedCandidates();
  const companyNames = candidates.map((candidate) => candidate.company.name);

  expect(companyNames).toEqual(expect.arrayContaining([
    "GE医疗中国",
    "联邦制药",
    "巨鲨医疗",
    "阿里健康",
    "科大讯飞医疗",
  ]));
  expect(candidates.every((candidate) => candidate.job.sourceUrl.startsWith("https://"))).toBe(true);
});
