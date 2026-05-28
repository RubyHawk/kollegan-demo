import { makeEmptyPage, parseTemplateDoc } from '../../src/app/(dashboard)/(shell)/mallar/_components/template-doc';

describe('template document defaults', () => {
  it('includes new blank presentation pages in customer PDF by default', () => {
    const page = makeEmptyPage('Sida 1', 'custom');

    expect(page.kind).toBe('presentation');
    expect(page.includeInCustomerPdf).toBe(true);
  });

  it('normalizes legacy pages without an inclusion flag as customer-facing', () => {
    const parsed = parseTemplateDoc(JSON.stringify({
      _v: 4,
      pages: [
        {
          id: 'page-1',
          label: 'Anpassad sida',
          role: 'custom',
          kind: 'presentation',
          body: { type: 'doc', content: [{ type: 'paragraph' }] },
          header: { enabled: false, useDefault: true, content: { type: 'doc', content: [] } },
          footer: { enabled: false, useDefault: true, content: { type: 'doc', content: [] } },
        },
      ],
      defaultHeader: { type: 'doc', content: [] },
      defaultFooter: { type: 'doc', content: [] },
    }));

    expect(parsed.pages[0]?.includeInCustomerPdf).toBe(true);
  });
});
