# 医疗行业 2027 秋招岗位情报

个人医疗健康行业校招岗位信息雷达。

## 开始使用

```bash
pnpm install
cp .env.example .env.local
pnpm dev
pnpm lint
pnpm test
```

本地启动后打开 `http://127.0.0.1:3000`。页面只读取公开的 Supabase 匿名 key；不会将写库密钥发送到浏览器。

## 数据库初始化

1. 在 Supabase 控制台创建一个新项目。
2. 打开 SQL Editor，粘贴并执行 `supabase/migrations/20260829000000_initial_schema.sql`，或者使用 Supabase CLI 将这份 migration 推送到项目。
3. 将项目的 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 写入 `.env.local`。
4. 若要本地执行采集，再将 `SUPABASE_SERVICE_ROLE_KEY` 写入 `.env.local`。它只能供本机采集命令使用，不能提交到 Git，也不能填入 `NEXT_PUBLIC_*` 变量。

## 采集与去重

```bash
pnpm crawl
```

采集器会读取已验证的公开招聘页面，并实时检索华中科技大学就业网中的医疗器械、生物医药、IVD、数字医疗和制药关键词。只保存发布日期在最近 30 天且正文能确认属于目标行业的公告。重复判定顺序为官方链接、来源岗位 ID、来源公告链接、公司/岗位/地点；同一公告再次发现时不会新增岗位。

## 启用每周自动采集

将项目推送至 GitHub 后，在仓库 **Settings → Secrets and variables → Actions** 添加以下三个 Repository secrets（只从本机 `.env.local` 复制，不要发送到聊天）：

| Secret | 对应本机变量 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `NEXT_PUBLIC_SUPABASE_URL` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_SERVICE_ROLE_KEY` |

工作流文件为 `.github/workflows/weekly-crawl.yml`。它支持在 **Actions → Weekly medical job crawl → Run workflow** 手动运行，并会在每周六北京时间 10:00 自动运行。采集完成后，它会重新生成并发布 GitHub Pages 页面。

## 当前验证记录

日期：2026-08-30

- 本地实时采集：发现 10 条候选、0 条重复新增，状态 `success`。
- Supabase：12 条去重后的岗位记录。
- `pnpm test`：通过，13 个测试文件、30 个测试。
- `pnpm build`：通过。
- `.env`、`.env.local`、`.env.*.local` 已加入忽略列表，`.env.example` 保留为可提交模板。

## 部署

项目通过 GitHub Pages 发布为稳定网址。首次发布时，在仓库 **Settings → Pages** 将 Source 选择为 **GitHub Actions**；推送 `main` 分支或在 Actions 手动执行发布工作流即可部署。采集用的 `SUPABASE_SERVICE_ROLE_KEY` 仅保存为 GitHub Actions secret，绝不写入网页或仓库文件。
