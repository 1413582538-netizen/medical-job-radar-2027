import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, it } from "vitest";

it("将 Next ESLint 配置要求的 React Hooks 插件声明为直接依赖", async () => {
  const packageJson = JSON.parse(await readFile(resolve("package.json"), "utf8"));

  expect(packageJson.devDependencies["eslint-plugin-react-hooks"]).toBeDefined();
  expect(packageJson.devDependencies["@next/eslint-plugin-next"]).toBeDefined();
});
