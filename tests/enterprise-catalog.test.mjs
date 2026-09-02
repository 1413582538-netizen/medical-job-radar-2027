import { expect, it } from "vitest";

import {
  ENTERPRISE_CATALOG,
  findEnterprise,
} from "../crawler/sources/enterprise-catalog.mjs";

it("收录指定的大健康企业及其别名", () => {
  const names = ENTERPRISE_CATALOG.map((item) => item.name);

  expect(names).toEqual(expect.arrayContaining([
    "深圳麦科田生物医疗技术股份有限公司",
    "GE医疗中国",
    "联邦制药",
    "雅诗兰黛中国",
    "华大智造",
    "巨鲨医疗",
    "字节跳动医疗健康",
    "阿里健康",
    "华润医疗健康",
    "科大讯飞医疗",
  ]));
  expect(findEnterprise("GE HealthCare")).toMatchObject({
    name: "GE医疗中国",
    industry: "医疗器械 / 医疗AI",
    officialCareersUrl: "https://career.gehealthcare.cn/",
  });
  expect(findEnterprise("麦科田")).toMatchObject({
    name: "深圳麦科田生物医疗技术股份有限公司",
    industry: "医疗器械",
  });
  expect(findEnterprise("南京巨鲨显示科技有限公司")).toMatchObject({
    name: "巨鲨医疗",
    industry: "医疗器械 / 医学影像",
  });
});
