import { Resend } from 'resend';
import { logger } from '@platform/logging/logger';
import { BRAND_EMAIL_FALLBACK } from '@shared/branding';

const TAG = 'OfferEmailDispatch';
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

export async function sendEmail(opts: { from: string; to: string; subject: string; html: string }): Promise<void> {
  const resend = getResend();
  if (!resend) {
    logger.info(
      TAG,
      `[DEV] Email not sent - RESEND_API_KEY missing. Would have sent:\n  To: ${opts.to}\n  Subject: ${opts.subject}\n  URL: ${opts.html.match(/href="([^"]+)"/)?.[1] ?? '(no link)'}`
    );
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

export function fromAddress(senderEmail?: string, senderName?: string): string {
  const email = senderEmail || process.env.EMAIL_FROM || BRAND_EMAIL_FALLBACK;
  if (senderName) return `${senderName} <${email}>`;
  return email;
}
