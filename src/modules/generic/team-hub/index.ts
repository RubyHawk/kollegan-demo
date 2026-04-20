/**
 * Team Hub — SaaS collaboration module — public interface.
 *
 * Other modules ONLY import from this file.
 *
 * Layer structure:
 *   domain/         — entity files for all sub-domains
 *   application/    — use cases [Phase 2]
 *   infrastructure/ — adapters [Phase 2]
 *   events/         — publishers/, subscribers/ [Phase 2]
 *   ui/             — pages/ [Phase 3]
 *
 * Sub-domains (organized in domain/ layer):
 *   announcement.entity.ts  — internal comms
 *   meeting.entity.ts       — video calls + AI transcription
 *   workspace.entity.ts     — multi-tenant workspace model
 *   github.entity.ts        — GitHub App integration
 *   slack.entity.ts         — Slack App integration
 */

// Workspace
export type {
  Workspace,
  WorkspaceMember,
  WorkspaceInvite,
  WorkspaceSettings,
  WorkspacePlan,
  WorkspaceMemberRole,
} from './domain/workspace.entity';

// GitHub integration
export type {
  GitHubInstallation,
  GitHubPullRequest,
  GitHubIssue,
  GitHubCIRun,
  PRStatus,
  CIStatus,
} from './domain/github.entity';

// Slack integration
export type {
  SlackInstallation,
  SlackChannel,
  SlackMessage,
  SlackNotificationRule,
} from './domain/slack.entity';

// Meetings + AI summaries
export type {
  Meeting,
  MeetingParticipant,
  MeetingTranscript,
  MeetingSummary,
  ActionItem,
  MeetingStatus,
  MeetingProvider,
} from './domain/meeting.entity';

// Announcements
export type {
  Announcement,
  AnnouncementRead,
  AnnouncementPriority,
} from './domain/announcement.entity';

export {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  markAnnouncementRead,
  updateAnnouncement,
} from './application/announcements.service';
export type { AnnouncementDto } from './application/announcements.service';

export {
  handleCreateAnnouncement,
  handleDeleteAnnouncement,
  handleListAnnouncements,
  handleUpdateAnnouncement,
} from './api/handlers/announcement.handler';
