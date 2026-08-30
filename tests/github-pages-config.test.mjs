import { expect, it } from "vitest";

import { createNextConfig } from "../next.config.mjs";

it("为 GitHub Pages 输出仓库路径下的静态站点", () => {
  expect(
    createNextConfig({
      githubActions: true,
      repository: "1413582538-netizen/medical-job-radar",
    }),
  ).toMatchObject({
    output: "export",
    basePath: "/medical-job-radar",
    assetPrefix: "/medical-job-radar/",
  });
});

it("本地构建不附加 GitHub Pages 的仓库路径", () => {
  expect(createNextConfig({ githubActions: false, repository: null })).toMatchObject({
    output: "export",
    basePath: "",
    assetPrefix: "",
  });
});
