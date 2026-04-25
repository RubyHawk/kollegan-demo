import { collectPlanStatusData } from "./metrics.mjs";
import { escapeTableCell } from "./shared.mjs";

export function renderPlanStatus(root) {
  const {
    completedOperationalRegisters,
    completionRows,
    implementationOrderCount,
    inventoryMetrics,
    milestoneRows,
    readinessActions,
    readinessGaps,
    readinessMetrics,
    repoBackedPlanComplete,
    repoSideRemaining,
    scope,
  } = collectPlanStatusData(root);

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
