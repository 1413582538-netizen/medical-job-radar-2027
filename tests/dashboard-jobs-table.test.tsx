import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DashboardJobsTable } from "@/components/dashboard-jobs-table";
import type { DashboardJob } from "@/lib/dashboard-jobs";

const navigation = vi.hoisted(() => ({
  replace: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ replace: navigation.replace }),
  useSearchParams: () => navigation.searchParams,
}));

const jobs: DashboardJob[] = [
  {
    id: "job-1", companyName: "华东医疗器械", companyType: "民营", industry: "医疗器械", companySize: "1000-5000人", location: "上海", publishedAt: "2026-08-27T02:00:00.000Z", firstDiscoveredAt: "2026-08-28T02:00:00.000Z", title: "临床专员", jobDirection: "临床", companyDescription: "专注诊疗设备研发。", url: "https://careers.example.com/clinical",
  },
  {
    id: "job-2", companyName: "北方生物", companyType: "国企", industry: "生物医药", companySize: null, location: "北京", publishedAt: "2026-07-02T02:00:00.000Z", firstDiscoveredAt: "2026-08-20T02:00:00.000Z", title: "注册专员", jobDirection: "注册", companyDescription: null, url: "https://careers.example.com/registration",
  },
];

describe("Dashboard 岗位表格", () => {
  afterEach(cleanup);

  it("以九列展示岗位、未知值和官方招聘链接", () => {
    render(<DashboardJobsTable jobs={[jobs[1]]} />);

    expect(screen.getAllByRole("columnheader")).toHaveLength(9);
    expect(screen.getByRole("cell", { name: "北方生物" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "国企" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "生物医药" })).toBeInTheDocument();
    expect(screen.getAllByRole("cell", { name: "未知" })).toHaveLength(2);
    expect(screen.getByRole("cell", { name: "北京" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "2026-07-02" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "注册专员（注册）" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看岗位" })).toHaveAttribute("href", "https://careers.example.com/registration");
  });

  it("按行业、岗位方向、城市和公司性质筛选岗位", () => {
    render(<DashboardJobsTable jobs={jobs} />);

    fireEvent.change(screen.getByLabelText("行业"), { target: { value: "医疗器械" } });
    expect(screen.getByText("华东医疗器械")).toBeInTheDocument();
    expect(screen.queryByText("北方生物")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("行业"), { target: { value: "" } });

    fireEvent.change(screen.getByLabelText("岗位方向"), { target: { value: "注册" } });
    expect(screen.getByText("北方生物")).toBeInTheDocument();
    expect(screen.queryByText("华东医疗器械")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("岗位方向"), { target: { value: "" } });

    fireEvent.change(screen.getByLabelText("城市"), { target: { value: "上海" } });
    expect(screen.getByText("华东医疗器械")).toBeInTheDocument();
    expect(screen.queryByText("北方生物")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("城市"), { target: { value: "" } });

    fireEvent.change(screen.getByLabelText("公司性质"), { target: { value: "国企" } });
    expect(screen.getByText("北方生物")).toBeInTheDocument();
    expect(screen.queryByText("华东医疗器械")).not.toBeInTheDocument();
  });

  it("按发布时间范围筛选岗位", () => {
    render(<DashboardJobsTable jobs={jobs} />);

    fireEvent.change(screen.getByLabelText("发布时间（起）"), { target: { value: "2026-08-01" } });
    fireEvent.change(screen.getByLabelText("发布时间（止）"), { target: { value: "2026-08-31" } });

    expect(screen.getByText("华东医疗器械")).toBeInTheDocument();
    expect(screen.queryByText("北方生物")).not.toBeInTheDocument();
  });

  it("将同一公司的多个岗位合并为一行，并优先显示官方链接", () => {
    render(<DashboardJobsTable jobs={[
      jobs[0],
      {
        ...jobs[0],
        id: "job-3",
        title: "产品经理",
        jobDirection: "产品",
        location: "深圳",
        publishedAt: "2026-08-28T02:00:00.000Z",
        firstDiscoveredAt: "2026-08-29T02:00:00.000Z",
        officialUrl: "https://careers.example.com/product",
        url: "https://careers.example.com/product",
      },
    ]} />);

    expect(screen.getAllByRole("row")).toHaveLength(2);
    expect(screen.getByText("临床专员（临床）；产品经理（产品）")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "上海、深圳" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看岗位" })).toHaveAttribute("href", "https://careers.example.com/product");
  });
});
