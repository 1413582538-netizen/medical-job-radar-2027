import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, it } from "vitest";

it("将依赖网址筛选参数的岗位表格放在 Suspense 边界内", async () => {
  const shell = await readFile(resolve("components/dashboard-shell.tsx"), "utf8");

  expect(shell).toMatch(/import React, \{ Suspense \} from "react"/);
  expect(shell).toMatch(/<Suspense[\s\S]*?<DashboardJobsTable jobs=\{jobs\} \/>[\s\S]*?<\/Suspense>/);
});
