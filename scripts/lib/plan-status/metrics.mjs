import path from "node:path";
import {
  fileExists,
  keyVerificationFiles,
  normalize,
  parseCount,
  readText,
  requiredReadFirstDocs,
  runScript,
} from "./shared.mjs";
import {
  parseEvidenceIndexGaps,
  parseReadinessActions,
  parseScope,
  parseSummaryTableFromText,
} from "./parsers.mjs";

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

function collectInventoryMetrics(inventorySummary) {
  return {
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
}

function collectReadinessMetrics(readinessSummary) {
  return {
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
}

function buildRepoSideRemaining({
  implementationOrderCount,
  inventoryMetrics,
  readinessMetrics,
  readFirst,
  scope,
  verification,
}) {
  const repoSideRemaining = [];

  if (implementationOrderCount !== 18) {
    repoSideRemaining.push(
      `Restore the implementation-order baseline to 18 tracked items; current count is ${implementationOrderCount}.`,
    );
  }
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
  if (inventoryMetrics.legacyWrappers > 0) {
    repoSideRemaining.push(
      `Retire or explicitly justify the remaining ${inventoryMetrics.legacyWrappers} legacy API compatibility wrapper(s).`,
    );
  }
  if (
    inventoryMetrics.filesAbove1000 > 0 ||
    inventoryMetrics.filesAbove500 > 0
  ) {
    repoSideRemaining.push(
      `Bring the file-size inventory back to zero over-threshold files; current snapshot shows ${inventoryMetrics.filesAbove1000} file(s) above 1000 lines and ${inventoryMetrics.filesAbove500} file(s) above 500 lines.`,
    );
  }
  if (inventoryMetrics.deadCandidates > 0) {
    repoSideRemaining.push(
      `Resolve the ${inventoryMetrics.deadCandidates} remaining dead-candidate review row(s).`,
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

  return repoSideRemaining;
}

export function collectPlanStatusData(root) {
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
  const readinessActions = parseReadinessActions(readinessPath, root);
  const scope = parseScope(scopePath, root);
  const readFirst = readFirstStatus(root);
  const verification = verificationStatus(root);

  const inventoryMetrics = collectInventoryMetrics(inventorySummary);
  const readinessMetrics = collectReadinessMetrics(readinessSummary);

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

  return {
    completedOperationalRegisters,
    completionRows,
    engineeringStructureComplete,
    governanceStructureComplete,
    implementationOrderCount,
    inventoryMetrics,
    milestoneRows,
    readinessActions,
    readinessGaps,
    readinessMetrics,
    repoBackedPlanComplete,
    repoSideRemaining: buildRepoSideRemaining({
      implementationOrderCount,
      inventoryMetrics,
      readinessMetrics,
      readFirst,
      scope,
      verification,
    }),
    scope,
  };
}
