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
import type {
  SendToRecipientPayload,
  NotifyCreatorPayload,
  ReminderPayload,
} from '../application/offer-email';

const TAG = 'OfferEmailJobs';

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
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
  const { error } = await resend.emails.send(effective);
  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
}

function fromAddress(senderEmail?: string, senderName?: string): string {
  const email = senderEmail || process.env.EMAIL_FROM || 'no-reply@kollegan.ai';
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

// ─── Email header renderer ─────────────────────────────────────────────────────

interface EmailHeaderConfig {
  logoUrl?: string;
  companyName?: string;
  tagline?: string;
  bgColor?: string;
  textColor?: string;
  accentColor?: string;
  alignment?: 'left' | 'center';
  showDivider?: boolean;
}

function renderEmailHeader(configJson?: string): string {
  if (!configJson) return '';
  let cfg: EmailHeaderConfig;
  try { cfg = JSON.parse(configJson); } catch { return ''; }

  const bg    = cfg.bgColor    || '#0f172a';
  const text  = cfg.textColor  || '#ffffff';
  const accent = cfg.accentColor || '#94a3b8';
  const align = cfg.alignment  || 'center';

  const logo = cfg.logoUrl
    ? `<img src="${escapeHtml(cfg.logoUrl)}" alt="" style="max-height:48px;max-width:200px;margin-bottom:12px;" />`
    : '';
  const name = cfg.companyName
    ? `<${align === 'center' ? 'h1' : 'p'} style="margin:0;font-size:20px;font-weight:700;color:${text};">${escapeHtml(cfg.companyName)}</${align === 'center' ? 'h1' : 'p'}>`
    : '';
  const tagline = cfg.tagline
    ? `<p style="margin:4px 0 0 0;font-size:13px;color:${accent};font-weight:400;">${escapeHtml(cfg.tagline)}</p>`
    : '';
  const divider = cfg.showDivider !== false
    ? `<div style="height:3px;background:${accent};opacity:0.3;margin-top:16px;border-radius:2px;"></div>`
    : '';

  return `
    <div style="background:${bg};padding:28px 24px 20px 24px;text-align:${align};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      ${logo}${name}${tagline}${divider}
    </div>`;
}

// ─── Email templates ────────────────────────────────────────────────────────────

function sendToRecipientHtml(p: SendToRecipientPayload): string {
  const header = renderEmailHeader(p.emailHeaderConfig);

  // Use custom email body if provided, wrapped in the standard shell with the signing button
  if (p.emailBody) {
    return `
    <div style="max-width:560px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      ${header}
    <div style="padding:32px 24px;color:#1e293b;">
      ${sanitizeEmailHtml(p.emailBody)}
      <div style="margin-top:24px;">
        <a href="${p.publicUrl}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;">
          Visa &amp; signera offert →
        </a>
      </div>
      <p style="margin:24px 0 0 0;font-size:12px;color:#94a3b8;">
        Om du inte kan klicka på knappen, kopiera och klistra in denna länk i din webbläsare:<br/>
        <a href="${p.publicUrl}" style="color:#94a3b8;">${p.publicUrl}</a>
      </p>
    </div>
    </div>`;
  }

  // Default email body
  return `
    <div style="max-width:560px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      ${header}
    <div style="padding:32px 24px;color:#1e293b;">
      <h2 style="margin:0 0 8px 0;font-size:22px;">Du har en ny offert</h2>
      <p style="color:#64748b;margin:0 0 24px 0;">Hej ${p.recipientName},</p>
      <p style="margin:0 0 16px 0;">Du har tagit emot en offert: <strong>${p.offerTitle}</strong></p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">Totalt inkl. moms</td><td style="padding:8px 0;font-weight:700;text-align:right;">${fmtSEK(p.totalIncVat)}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">Giltig till</td><td style="padding:8px 0;text-align:right;">${fmtDate(p.validUntil)}</td></tr>
      </table>
      <a href="${p.publicUrl}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;">
        Visa &amp; signera offert →
      </a>
      <p style="margin:24px 0 0 0;font-size:12px;color:#94a3b8;">
        Om du inte kan klicka på knappen, kopiera och klistra in denna länk i din webbläsare:<br/>
        <a href="${p.publicUrl}" style="color:#94a3b8;">${p.publicUrl}</a>
      </p>
    </div>
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
  const header = renderEmailHeader(p.emailHeaderConfig);

  // Use custom email body if provided
  if (p.emailBody) {
    return `
    <div style="max-width:560px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      ${header}
    <div style="padding:32px 24px;color:#1e293b;">
      ${sanitizeEmailHtml(p.emailBody)}
      <div style="margin-top:24px;">
        <a href="${p.publicUrl}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;">
          Visa &amp; signera offert →
        </a>
      </div>
      <p style="margin:24px 0 0 0;font-size:12px;color:#94a3b8;">
        Om du inte kan klicka på knappen, kopiera och klistra in denna länk i din webbläsare:<br/>
        <a href="${p.publicUrl}" style="color:#94a3b8;">${p.publicUrl}</a>
      </p>
    </div>
    </div>`;
  }

  return `
    <div style="max-width:560px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      ${header}
    <div style="padding:32px 24px;color:#1e293b;">
      <h2 style="margin:0 0 8px 0;font-size:22px;">Påminnelse om offert</h2>
      <p style="color:#64748b;margin:0 0 24px 0;">Hej ${p.recipientName},</p>
      <p style="margin:0 0 16px 0;">Vi vill påminna om en offert som väntar på ditt svar: <strong>${p.offerTitle}</strong></p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">Totalt inkl. moms</td><td style="padding:8px 0;font-weight:700;text-align:right;">${fmtSEK(p.totalIncVat)}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">Giltig till</td><td style="padding:8px 0;text-align:right;">${fmtDate(p.validUntil)}</td></tr>
      </table>
      <a href="${p.publicUrl}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;">
        Visa &amp; signera offert →
      </a>
      <p style="margin:24px 0 0 0;font-size:12px;color:#94a3b8;">
        Om du inte kan klicka på knappen, kopiera och klistra in denna länk i din webbläsare:<br/>
        <a href="${p.publicUrl}" style="color:#94a3b8;">${p.publicUrl}</a>
      </p>
    </div>
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
