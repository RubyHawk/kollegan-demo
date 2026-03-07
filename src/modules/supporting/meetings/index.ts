/**
 * Meetings Module — Team Hub
 *
 * Meeting lifecycle: scheduled -> in_progress -> completed | cancelled
 * Supports multiple providers: Daily, Google Meet, Zoom, Manual
 * AI-generated meeting summaries with key decisions and next steps
 */

export type {
  Meeting,
  MeetingParticipant,
  MeetingSummary,
  MeetingStatus,
  MeetingProvider,
  MeetingSummaryStatus,
} from './domain/meeting.entity';

export {
  createMeeting,
  getMeeting,
  listMeetings,
  updateMeeting,
  deleteMeeting,
} from './application/meeting.service';
export type { CreateMeetingInput, UpdateMeetingInput, ListMeetingsFilter } from './application/meeting.service';

export {
  MEETING_CREATED,
  MEETING_UPDATED,
  MEETING_STATUS_CHANGED,
  MEETING_DELETED,
} from './events/meeting.events';
export type {
  MeetingEvent,
  MeetingCreatedEvent,
  MeetingUpdatedEvent,
  MeetingStatusChangedEvent,
  MeetingDeletedEvent,
} from './events/meeting.events';

// ── API Handlers ─────────────────────────────────────────────────────────────
export {
  handleListMeetings,
  handleCreateMeeting,
  handleGetMeeting,
  handleUpdateMeeting,
  handleDeleteMeeting,
} from './api/handlers/meeting.handler';
