import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const gitignorePath = resolve(".gitignore");

describe("项目密钥保护", () => {
  it("不会跟踪本地环境密钥文件", async () => {
    const gitignore = await readFile(gitignorePath, "utf8");
    expect(gitignore).toMatch(/^\.env\.local$/m);
    expect(gitignore).toMatch(/^\.env$/m);
    expect(gitignore).toMatch(/^out$/m);
  });

  it("不对已生成的静态发布文件重复执行源码检查", async () => {
    const lintConfig = await readFile(resolve("eslint.config.mjs"), "utf8");
    expect(lintConfig).toMatch(/"out\/\*\*"/);
  });
});
