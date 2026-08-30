export function createNextConfig({
  githubActions = process.env.GITHUB_ACTIONS === "true",
  repository = process.env.GITHUB_REPOSITORY,
} = {}) {
  const repositoryName = repository?.split("/")[1];
  const basePath = githubActions && repositoryName ? `/${repositoryName}` : "";

  return {
    output: "export",
    basePath,
    assetPrefix: basePath ? `${basePath}/` : "",
  };
}

export default createNextConfig();
