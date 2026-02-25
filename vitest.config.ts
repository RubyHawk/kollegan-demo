import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/lib/**/*.ts', 'src/app/api/ai/**/*.ts'],
    },
  },
  resolve: {
    alias: {
      '@':         resolve(__dirname, 'src'),
      '@features': resolve(__dirname, 'src/features'),
      '@shared':   resolve(__dirname, 'src/shared'),
      '@infra':    resolve(__dirname, 'src/infrastructure'),
    },
  },
});
