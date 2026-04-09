import {
  collectOfferPublishBlockingIssues,
  type OfferPublishBlockingIssue,
} from '@modules/supporting/offers/application/publish-validation';
import type { Offer } from '@modules/supporting/offers/domain/offer.entity';

function makeOffer(overrides: Partial<Offer> = {}): Offer {
  return {
    id: 'offer-1',
    organizationId: 'org-1',
    title: 'Solfilm',
    status: 'draft',
    offerNumber: undefined,
    priceDisplayMode: 'inclusive',
    recipientName: 'Ali Zeytoun',
    recipientEmail: 'ali@example.com',
    recipientCompany: 'ACME',
    lineItems: [
      {
        id: 'line-1',
        description: 'Soleria SL 22 + X — Beskrivningen hjälper säljaren förstå vad som faktiskt ska läggas till i offerten.',
        quantity: 1,
        unitPrice: 1000,
        vatRate: 0.25,
        discount: 0,
      },
    ],
    notes: undefined,
    validUntil: '2026-05-08T00:00:00.000Z',
    validityDays: 30,
    createdBy: 'user-1',
    createdAt: '2026-04-09T00:00:00.000Z',
    sentAt: undefined,
    viewedAt: undefined,
    acceptedAt: undefined,
    declinedAt: undefined,
    reminderSentAt: undefined,
    reminderCount: 0,
    leadId: undefined,
    customerId: undefined,
    companyId: 'company-1',
    totalExVat: 1000,
    totalIncVat: 1250,
    templateId: 'template-1',
    generatedDocument: undefined,
    emailSubject: undefined,
    emailBody: undefined,
    emailHeaderConfig: undefined,
    signatureImage: undefined,
    signerName: undefined,
    signatureMethod: 'canvas',
    publicToken: 'token-1',
    publicTokenExpiresAt: undefined,
    ...overrides,
  };
}

function issueCodes(issues: OfferPublishBlockingIssue[]) {
  return issues.map((issue) => issue.code);
}

describe('offer publish validation', () => {
  it('blocks placeholder intro, placeholder terms, placeholder product text, and demo sender identity', () => {
    const issues = collectOfferPublishBlockingIssues({
      offer: makeOffer(),
      branding: {
        companyName: 'Soleria',
        senderName: 'Soleria',
        organizationNumber: '521523-5454',
        addressLines: ['Testgatan 42', '702 24 Örebro'],
      },
      generatedDocument: '<section class="offer-section--terms">Juridiska villkor</section>',
      templateContent: JSON.stringify({
        _v: 4,
        pages: [
          {
            kind: 'document',
            role: 'offer',
            body: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Här kan du skriva en kort introduktion eller extra förtydligande till offerten.',
                    },
                  ],
                },
              ],
            },
            document: {
              showIntro: true,
              showTerms: true,
              termsBody:
                'Offerten gäller till angivet datum. Arbetet utförs enligt överenskommen omfattning och faktureras enligt summeringen ovan. Eventuella ändringar eller tillägg hanteras som separat tilläggsbeställning.',
            },
          },
        ],
      }),
      company: {
        id: 'company-1',
        organizationId: 'org-1',
        name: 'Soleria',
        orgNumber: '521523-5454',
        addressLine1: 'Testgatan 42',
        country: 'Sverige',
        createdBy: 'user-1',
        createdAt: '2026-04-09T00:00:00.000Z',
        updatedAt: '2026-04-09T00:00:00.000Z',
      },
    });

    expect(issueCodes(issues)).toEqual([
      'template.placeholder_intro',
      'line_item.placeholder_description',
      'template.placeholder_terms',
      'sender.demo_org_number',
      'sender.demo_address',
    ]);
  });

  it('passes a fully specified offer without known placeholder content', () => {
    const issues = collectOfferPublishBlockingIssues({
      offer: makeOffer({
        lineItems: [
          {
            id: 'line-1',
            description: 'Soleria SL 22 + X — Solfilm inklusive montage på söderfasad.',
            quantity: 1,
            unitPrice: 1000,
            vatRate: 0.25,
            discount: 0,
          },
        ],
      }),
      branding: {
        companyName: 'Soleria',
        senderName: 'Soleria',
        organizationNumber: '556123-4567',
        addressLines: ['Industrigatan 10', '111 22 Stockholm'],
      },
      generatedDocument: '<section class="offer-section--terms">Betalningsvillkor och leveransvillkor</section>',
      templateContent: JSON.stringify({
        _v: 4,
        pages: [
          {
            kind: 'document',
            role: 'offer',
            body: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Vi föreslår solfilm med montage under vecka 21.' }],
                },
              ],
            },
            document: {
              showIntro: true,
              showTerms: true,
              termsBody:
                'Betalning sker 10 dagar netto. Leverans och installation ingår enligt specificerad omfattning ovan.',
            },
          },
        ],
      }),
      company: {
        id: 'company-1',
        organizationId: 'org-1',
        name: 'Soleria',
        orgNumber: '556123-4567',
        addressLine1: 'Industrigatan 10',
        country: 'Sverige',
        createdBy: 'user-1',
        createdAt: '2026-04-09T00:00:00.000Z',
        updatedAt: '2026-04-09T00:00:00.000Z',
      },
    });

    expect(issues).toEqual([]);
  });
});
