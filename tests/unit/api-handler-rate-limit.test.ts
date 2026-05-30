import { describe, expect, it } from 'vitest';
import { resolveRateLimitBudget } from '../../src/platform/api/rate-limit-policy';

describe('api handler rate-limit budgets', () => {
  it('keeps unauthenticated limits unchanged', () => {
    expect(resolveRateLimitBudget({ max: 30, windowMs: 60_000 }, 'jwt', false)).toEqual({
      max: 30,
      windowMs: 60_000,
    });
  });

  it('makes authenticated user limits generous while preserving a finite safeguard', () => {
    expect(resolveRateLimitBudget({ max: 30, windowMs: 60_000 }, 'jwt', true)).toEqual({
      max: 300,
      windowMs: 60_000,
    });

    expect(resolveRateLimitBudget({ max: 120, windowMs: 60_000 }, 'jwt', true)).toEqual({
      max: 480,
      windowMs: 60_000,
    });
  });
});
