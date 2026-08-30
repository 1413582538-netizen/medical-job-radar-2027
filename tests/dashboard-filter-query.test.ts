import { describe, expect, it } from "vitest";

import {
  dashboardFilterHref,
  filtersFromSearchParams,
} from "@/lib/dashboard-filter-query";

describe("岗位筛选网址", () => {
  it("从网址恢复五类筛选条件", () => {
    const filters = filtersFromSearchParams(
      new URLSearchParams("industry=IVD&jobDirection=%E7%A0%94%E5%8F%91&location=%E6%B7%B1%E5%9C%B3&companyType=%E4%B8%8A%E5%B8%82%E5%85%AC%E5%8F%B8&publishedFrom=2026-08-01&publishedTo=2026-08-31"),
    );

    expect(filters).toEqual({
      industry: "IVD",
      jobDirection: "研发",
      location: "深圳",
      companyType: "上市公司",
      publishedFrom: "2026-08-01",
      publishedTo: "2026-08-31",
    });
  });

  it("更新筛选条件时移除已清空的参数，并保留无关参数", () => {
    expect(
      dashboardFilterHref("/", new URLSearchParams("view=table&industry=旧值"), {
        industry: "医疗器械",
        location: undefined,
      }),
    ).toBe("/?view=table&industry=%E5%8C%BB%E7%96%97%E5%99%A8%E6%A2%B0");
  });
});
