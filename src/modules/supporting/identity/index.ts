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
export type {
  Organization,
  OrgMember,
  OrgPlan,
  MemberRole,
  CreateOrgInput,
} from './domain/organization.entity';
