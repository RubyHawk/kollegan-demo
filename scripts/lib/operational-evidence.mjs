import fs from "node:fs";
import path from "node:path";

export const operationalEvidenceRegistry = [
  {
    label: "Feature-flag rollouts",
    file: "docs/security/FEATURE_FLAG_ROLLOUT_LOG.md",
    workflow: "docs/security/FEATURE_FLAG_ROLLOUT_LOG.md",
    relatedDocs: [
      "docs/security/FEATURE_FLAG_ROLLOUT_LOG.md",
      "docs/security/CHANGE_MANAGEMENT.md",
    ],
    owner: "Engineering lead",
    reviewCadence: "Per rollout and quarterly review",
    section: "Feature Flag Rollout Evidence",
    scope: "Public offer rewrite",
    externalInputs:
      "Flag decision, rollout window, owner, rollback trigger, and any linked PRs or tickets.",
    entryTemplate:
      "| YYYY-MM-DD | flag-name | production | owner name or role | rolled out / rolled back / expired | exact rollback path | PR / ticket / follow-up | safe summary evidence link |",
    closeoutWhen:
      "A completed production rollout, rollback, or expiry-cleanup row is committed in the rollout log and the matching open-gap row is removed from `AUDIT_EVIDENCE_INDEX.md`.",
    nextAction:
      "Record the first completed production rollout or rollback in `docs/security/FEATURE_FLAG_ROLLOUT_LOG.md` when the public-offer rewrite or another production-impacting release flag changes state.",
  },
  {
    label: "Access reviews",
    file: "docs/security/ACCESS_REVIEW_LOG.md",
    workflow: "docs/security/ACCESS_REVIEW_CHECKLIST.md",
    relatedDocs: [
      "docs/security/ACCESS_REVIEW_LOG.md",
      "docs/security/ACCESS_REVIEW_CHECKLIST.md",
      "docs/security/ACCESS_CONTROL.md",
    ],
    owner: "ISMS Manager",
    reviewCadence: "Quarterly",
    section: "Access Reviews",
    scope:
      "Application admin, repository, VPS, database, and CI/CD secret access",
    externalInputs:
      "Current access lists for app admin, repository, VPS, database, CI/CD, and third-party admin surfaces.",
    entryTemplate:
      "| YYYY-MM-DD | reviewer name | reviewed access scope | access lists + checklist ref | findings summary | actions + owners | YYYY-MM-DD or N/A | PR / ticket / note |",
    closeoutWhen:
      "A completed quarterly review row is committed in the access-review log and the matching open-gap row is removed from `AUDIT_EVIDENCE_INDEX.md`.",
    nextAction:
      "Complete the first quarterly access review and record the outcome in `docs/security/ACCESS_REVIEW_LOG.md` using `docs/security/ACCESS_REVIEW_CHECKLIST.md`.",
  },
  {
    label: "Restore tests",
    file: "docs/security/RESTORE_TEST_LOG.md",
    workflow: "docs/security/RESTORE_TEST_PLAYBOOK.md",
    relatedDocs: [
      "docs/security/RESTORE_TEST_LOG.md",
      "docs/security/RESTORE_TEST_PLAYBOOK.md",
      "docs/security/BACKUP_AND_RESTORE.md",
    ],
    owner: "Engineering lead",
    reviewCadence: "Quarterly",
    section: "Backup Restore Tests",
    scope: "Production backup references are external to the repo",
    externalInputs:
      "Backup reference, restore target, smoke-test evidence, and any corrective actions from the exercise.",
    entryTemplate:
      "| YYYY-MM-DD | backup ref | restore environment | smoke tests + validation summary | pass / fail | follow-up actions | PR / ticket / note |",
    closeoutWhen:
      "A completed non-production restore-test row is committed in the restore log and the matching open-gap row is removed from `AUDIT_EVIDENCE_INDEX.md`.",
    nextAction:
      "Run the first non-production restore test and record the outcome in `docs/security/RESTORE_TEST_LOG.md` using `docs/security/RESTORE_TEST_PLAYBOOK.md`.",
  },
  {
    label: "Internal audits",
    file: "docs/security/INTERNAL_AUDIT_LOG.md",
    workflow: "docs/security/INTERNAL_AUDIT_PLAYBOOK.md",
    relatedDocs: [
      "docs/security/INTERNAL_AUDIT_LOG.md",
      "docs/security/INTERNAL_AUDIT_PLAYBOOK.md",
    ],
    owner: "ISMS Manager",
    reviewCadence: "At least annually and after major process changes",
    section: "Internal Audit And Management Review",
    scope: "Internal audit",
    externalInputs:
      "Audit scope, sampled evidence, findings, nonconformities, and corrective-action owners and dates.",
    entryTemplate:
      "| YYYY-MM-DD | auditor name | audit scope | findings summary | none / listed nonconformities | corrective actions + owners | YYYY-MM-DD or N/A | ticket / note |",
    closeoutWhen:
      "A completed internal-audit row is committed in the audit log and the matching open-gap row is removed from `AUDIT_EVIDENCE_INDEX.md`.",
    nextAction:
      "Schedule and record the first internal audit and management review cycles in their respective logs using the linked playbooks and agenda.",
  },
  {
    label: "Management reviews",
    file: "docs/security/MANAGEMENT_REVIEW_LOG.md",
    workflow: "docs/security/MANAGEMENT_REVIEW_AGENDA.md",
    relatedDocs: [
      "docs/security/MANAGEMENT_REVIEW_LOG.md",
      "docs/security/MANAGEMENT_REVIEW_AGENDA.md",
    ],
    owner: "Management",
    reviewCadence: "At least annually and after major ISMS changes",
    section: "Internal Audit And Management Review",
    scope: "Management review",
    externalInputs:
      "Reviewed inputs, decisions, action owners, and due dates from the management-review meeting.",
    entryTemplate:
      "| YYYY-MM-DD | participant list | reviewed inputs | decisions summary | actions + owners | YYYY-MM-DD or N/A | meeting note / ticket |",
    closeoutWhen:
      "A completed management-review row is committed in the management log and the matching open-gap row is removed from `AUDIT_EVIDENCE_INDEX.md`.",
    nextAction:
      "Schedule and record the first internal audit and management review cycles in their respective logs using the linked playbooks and agenda.",
  },
  {
    label: "Incidents and drills",
    file: "docs/security/INCIDENT_POSTMORTEM_LOG.md",
    workflow: "docs/security/INCIDENT_RESPONSE_DRILL_PLAYBOOK.md",
    relatedDocs: [
      "docs/security/INCIDENT_POSTMORTEM_LOG.md",
      "docs/security/INCIDENT_RESPONSE_DRILL_PLAYBOOK.md",
      "docs/security/INCIDENT_RESPONSE.md",
    ],
    owner: "ISMS Manager",
    reviewCadence: "After incidents or incident-response drills",
    section: "Incident And Vulnerability Operations",
    scope: "Incident drill/response",
    externalInputs:
      "Incident or drill scope, severity, impact, containment, recovery outcome, and follow-up actions.",
    entryTemplate:
      "| YYYY-MM-DD | incident / drill | sev-level | scope and impact summary | resolution summary | postmortem complete / pending | follow-up actions | note / ticket |",
    closeoutWhen:
      "A completed incident or drill row is committed in the incident log and the matching open-gap row is removed from `AUDIT_EVIDENCE_INDEX.md`.",
    nextAction:
      "Run the first incident drill and vulnerability review cycle, then record both outcomes in the corresponding logs.",
  },
  {
    label: "Vulnerability reviews",
    file: "docs/security/VULNERABILITY_REVIEW_LOG.md",
    workflow: "docs/security/VULNERABILITY_REVIEW_PLAYBOOK.md",
    relatedDocs: [
      "docs/security/VULNERABILITY_REVIEW_LOG.md",
      "docs/security/VULNERABILITY_REVIEW_PLAYBOOK.md",
      "docs/security/VULNERABILITY_MANAGEMENT.md",
    ],
    owner: "Engineering lead",
    reviewCadence: "Monthly and as findings arrive",
    section: "Incident And Vulnerability Operations",
    scope: "Vulnerability review",
    externalInputs:
      "Finding source, severity, affected asset or package, disposition, owner, and remediation target date.",
    entryTemplate:
      "| YYYY-MM-DD | advisory / scanner / manual review | severity | asset / package / scope | fixed / accepted / deferred | owner | YYYY-MM-DD or N/A | PR / advisory / ticket |",
    closeoutWhen:
      "A completed vulnerability-review row is committed in the vulnerability log and the matching open-gap row is removed from `AUDIT_EVIDENCE_INDEX.md`.",
    nextAction:
      "Run the first incident drill and vulnerability review cycle, then record both outcomes in the corresponding logs.",
  },
  {
    label: "Supplier reviews",
    file: "docs/security/SUPPLIER_REVIEW_LOG.md",
    workflow: "docs/security/SUPPLIER_REVIEW_PLAYBOOK.md",
    relatedDocs: [
      "docs/security/SUPPLIER_REVIEW_LOG.md",
      "docs/security/SUPPLIER_REVIEW_PLAYBOOK.md",
      "docs/security/SUPPLIER_MANAGEMENT.md",
    ],
    owner: "ISMS Manager",
    reviewCadence: "Quarterly and after major supplier changes",
    section: "Supplier Reviews",
    scope: "In-scope SaaS, hosting, database, and AI suppliers",
    externalInputs:
      "Supplier list, reviewed risks, contract or assurance notes, and follow-up owners and due dates.",
    entryTemplate:
      "| YYYY-MM-DD | supplier name | reviewed scope | findings summary | actions + owners | YYYY-MM-DD or N/A | note / ticket / assurance link |",
    closeoutWhen:
      "A completed supplier-review row is committed in the supplier log and the matching open-gap row is removed from `AUDIT_EVIDENCE_INDEX.md`.",
    nextAction:
      "Complete the first supplier review cycle for in-scope suppliers and record it in `docs/security/SUPPLIER_REVIEW_LOG.md`.",
  },
  {
    label: "Security awareness",
    file: "docs/security/SECURITY_AWARENESS_LOG.md",
    workflow: "docs/security/SECURITY_AWARENESS_PLAYBOOK.md",
    relatedDocs: [
      "docs/security/SECURITY_AWARENESS_LOG.md",
      "docs/security/SECURITY_AWARENESS_PLAYBOOK.md",
      "docs/security/AI_USAGE_POLICY.md",
    ],
    owner: "ISMS Manager",
    reviewCadence: "Quarterly and after major security/process changes",
    section: "Awareness And Training",
    scope: "In-scope engineering and admin/support awareness",
    externalInputs:
      "Audience, topic, delivery method, completion outcome, and any follow-up training actions.",
    entryTemplate:
      "| YYYY-MM-DD | audience | topic | workshop / doc / async review | complete / partial | follow-up actions | note / ticket / material link |",
    closeoutWhen:
      "A completed awareness or training row is committed in the awareness log and the matching open-gap row is removed from `AUDIT_EVIDENCE_INDEX.md`.",
    nextAction:
      "Run the first awareness or training cycle and record the completed activity in `docs/security/SECURITY_AWARENESS_LOG.md`.",
  },
  {
    label: "Asset lifecycle",
    file: "docs/security/ASSET_LIFECYCLE_LOG.md",
    workflow: "docs/security/OFFBOARDING_AND_ASSET_RETURN_STANDARD.md",
    relatedDocs: [
      "docs/security/ASSET_LIFECYCLE_LOG.md",
      "docs/security/OFFBOARDING_AND_ASSET_RETURN_STANDARD.md",
      "docs/security/ASSET_DISPOSAL_AND_REUSE_STANDARD.md",
    ],
    owner: "ISMS Manager",
    reviewCadence: "Quarterly",
    section: "Asset Lifecycle",
    scope: "Offboarding asset return and secure disposal/reuse events",
    externalInputs:
      "Lifecycle event type, asset class, safe summary of the result, and any follow-up or exception handling.",
    entryTemplate:
      "| YYYY-MM-DD | return / disposal / reuse / exception | asset class | trigger or scope | result summary | follow-up actions | external note / ticket |",
    closeoutWhen:
      "A completed asset-lifecycle row is committed in the lifecycle log and the matching open-gap row is removed from `AUDIT_EVIDENCE_INDEX.md`.",
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

export function cadenceBucketsForRegister(item) {
  if (item.label === "Asset lifecycle") {
    return ["Quarterly", "Event-driven"];
  }

  const cadence = item.reviewCadence;

  switch (cadence) {
    case "Per rollout and quarterly review":
      return ["Per release / rollout", "Quarterly"];
    case "Quarterly":
      return ["Quarterly"];
    case "Monthly and as findings arrive":
      return ["Monthly", "As findings arrive"];
    case "After incidents or incident-response drills":
      return ["Event-driven"];
    case "Quarterly and after major supplier changes":
    case "Quarterly and after major security/process changes":
      return ["Quarterly", "After major changes"];
    case "At least annually and after major process changes":
    case "At least annually and after major ISMS changes":
      return ["Annual", "After major changes"];
    default:
      return [cadence];
  }
}

export function renderCadenceSummary(registers) {
  const groups = new Map([
    ["Per release / rollout", []],
    ["Monthly", []],
    ["Quarterly", []],
    ["Annual", []],
    ["Event-driven", []],
    ["After major changes", []],
    ["As findings arrive", []],
  ]);

  for (const item of registers) {
    for (const bucket of cadenceBucketsForRegister(item)) {
      const group = groups.get(bucket);
      if (!group) continue;
      group.push(item);
    }
  }

  const orderedBuckets = [
    "Per release / rollout",
    "Monthly",
    "Quarterly",
    "Annual",
    "Event-driven",
    "After major changes",
    "As findings arrive",
  ];

  return orderedBuckets
    .filter((bucket) => (groups.get(bucket) ?? []).length > 0)
    .map((bucket) => {
      const items = groups.get(bucket) ?? [];
      const activities = items.map((item) => item.label).join(", ");
      const evidence = items.map((item) => `\`${item.file}\``).join(", ");
      const owners = [...new Set(items.map((item) => item.owner))].join(", ");

      return {
        bucket,
        activities,
        evidence,
        owners,
      };
    });
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
