// ─── Meeting domain events ────────────────────────────────────────────────────
// Published by meeting.service on every significant state change.
// Subscribers: automation module (triggers), audit module (logging).
//
// Type strings follow the platform convention: {domain}.{aggregate}.{verb}

export const MEETING_CREATED        = 'meetings.meeting.created' as const;
export const MEETING_UPDATED        = 'meetings.meeting.updated' as const;
export const MEETING_STATUS_CHANGED = 'meetings.meeting.status_changed' as const;
export const MEETING_DELETED        = 'meetings.meeting.deleted' as const;

export interface MeetingCreatedEvent {
  type: typeof MEETING_CREATED;
  orgId: string;
  occurredAt: string;
  payload: {
    meetingId: string;
    title: string;
    provider: string;
    scheduledAt: string;
    createdBy: string;
  };
}

export interface MeetingUpdatedEvent {
  type: typeof MEETING_UPDATED;
  orgId: string;
  occurredAt: string;
  payload: {
    meetingId: string;
    actorId: string;
  };
}

export interface MeetingStatusChangedEvent {
  type: typeof MEETING_STATUS_CHANGED;
  orgId: string;
  occurredAt: string;
  payload: {
    meetingId: string;
    fromStatus: string;
    toStatus: string;
    actorId: string;
  };
}

export interface MeetingDeletedEvent {
  type: typeof MEETING_DELETED;
  orgId: string;
  occurredAt: string;
  payload: {
    meetingId: string;
    actorId: string;
  };
}

export type MeetingEvent =
  | MeetingCreatedEvent
  | MeetingUpdatedEvent
  | MeetingStatusChangedEvent
  | MeetingDeletedEvent;
