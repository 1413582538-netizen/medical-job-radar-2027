import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = resolve("supabase/migrations/20260829000000_initial_schema.sql");

async function migration() {
  return readFile(migrationPath, "utf8");
}

describe("初始 Supabase Schema", () => {
  it("创建三张核心表和 jobs 到 companies 的外键", async () => {
    const sql = await migration();
    expect(sql).toMatch(/create table public\.companies/i);
    expect(sql).toMatch(/create table public\.jobs/i);
    expect(sql).toMatch(/create table public\.crawl_logs/i);
    expect(sql).toMatch(/company_id uuid not null references public\.companies\(id\) on delete restrict/i);
  });

  it("包含岗位去重字段、筛选索引与 RLS", async () => {
    const sql = await migration();
    expect(sql).toMatch(/official_url text/i);
    expect(sql).toMatch(/source_job_id text/i);
    expect(sql).toMatch(/source_urls jsonb not null default '\[\]'::jsonb/i);
    expect(sql).toMatch(/dedupe_key text not null/i);
    expect(sql).toMatch(/create unique index(?: if not exists)? jobs_official_url_unique/i);
    expect(sql).toMatch(/create unique index(?: if not exists)? jobs_source_job_id_unique/i);
    expect(sql).toMatch(/create index(?: if not exists)? jobs_dedupe_key_index/i);
    expect(sql).toMatch(/create index(?: if not exists)? jobs_first_discovered_at_index/i);
    expect(sql).toMatch(/create index(?: if not exists)? jobs_published_at_index/i);
    expect(sql).toMatch(/create index(?: if not exists)? jobs_job_direction_index/i);
    expect(sql).toMatch(/create index(?: if not exists)? jobs_industry_index/i);
    expect(sql).toMatch(/create index(?: if not exists)? jobs_location_index/i);
    expect(sql).toMatch(/enable row level security/i);
    expect(sql).toMatch(/on public\.companies for select to anon/i);
    expect(sql).toMatch(/on public\.jobs for select to anon/i);
  });

  it("不向匿名角色暴露 crawl_logs", async () => {
    const sql = await migration();
    expect(sql).not.toMatch(/on public\.crawl_logs for select to anon/i);
  });
});
