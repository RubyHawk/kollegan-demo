import { prisma } from '@core/database/prisma';
import { logActivity } from '@features/hotel/rooms/lib/room-store';
import { upsertCustomer } from './customers';
import type { CRMContact } from '@features/crm/types';
import { eventBus } from '@core/events';
import {
  CRM_CONTACT_UPSERTED,
  CRM_RECORD_CREATED,
} from '@features/crm/events';
import type {
  CrmContactUpsertedEvent,
  CrmRecordCreatedEvent,
} from '@features/crm/events';

const DEMO_ORG_ID = process.env.DEMO_ORG_ID ?? 'demo';

export interface CRMUpdateInput {
  name?: string;
  phone?: string;
  email?: string;
  company?: string;
  notes?: string;
  summary?: string;
  bookedRoomIds?: string[];
  vapiCallId?: string;
}

export interface CRMUpdateResult {
  success: boolean;
  message: string;
  customerId?: string;
  crmRecordId?: string;
}

/**
 * Creates or updates a CRM record for a completed call.
 *
 * - Upserts the customer profile in PostgreSQL
 * - Creates a CRM record for this call session
 * - Links existing room bookings to the customer
 * - Updates the call transcript if vapiCallId is provided
 * - Logs to the dashboard activity feed (SSE broadcast)
 */
export async function updateCRM(input: CRMUpdateInput): Promise<CRMUpdateResult> {
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

  // callCount === 1 means this is a newly created customer (upsert created it)
  eventBus.publish<CrmContactUpsertedEvent>({
    type: CRM_CONTACT_UPSERTED,
    orgId: DEMO_ORG_ID,
    occurredAt: new Date().toISOString(),
    payload: {
      customerId: customer.id,
      name:  input.name,
      phone: input.phone,
      email: input.email,
      isNew: customer.callCount === 1,
    },
  });

  const crmRecord = await prisma.crmRecord.create({
    data: {
      name:        input.name,
      phone:       input.phone,
      email:       input.email,
      company:     input.company,
      notes:       input.notes,
      summary:     input.summary,
      bookedRooms: input.bookedRoomIds ?? [],
      customerId:  customer.id,
    },
  });

  // Link unowned bookings to this customer
  if (input.bookedRoomIds?.length) {
    await prisma.hotelBooking.updateMany({
      where: { roomId: { in: input.bookedRoomIds }, customerId: null },
      data:  { customerId: customer.id },
    });
  }

  // Finalise call transcript
  if (input.vapiCallId) {
    await prisma.callTranscript.updateMany({
      where: { vapiCallId: input.vapiCallId },
      data: {
        customerId: customer.id,
        summary:    input.summary,
        endedAt:    new Date(),
        ...(input.bookedRoomIds?.length ? { bookingsMade: input.bookedRoomIds } : {}),
      },
    });
  }

  // Broadcast to dashboard activity feed
  const displayName = input.name ?? input.email ?? input.phone ?? 'Okänd gäst';
  const contact: CRMContact = {
    name:    input.name,
    email:   input.email,
    phone:   input.phone,
    company: input.company,
    notes:   input.notes,
    summary: input.summary,
  };

  logActivity({
    type:    'crm_contact',
    message: input.summary
      ? `Kundprofil: ${displayName} — ${input.summary}`
      : `Kundprofil insamlad för ${displayName}.`,
    metadata: contact,
  });

  eventBus.publish<CrmRecordCreatedEvent>({
    type: CRM_RECORD_CREATED,
    orgId: DEMO_ORG_ID,
    occurredAt: new Date().toISOString(),
    payload: {
      crmRecordId: crmRecord.id,
      customerId:  customer.id,
      vapiCallId:  input.vapiCallId,
      bookedRooms: input.bookedRoomIds ?? [],
    },
  });

  return {
    success:     true,
    message:     `CRM uppdaterad för ${displayName}.`,
    customerId:  customer.id,
    crmRecordId: crmRecord.id,
  };
}
