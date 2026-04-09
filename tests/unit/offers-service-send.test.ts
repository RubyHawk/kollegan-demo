import {
  resolveGeneratedDocumentForSend,
  resolveOfferSendWindow,
} from '@modules/supporting/offers/application/offers.service';
import type { Offer } from '@modules/supporting/offers/domain/offer.entity';

describe('offers service send snapshot handling', () => {
  const offer: Offer = {
    id: 'offer-1',
    organizationId: 'org-1',
    title: 'Facade wash',
    status: 'sent',
    offerNumber: 101,
    priceDisplayMode: 'inclusive',
    recipientName: 'Ada Lovelace',
    recipientEmail: 'ada@example.com',
    recipientCompany: 'Analytical Engines AB',
    lineItems: [
      {
        id: 'line-1',
        description: 'Facade wash - complete delivery',
        quantity: 1,
        unitPrice: 12500,
        vatRate: 0.25,
        discount: 0,
        sortOrder: 0,
      },
    ],
    notes: 'Delivered according to the agreed schedule.',
    validUntil: '2026-05-09T00:00:00.000Z',
    validityDays: 30,
    createdBy: 'user-1',
    createdAt: '2026-04-09T00:00:00.000Z',
    sentAt: '2026-04-09T01:00:00.000Z',
    reminderCount: 0,
    totalExVat: 12500,
    totalIncVat: 15625,
    templateId: 'template-1',
    generatedDocument: '<html><body><section>Immutable sent snapshot</section></body></html>',
    emailSubject: 'Offer 101',
    emailBody: 'Here is your offer.',
    emailHeaderConfig: '{"theme":"light"}',
    signatureMethod: 'typed',
    publicToken: 'public-token',
    publicTokenExpiresAt: '2026-05-09T00:00:00.000Z',
  };

  const branding = {
    companyName: 'Soleria',
    senderName: 'Soleria',
    senderEmail: 'hello@soleria.se',
    website: 'www.soleria.se',
    organizationNumber: '556123-4567',
    addressLines: ['Storgatan 1', '111 22 Stockholm'],
  };

  it('keeps the existing sent snapshot even if template content is available', () => {
    const resolved = resolveGeneratedDocumentForSend({
      existingGeneratedDocument: offer.generatedDocument,
      templateContent: JSON.stringify({
        _v: 4,
        pages: [
          {
            id: 'page-1',
            label: 'Offertsida',
            kind: 'document',
            role: 'offer',
            includeInCustomerPdf: true,
            body: {
              type: 'doc',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'New template version' }] }],
            },
            header: { enabled: false, useDefault: true, content: { type: 'doc', content: [] } },
            footer: { enabled: false, useDefault: true, content: { type: 'doc', content: [] } },
            document: {
              showIntro: true,
              showLineItems: true,
              showSummary: true,
              showTerms: true,
              showNotes: false,
              showFooter: false,
              termsHeading: 'Commercial terms',
              termsBody: 'Payment in 30 days. Delivery according to agreement.',
              notesHeading: 'Notes',
              summaryPlacement: 'below',
            },
          },
        ],
        defaultHeader: { type: 'doc', content: [] },
        defaultFooter: { type: 'doc', content: [] },
      }),
      sendSnapshot: offer,
      branding,
    });

    expect(resolved.generatedDocument).toBe(offer.generatedDocument);
    expect(resolved.usesCurrentTemplate).toBe(false);
  });

  it('renders from the current template when no stored snapshot exists yet', () => {
    const resolved = resolveGeneratedDocumentForSend({
      existingGeneratedDocument: undefined,
      templateContent: JSON.stringify({
        _v: 4,
        pages: [
          {
            id: 'page-1',
            label: 'Offertsida',
            kind: 'document',
            role: 'offer',
            includeInCustomerPdf: true,
            body: {
              type: 'doc',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Project introduction' }] }],
            },
            header: { enabled: false, useDefault: true, content: { type: 'doc', content: [] } },
            footer: { enabled: false, useDefault: true, content: { type: 'doc', content: [] } },
            document: {
              showIntro: true,
              showLineItems: true,
              showSummary: true,
              showTerms: true,
              showNotes: false,
              showFooter: false,
              termsHeading: 'Commercial terms',
              termsBody: 'Payment in 30 days. Delivery according to agreement.',
              notesHeading: 'Notes',
              summaryPlacement: 'below',
            },
          },
        ],
        defaultHeader: { type: 'doc', content: [] },
        defaultFooter: { type: 'doc', content: [] },
      }),
      sendSnapshot: {
        ...offer,
        generatedDocument: undefined,
        status: 'draft',
      },
      branding,
    });

    expect(resolved.generatedDocument).toContain('<!DOCTYPE html>');
    expect(resolved.generatedDocument).toContain('Project introduction');
    expect(resolved.usesCurrentTemplate).toBe(true);
  });

  it('falls back when neither a stored snapshot nor a template is available', () => {
    const resolved = resolveGeneratedDocumentForSend({
      existingGeneratedDocument: undefined,
      templateContent: undefined,
      sendSnapshot: {
        ...offer,
        generatedDocument: undefined,
        status: 'draft',
      },
      branding,
    });

    expect(resolved.generatedDocument).toContain('<!DOCTYPE html>');
    expect(resolved.generatedDocument).toContain('Facade wash');
    expect(resolved.usesCurrentTemplate).toBe(false);
  });

  it('treats a blank stored snapshot as missing content', () => {
    const resolved = resolveGeneratedDocumentForSend({
      existingGeneratedDocument: '   ',
      templateContent: JSON.stringify({
        _v: 4,
        pages: [
          {
            id: 'page-1',
            label: 'Offertsida',
            kind: 'document',
            role: 'offer',
            includeInCustomerPdf: true,
            body: {
              type: 'doc',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Fresh template content' }] }],
            },
            header: { enabled: false, useDefault: true, content: { type: 'doc', content: [] } },
            footer: { enabled: false, useDefault: true, content: { type: 'doc', content: [] } },
            document: {
              showIntro: true,
              showLineItems: true,
              showSummary: true,
              showTerms: true,
              showNotes: false,
              showFooter: false,
              termsHeading: 'Commercial terms',
              termsBody: 'Payment in 30 days. Delivery according to agreement.',
              notesHeading: 'Notes',
              summaryPlacement: 'below',
            },
          },
        ],
        defaultHeader: { type: 'doc', content: [] },
        defaultFooter: { type: 'doc', content: [] },
      }),
      sendSnapshot: {
        ...offer,
        generatedDocument: '   ',
        status: 'draft',
      },
      branding,
    });

    expect(resolved.generatedDocument).toContain('<!DOCTYPE html>');
    expect(resolved.generatedDocument).toContain('Fresh template content');
    expect(resolved.usesCurrentTemplate).toBe(true);
  });
  it('preserves the original validity window when reusing a sent snapshot', () => {
    const resolved = resolveOfferSendWindow(offer, new Date('2026-06-01T12:00:00.000Z'));

    expect(resolved.sentAt.toISOString()).toBe('2026-04-09T01:00:00.000Z');
    expect(resolved.validUntil.toISOString()).toBe('2026-05-09T00:00:00.000Z');
    expect(resolved.publicTokenExpiresAt.toISOString()).toBe('2026-05-09T00:00:00.000Z');
  });

  it('computes a fresh validity window when no sent snapshot exists yet', () => {
    const resolved = resolveOfferSendWindow(
      {
        ...offer,
        generatedDocument: undefined,
        sentAt: undefined,
      },
      new Date('2026-06-01T12:00:00.000Z'),
    );

    expect(resolved.sentAt.toISOString()).toBe('2026-06-01T12:00:00.000Z');
    expect(resolved.validUntil.toISOString()).toBe('2026-06-30T12:00:00.000Z');
    expect(resolved.publicTokenExpiresAt.toISOString()).toBe('2026-06-30T12:00:00.000Z');
  });
});
