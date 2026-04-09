import { stripPdfExcludedPageBlocks } from '@modules/supporting/offers/application/public-offer-document';

describe('public offer PDF sanitizing', () => {
  it('removes PDF-excluded pages and their adjacent separators', () => {
    const html = `<!DOCTYPE html>
<html lang="sv">
  <body>
    <div class="doc-wrapper">
      <div class="page-block" data-page="1">cover</div>
      <hr class="page-separator" />
      <div class="page-block" data-page="2" data-customer-pdf="false">internal</div>
      <hr class="page-separator" />
      <div class="page-block" data-page="3">offer</div>
    </div>
  </body>
</html>`;

    const sanitized = stripPdfExcludedPageBlocks(html);

    expect(sanitized).not.toContain('data-customer-pdf="false"');
    expect(sanitized).not.toContain('internal');
    expect(sanitized).toContain('cover');
    expect(sanitized).toContain('offer');
    expect((sanitized.match(/page-separator/g) ?? []).length).toBe(1);
  });
});
