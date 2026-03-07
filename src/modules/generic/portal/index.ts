/**
 * Customer Portal Module — manages customer-facing portal instances.
 *
 * Each customer organization gets a portal (auto-provisioned on lead conversion).
 * Handles portal member management, custom domains, and access control.
 */

export type { Portal, PortalMember, PortalMemberStatus, CreatePortalInput } from './domain/portal.entity';
export { provisionPortal, getPortalByOrg, getPortalBySlug } from './application/portal.service';
