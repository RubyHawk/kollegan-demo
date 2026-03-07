/**
 * Meetings service — Team Hub meetings lifecycle.
 *
 * Meeting lifecycle:
 *   scheduled -> in_progress -> completed | cancelled
 *
 * Every significant state change publishes a domain event for the automation module.
 */

import { eventBus } from '@platform/events';
import { logger } from '@platform/logging/logger';
import { meetingRepository } from '../infrastructure/meeting.repository';
import type { CreateMeetingInput, UpdateMeetingInput, ListMeetingsFilter } from '../infrastructure/meeting.repository';
import type { Meeting, MeetingStatus } from '../domain/meeting.entity';
import {
  MEETING_CREATED,
  MEETING_UPDATED,
  MEETING_STATUS_CHANGED,
  MEETING_DELETED,
} from '../events/meeting.events';

export type { Meeting };
export type { CreateMeetingInput, UpdateMeetingInput, ListMeetingsFilter };

const TAG = 'MeetingService';

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createMeeting(input: CreateMeetingInput): Promise<Meeting> {
  const meeting = await meetingRepository.create(input);

  eventBus.publish({
    type:       MEETING_CREATED,
    orgId:      meeting.organizationId,
    occurredAt: new Date().toISOString(),
    payload: {
      meetingId:   meeting.id,
      title:       meeting.title,
      provider:    meeting.provider,
      scheduledAt: meeting.scheduledAt,
      createdBy:   meeting.createdBy,
    },
  });

  logger.info(TAG, `Meeting created: ${meeting.title}`, { meetingId: meeting.id, provider: meeting.provider });
  return meeting;
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getMeeting(id: string, orgId: string): Promise<Meeting | null> {
  return meetingRepository.findById(id, orgId);
}

export async function listMeetings(
  orgId: string,
  filter: ListMeetingsFilter = {},
): Promise<{ meetings: Meeting[]; total: number }> {
  const [meetings, total] = await Promise.all([
    meetingRepository.list(orgId, filter),
    meetingRepository.count(orgId, filter),
  ]);
  return { meetings, total };
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateMeeting(
  id: string,
  orgId: string,
  input: UpdateMeetingInput,
  actorId: string,
): Promise<Meeting | null> {
  const existing = await meetingRepository.findById(id, orgId);
  if (!existing) return null;

  const updated = await meetingRepository.update(id, orgId, input);
  if (!updated) return null;

  // Publish status-change event if status was modified
  if (input.status && input.status !== existing.status) {
    eventBus.publish({
      type:       MEETING_STATUS_CHANGED,
      orgId,
      occurredAt: new Date().toISOString(),
      payload: {
        meetingId:  id,
        fromStatus: existing.status,
        toStatus:   input.status,
        actorId,
      },
    });
  }

  eventBus.publish({
    type:       MEETING_UPDATED,
    orgId,
    occurredAt: new Date().toISOString(),
    payload:    { meetingId: id, actorId },
  });

  logger.info(TAG, `Meeting updated: ${id}`, { actorId });
  return updated;
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteMeeting(id: string, orgId: string, actorId: string): Promise<boolean> {
  const deleted = await meetingRepository.softDelete(id, orgId);
  if (deleted) {
    eventBus.publish({
      type:       MEETING_DELETED,
      orgId,
      occurredAt: new Date().toISOString(),
      payload:    { meetingId: id, actorId },
    });
    logger.info(TAG, `Meeting soft-deleted: ${id}`, { actorId });
  }
  return deleted;
}
