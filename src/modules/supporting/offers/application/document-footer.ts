import { sanitizeUrl } from '@platform/security/sanitize';
import type { OfferBrandingProfile } from './company-branding';
import { escapeHtml } from './document-formatting';

function renderFooterIcon(kind: 'website' | 'user' | 'mail'): string {
  const pathByKind = {
    website: '<circle cx="128" cy="128" r="84"></circle><path d="M44 96h168"></path><path d="M44 160h168"></path><path d="M128 44c22 22 36 52 36 84s-14 62-36 84c-22-22-36-52-36-84s14-62 36-84z"></path>',
    user: '<circle cx="128" cy="96" r="36"></circle><path d="M60 204c12-34 40-52 68-52s56 18 68 52"></path>',
    mail: '<rect x="44" y="68" width="168" height="120" rx="18"></rect><path d="m56 84 72 56 72-56"></path>',
  } as const;

  return `
    <svg class="offer-shell__footer-icon" viewBox="0 0 256 256" aria-hidden="true" focusable="false">
      ${pathByKind[kind]}
    </svg>`;
}

export function renderPublicOfferFooterHtml(branding?: OfferBrandingProfile): string {
  const companyName = branding?.companyName?.trim() || branding?.senderName?.trim() || 'Soleria';
  const website = branding?.website?.trim() || '';
  const responsibleName = branding?.responsibleName?.trim() || branding?.senderName?.trim() || '-';
  const responsibleEmail = branding?.responsibleEmail?.trim() || branding?.senderEmail?.trim() || '-';
  const websiteHref = website ? sanitizeUrl(/^https?:\/\//i.test(website) ? website : `https://${website}`) : '';
  const websiteLabel = website
    ? escapeHtml(website.replace(/^https?:\/\//i, '').replace(/\/+$/, ''))
    : '-';

  return `
    <footer class="offer-shell__footer">
      <div class="offer-shell__footer-item offer-shell__footer-item--company">
        <strong>${renderFooterIcon('website')}<span>${escapeHtml(companyName)}</span></strong>
        ${websiteHref ? `<a href="${websiteHref}" target="_blank" rel="noreferrer noopener">${websiteLabel}</a>` : '<span>-</span>'}
      </div>
      <div class="offer-shell__footer-item offer-shell__footer-item--responsible">
        <strong>${renderFooterIcon('user')}<span>Ansvarig</span></strong>
        <span>${escapeHtml(responsibleName)}</span>
      </div>
      <div class="offer-shell__footer-item offer-shell__footer-item--contact">
        <strong>${renderFooterIcon('mail')}<span>Kontakt</span></strong>
        <span>${escapeHtml(responsibleEmail)}</span>
      </div>
    </footer>`;
}
