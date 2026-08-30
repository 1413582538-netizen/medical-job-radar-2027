import { describe, expect, it } from "vitest";

import {
  discoverHustCandidates,
  parseHustDetail,
  parseHustListing,
} from "../crawler/sources/hust-campus.mjs";

const listingHtml = `
  <a href="/zpinfo1/2409266.htm" title="邯郸制药股份有限公司2027届秋季校园招聘简章">邯郸制药股份有限公司2027届秋季校园招聘简章</a>
  <a href="/zpinfo1/2409200.htm" title="普通制造企业2027届校园招聘">普通制造企业2027届校园招聘</a>
`;

const medicalDetailHtml = `
  <h4>邯郸制药股份有限公司2027届秋季校园招聘简章</h4>
  <p>发布时间：2026-08-29</p>
  <p>邯郸制药股份有限公司是集科研、生产、营销为一体的现代化中成药生产企业。</p>
  <p>招聘岗位涵盖研发、市场、项目管理。</p>
`;

describe("华中科技大学就业网实时来源", () => {
  it("从列表页提取可公开访问的公告链接和岗位 ID", () => {
    expect(parseHustListing(listingHtml)).toEqual([
      {
        sourceUrl: "https://job.hust.edu.cn/zpinfo1/2409266.htm",
        sourceJobId: "2409266",
        listingTitle: "邯郸制药股份有限公司2027届秋季校园招聘简章",
      },
      {
        sourceUrl: "https://job.hust.edu.cn/zpinfo1/2409200.htm",
        sourceJobId: "2409200",
        listingTitle: "普通制造企业2027届校园招聘",
      },
    ]);
  });

  it("只把近一个月且正文明确属于目标行业的公告转换为候选岗位", () => {
    expect(
      parseHustDetail(medicalDetailHtml, {
        sourceUrl: "https://job.hust.edu.cn/zpinfo1/2409266.htm",
        sourceJobId: "2409266",
        listingTitle: "邯郸制药股份有限公司2027届秋季校园招聘简章",
      }, new Date("2026-08-30T00:00:00+08:00")),
    ).toMatchObject({
      company: { name: "邯郸制药股份有限公司", industry: "生物医药 / 制药" },
      job: {
        title: "2027届校园招聘",
        jobDirection: "研发、市场、项目管理",
        publishedAt: "2026-08-29T00:00:00+08:00",
        sourceJobId: "2409266",
      },
    });
    expect(
      parseHustDetail(medicalDetailHtml.replace("2026-08-29", "2026-07-01"), {
        sourceUrl: "https://job.hust.edu.cn/zpinfo1/2409266.htm",
        sourceJobId: "2409266",
        listingTitle: "邯郸制药股份有限公司2027届秋季校园招聘简章",
      }, new Date("2026-08-30T00:00:00+08:00")),
    ).toBeNull();
  });

  it("实时发现时去重公告并跳过正文不含目标医疗行业的结果", async () => {
    const calls = [];
    const candidates = await discoverHustCandidates({
      keywords: ["制药", "医疗器械"],
      maxDetailPages: 3,
      now: new Date("2026-08-30T00:00:00+08:00"),
      fetchImpl: async (url) => {
        const value = String(url);
        calls.push(value);
        if (value.includes("searchJob.do")) return new Response(listingHtml);
        if (value.includes("2409266")) return new Response(medicalDetailHtml);
        return new Response("<p>发布时间：2026-08-29</p><p>普通制造企业招聘软件工程师。</p>");
      },
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0].company.name).toBe("邯郸制药股份有限公司");
    expect(calls.filter((url) => url.includes("2409266"))).toHaveLength(1);
  });
});
