import { describe, expect, it } from 'vitest';
import { getOfferLineItemDescription } from '@modules/supporting/offers/application/document-formatting';

describe('offer document formatting', () => {
  it('splits descriptions on a legacy mojibake em dash separator', () => {
    expect(getOfferLineItemDescription('Tjanst \u00e2\u20ac\u201d Med detalj')).toEqual({
      title: 'Tjanst',
      detail: 'Med detalj',
    });
  });
});
