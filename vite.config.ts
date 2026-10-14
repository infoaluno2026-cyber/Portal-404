import { defineConfig } from 'vite';

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/').at(-1);
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';
const base = isGitHubActions && repositoryName
  ? repositoryName.endsWith('.github.io') ? '/' : `/${repositoryName}/`
  : './';

export default defineConfig({ base });
