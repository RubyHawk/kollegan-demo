import {
  sanitizePublicOfferDocument,
  sanitizePublicPdfOfferDocument,
  stripPdfExcludedPageBlocks,
} from '@modules/supporting/offers/application/public-offer-document';

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

  it('keeps promo pages in the public offer while simplifying the offer document', () => {
    const html = `<!DOCTYPE html>
<html lang="sv">
  <head></head>
  <body>
    <div class="doc-wrapper">
      <div class="page-block" data-page="1">
        <div class="page-content page-content--edge-to-edge">
          <div style="position:absolute;left:0;top:0;width:816px;"><img src="/promo.png" alt="" /></div>
        </div>
      </div>
      <hr class="page-separator" />
      <div class="page-block page-block--document" data-page="2">
        <div class="page-content page-content--document">
          <section class="offer-shell">
            <p class="offer-shell__lead">Tydlig prisbild, giltighet och villkor samlade i en offert.</p>
            <div class="offer-items">
              <div class="offer-items__table">
                <div class="offer-items__head" style="--offer-columns:minmax(220px, 1.85fr) 72px 112px 92px 92px 116px">
                  <span>Produkt eller tjänst</span>
                  <span>Antal</span>
                  <span>Å-pris</span>
                  <span>Rabatt</span>
                  <span>Moms</span>
                  <span>Belopp</span>
                </div>
                <article class="offer-item-row" style="--offer-columns:minmax(220px, 1.85fr) 72px 112px 92px 92px 116px">
                  <div class="offer-item-row__product"><div class="offer-item-row__title">Film</div></div>
                  <div class="offer-item-row__value">1</div>
                  <div class="offer-item-row__value">1 250,00 kr</div>
                  <div class="offer-item-row__value">5%</div>
                  <div class="offer-item-row__value">25% moms</div>
                  <div class="offer-item-row__value">1 187,50 kr</div>
                </article>
              </div>
            </div>
            <footer class="offer-shell__footer">
              <div><strong>Soleria</strong><span>Org.nr 556523-5454</span><span>www.soleria.se</span></div>
              <div><strong>Ansvarig</strong><span>Malek</span></div>
            </footer>
          </section>
        </div>
      </div>
    </div>
  </body>
</html>`;

    const sanitized = sanitizePublicOfferDocument(html, {
      id: 'offer-1',
      title: 'Test',
      status: 'viewed',
      createdAt: '2026-04-09T12:00:00.000Z',
      offerNumber: 35,
      recipientName: 'Ali',
      recipientEmail: 'ali@example.com',
      recipientCompany: 'Soleria',
      validUntil: '2026-05-08T00:00:00.000Z',
      totalExVat: 6800,
      totalIncVat: 8500,
      priceDisplayMode: 'inclusive',
      notes: '',
      lineItems: [],
    } as never, {
      website: 'https://www.soleria.se',
    } as never);

    expect(sanitized).toContain('/promo.png');
    expect(sanitized).toContain('/promo.png');
    expect(sanitized).not.toContain('Tydlig prisbild, giltighet och villkor samlade i en offert.');
    expect(sanitized).toContain('25%');
    expect(sanitized).not.toContain('25% moms');
    expect(sanitized).toContain('href="https://www.soleria.se"');
    expect(sanitized).not.toContain('Org.nr 556523-5454');
    expect(sanitized).toContain('--offer-columns:minmax(0,1.9fr) 44px 86px 56px 56px 92px');
    expect(sanitized).toContain('data-public-offer-cleanup');
  });

  it('removes promo pages from the downloaded public PDF', () => {
    const html = `<!DOCTYPE html>
<html lang="sv">
  <head></head>
  <body>
    <div class="doc-wrapper">
      <div class="page-block" data-page="1">
        <div class="page-content page-content--edge-to-edge">
          <div style="position:absolute;left:0;top:0;width:816px;"><img src="/promo-1.png" alt="" /></div>
        </div>
      </div>
      <hr class="page-separator" />
      <div class="page-block page-block--document" data-page="2">
        <div class="page-content page-content--document">
          <section class="offer-shell">
            <p class="offer-shell__lead">Tydlig prisbild, giltighet och villkor samlade i en offert.</p>
            <div class="offer-items">
              <div class="offer-items__table">
                <div class="offer-items__head" style="--offer-columns:minmax(220px, 1.85fr) 72px 112px 92px 92px 116px">
                  <span>Produkt eller tjÃ¤nst</span>
                  <span>Antal</span>
                  <span>Ã…-pris</span>
                  <span>Rabatt</span>
                  <span>Moms</span>
                  <span>Belopp</span>
                </div>
                <article class="offer-item-row" style="--offer-columns:minmax(220px, 1.85fr) 72px 112px 92px 92px 116px">
                  <div class="offer-item-row__product"><div class="offer-item-row__title">Film</div></div>
                  <div class="offer-item-row__value">1</div>
                  <div class="offer-item-row__value">1 250,00 kr</div>
                  <div class="offer-item-row__value">5%</div>
                  <div class="offer-item-row__value">25% moms</div>
                  <div class="offer-item-row__value">1 187,50 kr</div>
                </article>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </body>
</html>`;

    const sanitized = sanitizePublicPdfOfferDocument(html, {
      id: 'offer-1b',
      title: 'Test PDF',
      status: 'viewed',
      createdAt: '2026-04-09T12:00:00.000Z',
      offerNumber: 37,
      recipientName: 'Ali',
      recipientEmail: 'ali@example.com',
      recipientCompany: 'Soleria',
      validUntil: '2026-05-08T00:00:00.000Z',
      totalExVat: 6800,
      totalIncVat: 8500,
      priceDisplayMode: 'inclusive',
      notes: '',
      lineItems: [],
    } as never, {
      website: 'https://www.soleria.se',
    } as never);

    expect(sanitized).not.toContain('/promo-1.png');
    expect(sanitized).not.toContain('page-separator');
    expect(sanitized).not.toContain('25% moms');
    expect(sanitized).toContain('25%');
  });

  it('simplifies the company block in every page footer', () => {
    const html = `<!DOCTYPE html>
<html lang="sv">
  <head></head>
  <body>
    <div class="doc-wrapper">
      <div class="page-block page-block--document" data-page="1">
        <div class="page-content page-content--document">
          <footer class="offer-shell__footer">
            <div><strong>Soleria</strong><span>Org.nr 556523-5454</span><span>www.soleria.se</span></div>
            <div><strong>Ansvarig</strong><span>Malek</span></div>
          </footer>
        </div>
      </div>
      <hr class="page-separator" />
      <div class="page-block page-block--document" data-page="2">
        <div class="page-content page-content--document">
          <footer class="offer-shell__footer">
            <div><strong>Soleria</strong><span>Org.nr 556523-5454</span><span>www.soleria.se</span></div>
            <div><strong>Ansvarig</strong><span>Malek</span></div>
          </footer>
        </div>
      </div>
    </div>
  </body>
</html>`;

    const sanitized = sanitizePublicOfferDocument(html, {
      id: 'offer-2',
      title: 'Test 2',
      status: 'viewed',
      createdAt: '2026-04-09T12:00:00.000Z',
      offerNumber: 36,
      recipientName: 'Ali',
      recipientEmail: 'ali@example.com',
      recipientCompany: 'Soleria',
      validUntil: '2026-05-08T00:00:00.000Z',
      totalExVat: 6800,
      totalIncVat: 8500,
      priceDisplayMode: 'inclusive',
      notes: '',
      lineItems: [],
    } as never, {
      website: 'https://www.soleria.se',
    } as never);

    expect((sanitized.match(/href="https:\/\/www\.soleria\.se"/g) ?? []).length).toBe(2);
    expect(sanitized).not.toContain('Org.nr 556523-5454');
  });
});
