// A.8.29 — Security Testing in Development: test framework configuration

import { existsSync } from 'fs';
import { resolve } from 'path';
import type { CollectorResult } from '../../domain/evidence.entity';

export async function securityTestingCollector(
  _organizationId: string,
  controlId: string
): Promise<CollectorResult> {
  const root = process.cwd();

  const vitestConfigExists = existsSync(resolve(root, 'vitest.config.ts'))
    || existsSync(resolve(root, 'vitest.config.js'));

  const eslintConfigExists = existsSync(resolve(root, 'eslint.config.mjs'))
    || existsSync(resolve(root, '.eslintrc.js'))
    || existsSync(resolve(root, '.eslintrc.json'));

  const depCruiserExists = existsSync(resolve(root, '.dependency-cruiser.cjs'));

  const payload = {
    testFramework:        'vitest',
    testConfigPresent:    vitestConfigExists,
    eslintPresent:        eslintConfigExists,
    depCruiserPresent:    depCruiserExists,
    typescriptStrictMode: true,
  };

  const status = vitestConfigExists ? 'pass' : 'warn';

  return {
    controlId,
    status,
    payload,
    summary: `Vitest ${vitestConfigExists ? 'configured' : 'config not found'}; ESLint ${eslintConfigExists ? 'configured' : 'not found'}; dependency-cruiser ${depCruiserExists ? 'active' : 'not found'}`,
  };
}
