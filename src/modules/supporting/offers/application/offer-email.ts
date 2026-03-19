/**
 * Offer email service — enqueues transactional emails via the job queue.
 *
 * Never blocks the HTTP response: all email dispatch is async via jobQueue.
 * Actual Resend API call happens in the registered job handler (offer-email.jobs.ts).
 *
 * Email types:
 *   offer.email.send_to_recipient  — sent when offer is dispatched to recipient
 *   offer.email.notify_creator     — sent when recipient signs or declines
 */

import { jobQueue }  from '@platform/queue/job-queue';
import type { Offer } from '../domain/offer.entity';

// ─── Job payload types ─────────────────────────────────────────────────────────

export interface SendToRecipientPayload {
  offerId:       string;
  offerTitle:    string;
  recipientName: string;
  recipientEmail:string;
  publicUrl:     string;
  validUntil:    string;
  totalIncVat:   number;
  emailSubject?: string;  // custom email subject (already interpolated)
  emailBody?:    string;  // custom email body HTML (already interpolated)
  senderEmail?:  string;  // org-level custom sender email
  senderName?:   string;  // org-level custom sender display name
}

export interface NotifyCreatorPayload {
  offerId:      string;
  offerTitle:   string;
  createdBy:    string; // User.id — handler resolves email from DB
  event:        'signed' | 'declined';
  recipientName:string;
  comment?:     string;
  senderEmail?: string;
  senderName?:  string;
}

export interface ReminderPayload {
  offerId:        string;
  offerTitle:     string;
  recipientName:  string;
  recipientEmail: string;
  publicUrl:      string;
  validUntil:     string;
  totalIncVat:    number;
  reminderCount:  number;
  emailSubject?:  string;  // custom email subject (already interpolated)
  emailBody?:     string;  // custom email body HTML (already interpolated)
  senderEmail?:   string;
  senderName?:    string;
}

// ─── Enqueue helpers ───────────────────────────────────────────────────────────

/**
 * Enqueue email to offer recipient with the public signing link.
 * Called from sendOffer() after status is updated.
 */
export async function enqueueOfferEmail(
  offer: Offer,
  publicUrl: string,
  sender?: { senderEmail?: string; senderName?: string },
): Promise<void> {
  const payload: SendToRecipientPayload = {
    offerId:        offer.id,
    offerTitle:     offer.title,
    recipientName:  offer.recipientName,
    recipientEmail: offer.recipientEmail,
    publicUrl,
    validUntil:     offer.validUntil,
    totalIncVat:    offer.totalIncVat,
    emailSubject:   offer.emailSubject,
    emailBody:      offer.emailBody,
    senderEmail:    sender?.senderEmail,
    senderName:     sender?.senderName,
  };
  await jobQueue.add('offer.email.send_to_recipient', payload, { retries: 3 });
}

/**
 * Enqueue reminder email to the offer recipient.
 * Called from sendOfferReminder() after cooldown validation.
 */
export async function enqueueReminderEmail(
  offer: Offer,
  publicUrl: string,
  sender?: { senderEmail?: string; senderName?: string },
): Promise<void> {
  const payload: ReminderPayload = {
    offerId:        offer.id,
    offerTitle:     offer.title,
    recipientName:  offer.recipientName,
    recipientEmail: offer.recipientEmail,
    publicUrl,
    validUntil:     offer.validUntil,
    totalIncVat:    offer.totalIncVat,
    reminderCount:  offer.reminderCount ?? 1,
    emailSubject:   offer.emailSubject,
    emailBody:      offer.emailBody,
    senderEmail:    sender?.senderEmail,
    senderName:     sender?.senderName,
  };
  await jobQueue.add('offer.email.reminder', payload, { retries: 3 });
}

/**
 * Enqueue notification to the offer creator (staff user who created the offer).
 * Called from signOffer() and declineOfferByToken().
 */
export async function enqueueCreatorNotification(
  offer: Offer,
  event: 'signed' | 'declined',
  extra?: { comment?: string; senderEmail?: string; senderName?: string },
): Promise<void> {
  const payload: NotifyCreatorPayload = {
    offerId:       offer.id,
    offerTitle:    offer.title,
    createdBy:     offer.createdBy,
    event,
    recipientName: offer.recipientName,
    comment:       extra?.comment,
    senderEmail:   extra?.senderEmail,
    senderName:    extra?.senderName,
  };
  await jobQueue.add('offer.email.notify_creator', payload, { retries: 3 });
}
