/**
 * Reservation guest email — minimal, self-contained Resend dispatch.
 *
 * Self-contained inside the restaurant-menu module (mirrors the invoicing module's pattern: a no-op
 * when `RESEND_API_KEY` is missing, a `RESEND_TEST_TO` redirect override, and an onboarding-sender
 * fallback when the configured domain is unverified). Three plain-Swedish templates notify the guest
 * when a booking request is received, confirmed, or declined.
 *
 * Master switch: delivery is OFF unless `RESTAURANT_EMAIL_ENABLED=true`, so the wiring is fully
 * connected but no mail leaves the system until an operator explicitly opts in.
 */

import { Resend } from 'resend';
import { logger } from '@platform/logging/logger';
import { escapeHtml } from '@platform/security/sanitize';
import { BRAND_EMAIL_FALLBACK, BRAND_NAME } from '@shared/branding';

const TAG = 'ReservationEmail';
const RESEND_ONBOARDING_FROM = process.env.RESEND_ONBOARDING_FROM || 'onboarding@resend.dev';

export type ReservationEmailKind = 'received' | 'confirmed' | 'declined';

export interface ReservationEmailInput {
  to: string;
  kind: ReservationEmailKind;
  guestName: string;
  partySize: number;
  /** ISO timestamp of the requested booking time. */
  requestedAt: string;
  restaurantName: string;
  restaurantPhone: string | null;
  /** Reply-to / from mailbox for the restaurant, if configured. */
  senderEmail: string | null;
}

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function restaurantEmailEnabled(): boolean {
  return process.env.RESTAURANT_EMAIL_ENABLED === 'true';
}

function extractMailbox(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return (match ? match[1]! : from).trim();
}

function replaceMailbox(from: string, mailbox: string): string {
  const match = from.match(/^(.*)<[^>]+>\s*$/);
  if (!match) return mailbox;
  const displayName = match[1]!.trim();
  return displayName ? `${displayName} <${mailbox}>` : mailbox;
}

function isUnverifiedDomainError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const message = 'message' in error && typeof error.message === 'string' ? error.message.toLowerCase() : '';
  return message.includes('domain is not verified');
}

function fromAddress(senderEmail: string | null, restaurantName: string): string {
  const email = senderEmail || process.env.EMAIL_FROM || BRAND_EMAIL_FALLBACK;
  return restaurantName ? `${restaurantName} <${email}>` : email;
}

function partyLabel(partySize: number): string {
  return `${partySize} ${partySize === 1 ? 'person' : 'personer'}`;
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('sv-SE', {
    timeZone: 'Europe/Stockholm',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface Copy {
  subject: string;
  heading: string;
  intro: string;
  body: string;
}

export function buildReservationEmailCopy(input: ReservationEmailInput): Copy {
  const when = formatWhen(input.requestedAt);
  const party = partyLabel(input.partySize);
  const phoneSentence = input.restaurantPhone
    ? `Ring oss på ${input.restaurantPhone} så hjälper vi dig att hitta en annan tid.`
    : 'Hör gärna av dig så hjälper vi dig att hitta en annan tid.';

  switch (input.kind) {
    case 'confirmed':
      return {
        subject: `Din bokning hos ${input.restaurantName} är bekräftad`,
        heading: 'Bokningen är bekräftad',
        intro: `Hej ${input.guestName},`,
        body: `Ditt bord för ${party} ${when} är bekräftat. Varmt välkommen till ${input.restaurantName}!`,
      };
    case 'declined':
      return {
        subject: `Angående din bokningsförfrågan hos ${input.restaurantName}`,
        heading: 'Vi kunde tyvärr inte boka',
        intro: `Hej ${input.guestName},`,
        body: `Tyvärr kan vi inte ta emot din bokning för ${party} ${when}. ${phoneSentence}`,
      };
    case 'received':
    default:
      return {
        subject: `Vi har tagit emot din bokningsförfrågan`,
        heading: 'Tack för din förfrågan!',
        intro: `Hej ${input.guestName},`,
        body: `Vi har tagit emot din förfrågan om bord för ${party} ${when}. Vi återkommer snart med en bekräftelse.`,
      };
  }
}

function buildHtml(copy: Copy, restaurantName: string): string {
  return `<!doctype html>
<html lang="sv" dir="ltr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(copy.subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4efe6;">
    <div style="max-width:600px;margin:0 auto;padding:32px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#221a12;">
      <div style="background:#ffffff;border-radius:12px;padding:28px 24px;border:1px solid #e7ddcb;">
        <h1 style="margin:0 0 12px;font-size:20px;color:#221a12;">${escapeHtml(copy.heading)}</h1>
        <p style="margin:0 0 16px;color:#6b5b46;">${escapeHtml(copy.intro)}</p>
        <p style="margin:0 0 20px;line-height:1.6;">${escapeHtml(copy.body)}</p>
      </div>
      <p style="margin:20px 0 0;text-align:center;font-size:11px;color:#a08a6c;">${escapeHtml(restaurantName)} · skickat via ${escapeHtml(BRAND_NAME)}</p>
    </div>
  </body>
</html>`;
}

async function send(opts: { from: string; to: string; subject: string; html: string }): Promise<void> {
  const resend = getResend();
  if (!resend) {
    logger.info(
      TAG,
      `[DEV] Reservation email not sent — RESEND_API_KEY missing. Would have sent:\n  To: ${opts.to}\n  Subject: ${opts.subject}`,
    );
    return;
  }

  const testTo = process.env.RESEND_TEST_TO;
  const effective = testTo ? { ...opts, to: testTo } : opts;
  if (testTo) {
    logger.info(TAG, `[DEV] Redirecting reservation email to test address ${testTo} (original: ${opts.to})`);
  }

  const firstAttempt = await resend.emails.send(effective);
  if (!firstAttempt.error) return;

  const currentMailbox = extractMailbox(effective.from).toLowerCase();
  const canRetryWithOnboarding =
    isUnverifiedDomainError(firstAttempt.error) && currentMailbox !== RESEND_ONBOARDING_FROM.toLowerCase();

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

/** Sends the guest a reservation status email. No-op unless RESTAURANT_EMAIL_ENABLED=true. */
export async function sendReservationEmail(input: ReservationEmailInput): Promise<void> {
  if (!restaurantEmailEnabled()) {
    logger.info(
      TAG,
      `Reservation email suppressed — RESTAURANT_EMAIL_ENABLED not set; no mail sent to ${input.to}`,
      { kind: input.kind },
    );
    return;
  }

  const copy = buildReservationEmailCopy(input);
  await send({
    from: fromAddress(input.senderEmail, input.restaurantName),
    to: input.to,
    subject: copy.subject,
    html: buildHtml(copy, input.restaurantName),
  });
  logger.info(TAG, `Sent reservation ${input.kind} email to ${input.to}`);
}
