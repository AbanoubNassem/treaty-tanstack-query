import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['test/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['src/__type_tests__/**'],
    setupFiles: ['test/setup.ts'],
  },
});
