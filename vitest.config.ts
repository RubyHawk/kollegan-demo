import { configDefaults, defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    exclude: [
      ...configDefaults.exclude,
      '.claude/**',
      '.codex-artifacts/**',
      'deliverables/**',
      'deliveries/**',
      'preview-changes/**',
      'tests/e2e/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/lib/**/*.ts', 'src/app/api/ai/**/*.ts'],
    },
  },
  resolve: {
    alias: {
      '@':              resolve(__dirname, 'src'),
      '@platform':      resolve(__dirname, 'src/platform'),
      '@demos':         resolve(__dirname, 'src/modules/demos'),
      '@modules/core':  resolve(__dirname, 'src/modules/core'),
      '@modules/supporting': resolve(__dirname, 'src/modules/supporting'),
      '@modules/generic': resolve(__dirname, 'src/modules/generic'),
      '@shared':        resolve(__dirname, 'src/shared'),
    },
  },
});
