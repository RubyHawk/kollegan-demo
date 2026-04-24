import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const writeMode = process.argv.includes("--write");
const outputPath = path.join(root, "docs", "security", "READINESS_STATUS.md");
const trackerPath = path.join(root, "docs", "security", "ANNEX_A_CONTROL_TRACKER.md");
const evidenceIndexPath = path.join(root, "docs", "security", "AUDIT_EVIDENCE_INDEX.md");

const trackedRegisters = [
  {
    label: "Access reviews",
    file: "docs/security/ACCESS_REVIEW_LOG.md",
    owner: "ISMS Manager",
  },
  {
    label: "Restore tests",
    file: "docs/security/RESTORE_TEST_LOG.md",
    owner: "Engineering lead",
  },
  {
    label: "Internal audits",
    file: "docs/security/INTERNAL_AUDIT_LOG.md",
    owner: "ISMS Manager",
  },
  {
    label: "Management reviews",
    file: "docs/security/MANAGEMENT_REVIEW_LOG.md",
    owner: "Management",
  },
  {
    label: "Feature-flag rollouts",
    file: "docs/security/FEATURE_FLAG_ROLLOUT_LOG.md",
    owner: "Engineering lead",
  },
  {
    label: "Incidents and drills",
    file: "docs/security/INCIDENT_POSTMORTEM_LOG.md",
    owner: "ISMS Manager",
  },
  {
    label: "Vulnerability reviews",
    file: "docs/security/VULNERABILITY_REVIEW_LOG.md",
    owner: "Engineering lead",
  },
  {
    label: "Supplier reviews",
    file: "docs/security/SUPPLIER_REVIEW_LOG.md",
    owner: "ISMS Manager",
  },
  {
    label: "Security awareness",
    file: "docs/security/SECURITY_AWARENESS_LOG.md",
    owner: "ISMS Manager",
  },
  {
    label: "Asset lifecycle",
    file: "docs/security/ASSET_LIFECYCLE_LOG.md",
    owner: "ISMS Manager",
  },
];

const nextActionMap = new Map([
  [
    "Feature Flag Rollout Evidence",
    "Record the first completed production rollout or rollback in `docs/security/FEATURE_FLAG_ROLLOUT_LOG.md` when the public-offer rewrite or another production-impacting release flag changes state.",
  ],
  [
    "Access Reviews",
    "Complete the first quarterly access review and record the outcome in `docs/security/ACCESS_REVIEW_LOG.md` using `docs/security/ACCESS_REVIEW_CHECKLIST.md`.",
  ],
  [
    "Backup Restore Tests",
    "Run the first non-production restore test and record the outcome in `docs/security/RESTORE_TEST_LOG.md` using `docs/security/RESTORE_TEST_PLAYBOOK.md`.",
  ],
  [
    "Internal Audit And Management Review",
    "Schedule and record the first internal audit and management review cycles in their respective logs using the linked playbooks and agenda.",
  ],
  [
    "Incident And Vulnerability Operations",
    "Run the first incident drill and vulnerability review cycle, then record both outcomes in the corresponding logs.",
  ],
  [
    "Supplier Reviews",
    "Complete the first supplier review cycle for in-scope suppliers and record it in `docs/security/SUPPLIER_REVIEW_LOG.md`.",
  ],
  [
    "Awareness And Training",
    "Run the first awareness or training cycle and record the completed activity in `docs/security/SECURITY_AWARENESS_LOG.md`.",
  ],
]);

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function normalize(filePath) {
  return filePath.replaceAll("\\", "/");
}

function escapeTableCell(value) {
  return String(value).replaceAll("|", "\\|");
}

function parseMarkdownRow(line) {
  return line
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseTracker() {
  const lines = readText(trackerPath).split(/\r?\n/);
  const applicability = new Map([
    ["Included", 0],
    ["Excluded", 0],
    ["Review required", 0],
  ]);
  const implementation = new Map([
    ["Baseline evidence linked", 0],
    ["Open gap", 0],
    ["Excluded", 0],
  ]);

  let totalControls = 0;

  for (const line of lines) {
    if (!line.startsWith("|")) continue;
    const columns = parseMarkdownRow(line);
    if (columns.length < 6) continue;
    if (!/^\d+\.\d+$/.test(columns[0])) continue;

    totalControls += 1;
    applicability.set(
      columns[2],
      (applicability.get(columns[2]) ?? 0) + 1,
    );
    implementation.set(
      columns[3],
      (implementation.get(columns[3]) ?? 0) + 1,
    );
  }

  return { totalControls, applicability, implementation };
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
      date: columns[0].replace(/^Open gap as of\s+/, ""),
      scope: columns[1],
      owner: columns.at(-1) ?? "Unknown",
      summary: columns.slice(2, -1).join(" | "),
    });
  }

  return gaps;
}

function parseRegisterStatuses() {
  return trackedRegisters.map((register) => {
    const fullPath = path.join(root, register.file);
    const text = readText(fullPath);
    const emptyStatusMatch = text.match(/^Status:\s+Empty register as of (.+)$/m);
    const noRecordsMatch = text.match(/^No .* records are committed yet as of (.+)\.$/m);

    if (emptyStatusMatch || noRecordsMatch) {
      const asOf = emptyStatusMatch?.[1] ?? noRecordsMatch?.[1] ?? "unknown date";
      return {
        ...register,
        status: "Empty register",
        note: `No repo-backed records committed as of ${asOf}.`,
      };
    }

    const statusMatch = text.match(/^Status:\s+(.+)$/m);
    return {
      ...register,
      status: "Records present or manual review needed",
      note: statusMatch?.[1] ?? "See file contents.",
    };
  });
}

function renderMarkdown() {
  const tracker = parseTracker();
  const openGaps = parseEvidenceIndexGaps();
  const registerStatuses = parseRegisterStatuses();
  const emptyRegisterCount = registerStatuses.filter(
    (register) => register.status === "Empty register",
  ).length;
  const nextActions = [...new Set(openGaps.map((gap) => nextActionMap.get(gap.section)).filter(Boolean))];

  return `# Security Readiness Status

This document is generated from the current checkout. Run:

\`\`\`txt
npm run check:security-readiness:write
\`\`\`

It summarizes what the repository can currently prove about ISO/IEC 27001:2022 readiness structure and which operating records are still missing. It does not invent evidence that has not been recorded.

## Snapshot Summary

| Metric | Value |
|---|---:|
| Annex A controls tracked | ${tracker.totalControls} |
| Included controls | ${tracker.applicability.get("Included") ?? 0} |
| Excluded controls | ${tracker.applicability.get("Excluded") ?? 0} |
| Review required controls | ${tracker.applicability.get("Review required") ?? 0} |
| Controls with baseline evidence linked | ${tracker.implementation.get("Baseline evidence linked") ?? 0} |
| Controls with open gaps | ${tracker.implementation.get("Open gap") ?? 0} |
| Operational evidence registers tracked | ${registerStatuses.length} |
| Empty operational evidence registers | ${emptyRegisterCount} |
| Open gap rows in audit evidence index | ${openGaps.length} |

## Structural Readiness Observations

- All 93 Annex A controls currently have an applicability decision in \`ANNEX_A_CONTROL_TRACKER.md\`.
- Remaining readiness gaps in the repository are primarily missing operating records, not missing baseline structure.
- Certification readiness still must not be claimed until the operating logs contain real completed entries.

## Operational Evidence Register Status

| Register | Status | Owner | Note |
| --- | --- | --- | --- |
${registerStatuses.map((register) => `| ${escapeTableCell(register.label)} | ${escapeTableCell(register.status)} | ${escapeTableCell(register.owner)} | ${escapeTableCell(register.note)} |`).join("\n")}

## Open Gaps From Audit Evidence Index

| Section | Scope or activity | Owner | Summary |
| --- | --- | --- | --- |
${openGaps.map((gap) => `| ${escapeTableCell(gap.section)} | ${escapeTableCell(gap.scope)} | ${escapeTableCell(gap.owner)} | ${escapeTableCell(gap.summary)} |`).join("\n")}

## Next Highest-Value Actions

${nextActions.map((action) => `- ${action}`).join("\n")}
`;
}

const nextContent = renderMarkdown();
const currentContent = fs.existsSync(outputPath)
  ? readText(outputPath)
  : null;

if (writeMode) {
  fs.writeFileSync(outputPath, nextContent, "utf8");
  console.log(`Wrote ${normalize(path.relative(root, outputPath))}.`);
  process.exit(0);
}

if (currentContent === nextContent) {
  console.log("Security readiness status is up to date.");
  process.exit(0);
}

console.error("Security readiness status is out of date.");
console.error("Run `npm run check:security-readiness:write` and commit the result.");
process.exit(1);
