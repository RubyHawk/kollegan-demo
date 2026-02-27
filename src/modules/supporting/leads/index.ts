/**
 * Lead Management Module
 *
 * Status: PLANNED — not yet implemented.
 *
 * To add this module:
 * 1. Create Prisma model: Lead, LeadActivity
 * 2. Add API routes under /api/leads/
 * 3. Build LeadsTab component for the dashboard sidebar
 * 4. Register in DashboardSidebar NAV_ITEMS
 * 5. Add n8n webhook handler for automated lead ingestion
 *
 * See docs/ARCHITECTURE.md for the full ERP module roadmap.
 */

export type { Lead, LeadActivity, LeadStatus, LeadSource } from './domain/lead.entity';
