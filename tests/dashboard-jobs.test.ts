import { describe, expect, it } from "vitest";

import {
  countNewJobsThisShanghaiWeek,
  displayJobValue,
  loadDashboardData,
  filterDashboardJobs,
  toDashboardJobs,
} from "@/lib/dashboard-jobs";

describe("岗位展示数据", () => {
  it("将空的可选岗位字段显示为未知", () => {
    expect(displayJobValue(null)).toBe("未知");
    expect(displayJobValue("深圳")).toBe("深圳");
  });

  it("将 Supabase 岗位和公司记录转换为表格需要的展示数据，并按发现时间和发布时间倒序", () => {
    const jobs = toDashboardJobs([
      {
        id: "older",
        title: "注册专员",
        job_direction: "注册法规",
        industry: "医疗器械",
        location: "深圳",
        published_at: "2026-08-24T00:00:00.000Z",
        first_discovered_at: "2026-08-25T00:00:00.000Z",
        source_name: "官网",
        source_url: "https://source.example/older",
        official_url: null,
        status: "active",
        companies: {
          id: "company-older",
          name: "安康医疗",
          industry: "医疗器械",
          company_type: null,
          company_size: null,
          location: null,
          description: null,
        },
      },
      {
        id: "newer",
        title: "产品经理",
        job_direction: "产品",
        industry: null,
        location: null,
        published_at: "2026-08-24T00:00:00.000Z",
        first_discovered_at: "2026-08-26T00:00:00.000Z",
        source_name: "官网",
        source_url: "https://source.example/newer",
        official_url: "https://careers.example/newer",
        status: "active",
        companies: {
          id: "company-newer",
          name: "仁心生物",
          industry: "生物医药",
          company_type: "民企",
          company_size: "500 人",
          location: "上海",
          description: "专注创新药研发",
        },
      },
    ]);

    expect(jobs).toEqual([
      {
        id: "newer",
        companyName: "仁心生物",
        companyType: "民企",
        industry: "生物医药",
        companySize: "500 人",
        location: "上海",
        publishedAt: "2026-08-24T00:00:00.000Z",
        firstDiscoveredAt: "2026-08-26T00:00:00.000Z",
        title: "产品经理",
        jobDirection: "产品",
        companyDescription: "专注创新药研发",
        url: "https://careers.example/newer",
        officialUrl: "https://careers.example/newer",
      },
      {
        id: "older",
        companyName: "安康医疗",
        companyType: null,
        industry: "医疗器械",
        companySize: null,
        location: "深圳",
        publishedAt: "2026-08-24T00:00:00.000Z",
        firstDiscoveredAt: "2026-08-25T00:00:00.000Z",
        title: "注册专员",
        jobDirection: "注册法规",
        companyDescription: null,
        url: "https://source.example/older",
      },
    ]);
  });

  it("按行业、岗位方向、城市、公司性质和发布时间范围叠加筛选岗位", () => {
    const jobs = [
      {
        id: "matched",
        companyName: "仁心生物",
        companyType: "民企",
        industry: "生物医药",
        companySize: null,
        location: "上海",
        publishedAt: "2026-08-25T03:00:00.000Z",
        firstDiscoveredAt: "2026-08-25T03:00:00.000Z",
        title: "产品经理",
        jobDirection: "产品",
        companyDescription: null,
        url: "https://example.com/matched",
      },
      {
        id: "wrong-city",
        companyName: "安康医疗",
        companyType: "民企",
        industry: "生物医药",
        companySize: null,
        location: "深圳",
        publishedAt: "2026-08-25T03:00:00.000Z",
        firstDiscoveredAt: "2026-08-25T03:00:00.000Z",
        title: "产品经理",
        jobDirection: "产品",
        companyDescription: null,
        url: "https://example.com/wrong-city",
      },
      {
        id: "no-publish-date",
        companyName: "华夏医疗",
        companyType: "民企",
        industry: "生物医药",
        companySize: null,
        location: "上海",
        publishedAt: null,
        firstDiscoveredAt: "2026-08-25T03:00:00.000Z",
        title: "产品经理",
        jobDirection: "产品",
        companyDescription: null,
        url: "https://example.com/no-publish-date",
      },
    ];

    expect(
      filterDashboardJobs(jobs, {
        industry: "生物医药",
        jobDirection: "产品",
        location: "上海",
        companyType: "民企",
        publishedFrom: "2026-08-25",
        publishedTo: "2026-08-25",
      }).map((job) => job.id),
    ).toEqual(["matched"]);
  });

  it("按上海自然周统计首次发现的新增岗位，包含周一零点且不包含下周一零点", () => {
    const jobs = [
      { firstDiscoveredAt: "2026-08-23T15:59:59.999Z" },
      { firstDiscoveredAt: "2026-08-23T16:00:00.000Z" },
      { firstDiscoveredAt: "2026-08-30T15:59:59.999Z" },
      { firstDiscoveredAt: "2026-08-30T16:00:00.000Z" },
    ];

    expect(
      countNewJobsThisShanghaiWeek(jobs, new Date("2026-08-26T04:00:00.000Z")),
    ).toBe(2);
  });

  it("通过 Supabase REST 使用公开 anon key 读取未关闭岗位，并返回可展示数据", async () => {
    let request: Request | undefined;
    const fetchImpl: typeof fetch = async (input, init) => {
      request = new Request(input, init);
      return new Response(
        JSON.stringify([
          {
            id: "job-1",
            title: "临床专员",
            job_direction: "医学临床",
            industry: "医疗器械",
            location: "广州",
            published_at: "2026-08-25T03:00:00.000Z",
            first_discovered_at: "2026-08-25T03:00:00.000Z",
            source_name: "官网",
            source_url: "https://source.example/job-1",
            official_url: null,
            status: "active",
            companies: {
              id: "company-1",
              name: "安康医疗",
              industry: null,
              company_type: "外企",
              company_size: null,
              location: null,
              description: null,
            },
          },
        ]),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    };

    const data = await loadDashboardData({
      supabaseUrl: "https://project.supabase.co/",
      anonKey: "public-anon-key",
      fetchImpl,
      now: new Date("2026-08-26T04:00:00.000Z"),
    });

    expect(request?.url).toContain("/rest/v1/jobs?");
    expect(request?.url).toContain("status=neq.closed");
    expect(request?.url).toContain("order=first_discovered_at.desc%2Cpublished_at.desc");
    expect(request?.headers.get("apikey")).toBe("public-anon-key");
    expect(request?.headers.get("authorization")).toBe(
      "Bearer public-anon-key",
    );
    expect(data).toEqual({
      jobs: [
        expect.objectContaining({
          id: "job-1",
          companyName: "安康医疗",
          url: "https://source.example/job-1",
        }),
      ],
      weekNewCount: 1,
      error: null,
    });
  });
});
