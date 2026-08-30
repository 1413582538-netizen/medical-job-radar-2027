import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const gitignorePath = resolve(".gitignore");

describe("项目密钥保护", () => {
  it("不会跟踪本地环境密钥文件", async () => {
    const gitignore = await readFile(gitignorePath, "utf8");
    expect(gitignore).toMatch(/^\.env\.local$/m);
    expect(gitignore).toMatch(/^\.env$/m);
  });
});
