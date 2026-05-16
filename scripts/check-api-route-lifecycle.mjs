import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import {
  API_ROUTE_LIFECYCLE_STATUSES,
  auditApiRouteLifecycle,
  readTemporaryApiRouteOverlaps,
} from './lib/api-route-lifecycle.mjs';

const root = process.cwd();

function normalize(filePath) {
  return filePath.replaceAll('\\', '/');
}

function trackedApiRouteFiles() {
  return execFileSync('git', ['ls-files'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
    .split(/\r?\n/)
    .filter(Boolean)
    .map(normalize)
    .filter((file) => file.startsWith('src/app/api/') && file.endsWith('/route.ts'))
    .filter((file) => fs.existsSync(file));
}

const audit = auditApiRouteLifecycle(
  trackedApiRouteFiles(),
  readTemporaryApiRouteOverlaps(root),
);
const removableDuplicates = audit.families.filter(
  (family) => family.status === API_ROUTE_LIFECYCLE_STATUSES.REMOVABLE_DUPLICATE,
);

if (audit.issues.length > 0 || removableDuplicates.length > 0) {
  console.error('API route lifecycle check failed.');

  if (audit.issues.length > 0) {
    console.error('Temporary overlap registry issues:');
    for (const issue of audit.issues) {
      console.error(`- [${issue.code}] ${issue.message}`);
    }
  }

  if (removableDuplicates.length > 0) {
    console.error('Legacy product route families require a canonical V1 replacement, then removal or an approved temporary overlap registration:');
    for (const family of removableDuplicates) {
      const paths = family.routes.map((route) => route.path).join(', ');
      console.error(`- ${family.familyPath}: ${paths}`);
    }
  }

  process.exit(1);
}

console.log(
  'API route lifecycle check passed '
  + `(${audit.counts.canonicalV1} canonical v1 families, `
  + `${audit.counts.approvedNonVersionedExceptions} approved non-versioned exception families, `
  + `${audit.counts.temporaryRolloutOverlaps} approved temporary overlaps, `
  + `${audit.counts.removableDuplicates} removable duplicate families).`,
);
