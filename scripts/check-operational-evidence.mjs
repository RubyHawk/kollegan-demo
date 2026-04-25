import {
  gapKey,
  operationalEvidenceRegistry,
  parseOperationalEvidenceIndexGaps,
  parseOperationalRegisterStatus,
} from "./lib/operational-evidence.mjs";

const root = process.cwd();

const registerStatuses = operationalEvidenceRegistry.map((item) =>
  parseOperationalRegisterStatus(root, item),
);
const openGaps = parseOperationalEvidenceIndexGaps(root);

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
const registerOwnerMismatches = registerStatuses.filter(
  (item) => item.exists && item.actualOwner !== item.owner,
);
const registerCadenceMismatches = registerStatuses.filter(
  (item) => item.exists && item.actualReviewCadence !== item.reviewCadence,
);

if (
  missingFiles.length > 0 ||
  missingGapRows.length > 0 ||
  staleGapRows.length > 0 ||
  duplicateGapRows.length > 0 ||
  unexpectedGapRows.length > 0 ||
  ownerMismatches.length > 0 ||
  registerOwnerMismatches.length > 0 ||
  registerCadenceMismatches.length > 0
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
      console.error(
        `- ${item.label} -> ${item.section} / ${item.scope} (${item.recordRows} record rows detected)`,
      );
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

  if (registerOwnerMismatches.length > 0) {
    console.error(
      "Operational evidence log owners do not match the shared operational evidence registry:",
    );
    for (const item of registerOwnerMismatches) {
      console.error(
        `- ${item.file}: expected ${item.owner}, found ${item.actualOwner}`,
      );
    }
  }

  if (registerCadenceMismatches.length > 0) {
    console.error(
      "Operational evidence log review cadences do not match the shared operational evidence registry:",
    );
    for (const item of registerCadenceMismatches) {
      console.error(
        `- ${item.file}: expected ${item.reviewCadence}, found ${item.actualReviewCadence}`,
      );
    }
  }

  process.exit(1);
}

console.log(
  `Operational evidence coverage check passed (${registerStatuses.length} tracked items, ${openGaps.length} open-gap rows aligned).`,
);
