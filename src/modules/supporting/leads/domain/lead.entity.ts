/**
 * Lead Management Module — Types
 *
 * Future ERP module for tracking sales leads, pipeline stages,
 * and lead-to-customer conversion.
 *
 * Planned features:
 *  - Lead capture from voice calls, web forms, manual entry
 *  - Pipeline stage tracking (New → Qualified → Proposal → Won/Lost)
 *  - Lead scoring based on interaction history
 *  - Assignment to team members
 *  - Integration with CRM module for conversion
 *  - n8n workflow triggers on stage changes
 */

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';

export type LeadSource = 'voice_call' | 'web_form' | 'manual' | 'referral' | 'n8n_webhook';

export interface Lead {
  id: string;
  organizationId: string;
  companyId?: string;
  name: string;
  email?: string;
  normalizedEmail?: string;
  phone?: string;
  normalizedPhone?: string;
  company?: string;
  status: LeadStatus;
  source: LeadSource;
  sourceLabel?: string;
  address?: string;
  postalCode?: string;
  requestedService?: string;
  referralSource?: string;
  customFields?: Record<string, unknown> | null;
  score?: number;           // 0–100 lead score
  assignedTo?: string;      // StaffUser.id
  notes?: string;
  estimatedValue?: number;  // SEK
  createdAt: string;
  updatedAt: string;
  convertedAt?: string;     // When lead became a customer
  customerId?: string;      // CRM Customer.id after conversion
}

export interface LeadActivity {
  id: string;
  leadId: string;
  type: 'note' | 'call' | 'email' | 'stage_change' | 'ai_interaction';
  content: string;
  createdBy: string;        // StaffUser.id or 'system'
  createdAt: string;
}
