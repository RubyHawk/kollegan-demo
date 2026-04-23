/**
 * Identity module — public interface.
 *
 * Layer structure:
 *   domain/         — organization.entity.ts (Organization, OrgMember types)
 *   application/    — identity.service.ts
 *   infrastructure/ — identity.repository.ts
 *   events/         — publishers/, subscribers/
 */

export { identityService } from './application/identity.service';
export {
  handleGetOrgEmailSettings,
  handleUpdateOrgEmailSettings,
  handleGetOrgThemeSettings,
  handleUpdateOrgThemeSettings,
  handleGetOrgNotificationRecipients,
  handleUpdateOrgNotificationRecipients,
} from './api/handlers/org-settings.handler';
export type {
  Organization,
  OrgMember,
  OrgPlan,
  MemberRole,
  CreateOrgInput,
  ActiveNotificationTag,
  NotificationRecipient,
  NotificationTag,
  NotificationTagDefinition,
  NotificationTagScope,
} from './domain/organization.entity';
