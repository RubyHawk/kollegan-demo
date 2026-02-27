/**
 * GitHub Integration — Types
 *
 * Installation model: GitHub App (not OAuth).
 * One GitHub App installation per workspace, scoped to an org or specific repos.
 *
 * Data flow:
 *  1. Admin installs the GitHub App for their organization
 *  2. We store the installation ID + access token (refreshed via app private key)
 *  3. GitHub sends webhooks to /api/integrations/github/webhook
 *  4. We store PR/issue/CI state in DB, display in Team Hub
 *
 * Adapter: src/infrastructure/github/github-client.ts (future)
 */

export type GitHubEventType =
  | 'pull_request'
  | 'pull_request_review'
  | 'issues'
  | 'check_run'
  | 'check_suite'
  | 'push';

export type PRStatus = 'open' | 'merged' | 'closed' | 'draft';
export type CIStatus = 'queued' | 'in_progress' | 'success' | 'failure' | 'cancelled';

export interface GitHubInstallation {
  id: string;
  workspaceId: string;
  installationId: number;        // GitHub App installation ID
  orgLogin: string;              // GitHub organization login
  appId: number;
  installedAt: string;
  installedBy: string;           // StaffUser.id
}

export interface GitHubPullRequest {
  id: string;
  workspaceId: string;
  githubId: number;
  repoFullName: string;          // "org/repo"
  number: number;
  title: string;
  url: string;
  author: string;                // GitHub login
  status: PRStatus;
  isDraft: boolean;
  reviewCount: number;
  approvalCount: number;
  requestedReviewers: string[];
  labels: string[];
  baseBranch: string;
  headBranch: string;
  ciStatus?: CIStatus;
  mergedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GitHubIssue {
  id: string;
  workspaceId: string;
  githubId: number;
  repoFullName: string;
  number: number;
  title: string;
  url: string;
  author: string;
  isOpen: boolean;
  labels: string[];
  assignees: string[];
  milestone?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GitHubCIRun {
  id: string;
  workspaceId: string;
  repoFullName: string;
  branch: string;
  commitSha: string;
  workflowName: string;
  status: CIStatus;
  conclusion?: 'success' | 'failure' | 'cancelled' | 'skipped';
  runUrl: string;
  startedAt?: string;
  completedAt?: string;
}
