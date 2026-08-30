import { expect, it } from "vitest";

import { collectCandidates, runCrawler } from "../crawler/run.mjs";

it("单条岗位写入失败后仍继续，并记录部分失败摘要", async () => {
  const outcomes = [];
  const writer = {
    async upsertCandidate(candidate) {
      outcomes.push(candidate.company.name);
      if (candidate.company.name === "失败来源") throw new Error("page unavailable");
      return { newCompany: candidate.company.name === "新公司", newJob: true };
    },
    async finishRun(summary) {
      outcomes.push(summary);
    },
  };
  const candidates = [
    { company: { name: "新公司" }, job: { title: "研发" } },
    { company: { name: "失败来源" }, job: { title: "产品" } },
    { company: { name: "已有公司" }, job: { title: "临床" } },
  ];

  const result = await runCrawler({ writer, candidates });

  expect(result).toEqual({
    discoveredJobCount: 3,
    newJobCount: 2,
    newCompanyCount: 1,
    status: "partial_failure",
    errorMessage: "失败来源 / 产品: page unavailable",
  });
  expect(outcomes).toEqual(["新公司", "失败来源", "已有公司", result]);
});

it("实时来源失败时保留已验证来源并把失败带入运行摘要", async () => {
  const knownCandidate = { company: { name: "已验证公司" }, job: { title: "研发" } };
  const collected = await collectCandidates({
    knownCandidates: [knownCandidate],
    discoverHust: async () => {
      throw new Error("source timeout");
    },
  });
  const writer = {
    upsertCandidate: async () => ({ newCompany: false, newJob: false }),
    finishRun: async () => undefined,
  };

  expect(collected).toEqual({
    candidates: [knownCandidate],
    sourceErrors: ["华中科技大学就业信息网: source timeout"],
  });
  await expect(runCrawler({ writer, ...collected })).resolves.toMatchObject({
    status: "partial_failure",
    errorMessage: "华中科技大学就业信息网: source timeout",
  });
});
