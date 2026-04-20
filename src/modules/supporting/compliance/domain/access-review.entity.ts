export interface AccessReviewUserRow {
  id: string;
  email: string;
  name: string | null;
  userType: string;
  isActive: boolean;
  organizationId: string | null;
  roles: string[];
  lastLoginAt: string | null;
  mfaEnabled: boolean;
  totpConfigured: boolean;
  passkeysRegistered: number;
  mfaGraceExpiresAt: string | null;
  activeSessions: number;
  createdAt: string;
}

export interface AccessReviewData {
  generatedAt: string;
  totalUsers: number;
  users: AccessReviewUserRow[];
}
