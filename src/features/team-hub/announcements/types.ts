/**
 * Announcements — Internal team communications
 *
 * Pinned notices, company updates, policy changes.
 * Scoped to a workspace. Can optionally mirror to Slack.
 */

export type AnnouncementPriority = 'normal' | 'important' | 'urgent';

export interface Announcement {
  id: string;
  workspaceId: string;
  title: string;
  content: string;              // Markdown
  priority: AnnouncementPriority;
  isPinned: boolean;
  authorId: string;             // StaffUser.id
  targetAudience?: string[];    // StaffUser role filter (null = everyone)
  publishedAt: string;
  expiresAt?: string;
  slackMessageTs?: string;      // Slack message TS if mirrored
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementRead {
  announcementId: string;
  userId: string;
  readAt: string;
}
