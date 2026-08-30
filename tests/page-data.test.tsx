import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const loadDashboardData = vi.hoisted(() => vi.fn());

vi.mock("@/lib/dashboard-jobs", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/dashboard-jobs")>()),
  loadDashboardData,
}));

import Home from "@/app/page";

describe("Dashboard 首页数据加载", () => {
  beforeEach(() => {
    loadDashboardData.mockResolvedValue({
      jobs: [],
      weekNewCount: 2,
      error: null,
    });
  });

  it("将服务端读取到的本周新增数量传给 DashboardShell", async () => {
    render(await Home());

    expect(screen.getByText("本周新增 2 条")).toBeInTheDocument();
  });

  it("在读取失败时展示不含底层错误细节的状态提示", async () => {
    loadDashboardData.mockResolvedValueOnce({
      jobs: [],
      weekNewCount: 0,
      error: "岗位数据暂不可用",
    });

    render(await Home());

    expect(screen.getByRole("status")).toHaveTextContent("岗位数据暂不可用");
  });
});
