import { API_ROUTE_LIFECYCLE_STATUSES } from './api-route-lifecycle.mjs';

function rowsFor(apiRouteLifecycle, status, mapper) {
  return apiRouteLifecycle.families
    .filter((family) => family.status === status)
    .map(mapper);
}

export function renderApiRouteLifecycleSection(apiRouteLifecycle, markdownTable) {
  const canonicalV1Families = rowsFor(
    apiRouteLifecycle,
    API_ROUTE_LIFECYCLE_STATUSES.CANONICAL_V1,
    (family) => [
      `\`${family.familyPath}\``,
      family.routes.map((route) => `\`${route.path}\``).join('<br>'),
    ],
  );
  const approvedNonVersionedFamilies = rowsFor(
    apiRouteLifecycle,
    API_ROUTE_LIFECYCLE_STATUSES.APPROVED_NON_VERSIONED_EXCEPTION,
    (family) => [
      `\`${family.familyPath}\``,
      family.routes.map((route) => route.kind).join('<br>'),
      family.routes.map((route) => `\`${route.path}\``).join('<br>'),
    ],
  );
  const temporaryRolloutOverlaps = rowsFor(
    apiRouteLifecycle,
    API_ROUTE_LIFECYCLE_STATUSES.TEMPORARY_ROLLOUT_OVERLAP,
    (family) => [
      `\`${family.familyPath}\``,
      `\`${family.overlap.featureFlagKey}\``,
      family.overlap.owner,
      family.overlap.expiresOn,
      `\`${family.overlap.legacyPath}\` → \`${family.overlap.canonicalPath}\``,
    ],
  );
  const duplicateRemovalCandidates = rowsFor(
    apiRouteLifecycle,
    API_ROUTE_LIFECYCLE_STATUSES.REMOVABLE_DUPLICATE,
    (family) => [
      `\`${family.familyPath}\``,
      family.routes.map((route) => `\`${route.path}\``).join('<br>'),
    ],
  );

  return `## API Route Lifecycle Audit

Product API families should converge on one canonical \`/api/v1/**\` surface. Any temporary legacy/V1 overlap must be registered in \`scripts/api-route-overlaps.json\` with a flag key, owner, reason, and expiry date; otherwise it is a duplicate-removal candidate.

### Canonical V1 API Families

${markdownTable(['Family', 'Route'], canonicalV1Families)}
### Approved Non-Versioned API Families

${markdownTable(['Family', 'Kind', 'Route'], approvedNonVersionedFamilies)}
### Temporary Rollout Overlaps

${markdownTable(['Family', 'Feature flag', 'Owner', 'Expires on', 'Routes'], temporaryRolloutOverlaps)}
### Duplicate-Removal Candidates

${markdownTable(['Family', 'Routes'], duplicateRemovalCandidates)}`;
}
