import { describe, expect, it, vi } from 'vitest';

vi.mock('@platform/database/prisma', () => ({ prisma: {} }));
vi.mock('@platform/logging/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock('@platform/auth/jwt', () => ({
  signAccessToken: vi.fn(),
  blacklistUserTokens: vi.fn(),
  generateOpaqueToken: vi.fn(),
  hashOpaqueToken: vi.fn(),
}));

import { requiresMfa } from '../../src/modules/supporting/auth/application/auth.service';

describe('requiresMfa', () => {
  it('exempts clock-in-only restaurant staff and kitchen roles', () => {
    expect(requiresMfa('staff', ['restaurant_staff'])).toBe(false);
    expect(requiresMfa('staff', ['restaurant_kitchen'])).toBe(false);
    expect(requiresMfa('staff', ['restaurant_staff', 'restaurant_kitchen'])).toBe(false);
  });

  it('requires MFA when an exempt role is combined with a broader role', () => {
    expect(requiresMfa('staff', ['restaurant_staff', 'restaurant_manager'])).toBe(true);
    expect(requiresMfa('staff', ['restaurant_kitchen', 'admin'])).toBe(true);
  });

  it('requires MFA for restaurant roles with edit or reporting access', () => {
    expect(requiresMfa('staff', ['restaurant_owner'])).toBe(true);
    expect(requiresMfa('staff', ['restaurant_manager'])).toBe(true);
    expect(requiresMfa('staff', ['restaurant_accountant'])).toBe(true);
  });

  it('keeps existing behavior for other staff, including users without roles', () => {
    expect(requiresMfa('staff', ['admin'])).toBe(true);
    expect(requiresMfa('staff', ['user'])).toBe(true);
    expect(requiresMfa('staff', [])).toBe(true);
  });

  it('keeps existing behavior for customers', () => {
    expect(requiresMfa('customer', ['customer_admin'])).toBe(true);
    expect(requiresMfa('customer', ['customer_viewer'])).toBe(false);
  });
});
