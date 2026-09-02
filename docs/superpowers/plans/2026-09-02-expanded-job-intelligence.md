# Expanded Job Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the Dashboard into a verified, multi-source 2027 recruitment radar that covers healthcare, consumer-health/beauty, pharmacy retail, and healthcare business units in technology groups.

**Architecture:** Add a declarative enterprise source catalog that owns company aliases, industry, official careers URLs and allowed source domains. Keep each concrete source adapter responsible only for producing raw records; a shared classifier validates 2027 recruitment signals, relevant job directions and source trust before the existing normalizer/writer deduplicates and stores records. Existing dashboard aggregation remains one company per row.

**Tech Stack:** Next.js 15 static export, React 19, Node.js ESM crawler, Supabase REST/PostgreSQL, Vitest, GitHub Actions and GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-02-expanded-job-intelligence-design.md`

## Global Constraints

- Never invent company scale, type, description, location, publication date or recruitment link; use `null` and display `未知` when unverified.
- Only verified public official sources, credible university recruitment sites, and named recruitment platforms may create job candidates.
- Search engines only discover candidate sources; their result pages are never a job source URL.
- A job must contain a 2027-campus signal and a relevant role signal before it is written to Supabase.
- Deduplicate by official URL, source ID, source announcement URL, then normalized company/title/location.
- The dashboard must continue to display one row per company and choose the best available official job link.
- Do not expose Supabase service-role credentials in source code, static output or browser code.

---

## File Structure

- Create: `crawler/sources/enterprise-catalog.mjs` — declarative enterprise seeds, aliases, industry categories, official recruitment URLs and allowed domains.
- Create: `crawler/source-validation.mjs` — shared source-trust, campus-signal and role-direction classifiers.
- Create: `crawler/sources/curated-2027-campus.mjs` — normalized, source-verified 2027 job records discovered during the first expansion pass.
- Modify: `crawler/sources/hust-campus.mjs` — replace duplicated classification with shared validation helpers and use enterprise aliases when extracting companies.
- Modify: `crawler/sources/verified-2027-campus.mjs` — retain the existing verified records while importing the new curated source records.
- Modify: `crawler/run.mjs` — collect source adapters independently and report per-source failures without stopping other sources.
- Modify: `crawler/normalize.mjs` — add source-announcement URL matching as the documented dedupe fallback.
- Modify: `tests/verified-sources.test.mjs` — verify the expanded source batch has required fields and target enterprises.
- Create: `tests/enterprise-catalog.test.mjs` — test required enterprise entries, aliases, industry scope and allowed domains.
- Create: `tests/source-validation.test.mjs` — test 2027 and role filters plus invalid source rejection.
- Modify: `tests/hust-campus-source.test.mjs` — test the shared classifier integration with HUST HTML fixtures.
- Modify: `tests/crawler-run.test.mjs` — test independent source failure handling.
- Modify: `tests/crawler-normalize.test.mjs` — test source-announcement URL duplicate detection.
- Modify: `README.md` — document sources, expanded coverage and the no-invention policy.

### Task 1: Add enterprise catalog and source validation

**Files:**
- Create: `crawler/sources/enterprise-catalog.mjs`
- Create: `crawler/source-validation.mjs`
- Create: `tests/enterprise-catalog.test.mjs`
- Create: `tests/source-validation.test.mjs`

**Interfaces:**
- Produces `ENTERPRISE_CATALOG`, an immutable array of `{ name, aliases, industry, officialCareersUrl, allowedDomains }`.
- Produces `findEnterprise(name: string): Enterprise | null`.
- Produces `isTrustedSourceUrl(url: string, allowedDomains: string[]): boolean`.
- Produces `has2027CampusSignal(text: string): boolean` and `jobDirectionFromText(text: string): string | null`.
- Consumes only standard ESM APIs; source adapters consume these exports in later tasks.

- [ ] **Step 1: Write the failing enterprise catalog test**

```js
import { expect, it } from "vitest";
import { ENTERPRISE_CATALOG, findEnterprise } from "../crawler/sources/enterprise-catalog.mjs";

it("包含用户列出的企业、别名和行业范围", () => {
  const names = ENTERPRISE_CATALOG.map((item) => item.name);
  expect(names).toEqual(expect.arrayContaining([
    "深圳麦科田生物医疗技术股份有限公司",
    "GE医疗中国",
    "联邦制药",
    "雅诗兰黛中国",
    "华大智造",
    "巨鲨医疗",
    "字节跳动医疗健康",
    "阿里健康",
    "华润医疗健康",
    "科大讯飞医疗",
  ]));
  expect(findEnterprise("GE HealthCare")?.name).toBe("GE医疗中国");
  expect(findEnterprise("麦科田")).toMatchObject({ industry: "医疗器械" });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run tests/enterprise-catalog.test.mjs`

Expected: FAIL because `enterprise-catalog.mjs` does not exist.

- [ ] **Step 3: Implement the minimal enterprise catalog**

```js
export const ENTERPRISE_CATALOG = Object.freeze([
  { name: "深圳麦科田生物医疗技术股份有限公司", aliases: ["麦科田", "Medcaptain"], industry: "医疗器械" },
  { name: "GE医疗中国", aliases: ["GE HealthCare", "GE医疗"], industry: "医疗器械 / 医疗AI" },
  { name: "联邦制药", aliases: ["联邦制药集团", "The United Laboratories"], industry: "生物医药 / 制药" },
  { name: "雅诗兰黛中国", aliases: ["雅诗兰黛", "Estée Lauder"], industry: "消费健康 / 美妆" },
  { name: "华大智造", aliases: ["深圳华大智造科技股份有限公司", "MGI"], industry: "生命科学 / 医疗器械" },
  { name: "巨鲨医疗", aliases: ["巨鲨显示", "Jusha"], industry: "医疗器械 / 医学影像" },
  { name: "字节跳动医疗健康", aliases: ["字节跳动", "ByteDance"], industry: "科技医疗业务" },
  { name: "阿里健康", aliases: ["Alibaba Health"], industry: "数字医疗 / 医药零售" },
  { name: "华润医疗健康", aliases: ["华润", "华润医药", "华润医疗"], industry: "生物医药 / 医疗服务" },
  { name: "科大讯飞医疗", aliases: ["科大讯飞", "iFLYTEK"], industry: "医疗AI / 数字医疗" },
].map((enterprise) => Object.freeze({
  ...enterprise,
  officialCareersUrl: null,
  allowedDomains: [],
})).map(Object.freeze));
]);

export function findEnterprise(name) {
  const compact = name.trim().toLocaleLowerCase("zh-CN");
  return ENTERPRISE_CATALOG.find((enterprise) =>
    [enterprise.name, ...enterprise.aliases]
      .some((value) => value.toLocaleLowerCase("zh-CN") === compact),
  ) ?? null;
}
```

- [ ] **Step 4: Run the catalog test to verify it passes**

Run: `pnpm vitest run tests/enterprise-catalog.test.mjs`

Expected: PASS.

- [ ] **Step 5: Write the failing source validation test**

```js
import { expect, it } from "vitest";
import { has2027CampusSignal, isTrustedSourceUrl, jobDirectionFromText } from "../crawler/source-validation.mjs";

it("只接受 2027 届相关岗位并识别扩展方向", () => {
  expect(has2027CampusSignal("2027届校园招聘 医学合作专员")).toBe(true);
  expect(has2027CampusSignal("社会招聘 产品经理")).toBe(false);
  expect(jobDirectionFromText("医学合作专员（医疗健康业务）")).toBe("医学临床");
  expect(jobDirectionFromText("化妆品柜台销售")).toBeNull();
  expect(isTrustedSourceUrl("https://careers.gehealthcare.com/job/1", ["gehealthcare.com"])).toBe(true);
  expect(isTrustedSourceUrl("https://search.example.com/result", ["gehealthcare.com"])).toBe(false);
});
```

- [ ] **Step 6: Run the validation test to verify it fails**

Run: `pnpm vitest run tests/source-validation.test.mjs`

Expected: FAIL because `source-validation.mjs` does not exist.

- [ ] **Step 7: Implement the shared validation helpers**

```js
const CAMPUS_PATTERN = /2027\s*(?:届|级)?(?:秋季)?(?:校园)?(?:招聘|校招)|2027秋招|2027校园招聘|2027\s*graduate/i;

export function has2027CampusSignal(text) {
  return CAMPUS_PATTERN.test(text ?? "");
}

export function isTrustedSourceUrl(value, allowedDomains) {
  const hostname = new URL(value).hostname.toLocaleLowerCase("en-US");
  return allowedDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
}

export function jobDirectionFromText(text) {
  const value = text ?? "";
  if (/注册工程师|注册专员|法规|regulatory/i.test(value)) return "注册法规";
  if (/医学事务|医学合作|医学专员|临床研究|临床运营|临床项目|临床工程/i.test(value)) return "医学临床";
  if (/产品经理|产品工程师|产品专员|产品市场/i.test(value)) return "产品";
  if (/研发|算法|软件|硬件|检测|生命科学/i.test(value)) return "研发";
  if (/市场|项目管理|项目经理|管培/i.test(value)) return "市场、项目管理";
  return null;
}
```

- [ ] **Step 8: Run focused tests to verify green**

Run: `pnpm vitest run tests/enterprise-catalog.test.mjs tests/source-validation.test.mjs`

Expected: PASS.

- [ ] **Step 9: Commit Task 1**

```bash
git add crawler/sources/enterprise-catalog.mjs crawler/source-validation.mjs tests/enterprise-catalog.test.mjs tests/source-validation.test.mjs
git commit -m "feat: add enterprise source catalog"
```

### Task 2: Integrate shared validation into dynamic university discovery

**Files:**
- Modify: `crawler/sources/hust-campus.mjs`
- Modify: `tests/hust-campus-source.test.mjs`

**Interfaces:**
- Consumes `has2027CampusSignal`, `jobDirectionFromText` and `findEnterprise` from Task 1.
- Produces `parseHustDetail(html, listing, now)` with unchanged normalized candidate return type.
- Later source adapters rely on the same filtering semantics.

- [ ] **Step 1: Add a failing HUST fixture assertion for medical cooperation**

```js
it("将包含医学合作专员的 2027 公告归类为医学临床", () => {
  const candidate = parseHustDetail(
    detailHtml("2027届校园招聘 医学合作专员", "医疗健康业务", "2026-09-01"),
    { listingTitle: "字节跳动医疗健康2027届校园招聘", sourceUrl: "https://job.hust.edu.cn/zpinfo1/999.htm", sourceJobId: "999" },
    new Date("2026-09-02T00:00:00+08:00"),
  );
  expect(candidate?.job.jobDirection).toBe("医学临床");
});
```

- [ ] **Step 2: Run the HUST test to verify it fails**

Run: `pnpm vitest run tests/hust-campus-source.test.mjs`

Expected: FAIL because the current local classifier does not classify `医学合作专员`.

- [ ] **Step 3: Replace local classifier functions with shared helpers**

```js
import { findEnterprise } from "./enterprise-catalog.mjs";
import { has2027CampusSignal, jobDirectionFromText } from "../source-validation.mjs";

// In parseHustDetail, reject a listing when !has2027CampusSignal(listing.listingTitle).
// Prefer findEnterprise(companyName)?.name so aliases write a canonical company name.
// Use jobDirectionFromText(text) and reject null directions.
```

- [ ] **Step 4: Run the HUST test to verify it passes**

Run: `pnpm vitest run tests/hust-campus-source.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit Task 2**

```bash
git add crawler/sources/hust-campus.mjs tests/hust-campus-source.test.mjs
git commit -m "feat: share recruitment validation rules"
```

### Task 3: Add verified curated 2027 recruitment records

**Files:**
- Create: `crawler/sources/curated-2027-campus.mjs`
- Modify: `crawler/sources/verified-2027-campus.mjs`
- Modify: `tests/verified-sources.test.mjs`

**Interfaces:**
- Consumes `normalizeCandidate`, `ENTERPRISE_CATALOG`, `isTrustedSourceUrl`, `has2027CampusSignal` and `jobDirectionFromText`.
- Produces `curated2027Candidates(): NormalizedCandidate[]`.
- `verifiedCandidates()` merges legacy and curated candidates for `collectCandidates()`.

- [ ] **Step 1: Write the failing expanded source test**

```js
it("首批扩展来源包含可核实的目标企业与招聘链接", () => {
  const candidates = verifiedCandidates();
  const companies = new Set(candidates.map((candidate) => candidate.company.name));
  expect([...companies]).toEqual(expect.arrayContaining([
    "华大智造", "联邦制药", "阿里健康", "科大讯飞医疗",
  ]));
  for (const candidate of candidates.filter((item) => companies.has(item.company.name))) {
    expect(candidate.job.sourceUrl).toMatch(/^https:\/\//);
    expect(candidate.job.title).toMatch(/2027|产品|研发|注册|医学|临床|项目|市场/i);
  }
});
```

- [ ] **Step 2: Run the verified source test to verify it fails**

Run: `pnpm vitest run tests/verified-sources.test.mjs`

Expected: FAIL because the curated source module and target company records are absent.

- [ ] **Step 3: Research and record only verifiable job announcements**

For every record, independently open the official careers page or a credible university/platform announcement and record these exact fields:

```js
{
  companyName: "华大智造",
  companyIndustry: "生命科学 / 医疗器械",
  title: "2027届校园招聘（研发、产品、临床等）",
  jobDirection: "研发、产品、医学临床",
  sourceName: "公司官网" /* or named university/platform */,
  sourceUrl: "https://public-source.example/verified-job",
  officialUrl: null,
  sourceJobId: null,
  location: null,
  publishedAt: null,
  status: "active",
}
```

Do not add a job record for a named company if no verifiable 2027 recruitment record exists. Preserve its official careers URL only in `ENTERPRISE_CATALOG`.

- [ ] **Step 4: Implement `curated2027Candidates` with validation at module load**

```js
export function curated2027Candidates() {
  return RAW_CURATED_CANDIDATES
    .filter((item) => has2027CampusSignal(`${item.title} ${item.jobDirection}`))
    .filter((item) => isTrustedSourceUrl(item.sourceUrl, item.allowedDomains))
    .map(({ allowedDomains, ...candidate }) => normalizeCandidate(candidate));
}
```

- [ ] **Step 5: Merge curated candidates into the verified source adapter**

```js
import { curated2027Candidates } from "./curated-2027-campus.mjs";

export function verifiedCandidates() {
  return [...RAW_CANDIDATES.map(normalizeCandidate), ...curated2027Candidates()];
}
```

- [ ] **Step 6: Run the verified source test to verify it passes**

Run: `pnpm vitest run tests/verified-sources.test.mjs`

Expected: PASS; all candidates have a company, target role, named source and HTTPS URL.

- [ ] **Step 7: Commit Task 3**

```bash
git add crawler/sources/curated-2027-campus.mjs crawler/sources/verified-2027-campus.mjs tests/verified-sources.test.mjs
git commit -m "feat: add verified expanded campus sources"
```

### Task 4: Make source collection independent and add source-URL dedupe

**Files:**
- Modify: `crawler/run.mjs`
- Modify: `crawler/normalize.mjs`
- Modify: `tests/crawler-run.test.mjs`
- Modify: `tests/crawler-normalize.test.mjs`

**Interfaces:**
- `collectCandidates({ sourceAdapters? })` accepts `{ name, collect }[]` and returns `{ candidates, sourceErrors }`.
- `findDuplicate(existingJobs, candidate)` additionally matches `source_url` before the normalized key.
- Existing `runCrawler({ writer, candidates, sourceErrors })` output shape remains unchanged.

- [ ] **Step 1: Write the failing independent-source test**

```js
it("一个扩展来源失败时仍收集其他来源", async () => {
  const collected = await collectCandidates({
    sourceAdapters: [
      { name: "官方企业库", collect: async () => [{ company: { name: "已验证企业" }, job: { title: "研发" } }] },
      { name: "高校就业网", collect: async () => { throw new Error("timeout"); } },
    ],
  });
  expect(collected.candidates).toHaveLength(1);
  expect(collected.sourceErrors).toEqual(["高校就业网: timeout"]);
});
```

- [ ] **Step 2: Run the crawler test to verify it fails**

Run: `pnpm vitest run tests/crawler-run.test.mjs`

Expected: FAIL because `sourceAdapters` is not yet supported.

- [ ] **Step 3: Implement source adapter iteration**

```js
export async function collectCandidates({
  sourceAdapters = [
    { name: "已验证公开招聘来源", collect: verifiedCandidates },
    { name: "华中科技大学就业信息网", collect: discoverHustCandidates },
  ],
} = {}) {
  const candidates = [];
  const sourceErrors = [];
  for (const source of sourceAdapters) {
    try { candidates.push(...await source.collect()); }
    catch (error) { sourceErrors.push(`${source.name}: ${error instanceof Error ? error.message : String(error)}`); }
  }
  return { candidates, sourceErrors };
}
```

- [ ] **Step 4: Add a failing source URL duplicate test**

```js
it("相同来源公告链接视为同一岗位", () => {
  const candidate = normalizeCandidate({ companyName: "示例医疗", title: "研发", sourceName: "高校就业网", sourceUrl: "https://jobs.example/123" });
  const existing = { id: "source-url-match", official_url: null, source_name: "高校就业网", source_job_id: null, source_url: "https://jobs.example/123", dedupe_key: "other" };
  expect(findDuplicate([existing], candidate)).toBe(existing);
});
```

- [ ] **Step 5: Run the normalizer test to verify it fails**

Run: `pnpm vitest run tests/crawler-normalize.test.mjs`

Expected: FAIL because `findDuplicate` does not compare `source_url`.

- [ ] **Step 6: Implement source URL duplicate comparison**

```js
const sourceUrlMatch = existingJobs.find((existing) => existing.source_url === job.sourceUrl);
if (sourceUrlMatch) return sourceUrlMatch;
```

Place this after source ID matching and before `dedupe_key` matching.

- [ ] **Step 7: Run focused tests to verify green**

Run: `pnpm vitest run tests/crawler-run.test.mjs tests/crawler-normalize.test.mjs`

Expected: PASS.

- [ ] **Step 8: Commit Task 4**

```bash
git add crawler/run.mjs crawler/normalize.mjs tests/crawler-run.test.mjs tests/crawler-normalize.test.mjs
git commit -m "feat: isolate sources and dedupe announcements"
```

### Task 5: Document, load data, deploy and verify

**Files:**
- Modify: `README.md`
- No production code file is required for filters because the Dashboard derives filter options from stored jobs and already aggregates by company.

**Interfaces:**
- Consumes the expanded `verifiedCandidates()` and `collectCandidates()` from Tasks 3–4.
- Produces newly stored companies/jobs in Supabase, a crawl log and a published static dashboard.

- [ ] **Step 1: Write a failing README assertion**

```js
it("README 说明官方优先、扩展行业和不可编造原则", async () => {
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
  expect(readme).toMatch(/消费健康|美妆/);
  expect(readme).toMatch(/官方/);
  expect(readme).toMatch(/不.*编造/);
});
```

Add it to `tests/project-security.test.mjs` using its existing `readFile` import pattern.

- [ ] **Step 2: Run the README assertion to verify it fails**

Run: `pnpm vitest run tests/project-security.test.mjs`

Expected: FAIL because the README lacks the expanded-scope documentation.

- [ ] **Step 3: Update README source and data policy**

Add a concise section titled `覆盖范围与来源` stating: healthcare, consumer-health/beauty, pharmacy retail and health-tech business units are included; official careers pages are preferred; university notices and named platforms supplement discovery; unverified fields are `未知`; no search-result page is stored as a job link.

- [ ] **Step 4: Run the README assertion to verify it passes**

Run: `pnpm vitest run tests/project-security.test.mjs`

Expected: PASS.

- [ ] **Step 5: Run the complete test suite**

Run: `pnpm test`

Expected: all test files pass with zero failures.

- [ ] **Step 6: Run static build using non-public local secrets only**

Run: `pnpm build`

Expected: exit code 0 and generated `out/` directory; never print environment variable values.

- [ ] **Step 7: Write verified candidates to Supabase**

Run: `pnpm crawl`

Expected: JSON run summary with discovered records, new job/company counts, and either `success` or `partial_failure` accompanied only by source-specific errors. Do not suppress a partial failure.

- [ ] **Step 8: Commit and publish**

```bash
git add README.md tests/project-security.test.mjs
git commit -m "docs: describe expanded recruitment coverage"
git push origin main
```

Trigger the GitHub Actions deployment using the existing repository secrets. Do not add, print or alter secret values.

- [ ] **Step 9: Verify the deployed dashboard in a browser**

Open `https://1413582538-netizen.github.io/medical-job-radar-2027/` and verify:

1. The public page loads without localhost.
2. The table includes only one row per company.
3. Industry, job direction, city, company type and published-date filters are present.
4. Newly verified companies or their current official recruitment entries are shown when 2027 postings are publicly available.
5. Every visible `查看岗位` link points to an official careers page or the named credible announcement source.

- [ ] **Step 10: Commit Task 5 only if source/docs changes remain**

```bash
git status --short
```

Expected: clean working tree after the documentation commit and publish.
