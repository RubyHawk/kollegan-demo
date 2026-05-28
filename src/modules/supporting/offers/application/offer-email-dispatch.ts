import { logger } from '@platform/logging/logger';
import { sanitizeEmailHtml, escapeHtml } from '@platform/security/sanitize';
import { BRAND_NAME, BRAND_TAGLINE } from '@shared/branding';
import { offerBrandingRepository } from '../infrastructure/offer-branding.repository';
import { getDisplayModeLabel } from '../domain/pricing';
import type {
  NotifyCreatorPayload,
  ReminderPayload,
  SendToRecipientPayload,
} from './offer-email';
import { fromAddress, sendEmail } from './offer-email-transport';

const TAG = 'OfferEmailDispatch';
type OfferNotificationTag = 'offer_signed' | 'offer_declined';

function emailPricing(p: Pick<SendToRecipientPayload, 'priceDisplayMode' | 'totalExVat' | 'totalIncVat'>) {
  const hasVat = Math.abs(p.totalIncVat - p.totalExVat) > 0.009;
  return {
    amount: hasVat ? p.totalIncVat : p.totalExVat,
    label: 'Totalsumma',
    detail: getDisplayModeLabel(hasVat, p.priceDisplayMode),
  };
}

function fmtSEK(n: number): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('sv-SE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

interface EmailDesignConfig {
  meta: {
    preheader?: string;
  };
  header: {
    logoUrl?: string;
    companyName?: string;
    tagline?: string;
    bgColor: string;
    textColor: string;
    accentColor: string;
    alignment: 'left' | 'center';
    showDivider: boolean;
  };
  body: {
    bgColor: string;
    contentBgColor: string;
    textColor: string;
    mutedColor: string;
    linkColor: string;
  };
  cta: {
    bgColor: string;
    textColor: string;
    borderRadius: number;
    label: string;
  };
  footer: {
    companyInfo?: string;
    showSocial: boolean;
    socialLinks?: { website?: string; linkedin?: string; twitter?: string; instagram?: string };
    legalText?: string;
    bgColor: string;
    textColor: string;
  };
}

const DESIGN_DEFAULTS: EmailDesignConfig = {
  meta: {
    preheader: '',
  },
  header: {
    companyName: BRAND_NAME,
    tagline: BRAND_TAGLINE,
    bgColor: '#0f172a',
    textColor: '#ffffff',
    accentColor: '#94a3b8',
    alignment: 'center',
    showDivider: true,
  },
  body: {
    bgColor: '#f1f5f9',
    contentBgColor: '#ffffff',
    textColor: '#1e293b',
    mutedColor: '#64748b',
    linkColor: '#2563eb',
  },
  cta: {
    bgColor: '#0f172a',
    textColor: '#ffffff',
    borderRadius: 8,
    label: 'Visa & signera offert',
  },
  footer: {
    bgColor: '#0f172a',
    textColor: '#94a3b8',
    showSocial: false,
    legalText: `Skickat via ${BRAND_NAME}`,
  },
};

function parseDesignConfig(configJson?: string): EmailDesignConfig | null {
  if (!configJson) return null;
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(configJson);
  } catch {
    return null;
  }

  if ('bgColor' in raw && !('header' in raw)) {
    return {
      ...DESIGN_DEFAULTS,
      header: { ...DESIGN_DEFAULTS.header, ...(raw as Partial<EmailDesignConfig['header']>) },
    };
  }

  const d = raw as Partial<EmailDesignConfig>;
  return {
    meta: { ...DESIGN_DEFAULTS.meta, ...d.meta },
    header: { ...DESIGN_DEFAULTS.header, ...d.header },
    body: { ...DESIGN_DEFAULTS.body, ...d.body },
    cta: { ...DESIGN_DEFAULTS.cta, ...d.cta },
    footer: { ...DESIGN_DEFAULTS.footer, ...d.footer },
  };
}

function renderHeader(h: EmailDesignConfig['header']): string {
  if (!h.companyName && !h.logoUrl) return '';
  const logo = h.logoUrl
    ? `<img src="${escapeHtml(h.logoUrl)}" alt="" style="max-height:48px;max-width:200px;margin-bottom:12px;" />`
    : '';
  const name = h.companyName
    ? `<h1 style="margin:0;font-size:20px;font-weight:700;color:${h.textColor};">${escapeHtml(h.companyName)}</h1>`
    : '';
  const tag = h.tagline
    ? `<p style="margin:4px 0 0 0;font-size:13px;color:${h.accentColor};">${escapeHtml(h.tagline)}</p>`
    : '';
  const divider = h.showDivider
    ? `<div style="height:3px;background:${h.accentColor};opacity:0.3;margin-top:16px;border-radius:2px;"></div>`
    : '';
  return `<div style="background:${h.bgColor};padding:28px 24px 20px;text-align:${h.alignment};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${logo}${name}${tag}${divider}</div>`;
}

export function renderCta(cta: EmailDesignConfig['cta'], url: string): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto;">
      <tr>
        <td bgcolor="${cta.bgColor}" style="border-radius:${cta.borderRadius}px;text-align:center;">
          <a href="${url}" target="_blank" rel="noopener noreferrer" lang="sv" dir="ltr" translate="no" style="display:block;background:${cta.bgColor};color:${cta.textColor};text-decoration:none;padding:12px 28px;border-radius:${cta.borderRadius}px;font-weight:600;font-size:15px;line-height:1.2;white-space:nowrap;">${escapeHtml(cta.label || 'Visa & signera offert')} &rarr;</a>
        </td>
      </tr>
    </table>`;
}

function renderFooter(f: EmailDesignConfig['footer']): string {
  const parts: string[] = [];
  if (f.companyInfo) {
    parts.push(`<p style="margin:0 0 6px;font-size:12px;color:${f.textColor};">${escapeHtml(f.companyInfo)}</p>`);
  }
  if (f.showSocial && f.socialLinks) {
    const links: string[] = [];
    if (f.socialLinks.website) {
      links.push(`<a href="${escapeHtml(f.socialLinks.website)}" style="color:${f.textColor};text-decoration:underline;font-size:11px;">Webb</a>`);
    }
    if (f.socialLinks.linkedin) {
      links.push(`<a href="${escapeHtml(f.socialLinks.linkedin)}" style="color:${f.textColor};text-decoration:underline;font-size:11px;">LinkedIn</a>`);
    }
    if (f.socialLinks.twitter) {
      links.push(`<a href="${escapeHtml(f.socialLinks.twitter)}" style="color:${f.textColor};text-decoration:underline;font-size:11px;">X</a>`);
    }
    if (f.socialLinks.instagram) {
      links.push(`<a href="${escapeHtml(f.socialLinks.instagram)}" style="color:${f.textColor};text-decoration:underline;font-size:11px;">Instagram</a>`);
    }
    if (links.length) {
      parts.push(`<p style="margin:0 0 6px;">${links.join(' &nbsp;&middot;&nbsp; ')}</p>`);
    }
  }
  if (f.legalText) {
    parts.push(`<p style="margin:0;font-size:10px;color:${f.textColor};opacity:0.7;">${escapeHtml(f.legalText)}</p>`);
  }
  if (!parts.length) return '';
  return `<div style="background:${f.bgColor};padding:20px 24px;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${parts.join('')}</div>`;
}

function wrapEmailDocument(content: string, backgroundColor: string, previewText: string): string {
  return `<!doctype html>
<html lang="sv" dir="ltr">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Language" content="sv" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>Soleria offert</title>
    <style>
      body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
      img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
      table { border-collapse: collapse !important; }
      body { margin: 0 !important; padding: 0 !important; width: 100% !important; background: ${backgroundColor}; }
      a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
    </style>
  </head>
  <body lang="sv" dir="ltr" style="margin:0;padding:0;background:${backgroundColor};">
    <div lang="sv" dir="ltr" style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${escapeHtml(previewText)}
    </div>
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" lang="sv" dir="ltr" style="width:100%;background:${backgroundColor};">
      <tr>
        <td align="center" style="padding:0;">
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;margin:0 auto;">
            <tr>
              <td style="padding:0;">
                ${content}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function sendToRecipientHtml(p: SendToRecipientPayload): string {
  const d = parseDesignConfig(p.emailHeaderConfig);
  const b = d?.body ?? DESIGN_DEFAULTS.body;
  const c = d?.cta ?? DESIGN_DEFAULTS.cta;
  const configuredPreheader = d?.meta.preheader?.trim();

  const headerHtml = renderHeader((d ?? DESIGN_DEFAULTS).header);
  const footerHtml = renderFooter((d ?? DESIGN_DEFAULTS).footer);
  const ctaHtml = renderCta(c, p.publicUrl);
  const fallbackLink = `<p style="margin:24px 0 0 0;font-size:12px;color:${b.mutedColor};">Om du inte kan klicka på knappen, kopiera och klistra in denna länk i din webbläsare:<br/><a href="${p.publicUrl}" target="_blank" rel="noopener noreferrer" lang="sv" dir="ltr" translate="no" style="color:${b.mutedColor};word-break:break-all;"><span translate="no">${p.publicUrl}</span></a></p>`;

  if (p.emailBody) {
    return wrapEmailDocument(`
    <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:${b.bgColor};">
      ${headerHtml}
      <div style="padding:32px 24px;">
        <div style="background:${b.contentBgColor};border-radius:8px;padding:28px 24px;color:${b.textColor};">
          ${sanitizeEmailHtml(p.emailBody)}
          <div style="margin-top:24px;text-align:center;">${ctaHtml}</div>
          ${fallbackLink}
        </div>
      </div>
      ${footerHtml}
    </div>`, b.bgColor, configuredPreheader || `Offert ${p.offerTitle} från Soleria`);
  }

  return wrapEmailDocument(`
    <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:${b.bgColor};">
      ${headerHtml}
      <div style="padding:32px 24px;">
        <div style="background:${b.contentBgColor};border-radius:8px;padding:28px 24px;">
          <h2 style="margin:0 0 8px 0;font-size:22px;color:${b.textColor};">Du har en ny offert</h2>
          <p style="color:${b.mutedColor};margin:0 0 24px 0;">Hej ${p.recipientName},</p>
          <p style="margin:0 0 12px 0;color:${b.textColor};">Du har tagit emot en offert: <strong>${p.offerTitle}</strong>.</p>
          <p style="margin:0 0 18px 0;color:${b.mutedColor};line-height:1.65;">Klicka på knappen nedan för att öppna offerten, granska innehållet och se priset i den säkra offertvyn.</p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            <tr><td style="padding:8px 0;color:${b.mutedColor};font-size:14px;">Giltig till</td><td style="padding:8px 0;text-align:right;color:${b.textColor};">${fmtDate(p.validUntil)}</td></tr>
          </table>
          <div style="text-align:center;">${ctaHtml}</div>
          ${fallbackLink}
        </div>
      </div>
      ${footerHtml}
    </div>`, b.bgColor, configuredPreheader || `Ny offert ${p.offerTitle}. Giltig till ${fmtDate(p.validUntil)}.`);
}

export function notifyCreatorHtml(p: NotifyCreatorPayload): string {
  if (p.event === 'signed') {
    const pricing = emailPricing(p);
    const offerRef = p.offerNumber ? `#${p.offerNumber}` : p.offerTitle;
    const signedAt = p.acceptedAt ? fmtDate(p.acceptedAt) : '';
    return wrapEmailDocument(`
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#f8fafc;">
        <div style="background:#0f172a;padding:28px 24px;text-align:center;">
          <h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">Offert signerad ✅</h1>
          <p style="margin:6px 0 0;font-size:13px;color:#94a3b8;">En kund har accepterat din offert</p>
        </div>
        <div style="padding:32px 24px;">
          <div style="background:#ffffff;border-radius:10px;padding:28px 24px;border:1px solid #e2e8f0;">
            <p style="margin:0 0 20px;font-size:15px;color:#1e293b;"><strong>${escapeHtml(p.offerTitle)}</strong> har accepterats och signerats.</p>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:10px 0;color:#64748b;">Offert</td>
                <td style="padding:10px 0;text-align:right;color:#1e293b;font-weight:600;">${escapeHtml(offerRef)}</td>
              </tr>
              <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:10px 0;color:#64748b;">Kund</td>
                <td style="padding:10px 0;text-align:right;color:#1e293b;">${escapeHtml(p.recipientName)}</td>
              </tr>
              <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:10px 0;color:#64748b;">E-post</td>
                <td style="padding:10px 0;text-align:right;color:#1e293b;">${escapeHtml(p.recipientEmail)}</td>
              </tr>
              <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:10px 0;color:#64748b;">Belopp</td>
                <td style="padding:10px 0;text-align:right;color:#1e293b;font-weight:700;font-size:16px;">${fmtSEK(pricing.amount)}</td>
              </tr>
              <tr><td style="padding:4px 0 10px;color:#94a3b8;font-size:12px;">Prisvisning</td><td style="padding:4px 0 10px;text-align:right;color:#94a3b8;font-size:12px;">${pricing.detail}</td></tr>
              ${signedAt ? `<tr><td style="padding:10px 0;color:#64748b;">Signerades</td><td style="padding:10px 0;text-align:right;color:#1e293b;">${signedAt}</td></tr>` : ''}
            </table>
          </div>
          <p style="font-size:13px;color:#64748b;margin:20px 0 0;text-align:center;">Logga in på plattformen för att se signaturen och ladda ner dokumentet.</p>
        </div>
      </div>`, '#f8fafc', `Offert signerad: ${p.offerTitle}`);
  }

  return wrapEmailDocument(`
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1e293b;">
      <h2 style="margin:0 0 8px 0;font-size:22px;">Offert avvisad ❌</h2>
      <p style="color:#64748b;margin:0 0 24px 0;">Din offert har avvisats.</p>
      <p style="margin:0 0 8px 0;"><strong>${p.offerTitle}</strong> avvisades av <strong>${p.recipientName}</strong>.</p>
      ${p.comment ? `<p style="margin:8px 0;padding:12px 16px;background:#fef2f2;border-radius:8px;color:#991b1b;font-size:14px;"><strong>Anledning:</strong> ${escapeHtml(p.comment)}</p>` : ''}
    </div>`, '#ffffff', `Offert avvisad: ${p.offerTitle}`);
}

export function reminderHtml(p: ReminderPayload): string {
  const d = parseDesignConfig(p.emailHeaderConfig);
  const b = d?.body ?? DESIGN_DEFAULTS.body;
  const c = d?.cta ?? DESIGN_DEFAULTS.cta;
  const pricing = emailPricing(p);

  const headerHtml = renderHeader((d ?? DESIGN_DEFAULTS).header);
  const footerHtml = renderFooter((d ?? DESIGN_DEFAULTS).footer);
  const ctaHtml = renderCta(c, p.publicUrl);
  const fallbackLink = `<p style="margin:24px 0 0 0;font-size:12px;color:${b.mutedColor};">Om du inte kan klicka på knappen, kopiera och klistra in denna länk i din webbläsare:<br/><a href="${p.publicUrl}" target="_blank" rel="noopener noreferrer" lang="sv" dir="ltr" translate="no" style="color:${b.mutedColor};word-break:break-all;"><span translate="no">${p.publicUrl}</span></a></p>`;

  if (p.emailBody) {
    return wrapEmailDocument(`
    <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:${b.bgColor};">
      ${headerHtml}
      <div style="padding:32px 24px;">
        <div style="background:${b.contentBgColor};border-radius:8px;padding:28px 24px;color:${b.textColor};">
          ${sanitizeEmailHtml(p.emailBody)}
          <div style="margin-top:24px;text-align:center;">${ctaHtml}</div>
          ${fallbackLink}
        </div>
      </div>
      ${footerHtml}
    </div>`, b.bgColor, `Påminnelse om offert ${p.offerTitle}`);
  }

  return wrapEmailDocument(`
    <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:${b.bgColor};">
      ${headerHtml}
      <div style="padding:32px 24px;">
        <div style="background:${b.contentBgColor};border-radius:8px;padding:28px 24px;">
          <h2 style="margin:0 0 8px 0;font-size:22px;color:${b.textColor};">Påminnelse om offert</h2>
          <p style="color:${b.mutedColor};margin:0 0 24px 0;">Hej ${p.recipientName},</p>
          <p style="margin:0 0 16px 0;color:${b.textColor};">Vi vill påminna om en offert som väntar på ditt svar: <strong>${p.offerTitle}</strong></p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            <tr><td style="padding:8px 0;color:${b.mutedColor};font-size:14px;">${pricing.label}</td><td style="padding:8px 0;font-weight:700;text-align:right;color:${b.textColor};">${fmtSEK(pricing.amount)}</td></tr>
            <tr><td style="padding:0 0 8px 0;color:${b.mutedColor};font-size:12px;">Prisvisning</td><td style="padding:0 0 8px 0;text-align:right;color:${b.mutedColor};font-size:12px;">${pricing.detail}</td></tr>
            <tr><td style="padding:8px 0;color:${b.mutedColor};font-size:14px;">Giltig till</td><td style="padding:8px 0;text-align:right;color:${b.textColor};">${fmtDate(p.validUntil)}</td></tr>
          </table>
          <div style="text-align:center;">${ctaHtml}</div>
          ${fallbackLink}
        </div>
      </div>
      ${footerHtml}
    </div>`, b.bgColor, `Påminnelse: ${p.offerTitle}. Giltig till ${fmtDate(p.validUntil)}.`);
}

export async function dispatchOfferEmail(payload: SendToRecipientPayload): Promise<void> {
  const subject = payload.emailSubject || `Offert: ${payload.offerTitle}`;
  await sendEmail({
    from: fromAddress(payload.senderEmail, payload.senderName),
    to: payload.recipientEmail,
    subject,
    html: sendToRecipientHtml(payload),
  });
  logger.info(TAG, `Sent offer email to ${payload.recipientEmail}`, { offerId: payload.offerId });
}

export async function dispatchReminderEmail(payload: ReminderPayload): Promise<void> {
  const subject = payload.emailSubject ? `Påminnelse: ${payload.emailSubject}` : `Påminnelse: ${payload.offerTitle}`;
  await sendEmail({
    from: fromAddress(payload.senderEmail, payload.senderName),
    to: payload.recipientEmail,
    subject,
    html: reminderHtml(payload),
  });
  logger.info(TAG, `Sent reminder email to ${payload.recipientEmail}`, { offerId: payload.offerId });
}

export async function dispatchCreatorNotification(payload: NotifyCreatorPayload): Promise<void> {
  const creatorEmail = await offerBrandingRepository.findUserEmail(payload.createdBy);
  if (!creatorEmail) {
    logger.warn(TAG, `Creator email not found for User ${payload.createdBy} - skipping`);
    return;
  }

  const subject =
    payload.event === 'signed'
      ? `Offert signerad: ${payload.offerTitle}`
      : `Offert avvisad: ${payload.offerTitle}`;

  const from = fromAddress(payload.senderEmail, payload.senderName);
  const html = notifyCreatorHtml(payload);

  await sendEmail({ from, to: creatorEmail, subject, html });
  logger.info(TAG, `Sent creator notification (${payload.event}) to ${creatorEmail}`, { offerId: payload.offerId });

  // Fan out to additional notification routing recipients
  const tag: OfferNotificationTag = payload.event === 'signed' ? 'offer_signed' : 'offer_declined';
  try {
    const recipients = await offerBrandingRepository.listNotificationRecipients(payload.organizationId);
    for (const r of recipients) {
      if (!r.tags.includes(tag)) continue;
      if (r.email === creatorEmail) continue; // already sent above
      try {
        await sendEmail({ from, to: r.email, subject, html });
        logger.info(TAG, `Sent notification routing email (${payload.event}) to ${r.email}`, { offerId: payload.offerId });
      } catch (err) {
        logger.warn(TAG, 'Failed to send notification routing email to recipient', {
          err,
          offerId: payload.offerId,
          recipientEmail: r.email,
        });
      }
    }
  } catch (err) {
    logger.warn(TAG, 'Failed to send to notification routing recipients', { err, offerId: payload.offerId });
  }
}
