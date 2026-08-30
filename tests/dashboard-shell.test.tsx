import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("Dashboard 首页", () => {
  it("展示产品定位、当前无岗位状态和九列表头", async () => {
    render(await Home());

    expect(
      screen.getByRole("heading", { name: "医疗行业 2027 秋招岗位情报" }),
    ).toBeInTheDocument();
    expect(screen.getByText("本周新增 0 条")).toBeInTheDocument();
    expect(screen.getByText("暂无已收录岗位")).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(9);
    expect(
      screen.getByRole("columnheader", { name: "公司名称" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "招聘链接" }),
    ).toBeInTheDocument();
  });
});
