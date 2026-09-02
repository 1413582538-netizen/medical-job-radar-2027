import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, it } from "vitest";

it("不会把隔离工作目录中的测试重复纳入主分支测试", async () => {
  const config = await readFile(resolve("vitest.config.ts"), "utf8");

  expect(config).toMatch(/["']\.worktrees\/\*\*["']/);
  expect(config).toMatch(/["']node_modules\/\*\*["']/);
});
