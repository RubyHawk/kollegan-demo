import {
  DEFAULT_FRAMER_FIELD_CONFIG,
  coerceFieldConfig,
  normalizeEmail,
  normalizePhone,
  parseLeadIntakeEmail,
} from '@modules/supporting/leads/application/lead-intake-parser';
import type { LeadIntakeFieldConfig } from '@modules/supporting/leads/domain/lead-intake.entity';

describe('lead intake parser', () => {
  it('parses the Swedish Framer/Soleria email template into stable lead fields', () => {
    const parsed = parseLeadIntakeEmail(
      [
        'Namn: Sara Lind',
        'Email: Sara.Lind@Example.SE',
        'Telefon: +46 70 123 45 67',
        'Adress: Storgatan 12,',
        'Postnummer: 702 24',
        'Tjänst: Solfilm villa',
        'Meddelande: Ring mig gärna på eftermiddagen.',
        'Hur hittade du Soleria?: Google',
      ].join('\n'),
      DEFAULT_FRAMER_FIELD_CONFIG,
    );

    expect(parsed).toMatchObject({
      name: 'Sara Lind',
      email: 'Sara.Lind@Example.SE',
      phone: '+46 70 123 45 67',
      address: 'Storgatan 12',
      postalCode: '70224',
      requestedService: 'Solfilm villa',
      message: 'Ring mig gärna på eftermiddagen.',
      referralSource: 'Google',
      missingRequired: [],
    });
    expect(normalizeEmail(parsed.email)).toBe('sara.lind@example.se');
    expect(normalizePhone(parsed.phone)).toBe('46701234567');
  });

  it('keeps multiline messages together until the next mapped label', () => {
    const parsed = parseLeadIntakeEmail(
      [
        'Namn: Ali',
        'Email: ali@example.se',
        'Meddelande: Första raden',
        'Andra raden med mer kontext',
        '',
        'Tredje raden efter blankrad',
        'Telefon: 070-111 22 33',
      ].join('\n'),
      DEFAULT_FRAMER_FIELD_CONFIG,
    );

    expect(parsed.message).toBe('Första raden\nAndra raden med mer kontext\n\nTredje raden efter blankrad');
    expect(parsed.phone).toBe('070-111 22 33');
  });

  it('strips trailing commas from structured values', () => {
    const parsed = parseLeadIntakeEmail(
      [
        'Namn: Noor,',
        'Email: noor@example.se,',
        'Telefon: 070 222 33 44,',
        'Postnummer: 702 24,',
        'Tjänst: Dekorfilm,',
      ].join('\n'),
      DEFAULT_FRAMER_FIELD_CONFIG,
    );

    expect(parsed.name).toBe('Noor');
    expect(parsed.email).toBe('noor@example.se');
    expect(parsed.phone).toBe('070 222 33 44');
    expect(parsed.postalCode).toBe('70224');
    expect(parsed.requestedService).toBe('Dekorfilm');
  });

  it('allows optional fields to be absent while reporting missing required fields', () => {
    const parsed = parseLeadIntakeEmail('Namn: Kim', DEFAULT_FRAMER_FIELD_CONFIG);

    expect(parsed.name).toBe('Kim');
    expect(parsed.phone).toBeUndefined();
    expect(parsed.missingRequired).toEqual(['email']);
  });

  it('supports company-specific custom field mappings without hardcoding Soleria labels', () => {
    const config: LeadIntakeFieldConfig = {
      version: 1,
      fields: [
        { key: 'fullName', label: 'Full name', target: 'name', required: true, order: 10 },
        { key: 'emailAddress', label: 'Email address', target: 'email', required: true, order: 20 },
        { key: 'windowCount', label: 'Number of windows', target: 'custom', required: false, order: 30 },
      ],
    };

    const parsed = parseLeadIntakeEmail(
      ['Full name: Jamie', 'Email address: jamie@example.com', 'Number of windows: 14'].join('\n'),
      config,
    );

    expect(parsed.name).toBe('Jamie');
    expect(parsed.email).toBe('jamie@example.com');
    expect(parsed.customFields).toEqual({ windowCount: '14' });
    expect(coerceFieldConfig(config)).toEqual(config);
  });
});
