import fs from 'node:fs';
import path from 'node:path';

export const API_ROUTE_LIFECYCLE_STATUSES = {
  CANONICAL_V1: 'canonical-v1',
  APPROVED_NON_VERSIONED_EXCEPTION: 'approved-non-versioned-exception',
  TEMPORARY_ROLLOUT_OVERLAP: 'temporary-rollout-overlap',
  REMOVABLE_DUPLICATE: 'removable-duplicate',
};

export const API_ROUTE_OVERLAP_FIELDS = [
  'legacyPath',
  'canonicalPath',
  'featureFlagKey',
  'owner',
  'reason',
  'expiresOn',
];

export const API_ROUTE_OVERLAPS_PATH = 'scripts/api-route-overlaps.json';

function normalize(filePath) {
  return filePath.replaceAll('\\', '/');
}

function isApiRoute(file) {
  return normalize(file).startsWith('src/app/api/') && normalize(file).endsWith('/route.ts');
}

export function isV1ApiRoute(file) {
  return normalize(file).startsWith('src/app/api/v1/') && normalize(file).endsWith('/route.ts');
}

export function approvedNonVersionedRouteKind(file) {
  const normalized = normalize(file);
  if (!isApiRoute(normalized) || isV1ApiRoute(normalized)) return null;
  if (normalized.startsWith('src/app/api/demos/')) return 'demo-api-route';
  if (normalized.startsWith('src/app/api/offers/public/')) return 'public-document-route';
  if (
    normalized.startsWith('src/app/api/ai/')
    || normalized.startsWith('src/app/api/cron/')
    || normalized.startsWith('src/app/api/docs/')
    || normalized.startsWith('src/app/api/health/')
    || normalized.startsWith('src/app/api/n8n/')
    || normalized.startsWith('src/app/api/sse/')
  ) {
    return 'integration-or-ops-route';
  }
  return null;
}

export function apiRouteKind(file) {
  if (!isApiRoute(file)) return null;
  if (isV1ApiRoute(file)) return 'api-v1';
  return approvedNonVersionedRouteKind(file) ?? 'legacy-compat-wrapper';
}

export function routeFileToApiPath(file) {
  const normalized = normalize(file);
  if (!isApiRoute(normalized)) return null;
  return normalized
    .replace(/^src\/app/, '')
    .replace(/\/route\.ts$/, '');
}

export function routeFamilyPath(apiPath) {
  return apiPath.replace(/^\/api\/v1(?=\/|$)/, '/api');
}

export function readTemporaryApiRouteOverlaps(root) {
  const overlapPath = path.join(root, API_ROUTE_OVERLAPS_PATH);
  if (!fs.existsSync(overlapPath)) return [];

  const parsed = JSON.parse(fs.readFileSync(overlapPath, 'utf8'));
  return Array.isArray(parsed) ? parsed : [];
}

function overlapPairKey(overlap) {
  return `${overlap.legacyPath} -> ${overlap.canonicalPath}`;
}

function createIssue(code, message, overlap = null) {
  return { code, message, overlap };
}

export function validateTemporaryApiRouteOverlaps(overlaps, today = new Date()) {
  const issues = [];
  const validOverlaps = [];
  const seenPairs = new Set();

  for (const overlap of overlaps) {
    const missingFields = API_ROUTE_OVERLAP_FIELDS.filter((field) => {
      const value = overlap?.[field];
      return typeof value !== 'string' || value.trim().length === 0;
    });

    if (missingFields.length > 0) {
      issues.push(createIssue(
        'missing-overlap-fields',
        `Temporary overlap is missing required fields: ${missingFields.join(', ')}.`,
        overlap,
      ));
      continue;
    }

    if (!overlap.legacyPath.startsWith('/api/') || overlap.legacyPath.startsWith('/api/v1/')) {
      issues.push(createIssue(
        'invalid-legacy-path',
        `Temporary overlap legacyPath must be a non-versioned /api/* path: ${overlap.legacyPath}.`,
        overlap,
      ));
      continue;
    }

    if (!overlap.canonicalPath.startsWith('/api/v1/')) {
      issues.push(createIssue(
        'invalid-canonical-path',
        `Temporary overlap canonicalPath must use /api/v1/*: ${overlap.canonicalPath}.`,
        overlap,
      ));
      continue;
    }

    const expiry = new Date(`${overlap.expiresOn}T00:00:00.000Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(overlap.expiresOn) || Number.isNaN(expiry.getTime())) {
      issues.push(createIssue(
        'invalid-expiry',
        `Temporary overlap expiresOn must be an ISO date (YYYY-MM-DD): ${overlap.expiresOn}.`,
        overlap,
      ));
      continue;
    }

    const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    if (expiry.getTime() < todayUtc) {
      issues.push(createIssue(
        'expired-overlap',
        `Temporary overlap expired on ${overlap.expiresOn}: ${overlapPairKey(overlap)}.`,
        overlap,
      ));
      continue;
    }

    const pairKey = overlapPairKey(overlap);
    if (seenPairs.has(pairKey)) {
      issues.push(createIssue(
        'duplicate-overlap-registration',
        `Temporary overlap is registered more than once: ${pairKey}.`,
        overlap,
      ));
      continue;
    }

    seenPairs.add(pairKey);
    validOverlaps.push(overlap);
  }

  return { issues, validOverlaps };
}

export function auditApiRouteLifecycle(routeFiles, overlaps = [], today = new Date()) {
  const routes = routeFiles
    .map((file) => ({
      file: normalize(file),
      path: routeFileToApiPath(file),
      kind: apiRouteKind(file),
    }))
    .filter((route) => route.path && route.kind);

  const { issues, validOverlaps } = validateTemporaryApiRouteOverlaps(overlaps, today);
  const overlapByPair = new Map(validOverlaps.map((overlap) => [overlapPairKey(overlap), overlap]));
  const routesByPath = new Map(routes.map((route) => [route.path, route]));
  const familiesByPath = new Map();

  for (const route of routes) {
    const familyPath = routeFamilyPath(route.path);
    const family = familiesByPath.get(familyPath) ?? {
      familyPath,
      routes: [],
    };
    family.routes.push(route);
    familiesByPath.set(familyPath, family);
  }

  const families = [...familiesByPath.values()]
    .map((family) => {
      const canonicalRoutes = family.routes.filter((route) => route.kind === 'api-v1');
      const approvedExceptionRoutes = family.routes.filter((route) => route.kind !== 'api-v1' && route.kind !== 'legacy-compat-wrapper');
      const legacyProductRoutes = family.routes.filter((route) => route.kind === 'legacy-compat-wrapper');

      if (canonicalRoutes.length > 0 && legacyProductRoutes.length === 0) {
        return {
          ...family,
          status: API_ROUTE_LIFECYCLE_STATUSES.CANONICAL_V1,
          canonicalRoutes,
          approvedExceptionRoutes,
          legacyProductRoutes,
          overlap: null,
        };
      }

      if (legacyProductRoutes.length === 0) {
        return {
          ...family,
          status: API_ROUTE_LIFECYCLE_STATUSES.APPROVED_NON_VERSIONED_EXCEPTION,
          canonicalRoutes,
          approvedExceptionRoutes,
          legacyProductRoutes,
          overlap: null,
        };
      }

      const canonicalPath = `/api/v1${family.familyPath.replace(/^\/api/, '')}`;
      const legacyPath = family.familyPath;
      const overlap = overlapByPair.get(`${legacyPath} -> ${canonicalPath}`) ?? null;
      const hasCanonicalCounterpart = canonicalRoutes.some((route) => route.path === canonicalPath);

      if (!hasCanonicalCounterpart) {
        issues.push(createIssue(
          'missing-canonical-route',
          `Legacy product route has no canonical V1 replacement yet: ${legacyPath} -> ${canonicalPath}.`,
        ));
      }

      return {
        ...family,
        status: overlap && hasCanonicalCounterpart
          ? API_ROUTE_LIFECYCLE_STATUSES.TEMPORARY_ROLLOUT_OVERLAP
          : API_ROUTE_LIFECYCLE_STATUSES.REMOVABLE_DUPLICATE,
        canonicalRoutes,
        approvedExceptionRoutes,
        legacyProductRoutes,
        overlap,
      };
    })
    .sort((a, b) => a.familyPath.localeCompare(b.familyPath));

  for (const overlap of validOverlaps) {
    const legacyRoute = routesByPath.get(overlap.legacyPath);
    const canonicalRoute = routesByPath.get(overlap.canonicalPath);
    if (!legacyRoute || !canonicalRoute) {
      issues.push(createIssue(
        'stale-overlap-registration',
        `Temporary overlap must reference live legacy and canonical routes: ${overlapPairKey(overlap)}.`,
        overlap,
      ));
    }
  }

  return {
    routes,
    families,
    issues,
    counts: {
      canonicalV1: families.filter((family) => family.status === API_ROUTE_LIFECYCLE_STATUSES.CANONICAL_V1).length,
      approvedNonVersionedExceptions: families.filter((family) => family.status === API_ROUTE_LIFECYCLE_STATUSES.APPROVED_NON_VERSIONED_EXCEPTION).length,
      temporaryRolloutOverlaps: families.filter((family) => family.status === API_ROUTE_LIFECYCLE_STATUSES.TEMPORARY_ROLLOUT_OVERLAP).length,
      removableDuplicates: families.filter((family) => family.status === API_ROUTE_LIFECYCLE_STATUSES.REMOVABLE_DUPLICATE).length,
    },
  };
}
