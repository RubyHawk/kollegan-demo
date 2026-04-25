import fs from "node:fs";
import path from "node:path";
import {
  escapeTableCell,
  nextActionsForGaps,
  normalize,
  operationalEvidenceRegistry,
  parseMarkdownRow,
  parseOperationalEvidenceIndexGaps,
  parseOperationalRegisterStatus,
  readText,
} from "./lib/operational-evidence.mjs";

const root = process.cwd();
const writeMode = process.argv.includes("--write");
const outputPath = path.join(root, "docs", "security", "READINESS_STATUS.md");
const trackerPath = path.join(
  root,
  "docs",
  "security",
  "ANNEX_A_CONTROL_TRACKER.md",
);

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
  let missingApplicability = 0;
  let missingImplementation = 0;

  for (const line of lines) {
    if (!line.startsWith("|")) continue;
    const columns = parseMarkdownRow(line);
    if (columns.length < 6) continue;
    if (!/^\d+\.\d+$/.test(columns[0])) continue;

    totalControls += 1;
    const applicabilityValue = columns[2];
    const implementationValue = columns[3];

    if (applicability.has(applicabilityValue)) {
      applicability.set(
        applicabilityValue,
        (applicability.get(applicabilityValue) ?? 0) + 1,
      );
    } else {
      missingApplicability += 1;
    }

    if (implementation.has(implementationValue)) {
      implementation.set(
        implementationValue,
        (implementation.get(implementationValue) ?? 0) + 1,
      );
    } else {
      missingImplementation += 1;
    }
  }

  return {
    totalControls,
    applicability,
    implementation,
    missingApplicability,
    missingImplementation,
  };
}

function parseRegisterStatuses() {
  return operationalEvidenceRegistry.map((register) => {
    const status = parseOperationalRegisterStatus(root, register);

    if (!status.exists) {
      return {
        ...status,
        displayStatus: "Missing file",
        note: "Expected register file is missing from the repo.",
      };
    }

    if (status.empty) {
      const asOf = status.asOf ?? "unknown date";
      return {
        ...status,
        displayStatus: "Empty register",
        note: `No repo-backed records committed as of ${asOf}.`,
      };
    }

    return {
      ...status,
      displayStatus: "Records present",
      note: `${status.recordRows} record row(s) detected. Status line: ${status.status}.`,
    };
  });
}

function renderMarkdown() {
  const tracker = parseTracker();
  const openGaps = parseOperationalEvidenceIndexGaps(root);
  const registerStatuses = parseRegisterStatuses();
  const emptyRegisterCount = registerStatuses.filter(
    (register) => register.displayStatus === "Empty register",
  ).length;
  const nextActions = nextActionsForGaps(openGaps);
  const structuralObservations = [];

  if (tracker.missingApplicability === 0) {
    structuralObservations.push(
      `All ${tracker.totalControls} Annex A controls currently have an applicability decision in \`ANNEX_A_CONTROL_TRACKER.md\`.`,
    );
  } else {
    structuralObservations.push(
      `${tracker.missingApplicability} Annex A control rows are still missing an applicability decision in \`ANNEX_A_CONTROL_TRACKER.md\`.`,
    );
  }

  if (tracker.missingImplementation === 0) {
    structuralObservations.push(
      "All tracked Annex A controls currently have an implementation-status value.",
    );
  } else {
    structuralObservations.push(
      `${tracker.missingImplementation} Annex A control rows are still missing an implementation-status value.`,
    );
  }

  if (openGaps.length === 0 && emptyRegisterCount === 0) {
    structuralObservations.push(
      "No open evidence-index gaps or empty operating registers are currently detected in the repository snapshot.",
    );
  } else {
    structuralObservations.push(
      "Remaining readiness gaps in the repository are primarily missing operating records, not missing baseline structure.",
    );
  }

  structuralObservations.push(
    "Certification readiness still must not be claimed until the operating logs contain real completed entries.",
  );

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
| Controls missing applicability decision | ${tracker.missingApplicability} |
| Controls with baseline evidence linked | ${tracker.implementation.get("Baseline evidence linked") ?? 0} |
| Controls with open gaps | ${tracker.implementation.get("Open gap") ?? 0} |
| Controls missing implementation status | ${tracker.missingImplementation} |
| Operational evidence registers tracked | ${registerStatuses.length} |
| Empty operational evidence registers | ${emptyRegisterCount} |
| Open gap rows in audit evidence index | ${openGaps.length} |

## Structural Readiness Observations

${structuralObservations.map((observation) => `- ${observation}`).join("\n")}

## Operational Evidence Register Status

| Register | Review cadence | Status | Owner | Note |
| --- | --- | --- | --- | --- |
${registerStatuses.map((register) => `| ${escapeTableCell(register.label)} | ${escapeTableCell(register.reviewCadence)} | ${escapeTableCell(register.displayStatus)} | ${escapeTableCell(register.owner)} | ${escapeTableCell(register.note)} |`).join("\n")}

## Open Gaps From Audit Evidence Index

| Section | Scope or activity | Owner | Summary |
| --- | --- | --- | --- |
${openGaps.map((gap) => `| ${escapeTableCell(gap.section)} | ${escapeTableCell(gap.scope)} | ${escapeTableCell(gap.owner)} | ${escapeTableCell(gap.summary)} |`).join("\n")}

## Next Highest-Value Actions

${nextActions.map((action) => `- ${action}`).join("\n")}
`;
}

const nextContent = renderMarkdown();
const currentContent = fs.existsSync(outputPath) ? readText(outputPath) : null;

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
console.error(
  "Run `npm run check:security-readiness:write` and commit the result.",
);
process.exit(1);
