import fs from "node:fs";
import path from "node:path";
import {
  escapeTableCell,
  normalize,
  operationalEvidenceRegistry,
  parseOperationalEvidenceIndexGaps,
  parseOperationalRegisterStatus,
  readText,
} from "./lib/operational-evidence.mjs";

const root = process.cwd();
const writeMode = process.argv.includes("--write");
const outputPath = path.join(
  root,
  "docs",
  "security",
  "OPERATIONAL_CLOSEOUT_STATUS.md",
);

function renderChecklist(item, hasGap) {
  const relatedDocs = item.relatedDocs.map((doc) => `\`${doc}\``).join(", ");

  return `### ${item.label}

- Current gap state: ${hasGap ? "Open gap tracked in `AUDIT_EVIDENCE_INDEX.md`." : "No open-gap row currently tracked."}
- Owner: ${item.owner}
- Review cadence: ${item.reviewCadence}
- Primary workflow: \`${item.workflow}\`
- Entry standard: \`docs/security/OPERATIONAL_RECORD_ENTRY_STANDARD.md\`
- Files to open: ${relatedDocs}
- External inputs to gather: ${item.externalInputs}
- Suggested row template: \`${item.entryTemplate}\`

Checklist:
1. Open the workflow in \`${item.workflow}\` and prepare the evidence set described there.
2. Gather the safe summary inputs listed above without committing secrets, raw exports, or sensitive operational detail.
3. Add one completed row to \`${item.file}\` and update the register status line if this is the first committed record.
4. Remove the matching open-gap row under \`${item.section}\` in \`docs/security/AUDIT_EVIDENCE_INDEX.md\` once the record is committed.
5. Regenerate \`docs/security/READINESS_STATUS.md\` and \`docs/PLAN_STATUS.md\` so the dashboards reflect the closed gap.

Close the gap when: ${item.closeoutWhen}
`;
}

function renderMarkdown() {
  const registerStatuses = operationalEvidenceRegistry.map((item) =>
    parseOperationalRegisterStatus(root, item),
  );
  const openGaps = parseOperationalEvidenceIndexGaps(root);
  const openGapKeys = new Set(
    openGaps.map((gap) => `${gap.section}::${gap.scope}`),
  );
  const emptyRegisters = registerStatuses.filter((item) => item.empty);

  return `# Operational Evidence Closeout Status

This document is generated from the current checkout. Run:

\`\`\`txt
npm run check:operational-closeout-status:write
\`\`\`

Use it as the operator-facing checklist for the remaining operational evidence work. It summarizes the current ${openGaps.length} open operational evidence gap(s) without inventing completed records.

Use \`docs/security/OPERATIONAL_RECORD_ENTRY_STANDARD.md\` together with the log-specific workflow before you add a completed row.

## Snapshot Summary

| Metric | Value |
| --- | ---: |
| Operational evidence registers tracked | ${registerStatuses.length} |
| Empty operational evidence registers | ${emptyRegisters.length} |
| Open operational evidence gaps | ${openGaps.length} |
| Registers with a linked workflow document | ${operationalEvidenceRegistry.filter((item) => item.workflow).length} |

## Working Rules

- Do not create fake evidence rows just to close a dashboard gap.
- Do not commit secrets, raw customer exports, backups, or sensitive incident/HR data.
- Keep detailed operational evidence outside the repo when needed and link a safe summary or ticket reference instead.
- Close an evidence gap only after a completed record row is committed in the corresponding log.
- If a log gets its first completed row, change the status line to \`Active register; last updated YYYY-MM-DD\`.

## Closeout Queue

| Register | Owner | Review cadence | Status | Gap row | Primary workflow |
| --- | --- | --- | --- | --- | --- |
${registerStatuses
  .map((item) => {
    const key = `${item.section}::${item.scope}`;
    const gapState = openGapKeys.has(key) ? "Open" : "Closed";
    const status = item.empty ? "Empty register" : "Records present";
    return `| ${escapeTableCell(item.label)} | ${escapeTableCell(item.owner)} | ${escapeTableCell(item.reviewCadence)} | ${escapeTableCell(status)} | ${gapState} | ${escapeTableCell(item.workflow)} |`;
  })
  .join("\n")}

## Register Checklists

${operationalEvidenceRegistry
  .map((item) =>
    renderChecklist(item, openGapKeys.has(`${item.section}::${item.scope}`)),
  )
  .join("\n")}
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
  console.log("Operational closeout status is up to date.");
  process.exit(0);
}

console.error("Operational closeout status is out of date.");
console.error(
  "Run `npm run check:operational-closeout-status:write` and commit the result.",
);
process.exit(1);
