import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const isGitHubPages = !!repoName;

const enableCoop = !!process.env.VITE_ENABLE_COOP;

export default defineConfig({
  // When running in GitHub Actions for Pages, automatically set the base
  // so assets are referenced under /<repo>/ instead of the domain root.
  base: isGitHubPages ? `/${repoName}/` : '/',
  plugins: [react()],
  // Ensure WASM assets from dependencies are included by Vite when building/tests
  assetsInclude: ['**/*.wasm'],
  // Optional: enable Cross-Origin-Opener-Policy / Cross-Origin-Embedder-Policy
  // headers for local development so SharedArrayBuffer (and WASM threads)
  // can be tested. Toggle by setting VITE_ENABLE_COOP=1 in your environment.
  ...(enableCoop
    ? {
        server: {
          headers: {
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Cross-Origin-Opener-Policy': 'same-origin',
          },
        },
      }
    : {}),
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
