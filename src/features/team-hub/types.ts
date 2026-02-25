/**
 * Team Hub Module — Types
 *
 * Future ERP module for internal team collaboration.
 *
 * Planned integrations:
 *  - GitHub: PRs, issues, CI status per team
 *  - Slack: Channel feed, notifications, bot commands
 *  - Video calls: Meeting scheduling + AI-generated summaries
 *  - Internal announcements and pinned notes
 *  - Team member presence/status
 */

// ── GitHub Integration ────────────────────────────────────────────────────────

export interface GitHubPullRequest {
  id: number;
  title: string;
  url: string;
  author: string;
  status: 'open' | 'merged' | 'closed';
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GitHubIssue {
  id: number;
  title: string;
  url: string;
  author: string;
  status: 'open' | 'closed';
  labels: string[];
  assignee?: string;
  createdAt: string;
}

// ── Slack Integration ─────────────────────────────────────────────────────────

export interface SlackMessage {
  id: string;
  channel: string;
  author: string;
  text: string;
  timestamp: string;
  reactions?: { emoji: string; count: number }[];
}

// ── Meetings / Video Calls ────────────────────────────────────────────────────

export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface Meeting {
  id: string;
  title: string;
  status: MeetingStatus;
  participants: string[];       // StaffUser IDs
  scheduledAt: string;
  durationMinutes: number;
  recordingUrl?: string;
  transcript?: string;          // Raw transcript text
  aiSummary?: string;           // AI-generated meeting summary
  actionItems?: string[];       // Extracted action items
  createdBy: string;
  createdAt: string;
}

// ── Team Announcements ────────────────────────────────────────────────────────

export interface TeamAnnouncement {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  author: string;
  createdAt: string;
  expiresAt?: string;
}
