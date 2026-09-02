const CAMPUS_PATTERN = /2027\s*(?:届|级)?(?:秋季)?(?:校园)?(?:招聘|校招)|2027秋招|2027校园招聘|2027\s*graduate/i;

export function has2027CampusSignal(text) {
  return CAMPUS_PATTERN.test(String(text ?? ""));
}

export function isTrustedSourceUrl(value, allowedDomains) {
  try {
    const hostname = new URL(value).hostname.toLocaleLowerCase("en-US");
    return allowedDomains.some((domain) => {
      const normalized = domain.toLocaleLowerCase("en-US");
      return hostname === normalized || hostname.endsWith(`.${normalized}`);
    });
  } catch {
    return false;
  }
}

export function jobDirectionFromText(text) {
  const value = String(text ?? "");
  const directions = [];
  if (/产品经理|产品工程师|产品专员|产品市场/i.test(value)) directions.push("产品");
  if (/注册工程师|注册专员|法规|regulatory/i.test(value)) directions.push("注册法规");
  if (/研发|算法|软件|硬件|检测|生命科学(?:研发|工程师)/i.test(value)) directions.push("研发");
  if (/医学事务|医学合作|医学专员|临床研究|临床运营|临床项目|临床工程/i.test(value)) directions.push("医学临床");
  if (/市场|项目管理|项目经理|管培/i.test(value)) directions.push("市场、项目管理");
  return directions.join("、") || null;
}
