import { expect, it } from "vitest";

import {
  has2027CampusSignal,
  isTrustedSourceUrl,
  jobDirectionFromText,
} from "../crawler/source-validation.mjs";

it("只接受 2027 届信息并识别用户相关岗位方向", () => {
  expect(has2027CampusSignal("2027届校园招聘 医学合作专员")).toBe(true);
  expect(has2027CampusSignal("社会招聘 产品经理")).toBe(false);
  expect(jobDirectionFromText("医学合作专员（医疗健康业务）")).toBe("医学临床");
  expect(jobDirectionFromText("化妆品柜台销售")).toBeNull();
  expect(jobDirectionFromText("产品经理（生命科学）")).toBe("产品");
});

it("仅接受允许域名及其子域名", () => {
  expect(isTrustedSourceUrl("https://careers.gehealthcare.cn/job/1", ["gehealthcare.cn"])).toBe(true);
  expect(isTrustedSourceUrl("https://gehc.wd5.myworkdayjobs.com/job/1", ["gehc.wd5.myworkdayjobs.com"])).toBe(true);
  expect(isTrustedSourceUrl("https://search.example.com/result", ["gehealthcare.cn"])).toBe(false);
  expect(isTrustedSourceUrl("not a url", ["gehealthcare.cn"])).toBe(false);
});
