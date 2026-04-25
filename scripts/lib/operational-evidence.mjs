import fs from "node:fs";
import path from "node:path";

export const operationalEvidenceRegistry = [
  {
    label: "Feature-flag rollouts",
    file: "docs/security/FEATURE_FLAG_ROLLOUT_LOG.md",
    owner: "Engineering lead",
    reviewCadence: "Per rollout and quarterly review",
    section: "Feature Flag Rollout Evidence",
    scope: "Public offer rewrite",
    nextAction:
      "Record the first completed production rollout or rollback in `docs/security/FEATURE_FLAG_ROLLOUT_LOG.md` when the public-offer rewrite or another production-impacting release flag changes state.",
  },
  {
    label: "Access reviews",
    file: "docs/security/ACCESS_REVIEW_LOG.md",
    owner: "ISMS Manager",
    reviewCadence: "Quarterly",
    section: "Access Reviews",
    scope:
      "Application admin, repository, VPS, database, and CI/CD secret access",
    nextAction:
      "Complete the first quarterly access review and record the outcome in `docs/security/ACCESS_REVIEW_LOG.md` using `docs/security/ACCESS_REVIEW_CHECKLIST.md`.",
  },
  {
    label: "Restore tests",
    file: "docs/security/RESTORE_TEST_LOG.md",
    owner: "Engineering lead",
    reviewCadence: "Quarterly",
    section: "Backup Restore Tests",
    scope: "Production backup references are external to the repo",
    nextAction:
      "Run the first non-production restore test and record the outcome in `docs/security/RESTORE_TEST_LOG.md` using `docs/security/RESTORE_TEST_PLAYBOOK.md`.",
  },
  {
    label: "Internal audits",
    file: "docs/security/INTERNAL_AUDIT_LOG.md",
    owner: "ISMS Manager",
    reviewCadence: "At least annually and after major process changes",
    section: "Internal Audit And Management Review",
    scope: "Internal audit",
    nextAction:
      "Schedule and record the first internal audit and management review cycles in their respective logs using the linked playbooks and agenda.",
  },
  {
    label: "Management reviews",
    file: "docs/security/MANAGEMENT_REVIEW_LOG.md",
    owner: "Management",
    reviewCadence: "At least annually and after major ISMS changes",
    section: "Internal Audit And Management Review",
    scope: "Management review",
    nextAction:
      "Schedule and record the first internal audit and management review cycles in their respective logs using the linked playbooks and agenda.",
  },
  {
    label: "Incidents and drills",
    file: "docs/security/INCIDENT_POSTMORTEM_LOG.md",
    owner: "ISMS Manager",
    reviewCadence: "After incidents or incident-response drills",
    section: "Incident And Vulnerability Operations",
    scope: "Incident drill/response",
    nextAction:
      "Run the first incident drill and vulnerability review cycle, then record both outcomes in the corresponding logs.",
  },
  {
    label: "Vulnerability reviews",
    file: "docs/security/VULNERABILITY_REVIEW_LOG.md",
    owner: "Engineering lead",
    reviewCadence: "Monthly and as findings arrive",
    section: "Incident And Vulnerability Operations",
    scope: "Vulnerability review",
    nextAction:
      "Run the first incident drill and vulnerability review cycle, then record both outcomes in the corresponding logs.",
  },
  {
    label: "Supplier reviews",
    file: "docs/security/SUPPLIER_REVIEW_LOG.md",
    owner: "ISMS Manager",
    reviewCadence: "Quarterly and after major supplier changes",
    section: "Supplier Reviews",
    scope: "In-scope SaaS, hosting, database, and AI suppliers",
    nextAction:
      "Complete the first supplier review cycle for in-scope suppliers and record it in `docs/security/SUPPLIER_REVIEW_LOG.md`.",
  },
  {
    label: "Security awareness",
    file: "docs/security/SECURITY_AWARENESS_LOG.md",
    owner: "ISMS Manager",
    reviewCadence: "Quarterly and after major security/process changes",
    section: "Awareness And Training",
    scope: "In-scope engineering and admin/support awareness",
    nextAction:
      "Run the first awareness or training cycle and record the completed activity in `docs/security/SECURITY_AWARENESS_LOG.md`.",
  },
  {
    label: "Asset lifecycle",
    file: "docs/security/ASSET_LIFECYCLE_LOG.md",
    owner: "ISMS Manager",
    reviewCadence: "Quarterly",
    section: "Asset Lifecycle",
    scope: "Offboarding asset return and secure disposal/reuse events",
    nextAction:
      "Record the first repo-safe asset return, secure disposal, reuse, or exception outcome in `docs/security/ASSET_LIFECYCLE_LOG.md` when such an event occurs.",
  },
];

export function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

export function normalize(filePath) {
  return filePath.replaceAll("\\", "/");
}

export function escapeTableCell(value) {
  return String(value).replaceAll("|", "\\|");
}

export function parseMarkdownRow(line) {
  const trimmed = line.trim();
  const hasLeadingPipe = trimmed.startsWith("|");
  const hasTrailingPipe = trimmed.endsWith("|");
  const cells = trimmed.split("|");

  const start = hasLeadingPipe ? 1 : 0;
  const end = hasTrailingPipe ? -1 : undefined;

  return cells.slice(start, end).map((part) => part.trim());
}

export function gapKey({ section, scope }) {
  return `${section}::${scope}`;
}

export function countRecordRows(text) {
  const lines = text.split(/\r?\n/);
  let inRecordSection = false;
  let sawHeaderRow = false;
  let sawSeparatorRow = false;
  let recordRows = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("## ")) {
      if (inRecordSection) break;
      inRecordSection = /Records$/i.test(trimmed);
      sawHeaderRow = false;
      sawSeparatorRow = false;
      continue;
    }

    if (!inRecordSection || !trimmed.startsWith("|")) {
      continue;
    }

    const columns = parseMarkdownRow(trimmed);
    if (columns.length === 0) continue;

    if (!sawHeaderRow) {
      sawHeaderRow = true;
      continue;
    }

    const isSeparatorRow = columns.every((cell) =>
      /^:?-{3,}:?$/.test(cell.replace(/\s/g, "")),
    );

    if (!sawSeparatorRow && isSeparatorRow) {
      sawSeparatorRow = true;
      continue;
    }

    if (sawHeaderRow && sawSeparatorRow) {
      recordRows += 1;
    }
  }

  return recordRows;
}

export function parseOperationalRegisterStatus(root, item) {
  const fullPath = path.join(root, item.file);

  if (!fs.existsSync(fullPath)) {
    return {
      ...item,
      exists: false,
      empty: false,
      recordRows: 0,
      status: "Missing file",
      actualOwner: null,
      actualReviewCadence: null,
      asOf: null,
    };
  }

  const text = readText(fullPath);
  const recordRows = countRecordRows(text);
  const emptyStatusMatch = text.match(/^Status:\s+Empty register as of (.+)$/m);
  const noRecordsMatch = text.match(
    /^No .* records are committed yet as of (.+)\.$/m,
  );

  return {
    ...item,
    exists: true,
    empty: recordRows === 0,
    recordRows,
    status: text.match(/^Status:\s+(.+)$/m)?.[1]?.trim() ?? "Unknown",
    actualOwner: text.match(/^Owner:\s+(.+)$/m)?.[1]?.trim() ?? "Unknown",
    actualReviewCadence:
      text.match(/^Review cadence:\s+(.+)$/m)?.[1]?.trim() ?? "Unknown",
    asOf: emptyStatusMatch?.[1] ?? noRecordsMatch?.[1] ?? null,
  };
}

export function parseOperationalEvidenceIndexGaps(root) {
  const evidenceIndexPath = path.join(
    root,
    "docs",
    "security",
    "AUDIT_EVIDENCE_INDEX.md",
  );
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
      date: columns[0].replace(/^Open gap as of\s+/, ""),
      scope: columns[1],
      owner: columns.at(-1) ?? "Unknown",
      summary: columns.slice(2, -1).join(" | "),
    });
  }

  return gaps;
}

export function nextActionsForGaps(openGaps) {
  const actionBySection = new Map(
    operationalEvidenceRegistry.map((item) => [item.section, item.nextAction]),
  );

  return [
    ...new Set(
      openGaps.map((gap) => actionBySection.get(gap.section)).filter(Boolean),
    ),
  ];
}
