/**
 * Team Hub — SaaS collaboration module
 *
 * A multi-tenant workspace hub for internal team operations.
 * Each workspace is isolated; members have roles within their workspace.
 *
 * Sub-modules:
 *
 *  workspace/        Multi-tenant foundation — orgs, members, billing, invites
 *  integrations/
 *    github/         GitHub App: PRs, issues, CI status per repo
 *    slack/          Slack App: channel feed, notification rules, bot commands
 *  meetings/         Video calls + AI transcription + Claude summaries + action items
 *  announcements/    Internal comms — pinned notices, policy updates
 *
 * SaaS model:
 *  - Free tier:    1 workspace, limited integrations, no recordings
 *  - Pro tier:     Unlimited integrations, meeting recordings + AI summaries
 *  - Enterprise:   SSO, audit logs, SLA, dedicated support
 *
 * Infrastructure adapters needed (add to src/infrastructure/ when implementing):
 *  - github-client.ts   (GitHub App REST + GraphQL API)
 *  - slack-client.ts    (Slack Web API + Events API)
 *  - storage-client.ts  (S3-compatible for recordings)
 *  - transcription.ts   (Whisper / Deepgram / AssemblyAI)
 *
 * Webhook receivers needed (add to src/app/api/integrations/):
 *  - github/webhook/route.ts    (verify X-Hub-Signature-256)
 *  - slack/events/route.ts      (verify X-Slack-Signature)
 *
 * n8n workflows needed:
 *  - meeting-summary-pipeline.json  (recording → transcribe → summarize → notify)
 *  - slack-notification-router.json (ERP event → Slack message by rule)
 */

// Workspace
export type {
  Workspace,
  WorkspaceMember,
  WorkspaceInvite,
  WorkspaceSettings,
  WorkspacePlan,
  WorkspaceMemberRole,
} from './workspace/types';

// GitHub integration
export type {
  GitHubInstallation,
  GitHubPullRequest,
  GitHubIssue,
  GitHubCIRun,
  PRStatus,
  CIStatus,
} from './integrations/github/types';

// Slack integration
export type {
  SlackInstallation,
  SlackChannel,
  SlackMessage,
  SlackNotificationRule,
} from './integrations/slack/types';

// Meetings + AI summaries
export type {
  Meeting,
  MeetingParticipant,
  MeetingTranscript,
  MeetingSummary,
  ActionItem,
  MeetingStatus,
  MeetingProvider,
} from './meetings/types';

// Announcements
export type {
  Announcement,
  AnnouncementRead,
  AnnouncementPriority,
} from './announcements/types';
