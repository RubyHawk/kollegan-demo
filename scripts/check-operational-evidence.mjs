import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const evidenceIndexPath = path.join(
  root,
  "docs",
  "security",
  "AUDIT_EVIDENCE_INDEX.md",
);

const trackedOperationalEvidence = [
  {
    label: "Feature-flag rollouts",
    file: "docs/security/FEATURE_FLAG_ROLLOUT_LOG.md",
    owner: "Engineering lead",
    section: "Feature Flag Rollout Evidence",
    scope: "Public offer rewrite",
  },
  {
    label: "Access reviews",
    file: "docs/security/ACCESS_REVIEW_LOG.md",
    owner: "ISMS Manager",
    section: "Access Reviews",
    scope:
      "Application admin, repository, VPS, database, and CI/CD secret access",
  },
  {
    label: "Restore tests",
    file: "docs/security/RESTORE_TEST_LOG.md",
    owner: "Engineering lead",
    section: "Backup Restore Tests",
    scope: "Production backup references are external to the repo",
  },
  {
    label: "Internal audits",
    file: "docs/security/INTERNAL_AUDIT_LOG.md",
    owner: "ISMS Manager",
    section: "Internal Audit And Management Review",
    scope: "Internal audit",
  },
  {
    label: "Management reviews",
    file: "docs/security/MANAGEMENT_REVIEW_LOG.md",
    owner: "Management",
    section: "Internal Audit And Management Review",
    scope: "Management review",
  },
  {
    label: "Incidents and drills",
    file: "docs/security/INCIDENT_POSTMORTEM_LOG.md",
    owner: "ISMS Manager",
    section: "Incident And Vulnerability Operations",
    scope: "Incident drill/response",
  },
  {
    label: "Vulnerability reviews",
    file: "docs/security/VULNERABILITY_REVIEW_LOG.md",
    owner: "Engineering lead",
    section: "Incident And Vulnerability Operations",
    scope: "Vulnerability review",
  },
  {
    label: "Supplier reviews",
    file: "docs/security/SUPPLIER_REVIEW_LOG.md",
    owner: "ISMS Manager",
    section: "Supplier Reviews",
    scope: "In-scope SaaS, hosting, database, and AI suppliers",
  },
  {
    label: "Security awareness",
    file: "docs/security/SECURITY_AWARENESS_LOG.md",
    owner: "ISMS Manager",
    section: "Awareness And Training",
    scope: "In-scope engineering and admin/support awareness",
  },
  {
    label: "Asset lifecycle",
    file: "docs/security/ASSET_LIFECYCLE_LOG.md",
    owner: "ISMS Manager",
    section: "Asset Lifecycle",
    scope: "Offboarding asset return and secure disposal/reuse events",
  },
];

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function parseMarkdownRow(line) {
  const trimmed = line.trim();
  const hasLeadingPipe = trimmed.startsWith("|");
  const hasTrailingPipe = trimmed.endsWith("|");
  const cells = trimmed.split("|");

  const start = hasLeadingPipe ? 1 : 0;
  const end = hasTrailingPipe ? -1 : undefined;

  return cells.slice(start, end).map((part) => part.trim());
}

function gapKey({ section, scope }) {
  return `${section}::${scope}`;
}

function parseRegisterStatus(item) {
  const fullPath = path.join(root, item.file);

  if (!fs.existsSync(fullPath)) {
    return {
      ...item,
      exists: false,
      empty: false,
      status: "Missing file",
    };
  }

  const text = readText(fullPath);
  const emptyStatusMatch = text.match(/^Status:\s+Empty register as of (.+)$/m);
  const noRecordsMatch = text.match(
    /^No .* records are committed yet as of (.+)\.$/m,
  );

  return {
    ...item,
    exists: true,
    empty: Boolean(emptyStatusMatch || noRecordsMatch),
    status: text.match(/^Status:\s+(.+)$/m)?.[1] ?? "Unknown",
  };
}

function parseEvidenceIndexGaps() {
  const lines = readText(evidenceIndexPath).split(/\r?\n/);
  const gaps = [];
  let currentSection = "";

  for (const line of lines) {
    if (line.startsWith("## ")) {
      currentSection = line.replace(/^##\s+/, "").trim();
      continue;
    }

    if (!line.startsWith("| Open gap as of ")) continue;
    const columns = parseMarkdownRow(line);
    if (columns.length < 4) continue;

    gaps.push({
      section: currentSection,
      scope: columns[1],
      owner: columns.at(-1) ?? "Unknown",
      summary: columns.slice(2, -1).join(" | "),
    });
  }

  return gaps;
}

const registerStatuses = trackedOperationalEvidence.map(parseRegisterStatus);
const openGaps = parseEvidenceIndexGaps();

const expectedByKey = new Map(
  registerStatuses.map((item) => [gapKey(item), item]),
);
const gapsByKey = new Map();

for (const gap of openGaps) {
  const key = gapKey(gap);
  if (!gapsByKey.has(key)) gapsByKey.set(key, []);
  gapsByKey.get(key).push(gap);
}

const missingFiles = registerStatuses.filter((item) => !item.exists);
const missingGapRows = registerStatuses.filter(
  (item) => item.exists && item.empty && !gapsByKey.has(gapKey(item)),
);
const staleGapRows = registerStatuses.filter(
  (item) => item.exists && !item.empty && gapsByKey.has(gapKey(item)),
);
const duplicateGapRows = [...gapsByKey.entries()]
  .filter(([, gaps]) => gaps.length > 1)
  .map(([key, gaps]) => ({ key, gaps }));
const unexpectedGapRows = openGaps.filter(
  (gap) => !expectedByKey.has(gapKey(gap)),
);
const ownerMismatches = openGaps.flatMap((gap) => {
  const expected = expectedByKey.get(gapKey(gap));
  if (!expected || expected.owner === gap.owner) return [];
  return [{ gap, expectedOwner: expected.owner }];
});

if (
  missingFiles.length > 0 ||
  missingGapRows.length > 0 ||
  staleGapRows.length > 0 ||
  duplicateGapRows.length > 0 ||
  unexpectedGapRows.length > 0 ||
  ownerMismatches.length > 0
) {
  console.error("Operational evidence coverage check failed.");

  if (missingFiles.length > 0) {
    console.error("Missing operational evidence files:");
    for (const item of missingFiles) {
      console.error(`- ${item.file}`);
    }
  }

  if (missingGapRows.length > 0) {
    console.error(
      "Empty registers without matching open-gap rows in AUDIT_EVIDENCE_INDEX.md:",
    );
    for (const item of missingGapRows) {
      console.error(`- ${item.label} -> ${item.section} / ${item.scope}`);
    }
  }

  if (staleGapRows.length > 0) {
    console.error(
      "Open-gap rows still exist for registers that are no longer marked empty:",
    );
    for (const item of staleGapRows) {
      console.error(`- ${item.label} -> ${item.section} / ${item.scope}`);
    }
  }

  if (duplicateGapRows.length > 0) {
    console.error("Duplicate open-gap rows detected:");
    for (const duplicate of duplicateGapRows) {
      console.error(`- ${duplicate.key} (${duplicate.gaps.length} rows)`);
    }
  }

  if (unexpectedGapRows.length > 0) {
    console.error(
      "Open-gap rows are present for unknown operational evidence items:",
    );
    for (const gap of unexpectedGapRows) {
      console.error(`- ${gap.section} / ${gap.scope}`);
    }
  }

  if (ownerMismatches.length > 0) {
    console.error(
      "Open-gap row owners do not match the tracked operational evidence owner:",
    );
    for (const mismatch of ownerMismatches) {
      console.error(
        `- ${mismatch.gap.section} / ${mismatch.gap.scope}: expected ${mismatch.expectedOwner}, found ${mismatch.gap.owner}`,
      );
    }
  }

  process.exit(1);
}

console.log(
  `Operational evidence coverage check passed (${registerStatuses.length} tracked items, ${openGaps.length} open-gap rows aligned).`,
);
