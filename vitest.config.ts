import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
      exclude: ['**/*.config.*', 'dist/**', '**/*.d.ts', 'node_modules/**', 'coverage/**'],
    },
  },
});
