function enterprise({
  name,
  aliases,
  industry,
  officialCareersUrl = null,
  allowedDomains = [],
}) {
  return Object.freeze({
    name,
    aliases: Object.freeze(aliases),
    industry,
    officialCareersUrl,
    allowedDomains: Object.freeze(allowedDomains),
  });
}

export const ENTERPRISE_CATALOG = Object.freeze([
  enterprise({
    name: "深圳麦科田生物医疗技术股份有限公司",
    aliases: ["麦科田", "Medcaptain"],
    industry: "医疗器械",
    officialCareersUrl: "https://www.medcaptain.com/",
    allowedDomains: ["medcaptain.com"],
  }),
  enterprise({
    name: "GE医疗中国",
    aliases: ["GE HealthCare", "GE医疗"],
    industry: "医疗器械 / 医疗AI",
    officialCareersUrl: "https://career.gehealthcare.cn/",
    allowedDomains: ["gehealthcare.cn", "gehc.wd5.myworkdayjobs.com"],
  }),
  enterprise({
    name: "联邦制药",
    aliases: ["联邦制药集团", "The United Laboratories"],
    industry: "生物医药 / 制药",
  }),
  enterprise({
    name: "雅诗兰黛中国",
    aliases: ["雅诗兰黛", "Estée Lauder", "Estee Lauder"],
    industry: "消费健康 / 美妆",
    officialCareersUrl: "https://careers.elcompanies.com/",
    allowedDomains: ["elcompanies.com"],
  }),
  enterprise({
    name: "华大智造",
    aliases: ["深圳华大智造科技股份有限公司", "MGI"],
    industry: "生命科学 / 医疗器械",
    officialCareersUrl: "https://www.mgi-tech.com/",
    allowedDomains: ["mgi-tech.com"],
  }),
  enterprise({
    name: "巨鲨医疗",
    aliases: ["巨鲨显示", "南京巨鲨显示科技有限公司", "Jusha"],
    industry: "医疗器械 / 医学影像",
  }),
  enterprise({
    name: "字节跳动医疗健康",
    aliases: ["字节跳动", "ByteDance"],
    industry: "科技医疗业务",
    officialCareersUrl: "https://jobs.bytedance.com/",
    allowedDomains: ["jobs.bytedance.com"],
  }),
  enterprise({
    name: "阿里健康",
    aliases: ["Alibaba Health"],
    industry: "数字医疗 / 医药零售",
    officialCareersUrl: "https://talent.alibaba.com/",
    allowedDomains: ["talent.alibaba.com"],
  }),
  enterprise({
    name: "华润医疗健康",
    aliases: ["华润", "华润医药", "华润医疗"],
    industry: "生物医药 / 医疗服务",
  }),
  enterprise({
    name: "科大讯飞医疗",
    aliases: ["科大讯飞", "iFLYTEK"],
    industry: "医疗AI / 数字医疗",
    officialCareersUrl: "https://www.iflytek.com/",
    allowedDomains: ["iflytek.com"],
  }),
]);

function compact(value) {
  return String(value ?? "").trim().toLocaleLowerCase("zh-CN").replace(/\s+/g, "");
}

export function findEnterprise(name) {
  const lookup = compact(name);
  if (!lookup) return null;
  return ENTERPRISE_CATALOG.find((item) => [item.name, ...item.aliases].some((value) => compact(value) === lookup)) ?? null;
}
