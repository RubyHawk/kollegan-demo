/**
 * Team Hub Module
 *
 * Status: PLANNED — not yet implemented.
 *
 * Sub-modules and implementation plan:
 *
 * 1. GitHub integration
 *    - OAuth app or GitHub App installation
 *    - Webhook receiver at /api/integrations/github/webhook
 *    - PRs, issues, CI status displayed in team dashboard
 *
 * 2. Slack integration
 *    - Slack App with Bot token
 *    - Webhook receiver at /api/integrations/slack/webhook
 *    - Channel feed + notification rules
 *
 * 3. Video call + AI summaries
 *    - Daily.co or similar for video
 *    - Whisper/Deepgram for transcription
 *    - Claude API for meeting summary and action items
 *    - Stored in Meeting model
 *
 * To add this module:
 * 1. Create Prisma models: Meeting, TeamAnnouncement
 * 2. Add integration adapters under src/infrastructure/github/, src/infrastructure/slack/
 * 3. Add API routes under /api/integrations/ and /api/meetings/
 * 4. Build TeamHubTab component for the dashboard
 * 5. Register in DashboardSidebar NAV_ITEMS
 *
 * See docs/ARCHITECTURE.md for the full ERP module roadmap.
 */

export type {
  GitHubPullRequest,
  GitHubIssue,
  SlackMessage,
  Meeting,
  MeetingStatus,
  TeamAnnouncement,
} from './types';
