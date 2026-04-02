/**
 * Offer email job handlers — registered at module startup.
 *
 * Calls Resend API. Creator email is resolved from the database by User.id.
 * Fail-gracefully: logs errors but does not re-throw (job queue handles retries).
 *
 * Call registerOfferEmailJobs() once at app startup (e.g. in instrumentation.ts
 * or the module index) to register handlers before any jobs are enqueued.
 */

import { Resend }     from 'resend';
import { jobQueue }   from '@platform/queue/job-queue';
import { prisma }     from '@platform/database/prisma';
import { logger }     from '@platform/logging/logger';
import { sanitizeEmailHtml, escapeHtml } from '@platform/security/sanitize';
import { BRAND_EMAIL_FALLBACK, BRAND_NAME, BRAND_TAGLINE } from '@shared/branding';
import type {
  SendToRecipientPayload,
  NotifyCreatorPayload,
  ReminderPayload,
} from '../application/offer-email';

const TAG = 'OfferEmailJobs';
const RESEND_ONBOARDING_FROM = process.env.RESEND_ONBOARDING_FROM || 'onboarding@resend.dev';

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function extractMailbox(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return (match ? match[1] : from).trim();
}

function replaceMailbox(from: string, mailbox: string): string {
  const match = from.match(/^(.*)<[^>]+>\s*$/);
  if (!match) return mailbox;

  const displayName = match[1].trim();
  return displayName ? `${displayName} <${mailbox}>` : mailbox;
}

function isUnverifiedDomainError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const message = 'message' in error && typeof error.message === 'string' ? error.message.toLowerCase() : '';
  return message.includes('domain is not verified');
}

async function sendEmail(opts: { from: string; to: string; subject: string; html: string }): Promise<void> {
  const resend = getResend();
  if (!resend) {
    logger.info(TAG, `[DEV] Email not sent — RESEND_API_KEY missing. Would have sent:\n  To: ${opts.to}\n  Subject: ${opts.subject}\n  URL: ${opts.html.match(/href="([^"]+)"/)?.[1] ?? '(no link)'}`);
    return;
  }
  const testTo = process.env.RESEND_TEST_TO;
  const effective = testTo ? { ...opts, to: testTo } : opts;
  if (testTo) {
    logger.info(TAG, `[DEV] Redirecting email to test address ${testTo} (original: ${opts.to})`);
  }
  const firstAttempt = await resend.emails.send(effective);
  if (!firstAttempt.error) return;

  const currentMailbox = extractMailbox(effective.from).toLowerCase();
  const canRetryWithOnboarding = isUnverifiedDomainError(firstAttempt.error)
    && currentMailbox !== RESEND_ONBOARDING_FROM.toLowerCase();

  if (canRetryWithOnboarding) {
    const fallbackFrom = replaceMailbox(effective.from, RESEND_ONBOARDING_FROM);
    logger.warn(TAG, 'Resend rejected sender domain, retrying with onboarding sender', {
      originalFrom: effective.from,
      fallbackFrom,
    });

    const fallbackAttempt = await resend.emails.send({ ...effective, from: fallbackFrom });
    if (!fallbackAttempt.error) return;

    throw new Error(`Resend error: ${JSON.stringify(fallbackAttempt.error)}`);
  }

  throw new Error(`Resend error: ${JSON.stringify(firstAttempt.error)}`);
}

function fromAddress(senderEmail?: string, senderName?: string): string {
  const email = senderEmail || process.env.EMAIL_FROM || BRAND_EMAIL_FALLBACK;
  if (senderName) return `${senderName} <${email}>`;
  return email;
}

// ─── Format helpers ─────────────────────────────────────────────────────────────

function fmtSEK(n: number): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency', currency: 'SEK', maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('sv-SE', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

// ─── Email Design System ───────────────────────────────────────────────────────
// Full email design config — header, body theme, CTA button, footer with trust signals.
// Backwards-compatible: old flat header configs (bgColor at root) still work.

interface EmailDesignConfig {
  header: { logoUrl?: string; companyName?: string; tagline?: string; bgColor: string; textColor: string; accentColor: string; alignment: 'left' | 'center'; showDivider: boolean };
  body:   { bgColor: string; contentBgColor: string; textColor: string; mutedColor: string; linkColor: string };
  cta:    { bgColor: string; textColor: string; borderRadius: number; label: string };
  footer: { companyInfo?: string; showSocial: boolean; socialLinks?: { website?: string; linkedin?: string; twitter?: string; instagram?: string }; legalText?: string; bgColor: string; textColor: string };
}

const DESIGN_DEFAULTS: EmailDesignConfig = {
  header: {
    companyName: BRAND_NAME,
    tagline: BRAND_TAGLINE,
    bgColor: '#0f172a',
    textColor: '#ffffff',
    accentColor: '#94a3b8',
    alignment: 'center',
    showDivider: true,
  },
  body:   { bgColor: '#f1f5f9', contentBgColor: '#ffffff', textColor: '#1e293b', mutedColor: '#64748b', linkColor: '#2563eb' },
  cta:    { bgColor: '#0f172a', textColor: '#ffffff', borderRadius: 8, label: 'Visa & signera offert' },
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
  try { raw = JSON.parse(configJson); } catch { return null; }

  // Backwards compat: old flat header-only config
  if ('bgColor' in raw && !('header' in raw)) {
    return { ...DESIGN_DEFAULTS, header: { ...DESIGN_DEFAULTS.header, ...(raw as Partial<EmailDesignConfig['header']>) } };
  }
  const d = raw as Partial<EmailDesignConfig>;
  return {
    header: { ...DESIGN_DEFAULTS.header, ...d.header },
    body:   { ...DESIGN_DEFAULTS.body, ...d.body },
    cta:    { ...DESIGN_DEFAULTS.cta, ...d.cta },
    footer: { ...DESIGN_DEFAULTS.footer, ...d.footer },
  };
}

function renderHeader(h: EmailDesignConfig['header']): string {
  if (!h.companyName && !h.logoUrl) return '';
  const logo = h.logoUrl ? `<img src="${escapeHtml(h.logoUrl)}" alt="" style="max-height:48px;max-width:200px;margin-bottom:12px;" />` : '';
  const name = h.companyName ? `<h1 style="margin:0;font-size:20px;font-weight:700;color:${h.textColor};">${escapeHtml(h.companyName)}</h1>` : '';
  const tag = h.tagline ? `<p style="margin:4px 0 0 0;font-size:13px;color:${h.accentColor};">${escapeHtml(h.tagline)}</p>` : '';
  const div = h.showDivider ? `<div style="height:3px;background:${h.accentColor};opacity:0.3;margin-top:16px;border-radius:2px;"></div>` : '';
  return `<div style="background:${h.bgColor};padding:28px 24px 20px;text-align:${h.alignment};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${logo}${name}${tag}${div}</div>`;
}

function renderCta(cta: EmailDesignConfig['cta'], url: string): string {
  return `<a href="${url}" style="display:inline-block;background:${cta.bgColor};color:${cta.textColor};text-decoration:none;padding:12px 28px;border-radius:${cta.borderRadius}px;font-weight:600;font-size:15px;">${escapeHtml(cta.label || 'Visa & signera offert')} &rarr;</a>`;
}

function renderFooter(f: EmailDesignConfig['footer']): string {
  const parts: string[] = [];
  if (f.companyInfo) parts.push(`<p style="margin:0 0 6px;font-size:12px;color:${f.textColor};">${escapeHtml(f.companyInfo)}</p>`);
  if (f.showSocial && f.socialLinks) {
    const links: string[] = [];
    if (f.socialLinks.website) links.push(`<a href="${escapeHtml(f.socialLinks.website)}" style="color:${f.textColor};text-decoration:underline;font-size:11px;">Webb</a>`);
    if (f.socialLinks.linkedin) links.push(`<a href="${escapeHtml(f.socialLinks.linkedin)}" style="color:${f.textColor};text-decoration:underline;font-size:11px;">LinkedIn</a>`);
    if (f.socialLinks.twitter) links.push(`<a href="${escapeHtml(f.socialLinks.twitter)}" style="color:${f.textColor};text-decoration:underline;font-size:11px;">X</a>`);
    if (f.socialLinks.instagram) links.push(`<a href="${escapeHtml(f.socialLinks.instagram)}" style="color:${f.textColor};text-decoration:underline;font-size:11px;">Instagram</a>`);
    if (links.length) parts.push(`<p style="margin:0 0 6px;">${links.join(' &nbsp;&middot;&nbsp; ')}</p>`);
  }
  if (f.legalText) parts.push(`<p style="margin:0;font-size:10px;color:${f.textColor};opacity:0.7;">${escapeHtml(f.legalText)}</p>`);
  if (!parts.length) return '';
  return `<div style="background:${f.bgColor};padding:20px 24px;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${parts.join('')}</div>`;
}

// ─── Email templates ────────────────────────────────────────────────────────────

function sendToRecipientHtml(p: SendToRecipientPayload): string {
  const d = parseDesignConfig(p.emailHeaderConfig);
  const b = d?.body ?? DESIGN_DEFAULTS.body;
  const c = d?.cta ?? DESIGN_DEFAULTS.cta;

  const headerHtml = renderHeader((d ?? DESIGN_DEFAULTS).header);
  const footerHtml = renderFooter((d ?? DESIGN_DEFAULTS).footer);
  const ctaHtml = renderCta(c, p.publicUrl);
  const fallbackLink = `<p style="margin:24px 0 0 0;font-size:12px;color:${b.mutedColor};">Om du inte kan klicka på knappen, kopiera och klistra in denna länk i din webbläsare:<br/><a href="${p.publicUrl}" style="color:${b.mutedColor};">${p.publicUrl}</a></p>`;

  // Custom body
  if (p.emailBody) {
    return `
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
    </div>`;
  }

  // Default body
  return `
    <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:${b.bgColor};">
      ${headerHtml}
      <div style="padding:32px 24px;">
        <div style="background:${b.contentBgColor};border-radius:8px;padding:28px 24px;">
          <h2 style="margin:0 0 8px 0;font-size:22px;color:${b.textColor};">Du har en ny offert</h2>
          <p style="color:${b.mutedColor};margin:0 0 24px 0;">Hej ${p.recipientName},</p>
          <p style="margin:0 0 16px 0;color:${b.textColor};">Du har tagit emot en offert: <strong>${p.offerTitle}</strong></p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            <tr><td style="padding:8px 0;color:${b.mutedColor};font-size:14px;">Totalt inkl. moms</td><td style="padding:8px 0;font-weight:700;text-align:right;color:${b.textColor};">${fmtSEK(p.totalIncVat)}</td></tr>
            <tr><td style="padding:8px 0;color:${b.mutedColor};font-size:14px;">Giltig till</td><td style="padding:8px 0;text-align:right;color:${b.textColor};">${fmtDate(p.validUntil)}</td></tr>
          </table>
          <div style="text-align:center;">${ctaHtml}</div>
          ${fallbackLink}
        </div>
      </div>
      ${footerHtml}
    </div>`;
}

function notifyCreatorHtml(p: NotifyCreatorPayload): string {
  if (p.event === 'signed') {
    return `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1e293b;">
        <h2 style="margin:0 0 8px 0;font-size:22px;">Offert signerad ✅</h2>
        <p style="color:#64748b;margin:0 0 24px 0;">Din offert har signerats!</p>
        <p style="margin:0 0 8px 0;"><strong>${p.offerTitle}</strong> har accepterats och signerats av <strong>${p.recipientName}</strong>.</p>
        <p style="font-size:13px;color:#64748b;margin:16px 0 0 0;">Logga in på plattformen för att se signaturen och ladda ner dokumentet.</p>
      </div>`;
  }
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1e293b;">
      <h2 style="margin:0 0 8px 0;font-size:22px;">Offert avvisad ❌</h2>
      <p style="color:#64748b;margin:0 0 24px 0;">Din offert har avvisats.</p>
      <p style="margin:0 0 8px 0;"><strong>${p.offerTitle}</strong> avvisades av <strong>${p.recipientName}</strong>.</p>
      ${p.comment ? `<p style="margin:8px 0;padding:12px 16px;background:#fef2f2;border-radius:8px;color:#991b1b;font-size:14px;"><strong>Anledning:</strong> ${escapeHtml(p.comment)}</p>` : ''}
    </div>`;
}

function reminderHtml(p: ReminderPayload): string {
  const d = parseDesignConfig(p.emailHeaderConfig);
  const b = d?.body ?? DESIGN_DEFAULTS.body;
  const c = d?.cta ?? DESIGN_DEFAULTS.cta;

  const headerHtml = renderHeader((d ?? DESIGN_DEFAULTS).header);
  const footerHtml = renderFooter((d ?? DESIGN_DEFAULTS).footer);
  const ctaHtml = renderCta(c, p.publicUrl);
  const fallbackLink = `<p style="margin:24px 0 0 0;font-size:12px;color:${b.mutedColor};">Om du inte kan klicka på knappen, kopiera och klistra in denna länk i din webbläsare:<br/><a href="${p.publicUrl}" style="color:${b.mutedColor};">${p.publicUrl}</a></p>`;

  if (p.emailBody) {
    return `
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
    </div>`;
  }

  return `
    <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:${b.bgColor};">
      ${headerHtml}
      <div style="padding:32px 24px;">
        <div style="background:${b.contentBgColor};border-radius:8px;padding:28px 24px;">
          <h2 style="margin:0 0 8px 0;font-size:22px;color:${b.textColor};">Påminnelse om offert</h2>
          <p style="color:${b.mutedColor};margin:0 0 24px 0;">Hej ${p.recipientName},</p>
          <p style="margin:0 0 16px 0;color:${b.textColor};">Vi vill påminna om en offert som väntar på ditt svar: <strong>${p.offerTitle}</strong></p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            <tr><td style="padding:8px 0;color:${b.mutedColor};font-size:14px;">Totalt inkl. moms</td><td style="padding:8px 0;font-weight:700;text-align:right;color:${b.textColor};">${fmtSEK(p.totalIncVat)}</td></tr>
            <tr><td style="padding:8px 0;color:${b.mutedColor};font-size:14px;">Giltig till</td><td style="padding:8px 0;text-align:right;color:${b.textColor};">${fmtDate(p.validUntil)}</td></tr>
          </table>
          <div style="text-align:center;">${ctaHtml}</div>
          ${fallbackLink}
        </div>
      </div>
      ${footerHtml}
    </div>`;
}

// ─── Job registration ──────────────────────────────────────────────────────────

let registered = false;

export function registerOfferEmailJobs(): void {
  if (registered) return;
  registered = true;

  // ── Send offer to recipient ─────────────────────────────────────────────────
  jobQueue.register<SendToRecipientPayload>(
    'offer.email.send_to_recipient',
    async (job) => {
      const p      = job.payload;
      const subject = p.emailSubject || `Offert: ${p.offerTitle}`;
      await sendEmail({ from: fromAddress(p.senderEmail, p.senderName), to: p.recipientEmail, subject, html: sendToRecipientHtml(p) });
      logger.info(TAG, `Sent offer email to ${p.recipientEmail}`, { offerId: p.offerId });
    },
  );

  // ── Notify creator of sign/decline ──────────────────────────────────────────
  jobQueue.register<NotifyCreatorPayload>(
    'offer.email.notify_creator',
    async (job) => {
      const p = job.payload;

      // Resolve creator email from database
      const user = await prisma.user.findUnique({
        where:  { id: p.createdBy },
        select: { email: true },
      });
      if (!user?.email) {
        logger.warn(TAG, `Creator email not found for User ${p.createdBy} — skipping`);
        return;
      }

      const subject = p.event === 'signed'
        ? `Offert signerad: ${p.offerTitle}`
        : `Offert avvisad: ${p.offerTitle}`;
      await sendEmail({ from: fromAddress(p.senderEmail, p.senderName), to: user.email, subject, html: notifyCreatorHtml(p) });
      logger.info(TAG, `Sent creator notification (${p.event}) to ${user.email}`, { offerId: p.offerId });
    },
  );

  // ── Reminder email to recipient ─────────────────────────────────────────────
  jobQueue.register<ReminderPayload>(
    'offer.email.reminder',
    async (job) => {
      const p      = job.payload;
      const subject = p.emailSubject ? `Påminnelse: ${p.emailSubject}` : `Påminnelse: ${p.offerTitle}`;
      await sendEmail({ from: fromAddress(p.senderEmail, p.senderName), to: p.recipientEmail, subject, html: reminderHtml(p) });
      logger.info(TAG, `Sent reminder email to ${p.recipientEmail}`, { offerId: p.offerId });
    },
  );

  logger.info(TAG, 'Offer email job handlers registered');
}
