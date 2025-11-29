import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    watch: false,
    environment: 'jsdom',
    include: ['tests/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    setupFiles: ['./tests/setup.ts', './src/test/setup.ts'],
  },
});
