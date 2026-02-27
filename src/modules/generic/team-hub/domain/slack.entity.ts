/**
 * Slack Integration — Types
 *
 * Installation model: Slack App (OAuth 2.0 with Bot token).
 * One Slack App installation per workspace.
 *
 * Data flow:
 *  1. Admin clicks "Connect Slack" → OAuth flow → we store bot token
 *  2. Admin chooses which channels to surface in Team Hub
 *  3. Slack sends events to /api/integrations/slack/events (verified by signing secret)
 *  4. We forward relevant ERP events as Slack notifications (new booking, new lead, etc.)
 *
 * Scopes needed:
 *   Bot: channels:history, channels:read, chat:write, users:read, reactions:read
 *   Events: message.channels, reaction_added, app_mention
 *
 * Adapter: src/infrastructure/slack/slack-client.ts (future)
 */

export interface SlackInstallation {
  id: string;
  workspaceId: string;
  slackTeamId: string;           // Slack workspace ID (T...)
  slackTeamName: string;
  botToken: string;              // xoxb-... (encrypted at rest)
  botUserId: string;             // U... Slack bot user ID
  installedBy: string;           // StaffUser.id
  installedAt: string;
}

export interface SlackChannel {
  id: string;
  workspaceId: string;
  slackChannelId: string;        // C...
  name: string;
  isPrivate: boolean;
  isSynced: boolean;             // Whether we're pulling messages from this channel
  lastSyncedAt?: string;
}

export interface SlackMessage {
  id: string;
  workspaceId: string;
  slackChannelId: string;
  slackTs: string;               // Slack timestamp (message ID)
  author: string;                // Slack user name/display name
  authorId: string;              // U...
  text: string;
  isBot: boolean;
  threadTs?: string;             // Parent message ts if this is a reply
  replyCount?: number;
  reactions?: { emoji: string; count: number; users: string[] }[];
  createdAt: string;             // Parsed from slackTs
}

export interface SlackNotificationRule {
  id: string;
  workspaceId: string;
  slackChannelId: string;
  triggerEvent: string;          // e.g. 'room_confirmed', 'lead_created', 'offer_accepted'
  messageTemplate: string;       // Slack Block Kit JSON template
  isActive: boolean;
  createdBy: string;
}
