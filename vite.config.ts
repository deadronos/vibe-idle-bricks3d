import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const isGitHubPages = !!repoName;

const enableCoop = !!process.env.VITE_ENABLE_COOP;

// Simple plugin to add COOP/COEP headers and provide a /coop-check endpoint for debugging
const coopPlugin = enableCoop
  ? {
      name: 'vite-coop-coep-headers',
      configureServer(server: any) {
        server.middlewares.use((req: any, res: any, next: any) => {
          try {
            res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
            res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
          } catch {
            /* ignore */
          }

          // Provide a simple debug endpoint to verify headers quickly
          if (req.url && req.url.startsWith('/coop-check')) {
            res.statusCode = 200;
            res.end('coop-check');
            return;
          }

          next();
        });
      },
    }
  : undefined;

export default defineConfig({
  // When running in GitHub Actions for Pages, automatically set the base
  // so assets are referenced under /<repo>/ instead of the domain root.
  base: isGitHubPages ? `/${repoName}/` : '/',
  plugins: [react(), ...(enableCoop && coopPlugin ? [coopPlugin] : [])],
  // Ensure WASM assets from dependencies are included by Vite when building/tests
  assetsInclude: ['**/*.wasm'],
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
