import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const isGitHubPages = !!repoName;

export default defineConfig({
  // When running in GitHub Actions for Pages, automatically set the base
  // so assets are referenced under /<repo>/ instead of the domain root.
  base: isGitHubPages ? `/${repoName}/` : '/',
  plugins: [react()],
  test: {
    globals: true,
    watch: false,
    environment: 'jsdom',
    include: [
      'tests/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'src/test/**/*.{test,spec}.{js,ts,jsx,tsx}',
    ],
    setupFiles: ['./tests/setup.ts', './src/test/setup.ts'],
  },
});
