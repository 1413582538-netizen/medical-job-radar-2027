import { createSupabaseWriter } from "./supabase-writer.mjs";
import { discoverHustCandidates } from "./sources/hust-campus.mjs";
import { verifiedCandidates } from "./sources/verified-2027-campus.mjs";

export async function collectCandidates({
  knownCandidates = verifiedCandidates(),
  discoverHust = discoverHustCandidates,
  sourceAdapters,
} = {}) {
  const adapters = sourceAdapters ?? [
    { name: "已验证公开招聘来源", collect: async () => knownCandidates },
    { name: "华中科技大学就业信息网", collect: discoverHust },
  ];
  const candidates = [];
  const sourceErrors = [];
  for (const adapter of adapters) {
    try {
      candidates.push(...await adapter.collect());
    } catch (error) {
      sourceErrors.push(`${adapter.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return { candidates, sourceErrors };
}

export async function runCrawler({ writer, candidates, sourceErrors = [] }) {
  let newJobCount = 0;
  let newCompanyCount = 0;
  const errors = [...sourceErrors];

  for (const candidate of candidates) {
    try {
      const outcome = await writer.upsertCandidate(candidate);
      if (outcome.newJob) newJobCount += 1;
      if (outcome.newCompany) newCompanyCount += 1;
    } catch (error) {
      errors.push(`${candidate.company.name} / ${candidate.job.title}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const result = {
    discoveredJobCount: candidates.length,
    newJobCount,
    newCompanyCount,
    status: errors.length ? "partial_failure" : "success",
    errorMessage: errors.length ? errors.join("\n") : null,
  };
  await writer.finishRun(result);
  return result;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const writer = createSupabaseWriter({ url, serviceRoleKey });
  const collected = await collectCandidates();
  const result = await runCrawler({ writer, ...collected });
  console.log(JSON.stringify(result));
}

if (import.meta.url === new URL(process.argv[1], "file:").href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
