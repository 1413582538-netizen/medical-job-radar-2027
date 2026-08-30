import { expect, it } from "vitest";

import tailwindConfig from "../tailwind.config.mjs";

it("扫描应用与组件目录以生成 Dashboard 所需的 Tailwind 样式", () => {
  expect(tailwindConfig.content).toContain("./app/**/*.{js,ts,jsx,tsx,mdx}");
  expect(tailwindConfig.content).toContain("./components/**/*.{js,ts,jsx,tsx,mdx}");
});
