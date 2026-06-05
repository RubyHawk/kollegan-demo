export interface CreateCompanyInput {
  organizationId: string;
  name:           string;
  orgNumber?:     string;
  addressLine1?:  string;
  addressLine2?:  string;
  postalCode?:    string;
  city?:          string;
  region?:        string;
  country?:       string;
  website?:       string;
  logoUrl?:       string;
  senderEmail?:   string;
  senderName?:    string;
  emailHeaderConfig?: string;
  industry?:      string;
  notes?:         string;
  customFields?:  Record<string, unknown>;
  createdBy:      string;
}

export interface UpdateCompanyInput {
  name?:      string;
  orgNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  postalCode?: string;
  city?: string;
  region?: string;
  country?: string;
  website?:   string;
  logoUrl?:   string;
  senderEmail?: string;
  senderName?: string;
  emailHeaderConfig?: string;
  industry?:  string;
  notes?:     string;
  customFields?: Record<string, unknown>;
}

export interface UpsertCompanyMemberInput {
  companyId: string;
  organizationId: string;
  userId: string;
  role: 'staff' | 'admin';
  grantedBy?: string;
}

export interface CompanyListOptions {
  userId?: string;
  restrictToMemberships?: boolean;
}

// ─── Mapper ────────────────────────────────────────────────────────────────────
