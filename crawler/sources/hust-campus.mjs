import { normalizeCandidate } from "../normalize.mjs";

const HUST_BASE_URL = "https://job.hust.edu.cn";

function textFromHtml(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function attrValue(value) {
  return value.replace(/&quot;/gi, '"').replace(/&amp;/gi, "&").trim();
}

function companyNameFromListingTitle(title) {
  const beforeRecruitment = title
    .split(/20\s*27\s*(?:届)?(?:秋季)?(?:校园)?(?:招聘|校招)|2027秋招|2027校园招聘/i)[0]
    .replace(/^[—\-｜|\s]+|[—\-｜|:：\s]+$/g, "")
    .trim();
  if (!beforeRecruitment || !/(公司|集团|医疗|制药|生物|科技|药业|研究院)/.test(beforeRecruitment)) return null;
  return beforeRecruitment;
}

function classifyIndustry(text) {
  if (/IVD|体外诊断|分子诊断|医学检验/i.test(text)) return "IVD / 体外诊断";
  if (/医疗AI|数字医疗|智慧医疗|医疗大模型|医疗数据/i.test(text)) return "医疗AI / 数字医疗";
  if (/医疗器械|医疗设备|医学影像|医疗机器人|医疗电子|人工耳蜗|神经调控/i.test(text)) return "医疗器械";
  if (/生物医药|生物制药|创新药|制药|中成药|CRO|CDMO|生命科学/i.test(text)) return "生物医药 / 制药";
  return null;
}

function jobDirectionFromText(text) {
  const labels = [];
  if (/产品经理|产品工程师|产品专员|产品市场/i.test(text)) labels.push("产品");
  if (/注册工程师|注册专员|法规|Regulatory Affairs/i.test(text)) labels.push("注册法规");
  if (/研发工程师|研发方向|技术研发|研发管培|研发(?:、|，|。|\s|$)/i.test(text)) labels.push("研发");
  if (/医学事务|医学专员|临床研究|临床运营|临床项目|临床研究工程师/i.test(text)) labels.push("医学临床");
  if (/市场|项目管理|项目经理/i.test(text)) labels.push("市场、项目管理");
  return labels.join("、") || "其他";
}

function publishedAtFromText(text) {
  const match = text.match(/发布时间\s*[：:]?\s*(20\d{2})[-年/.](\d{1,2})[-月/.](\d{1,2})/);
  if (!match) return null;
  const [, year, month, day] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T00:00:00+08:00`;
}

function isWithinThirtyDays(publishedAt, now) {
  if (!publishedAt) return false;
  const delta = now.getTime() - new Date(publishedAt).getTime();
  return delta >= 0 && delta <= 30 * 86_400_000;
}

export function parseHustListing(html) {
  const matches = [];
  const anchorPattern = /<a\s+[^>]*href=["']([^"']*\/zpinfo1\/(\d+)\.htm)["'][^>]*title=["']([^"']+)["'][^>]*>/gi;
  for (const match of html.matchAll(anchorPattern)) {
    matches.push({
      sourceUrl: new URL(attrValue(match[1]), HUST_BASE_URL).toString(),
      sourceJobId: match[2],
      listingTitle: attrValue(match[3]),
    });
  }
  return matches;
}

export function parseHustDetail(html, listing, now = new Date()) {
  const text = textFromHtml(html);
  const publishedAt = publishedAtFromText(text);
  const companyName = companyNameFromListingTitle(listing.listingTitle);
  const industry = classifyIndustry(text);
  if (!companyName || !industry || !isWithinThirtyDays(publishedAt, now)) return null;

  return normalizeCandidate({
    companyName,
    companyIndustry: industry,
    title: "2027届校园招聘",
    jobDirection: jobDirectionFromText(text),
    industry,
    sourceName: "华中科技大学就业信息网",
    sourceUrl: listing.sourceUrl,
    sourceJobId: listing.sourceJobId,
    publishedAt,
    status: "unknown",
  });
}

export async function discoverHustCandidates({
  fetchImpl = fetch,
  keywords = ["医疗器械", "生物医药", "IVD", "体外诊断", "医疗AI", "数字医疗", "制药", "生命科学"],
  maxDetailPages = 24,
  now = new Date(),
} = {}) {
  const listings = new Map();
  for (const keyword of keywords) {
    const searchUrl = new URL("/searchJob.do", HUST_BASE_URL);
    searchUrl.search = new URLSearchParams({ type: "2", fbsj: "", q: keyword }).toString();
    const response = await fetchImpl(searchUrl);
    if (!response.ok) throw new Error(`华中科技大学就业网搜索失败 (${response.status})`);
    for (const listing of parseHustListing(await response.text())) {
      if (/2027\s*(?:届)?(?:秋季)?(?:校园)?(?:招聘|校招)|2027秋招/i.test(listing.listingTitle)) {
        listings.set(listing.sourceUrl, listing);
      }
    }
  }

  const candidates = [];
  for (const listing of [...listings.values()].slice(0, maxDetailPages)) {
    const response = await fetchImpl(listing.sourceUrl);
    if (!response.ok) continue;
    const candidate = parseHustDetail(await response.text(), listing, now);
    if (candidate) candidates.push(candidate);
  }
  return candidates;
}
