import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const requiredReadFirstDocs = [
  "docs/AI_ENGINEERING.md",
  "docs/PRODUCTION_DATA_SAFETY.md",
  "docs/FRONTEND_GUIDELINES.md",
  "docs/BRANDING_AND_THEMING.md",
  "docs/API_VERSIONING.md",
  "docs/REFACTORING_PLAYBOOK.md",
  "docs/CODEBASE_CLEANUP_INVENTORY.md",
  "docs/security/AUDIT_EVIDENCE_INDEX.md",
];

const keyVerificationFiles = [
  "tests/unit/api-client.test.ts",
  "tests/unit/feature-flags-api-contract.test.ts",
  "tests/unit/public-offer-api-contract.test.ts",
  "tests/unit/theme-bootstrap.test.ts",
];

export function planStatusOutputPath(root) {
  return path.join(root, "docs", "PLAN_STATUS.md");
}

export function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

export function normalize(filePath) {
  return filePath.replaceAll("\\", "/");
}

function escapeTableCell(value) {
  return String(value).replaceAll("|", "\\|");
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

function parseSummaryTableFromText(text, heading, sourceLabel) {
  const lines = text.split(/\r?\n/);
  const headingIndex = lines.findIndex((line) => line.trim() === heading);
  if (headingIndex === -1) {
    throw new Error(`Could not find heading "${heading}" in ${sourceLabel}.`);
  }

  const values = new Map();

  for (let index = headingIndex + 1; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) {
      if (values.size > 0) break;
      continue;
    }
    if (!line.startsWith("|")) {
      if (values.size > 0) break;
      continue;
    }

    const cells = parseMarkdownRow(line);
    if (cells.length < 2) continue;
    if (cells[0] === "Metric" || /^-+$/.test(cells[0].replaceAll(":", ""))) {
      continue;
    }
    values.set(cells[0], cells[1]);
  }

  return values;
}

function parseEvidenceIndexGaps(evidenceIndexPath) {
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

function parseReadinessActions(readinessPath) {
  const lines = readText(readinessPath).split(/\r?\n/);
  const heading = "## Next Highest-Value Actions";
  const headingIndex = lines.findIndex((line) => line.trim() === heading);
  if (headingIndex === -1) {
    throw new Error(
      `Could not find heading "${heading}" in ${normalize(
        path.relative(process.cwd(), readinessPath),
      )}.`,
    );
  }

  const actions = [];

  for (let index = headingIndex + 1; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) {
      if (actions.length > 0) break;
      continue;
    }
    if (!line.startsWith("- ")) {
      if (actions.length > 0) break;
      continue;
    }

    actions.push(line.slice(2).trim());
  }

  return actions;
}

function parseScope(scopePath, root) {
  const text = readText(scopePath);
  const status = text.match(/^Status:\s+(.+)$/m)?.[1] ?? "Unknown";
  const outOfScopeSection =
    text.split("## Out Of Scope")[1]?.split("## Scope Decisions")[0] ?? "";
  const outOfScopeItems = outOfScopeSection
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim());

  return {
    status,
    outOfScopeItems,
    hasPendingDecisionLanguage: /Pending Decision/i.test(text),
    sourceLabel: normalize(path.relative(root, scopePath)),
  };
}

function fileExists(root, relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function parseCount(value) {
  const match = String(value).match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function readFirstStatus(root) {
  const missing = requiredReadFirstDocs.filter(
    (file) => !fileExists(root, file),
  );
  return {
    complete: missing.length === 0,
    missing,
  };
}

function verificationStatus(root) {
  const missing = keyVerificationFiles.filter(
    (file) => !fileExists(root, file),
  );
  return {
    complete: missing.length === 0,
    missing,
  };
}

function completionRow(area, complete, evidence) {
  return {
    area,
    status: complete ? "Complete" : "Open",
    percent: complete ? 100 : 0,
    evidence,
  };
}

function runScript(root, relativePath) {
  return execFileSync(process.execPath, [relativePath], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

export function renderPlanStatus(root) {
  const planPath = path.join(root, "docs", "ERP_REFACTOR_PLAN.md");
  const readinessPath = path.join(
    root,
    "docs",
    "security",
    "READINESS_STATUS.md",
  );
  const evidenceIndexPath = path.join(
    root,
    "docs",
    "security",
    "AUDIT_EVIDENCE_INDEX.md",
  );
  const scopePath = path.join(root, "docs", "security", "ISMS_SCOPE.md");

  const planText = readText(planPath);
  const implementationOrderCount = [...planText.matchAll(/^\d+\.\s+/gm)].length;
  const inventorySummary = parseSummaryTableFromText(
    runScript(root, "scripts/codebase-inventory.mjs"),
    "## Snapshot Summary",
    "scripts/codebase-inventory.mjs output",
  );
  const readinessSummary = parseSummaryTableFromText(
    readText(readinessPath),
    "## Snapshot Summary",
    normalize(path.relative(root, readinessPath)),
  );
  const readinessGaps = parseEvidenceIndexGaps(evidenceIndexPath);
  const readinessActions = parseReadinessActions(readinessPath);
  const scope = parseScope(scopePath, root);
  const readFirst = readFirstStatus(root);
  const verification = verificationStatus(root);

  const inventoryMetrics = {
    trackedFiles: parseCount(
      inventorySummary.get("Tracked files scanned") ?? 0,
    ),
    sourceFiles: parseCount(inventorySummary.get("Source files scanned") ?? 0),
    filesAbove1000: parseCount(
      inventorySummary.get("Files above 1000 lines") ?? 0,
    ),
    filesAbove500: parseCount(
      inventorySummary.get("Files above 500 lines") ?? 0,
    ),
    apiRouteFiles: parseCount(inventorySummary.get("API route files") ?? 0),
    apiV1RouteFiles: parseCount(
      inventorySummary.get("API v1 route files") ?? 0,
    ),
    featureApiClients: parseCount(
      inventorySummary.get("Feature API clients") ?? 0,
    ),
    legacyWrappers: parseCount(
      inventorySummary.get("Legacy API compatibility wrappers") ?? 0,
    ),
    deadCandidates: parseCount(
      inventorySummary.get("Dead-candidate review rows") ?? 0,
    ),
    legacyLiteralRefs: parseCount(
      inventorySummary.get(
        "Literal legacy `/api/*` references outside route files",
      ) ?? 0,
    ),
  };

  const readinessMetrics = {
    annexTracked: parseCount(
      readinessSummary.get("Annex A controls tracked") ?? 0,
    ),
    baselineEvidenceLinked: parseCount(
      readinessSummary.get("Controls with baseline evidence linked") ?? 0,
    ),
    missingApplicability: parseCount(
      readinessSummary.get("Controls missing applicability decision") ?? 0,
    ),
    openGapControls: parseCount(
      readinessSummary.get("Controls with open gaps") ?? 0,
    ),
    missingImplementation: parseCount(
      readinessSummary.get("Controls missing implementation status") ?? 0,
    ),
    operationalRegisters: parseCount(
      readinessSummary.get("Operational evidence registers tracked") ?? 0,
    ),
    emptyOperationalRegisters: parseCount(
      readinessSummary.get("Empty operational evidence registers") ?? 0,
    ),
    openGapRows: parseCount(
      readinessSummary.get("Open gap rows in audit evidence index") ?? 0,
    ),
  };

  const engineeringStructureComplete =
    implementationOrderCount === 18 &&
    readFirst.complete &&
    verification.complete &&
    inventoryMetrics.apiV1RouteFiles > 0 &&
    inventoryMetrics.featureApiClients > 0 &&
    inventoryMetrics.legacyWrappers === 0 &&
    inventoryMetrics.filesAbove1000 === 0 &&
    inventoryMetrics.filesAbove500 === 0 &&
    inventoryMetrics.deadCandidates === 0;

  const governanceStructureComplete =
    readinessMetrics.annexTracked === 93 &&
    readinessMetrics.baselineEvidenceLinked === 93 &&
    readinessMetrics.missingApplicability === 0 &&
    readinessMetrics.openGapControls === 0 &&
    readinessMetrics.missingImplementation === 0 &&
    readinessMetrics.operationalRegisters === 10 &&
    !scope.hasPendingDecisionLanguage;

  const repoBackedPlanComplete =
    engineeringStructureComplete && governanceStructureComplete;
  const completedOperationalRegisters =
    readinessMetrics.operationalRegisters -
    readinessMetrics.emptyOperationalRegisters;

  const completionRows = [
    completionRow(
      "Engineering / refactor structure",
      engineeringStructureComplete,
      `All ${implementationOrderCount} implementation-order items are structurally covered in the repo; inventory shows ${inventoryMetrics.legacyWrappers} legacy wrappers, ${inventoryMetrics.filesAbove1000} files above 1000 lines, ${inventoryMetrics.filesAbove500} files above 500 lines, and ${inventoryMetrics.deadCandidates} dead-candidate rows.`,
    ),
    completionRow(
      "Governance / evidence structure",
      governanceStructureComplete,
      `${readinessMetrics.annexTracked} Annex A controls are tracked, ${readinessMetrics.baselineEvidenceLinked} have baseline evidence linked, ${readinessMetrics.missingApplicability} are missing applicability, ${readinessMetrics.openGapControls} have structural open gaps, ${readinessMetrics.missingImplementation} are missing implementation status, and ISMS scope has no pending-decision language.`,
    ),
    completionRow(
      "Total repo-backed plan structure",
      repoBackedPlanComplete,
      repoBackedPlanComplete
        ? "All currently-detectable repo-side structural plan requirements are present; the remaining work is operating the ISMS and recording real events."
        : "Some repo-side structural plan requirements are still missing or inconsistent.",
    ),
  ];

  const milestoneRows = [
    {
      milestone: "Read-first baseline docs",
      status: readFirst.complete ? "Complete" : "Missing inputs",
      evidence: readFirst.complete
        ? "All listed read-first docs are present in `docs/`."
        : `Missing: ${readFirst.missing.join(", ")}`,
    },
    {
      milestone: "Render and API contract baseline",
      status: verification.complete ? "Complete" : "Needs attention",
      evidence: verification.complete
        ? "Key contract and client verification files exist: `api-client.test.ts`, `feature-flags-api-contract.test.ts`, `public-offer-api-contract.test.ts`, and `theme-bootstrap.test.ts`."
        : `Missing: ${verification.missing.join(", ")}`,
    },
    {
      milestone: "API v1 migration and wrappers",
      status: inventoryMetrics.legacyWrappers === 0 ? "Complete" : "Open",
      evidence:
        `Inventory shows ${inventoryMetrics.apiV1RouteFiles} \`/api/v1\` route files, ` +
        `${inventoryMetrics.featureApiClients} feature API clients, and ${inventoryMetrics.legacyWrappers} legacy compatibility wrappers.`,
    },
    {
      milestone: "Cleanup and file-size enforcement",
      status:
        inventoryMetrics.filesAbove1000 === 0 &&
        inventoryMetrics.filesAbove500 === 0 &&
        inventoryMetrics.deadCandidates === 0
          ? "Complete"
          : "Open",
      evidence:
        `Inventory shows ${inventoryMetrics.filesAbove1000} files above 1000 lines, ` +
        `${inventoryMetrics.filesAbove500} files above 500 lines, and ${inventoryMetrics.deadCandidates} dead-candidate review rows.`,
    },
    {
      milestone: "ISO readiness structure",
      status:
        readinessMetrics.annexTracked === 93 &&
        readinessMetrics.missingApplicability === 0 &&
        readinessMetrics.openGapControls === 0 &&
        readinessMetrics.missingImplementation === 0
          ? "Complete structurally"
          : "Open structurally",
      evidence:
        `${readinessMetrics.annexTracked} Annex A controls are tracked, ` +
        `${readinessMetrics.missingApplicability} are missing applicability, ` +
        `${readinessMetrics.openGapControls} have open-gap implementation status, and ` +
        `${readinessMetrics.missingImplementation} are missing implementation status.`,
    },
    {
      milestone: "Operational evidence execution",
      status:
        readinessMetrics.emptyOperationalRegisters === 0
          ? "Complete"
          : "Operational work remaining",
      evidence:
        `${readinessMetrics.operationalRegisters} operational registers are tracked, ` +
        `${readinessMetrics.emptyOperationalRegisters} are still empty, and the audit evidence index still has ${readinessMetrics.openGapRows} open-gap rows.`,
    },
    {
      milestone: "ISMS scope decisions",
      status: scope.hasPendingDecisionLanguage
        ? "Pending decisions remain"
        : "Complete structurally",
      evidence: `ISMS scope status is "${scope.status}" and the current out-of-scope list has ${scope.outOfScopeItems.length} explicit items.`,
    },
  ];

  const repoSideRemaining = [];
  if (!readFirst.complete) {
    repoSideRemaining.push(
      `Restore or add any missing read-first docs: ${readFirst.missing.join(", ")}.`,
    );
  }
  if (!verification.complete) {
    repoSideRemaining.push(
      `Restore or add any missing contract/baseline verification files: ${verification.missing.join(", ")}.`,
    );
  }
  if (scope.hasPendingDecisionLanguage) {
    repoSideRemaining.push(
      "Remove any remaining `Pending Decision` scope language and replace it with explicit scope criteria.",
    );
  }
  if (
    readinessMetrics.openGapControls > 0 ||
    readinessMetrics.missingImplementation > 0 ||
    readinessMetrics.missingApplicability > 0
  ) {
    repoSideRemaining.push(
      "Bring the Annex A tracker and readiness snapshot back to a zero-structural-gap state.",
    );
  }
  if (repoSideRemaining.length === 0) {
    repoSideRemaining.push(
      "No major repo-structure gaps are currently detected; the remaining plan work is primarily operational evidence.",
    );
  }

  return `# Refactor Plan Status

This document is generated from the current checkout. Run:

\`\`\`txt
npm run check:plan-status:write
\`\`\`

It summarizes what the repository can currently prove about the ERP refactor and ISO readiness plan. It only reports repo-backed completion for structural work and does not invent completed operational evidence.

## Repo-Backed Completion

| Area | Status | Repo-backed completion | Evidence |
| --- | --- | ---: | --- |
${completionRows.map((row) => `| ${escapeTableCell(row.area)} | ${escapeTableCell(row.status)} | ${row.percent}% | ${escapeTableCell(row.evidence)} |`).join("\n")}

## Snapshot Summary

| Metric | Value |
|---|---:|
| Implementation-order items in plan | ${implementationOrderCount} |
| Tracked files scanned | ${inventoryMetrics.trackedFiles} |
| Source files scanned | ${inventoryMetrics.sourceFiles} |
| API route files | ${inventoryMetrics.apiRouteFiles} |
| API v1 route files | ${inventoryMetrics.apiV1RouteFiles} |
| Feature API clients | ${inventoryMetrics.featureApiClients} |
| Legacy API compatibility wrappers | ${inventoryMetrics.legacyWrappers} |
| Files above 1000 lines | ${inventoryMetrics.filesAbove1000} |
| Files above 500 lines | ${inventoryMetrics.filesAbove500} |
| Dead-candidate review rows | ${inventoryMetrics.deadCandidates} |
| Literal legacy \`/api/*\` references outside route files | ${inventoryMetrics.legacyLiteralRefs} |
| Annex A controls tracked | ${readinessMetrics.annexTracked} |
| Controls with baseline evidence linked | ${readinessMetrics.baselineEvidenceLinked} |
| Empty operational evidence registers | ${readinessMetrics.emptyOperationalRegisters} |
| Open gap rows in audit evidence index | ${readinessMetrics.openGapRows} |

## Evidence-Backed Milestones

| Milestone | Status | Evidence |
| --- | --- | --- |
${milestoneRows.map((row) => `| ${escapeTableCell(row.milestone)} | ${escapeTableCell(row.status)} | ${escapeTableCell(row.evidence)} |`).join("\n")}

## Structural Readiness Notes

- The cleanup inventory currently reports \`${inventoryMetrics.legacyWrappers}\` legacy API compatibility wrappers and \`${inventoryMetrics.deadCandidates}\` dead-candidate review rows.
- The inventory still reports \`${inventoryMetrics.legacyLiteralRefs}\` literal legacy \`/api/*\` references outside route files; the generated inventory distinguishes expected demo, public-document, OpenAPI, proxy, and integration rows from migration blockers.
- The readiness dashboard currently reports \`${readinessMetrics.emptyOperationalRegisters}\` empty operational registers and \`${readinessMetrics.openGapRows}\` open evidence-index rows, which means the remaining plan work is mostly operating the ISMS and recording real events.
- ISMS scope is currently marked as \`${escapeTableCell(scope.status)}\` and ${
    scope.hasPendingDecisionLanguage
      ? "still contains `Pending Decision` language that should be resolved."
      : "no `Pending Decision` scope language is present in the tracked scope document."
  }

## Remaining Repo-Side Work

${repoSideRemaining.map((item) => `- ${item}`).join("\n")}

## Operational Readiness Snapshot

- Repo-backed structural completion is currently \`${repoBackedPlanComplete ? 100 : 0}%\`, but practical readiness is still limited by real operating evidence.
- Operational evidence progress is currently \`${completedOperationalRegisters}/${readinessMetrics.operationalRegisters}\` completed registers and \`${readinessMetrics.emptyOperationalRegisters}\` still-empty registers.
- The audit evidence index currently reports \`${readinessMetrics.openGapRows}\` open-gap rows that must only close when real records are added.
- Use \`docs/security/OPERATIONAL_CLOSEOUT_STATUS.md\` as the operator-facing checklist for closing the remaining evidence gaps.
- Use \`docs/security/ISMS_OPERATING_RHYTHM.md\`, \`docs/security/RELEASE_EVIDENCE_CHECKLIST.md\`, \`docs/security/QUARTERLY_EVIDENCE_PACKET.md\`, and \`docs/security/ANNUAL_GOVERNANCE_PACKET.md\` to run the remaining stage-2 work in practical batches instead of disconnected one-off tasks.

## Remaining Operational Work

| Section | Owner | Summary |
| --- | --- | --- |
${readinessGaps.map((gap) => `| ${escapeTableCell(gap.section)} | ${escapeTableCell(gap.owner)} | ${escapeTableCell(gap.summary)} |`).join("\n")}

## Next Highest-Value Actions

${readinessActions.map((action) => `- ${action}`).join("\n")}
`;
}
