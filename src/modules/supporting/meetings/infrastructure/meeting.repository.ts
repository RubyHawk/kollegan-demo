// ─── Meetings repository ──────────────────────────────────────────────────────
// All Prisma access for the meetings module goes through this file.

import { prisma } from '@platform/database/prisma';
import type {
  Meeting,
  MeetingParticipant,
  MeetingSummary,
  MeetingStatus,
  MeetingProvider,
  MeetingSummaryStatus,
} from '../domain/meeting.entity';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateMeetingInput {
  organizationId: string;
  title: string;
  scheduledAt: Date;
  provider: MeetingProvider;
  meetingUrl?: string | null;
  agenda?: string | null;
  createdBy: string;
  participants: { userId?: string | null; name: string; email?: string | null }[];
}

export interface UpdateMeetingInput {
  title?: string;
  status?: MeetingStatus;
  meetingUrl?: string | null;
  agenda?: string | null;
  startedAt?: Date | null;
  endedAt?: Date | null;
  durationSeconds?: number;
}

export interface ListMeetingsFilter {
  status?: MeetingStatus;
  limit?: number;
  offset?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapParticipant(row: Record<string, unknown>): MeetingParticipant {
  return {
    id:        row.id as string,
    meetingId: row.meetingId as string,
    userId:    (row.userId as string | null) ?? null,
    name:      row.name as string,
    email:     (row.email as string | null) ?? null,
  };
}

function mapSummary(row: Record<string, unknown> | null | undefined): MeetingSummary | null {
  if (!row) return null;
  return {
    id:           row.id as string,
    meetingId:    row.meetingId as string,
    status:       row.status as MeetingSummaryStatus,
    model:        row.model as string,
    summary:      (row.summary as string | null) ?? null,
    keyDecisions: (row.keyDecisions as string[]) ?? [],
    nextSteps:    (row.nextSteps as string | null) ?? null,
    generatedAt:  row.generatedAt ? (row.generatedAt as Date).toISOString() : null,
    errorMessage: (row.errorMessage as string | null) ?? null,
  };
}

function mapMeeting(row: Record<string, unknown>): Meeting {
  const participants = Array.isArray(row.participants)
    ? (row.participants as Record<string, unknown>[]).map(mapParticipant)
    : [];
  const summary = row.summary
    ? mapSummary(row.summary as Record<string, unknown>)
    : null;

  return {
    id:              row.id as string,
    organizationId:  row.organizationId as string,
    title:           row.title as string,
    status:          row.status as MeetingStatus,
    provider:        row.provider as MeetingProvider,
    meetingUrl:      (row.meetingUrl as string | null) ?? null,
    agenda:          (row.agenda as string | null) ?? null,
    scheduledAt:     (row.scheduledAt as Date).toISOString(),
    startedAt:       row.startedAt ? (row.startedAt as Date).toISOString() : null,
    endedAt:         row.endedAt ? (row.endedAt as Date).toISOString() : null,
    durationSeconds: (row.durationSeconds as number | null) ?? null,
    createdBy:       row.createdBy as string,
    createdAt:       (row.createdAt as Date).toISOString(),
    updatedAt:       (row.updatedAt as Date).toISOString(),
    participants,
    summary,
  };
}

// ─── Repository ───────────────────────────────────────────────────────────────

export const meetingRepository = {
  async create(input: CreateMeetingInput): Promise<Meeting> {
    const row = await prisma.meeting.create({
      data: {
        organizationId: input.organizationId,
        title:          input.title,
        scheduledAt:    input.scheduledAt,
        provider:       input.provider,
        meetingUrl:     input.meetingUrl ?? null,
        agenda:         input.agenda ?? null,
        createdBy:      input.createdBy,
        participants: {
          create: input.participants.map((p) => ({
            userId: p.userId ?? null,
            name:   p.name,
            email:  p.email ?? null,
          })),
        },
      },
      include: { participants: true, summary: true },
    });
    return mapMeeting(row as unknown as Record<string, unknown>);
  },

  async findById(id: string, orgId: string): Promise<Meeting | null> {
    const row = await prisma.meeting.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      include: { participants: true, summary: true },
    });
    return row ? mapMeeting(row as unknown as Record<string, unknown>) : null;
  },

  async list(
    orgId: string,
    filter: ListMeetingsFilter,
  ): Promise<Meeting[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { organizationId: orgId, deletedAt: null };
    if (filter.status) where.status = filter.status;

    const rows = await prisma.meeting.findMany({
      where,
      orderBy: { scheduledAt: 'desc' },
      take:    filter.limit  ?? 50,
      skip:    filter.offset ?? 0,
      include: { participants: true, summary: true },
    });
    return rows.map((r) => mapMeeting(r as unknown as Record<string, unknown>));
  },

  async count(orgId: string, filter: Omit<ListMeetingsFilter, 'limit' | 'offset'>): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { organizationId: orgId, deletedAt: null };
    if (filter.status) where.status = filter.status;
    return prisma.meeting.count({ where });
  },

  async update(id: string, orgId: string, input: UpdateMeetingInput): Promise<Meeting | null> {
    const existing = await prisma.meeting.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });
    if (!existing) return null;

    const row = await prisma.meeting.update({
      where: { id },
      data: {
        title:           input.title           ?? undefined,
        status:          input.status          ?? undefined,
        meetingUrl:      input.meetingUrl      !== undefined ? input.meetingUrl      : undefined,
        agenda:          input.agenda          !== undefined ? input.agenda          : undefined,
        startedAt:       input.startedAt       !== undefined ? input.startedAt       : undefined,
        endedAt:         input.endedAt         !== undefined ? input.endedAt         : undefined,
        durationSeconds: input.durationSeconds !== undefined ? input.durationSeconds : undefined,
      },
      include: { participants: true, summary: true },
    });
    return mapMeeting(row as unknown as Record<string, unknown>);
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const existing = await prisma.meeting.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });
    if (!existing) return false;
    await prisma.meeting.update({ where: { id }, data: { deletedAt: new Date() } });
    return true;
  },
};
