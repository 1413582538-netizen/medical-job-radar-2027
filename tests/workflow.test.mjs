import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, it } from "vitest";

it("每周采集工作流在北京时间周六十点运行且可手动触发", async () => {
  const workflow = await readFile(resolve(".github/workflows/weekly-crawl.yml"), "utf8");

  expect(workflow).toMatch(/cron:\s*["']0 2 \* \* 6["']/);
  expect(workflow).toMatch(/workflow_dispatch:/);
  expect(workflow).toMatch(/node-version:\s*["']20["']/);
  expect(workflow).toMatch(/pnpm\/action-setup@v\d/);
  expect(workflow).not.toMatch(/corepack enable/);
  expect(workflow).toMatch(/pnpm install --frozen-lockfile/);
  expect(workflow).toMatch(/pnpm crawl/);
  expect(workflow).toMatch(/NEXT_PUBLIC_SUPABASE_URL:\s*\$\{\{ secrets\.NEXT_PUBLIC_SUPABASE_URL \}\}/);
  expect(workflow).toMatch(/SUPABASE_SERVICE_ROLE_KEY:\s*\$\{\{ secrets\.SUPABASE_SERVICE_ROLE_KEY \}\}/);
  expect(workflow).toMatch(/NEXT_PUBLIC_SUPABASE_ANON_KEY:\s*\$\{\{ secrets\.NEXT_PUBLIC_SUPABASE_ANON_KEY \}\}/);
  expect(workflow).toMatch(/actions\/configure-pages@v\d/);
  expect(workflow).toMatch(/actions\/upload-pages-artifact@v\d/);
  expect(workflow).toMatch(/actions\/deploy-pages@v\d/);
});

it("提交到主分支时发布静态 Dashboard", async () => {
  const workflow = await readFile(resolve(".github/workflows/deploy-pages.yml"), "utf8");

  expect(workflow).toMatch(/push:/);
  expect(workflow).toMatch(/main/);
  expect(workflow).toMatch(/pnpm\/action-setup@v\d/);
  expect(workflow).not.toMatch(/corepack enable/);
  expect(workflow).toMatch(/pnpm build/);
  expect(workflow).toMatch(/actions\/deploy-pages@v\d/);
});
