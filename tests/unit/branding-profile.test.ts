import { describe, expect, it } from 'vitest';
import { resolveBrandingProfile } from '@modules/generic/branding';

describe('resolveBrandingProfile', () => {
  it('prefers document overrides over company and organization branding', () => {
    expect(resolveBrandingProfile({
      documentOverride: {
        companyName: 'Dokument AB',
        senderName: 'Dokumentteamet',
        senderEmail: 'doc@example.com',
        website: 'https://doc.example.com',
        addressLines: ['Dokumentgatan 1'],
      },
      company: {
        companyName: 'Bolag AB',
        senderName: 'Bolagsteamet',
        senderEmail: 'company@example.com',
      },
      organization: {
        companyName: 'Org AB',
        senderName: 'Orgteamet',
        senderEmail: 'org@example.com',
      },
      responsible: {
        name: 'Ada Lovelace',
        email: 'ada@example.com',
      },
    })).toEqual({
      companyName: 'Dokument AB',
      senderName: 'Dokumentteamet',
      senderEmail: 'doc@example.com',
      website: 'https://doc.example.com',
      addressLines: ['Dokumentgatan 1'],
      responsibleName: 'Ada Lovelace',
      responsibleEmail: 'ada@example.com',
    });
  });

  it('falls back from company to organization branding and then to the fallback name', () => {
    expect(resolveBrandingProfile({
      organization: {
        companyName: 'Org AB',
        senderName: 'Orgteamet',
      },
    })).toMatchObject({
      companyName: 'Org AB',
      senderName: 'Orgteamet',
    });

    expect(resolveBrandingProfile({})).toMatchObject({
      companyName: 'Offert',
      senderName: 'Offert',
    });
  });

  it('normalizes and filters blank address lines', () => {
    expect(resolveBrandingProfile({
      company: {
        companyName: 'Bolag AB',
        addressLines: ['  ', ' Main Street 1 ', '', '123 45 City'],
      },
    })).toMatchObject({
      addressLines: ['Main Street 1', '123 45 City'],
    });
  });
});
