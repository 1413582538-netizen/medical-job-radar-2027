import { normalizeCandidate } from "../normalize.mjs";

const NEW_INDUSTRY_SOURCE = "https://job.hust.edu.cn/zpinfo1/2407428.htm";
const NEW_INDUSTRY = {
  companyName: "深圳市新产业生物医学工程股份有限公司",
  companyIndustry: "医疗器械 / IVD",
  companyType: "上市公司",
  companySize: "2700+",
  companyLocation: "深圳",
  companyDescription: "从事医疗器械体外诊断产品研发、生产、销售及服务。",
  careersUrl: null,
  sourceName: "华中科技大学就业信息网",
  sourceUrl: NEW_INDUSTRY_SOURCE,
  publishedAt: "2026-08-24T00:00:00+08:00",
  location: "深圳",
  industry: "医疗器械 / IVD",
};

const RAW_CANDIDATES = [
  { ...NEW_INDUSTRY, title: "电子研发工程师", jobDirection: "研发" },
  { ...NEW_INDUSTRY, title: "软件研发工程师", jobDirection: "研发" },
  { ...NEW_INDUSTRY, title: "数据分析工程师（AI方向）", jobDirection: "研发" },
  { ...NEW_INDUSTRY, title: "试剂研发工程师", jobDirection: "研发" },
  { ...NEW_INDUSTRY, title: "临床研究工程师", jobDirection: "医学临床" },
  { ...NEW_INDUSTRY, title: "产品经理（驻外）", jobDirection: "产品", location: "全国多地" },
  {
    companyName: "上海联影医疗科技股份有限公司",
    companyIndustry: "医疗器械 / 医学影像 / 医疗AI",
    companyType: "上市公司",
    companyLocation: "上海",
    sourceName: "牛客网",
    sourceUrl: "https://www.nowcoder.com/jobs/detail/459860",
    sourceJobId: "459860",
    title: "机械工程师",
    jobDirection: "研发",
    industry: "医疗器械 / 医学影像",
    location: "武汉",
    status: "active",
  },
  {
    companyName: "深圳开立生物医疗科技股份有限公司",
    companyIndustry: "医疗器械 / 医学影像",
    companyType: "上市公司",
    companySize: "3000+",
    companyLocation: "深圳",
    companyDescription: "从事医疗设备自主研发和制造，覆盖超声医学影像、内镜诊疗等领域。",
    sourceName: "中公教育",
    sourceUrl: "https://www.eoffcn.com/kszx/detail/2187853.html",
    title: "2027届校园招聘",
    jobDirection: "研发、医学临床、产品等",
    industry: "医疗器械 / 医学影像",
    location: "深圳、武汉",
    status: "active",
  },
  {
    companyName: "邯郸制药股份有限公司",
    companyIndustry: "生物医药 / 制药",
    companyType: null,
    companyLocation: "邯郸",
    companyDescription: "集科研、生产、营销为一体的中成药生产企业。",
    sourceName: "华中科技大学就业信息网",
    sourceUrl: "https://job.hust.edu.cn/zpinfo1/2409266.htm",
    title: "2027届秋季校园招聘",
    jobDirection: "研发、市场、项目管理等",
    industry: "生物医药 / 制药",
    location: null,
    publishedAt: "2026-08-29T00:00:00+08:00",
    status: "active",
  },
];

export function verifiedCandidates() {
  return RAW_CANDIDATES.map(normalizeCandidate);
}
