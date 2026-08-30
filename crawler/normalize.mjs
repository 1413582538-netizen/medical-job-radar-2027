function textOrNull(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized || null;
}

function requiredText(value, fieldName) {
  const normalized = textOrNull(value);
  if (!normalized) throw new Error(`Missing required candidate field: ${fieldName}`);
  return normalized;
}

function compact(value) {
  return (value ?? "").toLocaleLowerCase("zh-CN").replace(/\s+/g, "");
}

export function dedupeKey(companyName, title, location) {
  return [companyName, title, location].map((value) => compact(value)).join("|");
}

export function normalizeCandidate(input) {
  const companyName = requiredText(input.companyName, "companyName");
  const title = requiredText(input.title, "title");
  const sourceName = requiredText(input.sourceName, "sourceName");
  const sourceUrl = requiredText(input.sourceUrl, "sourceUrl");
  const location = textOrNull(input.location);

  return {
    company: {
      name: companyName,
      industry: textOrNull(input.companyIndustry),
      companyType: textOrNull(input.companyType),
      companySize: textOrNull(input.companySize),
      location: textOrNull(input.companyLocation),
      description: textOrNull(input.companyDescription),
      websiteUrl: textOrNull(input.websiteUrl),
      careersUrl: textOrNull(input.careersUrl),
    },
    job: {
      title,
      jobDirection: textOrNull(input.jobDirection),
      industry: textOrNull(input.industry),
      location,
      publishedAt: textOrNull(input.publishedAt),
      sourceName,
      sourceUrl,
      officialUrl: textOrNull(input.officialUrl),
      sourceJobId: textOrNull(input.sourceJobId),
      status: input.status === "active" || input.status === "closed" ? input.status : "unknown",
      dedupeKey: dedupeKey(companyName, title, location),
    },
  };
}

export function findDuplicate(existingJobs, candidate) {
  const job = candidate.job;
  if (job.officialUrl) {
    const officialMatch = existingJobs.find((existing) => existing.official_url === job.officialUrl);
    if (officialMatch) return officialMatch;
  }

  if (job.sourceJobId) {
    const sourceIdMatch = existingJobs.find(
      (existing) =>
        existing.source_name === job.sourceName &&
        existing.source_job_id === job.sourceJobId,
    );
    if (sourceIdMatch) return sourceIdMatch;
  }

  return existingJobs.find((existing) => existing.dedupe_key === job.dedupeKey) ?? null;
}
