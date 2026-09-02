import { normalizeCandidate } from "../normalize.mjs";
import { has2027CampusSignal, isTrustedSourceUrl } from "../source-validation.mjs";

const CURATED_CANDIDATES = [
  {
    companyName: "GE医疗中国",
    companyIndustry: "医疗器械 / 医学影像 / 医疗AI",
    companyType: "外企",
    companyLocation: "北京",
    sourceName: "GE HealthCare 招聘官网",
    sourceUrl: "https://gehc.wd5.myworkdayjobs.com/en-US/GEHC_ExternalSite/job/Edison-Engineering-Development-Program-Early-Identification_R4040830-2",
    sourceJobId: "R4040830-2",
    officialUrl: "https://gehc.wd5.myworkdayjobs.com/en-US/GEHC_ExternalSite/job/Edison-Engineering-Development-Program-Early-Identification_R4040830-2",
    title: "2027届 Edison Engineering Development Program 研发实习生",
    jobDirection: "研发",
    industry: "医疗器械 / 医学影像 / 医疗AI",
    location: "北京",
    status: "active",
    allowedDomains: ["myworkdayjobs.com"],
  },
  {
    companyName: "联邦制药",
    companyIndustry: "生物医药 / 制药",
    sourceName: "智联招聘",
    sourceUrl: "https://www.zhaopin.com/jobdetail/CC290231730J40873470307.htm",
    sourceJobId: "J10584",
    title: "药物警戒专员（PVP方向）（2027届）",
    jobDirection: "医学临床、注册法规",
    industry: "生物医药 / 制药",
    location: "广州",
    status: "active",
    allowedDomains: ["zhaopin.com"],
  },
  {
    companyName: "巨鲨医疗",
    companyIndustry: "医疗器械 / 医学影像",
    companyLocation: "南京",
    sourceName: "中国石油大学（北京）就业信息网",
    sourceUrl: "https://career.cup.edu.cn/campus/view/id/460212",
    sourceJobId: "460212-rd",
    title: "研发工程师（2027届）",
    jobDirection: "研发",
    industry: "医疗器械 / 医学影像",
    location: "南京",
    status: "active",
    allowedDomains: ["career.cup.edu.cn"],
  },
  {
    companyName: "巨鲨医疗",
    companyIndustry: "医疗器械 / 医学影像",
    companyLocation: "南京",
    sourceName: "中国石油大学（北京）就业信息网",
    sourceUrl: "https://career.cup.edu.cn/campus/view/id/460212",
    sourceJobId: "460212-mt",
    title: "管理培训生（2027届）",
    jobDirection: "市场、项目管理",
    industry: "医疗器械 / 医学影像",
    location: "南京",
    status: "active",
    allowedDomains: ["career.cup.edu.cn"],
  },
  {
    companyName: "阿里健康",
    companyIndustry: "数字医疗 / 医药零售",
    sourceName: "得早学就创",
    sourceUrl: "https://www.deizao.net/m/index/gonggaoxq/nwid/16299",
    title: "2027届实习生招聘（研发、算法、数据、市场运营）",
    jobDirection: "研发、市场、项目管理",
    industry: "数字医疗 / 医药零售",
    location: "杭州",
    allowedDomains: ["deizao.net"],
  },
  {
    companyName: "科大讯飞医疗",
    companyIndustry: "医疗AI / 数字医疗",
    companyLocation: "合肥",
    sourceName: "北京体育大学就业信息网",
    sourceUrl: "https://jy.bsu.edu.cn/front/zpxx.jspa?tid=2089619655797788673",
    title: "2027届秋季校园招聘（AI医学研究员、项目经理-医疗方向）",
    jobDirection: "研发、医学临床、市场、项目管理",
    industry: "医疗AI / 数字医疗",
    location: "合肥",
    publishedAt: "2026-08-23T00:00:00+08:00",
    allowedDomains: ["jy.bsu.edu.cn"],
  },
];

export function curated2027CampusCandidates() {
  return CURATED_CANDIDATES
    .filter((candidate) => has2027CampusSignal(candidate.title))
    .filter((candidate) => isTrustedSourceUrl(candidate.sourceUrl, candidate.allowedDomains))
    .map((candidate) => {
      const normalizedInput = { ...candidate };
      delete normalizedInput.allowedDomains;
      return normalizeCandidate(normalizedInput);
    });
}
