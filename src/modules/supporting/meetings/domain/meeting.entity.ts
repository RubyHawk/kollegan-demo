/**
 * Meetings Module — Domain Types
 *
 * Core types for the meetings bounded context:
 *  - Meeting lifecycle: scheduled -> in_progress -> completed | cancelled
 *  - Participants: internal (userId) or external (name + email)
 *  - AI-generated meeting summaries with key decisions and next steps
 */

export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export type MeetingProvider = 'daily' | 'google_meet' | 'zoom' | 'manual';

export type MeetingSummaryStatus = 'pending' | 'generating' | 'completed' | 'failed';

export interface MeetingParticipant {
  id: string;
  meetingId: string;
  userId: string | null;
  name: string;
  email: string | null;
}

export interface MeetingSummary {
  id: string;
  meetingId: string;
  status: MeetingSummaryStatus;
  model: string;
  summary: string | null;
  keyDecisions: string[];
  nextSteps: string | null;
  generatedAt: string | null;
  errorMessage: string | null;
}

export interface Meeting {
  id: string;
  organizationId: string;
  title: string;
  status: MeetingStatus;
  provider: MeetingProvider;
  meetingUrl: string | null;
  agenda: string | null;
  scheduledAt: string;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  participants: MeetingParticipant[];
  summary: MeetingSummary | null;
}
