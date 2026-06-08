/**
 * Invoice send email — minimal, self-contained Resend dispatch.
 *
 * Self-contained inside the invoicing module (no offers import). There is no
 * shared platform sender, so this replicates the offers Resend pattern at the
 * minimum needed for invoicing: a no-op when `RESEND_API_KEY` is missing, the
 * `RESEND_TEST_TO` redirect override, and an onboarding-sender fallback when the
 * configured domain is unverified. The email is plain Swedish copy with a link
 * to the authenticated invoice PDF route.
 */

import { Resend } from 'resend';
import { logger } from '@platform/logging/logger';
import { escapeHtml } from '@platform/security/sanitize';
import { BRAND_EMAIL_FALLBACK, BRAND_NAME } from '@shared/branding';

const TAG = 'InvoiceEmail';
const RESEND_ONBOARDING_FROM = process.env.RESEND_ONBOARDING_FROM || 'onboarding@resend.dev';

export interface InvoiceEmailInput {
  to: string;
  invoiceNumber: number | null;
  recipientName: string;
  sellerName: string;
  senderEmail?: string | null;
  senderName?: string | null;
  /** Inc-VAT total, used in the email body. */
  totalIncVat: number;
  currency: string;
  /** 'YYYY-MM-DD' due date. */
  dueDate: string;
  /** Absolute URL to the authenticated invoice PDF route. */
  pdfUrl: string;
  documentType: string;
}

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

function fromAddress(senderEmail?: string | null, senderName?: string | null): string {
  const email = senderEmail || process.env.EMAIL_FROM || BRAND_EMAIL_FALLBACK;
  return senderName ? `${senderName} <${email}>` : email;
}

function formatMoney(amount: number, currency: string): string {
  const value = new Intl.NumberFormat('sv-SE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
  const code = (currency || 'SEK').toUpperCase();
  if (code === 'EUR') return `${value} €`;
  if (code === 'SEK' || code === 'NOK' || code === 'DKK') return `${value} kr`;
  return `${value} ${code}`;
}

function formatDate(value: string): string {
  const date = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('sv-SE', { day: '2-digit', month: 'long', year: 'numeric' });
}

function buildInvoiceEmailHtml(input: InvoiceEmailInput): string {
  const heading = input.documentType === 'credit_note' ? 'Kreditfaktura' : 'Faktura';
  const number = input.invoiceNumber != null ? String(input.invoiceNumber) : '';
  const title = number ? `${heading} ${escapeHtml(number)}` : heading;
  return `<!doctype html>
<html lang="sv" dir="ltr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f1f5f9;">
    <div style="max-width:600px;margin:0 auto;padding:32px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1e293b;">
      <div style="background:#ffffff;border-radius:8px;padding:28px 24px;border:1px solid #e2e8f0;">
        <h1 style="margin:0 0 8px;font-size:20px;color:#1f2d44;">${title}</h1>
        <p style="margin:0 0 20px;color:#64748b;">Hej ${escapeHtml(input.recipientName || '')},</p>
        <p style="margin:0 0 16px;line-height:1.6;">Du har fått en ${escapeHtml(heading.toLowerCase())} från <strong>${escapeHtml(input.sellerName)}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:0 0 24px;font-size:14px;">
          <tr><td style="padding:8px 0;color:#64748b;">Att betala</td><td style="padding:8px 0;text-align:right;font-weight:700;">${formatMoney(input.totalIncVat, input.currency)}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Förfallodatum</td><td style="padding:8px 0;text-align:right;">${escapeHtml(formatDate(input.dueDate))}</td></tr>
        </table>
        <p style="margin:0 0 12px;line-height:1.6;">Klicka på länken nedan för att öppna och ladda ner ${escapeHtml(heading.toLowerCase())}n som PDF:</p>
        <p style="margin:0 0 8px;"><a href="${input.pdfUrl}" target="_blank" rel="noopener noreferrer" style="color:#1f3a63;font-weight:600;word-break:break-all;">${escapeHtml(input.pdfUrl)}</a></p>
      </div>
      <p style="margin:20px 0 0;text-align:center;font-size:11px;color:#94a3b8;">Skickat via ${escapeHtml(BRAND_NAME)}</p>
    </div>
  </body>
</html>`;
}

async function send(opts: { from: string; to: string; subject: string; html: string }): Promise<void> {
  const resend = getResend();
  if (!resend) {
    logger.info(
      TAG,
      `[DEV] Invoice email not sent — RESEND_API_KEY missing. Would have sent:\n  To: ${opts.to}\n  Subject: ${opts.subject}`,
    );
    return;
  }

  const testTo = process.env.RESEND_TEST_TO;
  const effective = testTo ? { ...opts, to: testTo } : opts;
  if (testTo) {
    logger.info(TAG, `[DEV] Redirecting invoice email to test address ${testTo} (original: ${opts.to})`);
  }

  const firstAttempt = await resend.emails.send(effective);
  if (!firstAttempt.error) return;

  const currentMailbox = extractMailbox(effective.from).toLowerCase();
  const canRetryWithOnboarding =
    isUnverifiedDomainError(firstAttempt.error) &&
    currentMailbox !== RESEND_ONBOARDING_FROM.toLowerCase();

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

/**
 * Master switch for invoice email delivery. Disabled by default so issuing an
 * invoice freezes the PDF and assigns the gapless number WITHOUT emailing the
 * customer — the wiring is fully connected but no mail leaves the system until an
 * operator explicitly opts in with `INVOICE_EMAIL_ENABLED=true`. Independent of
 * the offers email flow, which is unaffected.
 */
function invoiceEmailEnabled(): boolean {
  return process.env.INVOICE_EMAIL_ENABLED === 'true';
}

/** Sends the issued invoice to its recipient with a link to the PDF route. */
export async function sendInvoiceEmail(input: InvoiceEmailInput): Promise<void> {
  if (!invoiceEmailEnabled()) {
    logger.info(
      TAG,
      `Invoice email suppressed — INVOICE_EMAIL_ENABLED not set; no mail sent to ${input.to}`,
      { invoiceNumber: input.invoiceNumber },
    );
    return;
  }

  const heading = input.documentType === 'credit_note' ? 'Kreditfaktura' : 'Faktura';
  const subject = input.invoiceNumber != null
    ? `${heading} ${input.invoiceNumber}`
    : heading;
  await send({
    from: fromAddress(input.senderEmail, input.senderName),
    to: input.to,
    subject,
    html: buildInvoiceEmailHtml(input),
  });
  logger.info(TAG, `Sent invoice email to ${input.to}`, { invoiceNumber: input.invoiceNumber });
}
