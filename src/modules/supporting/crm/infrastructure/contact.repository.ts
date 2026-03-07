import { prisma } from '@platform/database/prisma';

// ─── Customer queries ──────────────────────────────────────────────────────────

export type CustomerWithHistory = Awaited<ReturnType<typeof findCustomerByPhone>>;

/**
 * Find customer by phone number including recent bookings and transcripts.
 */
export async function findCustomerByPhone(phone: string) {
  return prisma.customer.findFirst({
    where: { phone },
    include: {
      bookings:    { orderBy: { createdAt: 'desc' }, take: 10 },
      transcripts: { orderBy: { startedAt: 'desc' }, take: 5 },
    },
  });
}

/**
 * Find customer by name (case-insensitive, partial match).
 */
export async function findCustomerByName(name: string) {
  return prisma.customer.findFirst({
    where: { name: { contains: name, mode: 'insensitive' } },
    include: {
      bookings:    { orderBy: { createdAt: 'desc' }, take: 10 },
      transcripts: { orderBy: { startedAt: 'desc' }, take: 5 },
    },
  });
}

export interface UpsertCustomerData {
  phone?:   string;
  name?:    string;
  email?:   string;
  company?: string;
  notes?:   string;
}

/**
 * Creates or updates a customer record.
 * Uses phone as the unique key when available, falls back to email.
 * Increments callCount on each upsert.
 */
export async function upsertCustomer(data: UpsertCustomerData) {
  // No unique key available — create a new record
  if (!data.phone && !data.email) {
    return prisma.customer.create({
      data: { ...data, callCount: 1 },
    });
  }

  // Upsert by phone (preferred) or email
  const whereKey = data.phone ? { phone: data.phone } : { phone: data.email ?? '' };

  return prisma.customer.upsert({
    where:  whereKey,
    create: { ...data, callCount: 1 },
    update: {
      name:      data.name      ?? undefined,
      email:     data.email     ?? undefined,
      company:   data.company   ?? undefined,
      notes:     data.notes     ?? undefined,
      callCount: { increment: 1 },
    },
  });
}

// ─── CRM record queries ────────────────────────────────────────────────────────

export interface CreateCrmRecordData {
  name?:        string;
  phone?:       string;
  email?:       string;
  company?:     string;
  notes?:       string;
  summary?:     string;
  bookedRooms?: string[];
  customerId?:  string;
}

export async function createCrmRecord(data: CreateCrmRecordData) {
  return prisma.crmRecord.create({
    data: {
      name:        data.name,
      phone:       data.phone,
      email:       data.email,
      company:     data.company,
      notes:       data.notes,
      summary:     data.summary,
      bookedRooms: data.bookedRooms ?? [],
      customerId:  data.customerId,
    },
  });
}

// ─── Booking queries ───────────────────────────────────────────────────────────

/**
 * Link unowned bookings (customerId = null) to a customer.
 */
export async function linkBookingsToCustomer(roomIds: string[], customerId: string) {
  return prisma.hotelBooking.updateMany({
    where: { roomId: { in: roomIds }, customerId: null },
    data:  { customerId },
  });
}

// ─── Call transcript queries ───────────────────────────────────────────────────

/**
 * Upsert a call transcript record at the start of a call.
 * Returns the transcript with its generated id.
 */
export async function upsertCallTranscript(vapiCallId: string) {
  return prisma.callTranscript.upsert({
    where:  { vapiCallId },
    create: { vapiCallId, startedAt: new Date() },
    update: { startedAt: new Date() },
  });
}

export interface FinaliseTranscriptData {
  customerId?:   string;
  summary?:      string;
  bookedRoomIds?: string[];
}

/**
 * Finalise the call transcript at the end of a call.
 */
export async function finaliseCallTranscript(vapiCallId: string, data: FinaliseTranscriptData) {
  return prisma.callTranscript.updateMany({
    where: { vapiCallId },
    data: {
      customerId: data.customerId,
      summary:    data.summary,
      endedAt:    new Date(),
      ...(data.bookedRoomIds?.length ? { bookingsMade: data.bookedRoomIds } : {}),
    },
  });
}
