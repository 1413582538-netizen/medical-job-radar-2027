import { expect, it } from "vitest";

import {
  dedupeKey,
  findDuplicate,
  normalizeCandidate,
} from "../crawler/normalize.mjs";

it("规范化候选记录并优先以官方链接匹配已有岗位", () => {
  const candidate = normalizeCandidate({
    companyName: " 示例 医疗 ",
    title: " 研发工程师 ",
    sourceName: "校园招聘公告",
    sourceUrl: "https://source.example/job",
    officialUrl: "https://careers.example/jobs/1",
    location: " 深圳 ",
  });
  const officialMatch = {
    id: "official-match",
    official_url: "https://careers.example/jobs/1",
    source_name: "其他来源",
    source_job_id: "different",
    dedupe_key: "different",
  };

  expect(candidate.company.name).toBe("示例 医疗");
  expect(candidate.job.title).toBe("研发工程师");
  expect(candidate.job.dedupeKey).toBe("示例医疗|研发工程师|深圳");
  expect(dedupeKey(" 示例 医疗 ", "研发工程师", " 深圳 ")).toBe("示例医疗|研发工程师|深圳");
  expect(findDuplicate([officialMatch], candidate)).toBe(officialMatch);
});

it("以来源岗位 ID 和规范化去重键作为后备匹配", () => {
  const sourceIdCandidate = normalizeCandidate({
    companyName: "示例医疗",
    title: "产品工程师",
    sourceName: "官方招聘站",
    sourceUrl: "https://source.example/2",
    sourceJobId: "job-2",
  });
  const keyCandidate = normalizeCandidate({
    companyName: "示例 医疗",
    title: "产品工程师",
    sourceName: "第三方公告",
    sourceUrl: "https://source.example/3",
    location: "广州",
  });
  const sourceIdMatch = {
    id: "source-id-match",
    official_url: null,
    source_name: "官方招聘站",
    source_job_id: "job-2",
    dedupe_key: "unrelated",
  };
  const keyMatch = {
    id: "key-match",
    official_url: null,
    source_name: "官网",
    source_job_id: null,
    dedupe_key: "示例医疗|产品工程师|广州",
  };

  expect(findDuplicate([sourceIdMatch], sourceIdCandidate)).toBe(sourceIdMatch);
  expect(findDuplicate([keyMatch], keyCandidate)).toBe(keyMatch);
});

it("同一来源招聘链接优先合并，即使岗位标题后来变化", () => {
  const candidate = normalizeCandidate({
    companyName: "示例医疗",
    title: "更新后的岗位名称",
    sourceName: "学校就业网",
    sourceUrl: "https://career.example/jobs/2027-1",
  });
  const sourceUrlMatch = {
    id: "source-url-match",
    official_url: null,
    source_name: "学校就业网",
    source_job_id: null,
    source_url: "https://career.example/jobs/2027-1",
    dedupe_key: "示例医疗|旧岗位名称|深圳",
  };

  expect(findDuplicate([sourceUrlMatch], candidate)).toBe(sourceUrlMatch);
});

it("缺少公司、岗位、来源或来源链接时拒绝候选记录", () => {
  expect(() => normalizeCandidate({ companyName: "示例医疗", title: "研发工程师", sourceName: "官网" })).toThrow(/sourceUrl/);
});
