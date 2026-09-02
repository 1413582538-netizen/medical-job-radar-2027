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

采集器会读取经链接域名校验的官方招聘页、公开招聘平台和高校就业网来源，并实时检索华中科技大学就业网中的医疗器械、生物医药、IVD、数字医疗和制药关键词。企业目录覆盖医疗器械、生物医药、IVD、医疗 AI、消费健康与大型科技集团医疗业务；其中包括麦科田、GE 医疗、联邦制药、雅诗兰黛、华大智造、巨鲨医疗、字节跳动医疗健康、阿里健康、华润医疗健康和科大讯飞医疗。只有能够确认“2027届”信号、目标岗位方向和可打开来源链接的岗位才会入库；无法确认的字段保持“未知”。

重复判定顺序为官方链接、来源岗位 ID、来源公告链接、公司/岗位/地点；同一公告再次发现时不会新增岗位。页面仍按公司合并为一行，并在“招聘岗位”列展示该公司已收录的多个职位。

## 启用每周自动采集

将项目推送至 GitHub 后，在仓库 **Settings → Secrets and variables → Actions** 添加以下三个 Repository secrets（只从本机 `.env.local` 复制，不要发送到聊天）：

| Secret | 对应本机变量 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `NEXT_PUBLIC_SUPABASE_URL` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_SERVICE_ROLE_KEY` |

工作流文件为 `.github/workflows/weekly-crawl.yml`。它支持在 **Actions → Weekly medical job crawl → Run workflow** 手动运行，并会在每周六北京时间 10:00 自动运行。采集完成后，它会重新生成并发布 GitHub Pages 页面。

## 当前验证记录

每次更新前均运行测试与构建验证。岗位数据不以此处的示例数字为准，请以 Dashboard 页面和最近一次采集日志为准。

## 部署

项目通过 GitHub Pages 发布为稳定网址。首次发布时，在仓库 **Settings → Pages** 将 Source 选择为 **GitHub Actions**；推送 `main` 分支或在 Actions 手动执行发布工作流即可部署。采集用的 `SUPABASE_SERVICE_ROLE_KEY` 仅保存为 GitHub Actions secret，绝不写入网页或仓库文件。
