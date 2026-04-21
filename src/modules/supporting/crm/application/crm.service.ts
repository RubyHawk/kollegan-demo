import { logger } from '@platform/logging/logger';
import { eventBus } from '@platform/events';
import {
  findCustomerByPhone,
  findCustomerByName,
  upsertCustomer,
  createCrmRecord,
  linkBookingsToCustomer,
  upsertCallTranscript,
  finaliseCallTranscript,
} from '../infrastructure/contact.repository';
import { CRM_CONTACT_UPSERTED, CRM_RECORD_CREATED } from '../events/contact.events';
import type { CrmContactUpsertedEvent, CrmRecordCreatedEvent } from '../events/contact.events';
import type { CrmContact } from '../domain/contact.entity';

const DEMO_ORG_ID = process.env.DEMO_ORG_ID ?? 'demo';
const TAG = 'CrmService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CustomerLookupResult {
  found: boolean;
  customer: Awaited<ReturnType<typeof findCustomerByPhone>> | null;
}

export interface CrmUpdateInput {
  name?:         string;
  phone?:        string;
  email?:        string;
  company?:      string;
  notes?:        string;
  summary?:      string;
  bookedRoomIds?: string[];
  vapiCallId?:   string;
}

export interface CrmUpdateResult {
  success:      boolean;
  message:      string;
  customerId?:  string;
  crmRecordId?: string;
}

// ─── lookupCustomer ───────────────────────────────────────────────────────────

/**
 * Looks up a customer by phone number or name.
 * Returns found=false if neither is provided or no match exists.
 */
export async function lookupCustomer(
  params: { phone?: string; name?: string }
): Promise<CustomerLookupResult> {
  if (!params.phone && !params.name) {
    return { found: false, customer: null };
  }

  const customer = params.phone
    ? await findCustomerByPhone(params.phone)
    : await findCustomerByName(params.name!);

  return { found: !!customer, customer };
}

// ─── updateCrm ────────────────────────────────────────────────────────────────

/**
 * Creates or updates a CRM record for a completed call.
 *
 * - Upserts the customer profile in PostgreSQL
 * - Creates a CRM record for this call session
 * - Links existing room bookings to the customer
 * - Updates the call transcript if vapiCallId is provided
 * - Logs to the dashboard activity feed (SSE broadcast)
 */
export async function updateCrm(input: CrmUpdateInput): Promise<CrmUpdateResult> {
  if (!input.name && !input.phone && !input.email) {
    return {
      success: false,
      message: 'Minst ett av name, phone eller email krävs.',
    };
  }

  const customer = await upsertCustomer({
    phone:   input.phone,
    name:    input.name,
    email:   input.email,
    company: input.company,
    notes:   input.notes,
  });

  // Auto-create a lead for new customers identified from voice calls (Phase 3)
  const isNewCustomer = customer.callCount === 1;
  if (isNewCustomer && (input.name ?? input.phone ?? input.email)) {
    const { createLead } = await import('@modules/supporting/leads');
    await createLead(
      {
        organizationId: DEMO_ORG_ID,
        name:           input.name ?? input.email ?? input.phone ?? 'Unknown',
        email:          input.email,
        phone:          input.phone,
        company:        input.company,
        notes:          input.summary ?? input.notes,
        source:         'voice_call',
      },
      'system',
    ).catch((err: unknown) => logger.error(TAG, 'Auto-lead creation failed', { error: err }));
  }

  // callCount === 1 means this is a newly created customer (upsert created it)
  eventBus.publish<CrmContactUpsertedEvent>({
    type:       CRM_CONTACT_UPSERTED,
    orgId:      DEMO_ORG_ID,
    occurredAt: new Date().toISOString(),
    payload: {
      customerId: customer.id,
      name:  input.name,
      phone: input.phone,
      email: input.email,
      isNew: customer.callCount === 1,
    },
  });

  const crmRecord = await createCrmRecord({
    name:        input.name,
    phone:       input.phone,
    email:       input.email,
    company:     input.company,
    notes:       input.notes,
    summary:     input.summary,
    bookedRooms: input.bookedRoomIds,
    customerId:  customer.id,
  });

  // Link unowned bookings to this customer
  if (input.bookedRoomIds?.length) {
    await linkBookingsToCustomer(input.bookedRoomIds, customer.id);
  }

  // Finalise call transcript
  if (input.vapiCallId) {
    await finaliseCallTranscript(input.vapiCallId, {
      customerId:    customer.id,
      summary:       input.summary,
      bookedRoomIds: input.bookedRoomIds,
    });
  }

  const displayName = input.name ?? input.email ?? input.phone ?? 'Okänd gäst';
  const contact: CrmContact = {
    name:    input.name,
    email:   input.email,
    phone:   input.phone,
    company: input.company,
    notes:   input.notes,
    summary: input.summary,
  };

  eventBus.publish<CrmRecordCreatedEvent>({
    type:       CRM_RECORD_CREATED,
    orgId:      DEMO_ORG_ID,
    occurredAt: new Date().toISOString(),
    payload: {
      crmRecordId: crmRecord.id,
      customerId:  customer.id,
      vapiCallId:  input.vapiCallId,
      bookedRooms: input.bookedRoomIds ?? [],
      displayName,
      summary:     input.summary,
      contact,
    },
  });

  logger.info(TAG, `CRM updated for ${displayName}`, { customerId: customer.id });

  return {
    success:     true,
    message:     `CRM uppdaterad för ${displayName}.`,
    customerId:  customer.id,
    crmRecordId: crmRecord.id,
  };
}

// ─── startCallTranscript ──────────────────────────────────────────────────────

/**
 * Called at the start of a VAPI call to create a transcript record.
 * Returns the transcriptId for use in subsequent CRM update.
 */
export async function startCallTranscript(
  vapiCallId: string
): Promise<{ transcriptId: string }> {
  const transcript = await upsertCallTranscript(vapiCallId);
  logger.info(TAG, `Transcript started for call ${vapiCallId}`, { transcriptId: transcript.id });
  return { transcriptId: transcript.id };
}
