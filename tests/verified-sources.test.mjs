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

it("收录本周新发现的医药和医疗器械 2027 校招来源", () => {
  const candidates = verifiedCandidates();

  expect(candidates).toEqual(expect.arrayContaining([
    expect.objectContaining({
      company: expect.objectContaining({ name: "罗氏制药中国" }),
      job: expect.objectContaining({
        title: "2027届 StartUp 人才发展项目（医学路径）",
        sourceUrl: "https://careers.roche.com/cn/zh/startup-china-pharma",
      }),
    }),
    expect.objectContaining({
      company: expect.objectContaining({ name: "甘李药业股份有限公司" }),
      job: expect.objectContaining({
        title: "2027届校园招聘（研究、开发、营销、运营）",
        sourceUrl: "https://jy.tust.edu.cn/correcruit/content/id/46291.html",
      }),
    }),
    expect.objectContaining({
      company: expect.objectContaining({ name: "BMC瑞迈特" }),
      job: expect.objectContaining({
        title: "2027届校园招聘",
        sourceUrl: "https://career.nankai.edu.cn/correcruit/content/id/117304.html",
      }),
    }),
  ]));
});
