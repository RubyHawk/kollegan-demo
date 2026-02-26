/**
 * Meetings — Video calls with AI-generated summaries
 *
 * Data flow:
 *  1. Meeting scheduled (manual or via calendar sync)
 *  2. Call happens (Daily.co, Google Meet, Zoom — provider-agnostic)
 *  3. Recording uploaded to S3-compatible storage
 *  4. Transcription job triggered (Whisper / Deepgram)
 *  5. AI summary generated (Claude API) → stored in Meeting model
 *  6. Action items extracted → optionally synced to GitHub issues
 *  7. Summary sent to Slack channel (if configured)
 *
 * The AI pipeline (steps 3–6) runs async via n8n workflow,
 * NOT in the request path. Meeting creation is instant;
 * summary appears when the pipeline completes.
 */

export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type MeetingProvider = 'daily' | 'google_meet' | 'zoom' | 'manual';
export type TranscriptionStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type SummaryStatus = 'pending' | 'generating' | 'completed' | 'failed';

export interface Meeting {
  id: string;
  workspaceId: string;
  title: string;
  status: MeetingStatus;
  provider: MeetingProvider;
  meetingUrl?: string;           // Join link
  recordingUrl?: string;         // S3 recording URL
  participants: MeetingParticipant[];
  scheduledAt: string;
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  createdBy: string;             // StaffUser.id
  createdAt: string;
}

export interface MeetingParticipant {
  userId: string;                // StaffUser.id (or null for external)
  name: string;
  email?: string;
  joinedAt?: string;
  leftAt?: string;
}

export interface MeetingTranscript {
  id: string;
  meetingId: string;
  workspaceId: string;
  status: TranscriptionStatus;
  provider: 'whisper' | 'deepgram' | 'assembly_ai';
  rawText?: string;              // Full transcript text
  segments?: TranscriptSegment[];
  processingStartedAt?: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface TranscriptSegment {
  speaker?: string;
  startMs: number;
  endMs: number;
  text: string;
}

export interface MeetingSummary {
  id: string;
  meetingId: string;
  workspaceId: string;
  status: SummaryStatus;
  model: string;                 // e.g. 'claude-3-5-sonnet-20241022'
  summary?: string;              // 2–4 paragraph narrative summary
  keyDecisions?: string[];       // Bullet list of decisions made
  actionItems?: ActionItem[];
  nextSteps?: string;            // Free-form next steps
  generatedAt?: string;
  errorMessage?: string;
}

export interface ActionItem {
  id: string;
  text: string;
  assignee?: string;             // Name or user ID
  dueDate?: string;
  isCompleted: boolean;
  githubIssueUrl?: string;       // If synced to GitHub
}
