import fs from "node:fs";
import { execSync } from "node:child_process";

const root = process.cwd();

function normalize(filePath) {
  return filePath.replaceAll("\\", "/");
}

function getPushBeforeSha() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !fs.existsSync(eventPath)) return null;

  try {
    const event = JSON.parse(fs.readFileSync(eventPath, "utf8"));
    const before = typeof event.before === "string" ? event.before : null;
    if (!before || /^0+$/.test(before)) return null;
    return before;
  } catch {
    return null;
  }
}

function isGitSha(value) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{7,40}$/i.test(value) &&
    !/^0+$/.test(value)
  );
}

function isGitHead(value) {
  return value === "HEAD";
}

function readExplicitRange() {
  const rawBase = process.env.QUALITY_BASE_SHA;
  const rawHead = process.env.QUALITY_HEAD_SHA;
  if (!rawBase && !rawHead) return null;

  if (!isGitSha(rawBase)) {
    console.error(
      "QUALITY_BASE_SHA is set but is not a valid non-zero git SHA.",
    );
    process.exit(1);
  }

  if (rawHead && !isGitSha(rawHead) && !isGitHead(rawHead)) {
    console.error(
      "QUALITY_HEAD_SHA is set but is not a valid non-zero git SHA or HEAD.",
    );
    process.exit(1);
  }

  return { base: rawBase, head: rawHead ?? "HEAD" };
}

function changedFilesForRange(base, head) {
  try {
    const output = execSync(
      `git diff --name-only --diff-filter=ACMRD ${base} ${head}`,
      {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    return output.split(/\r?\n/).filter(Boolean).map(normalize);
  } catch (error) {
    console.error(
      `Failed to compute security-evidence diff range ${base}..${head}.`,
    );
    if (error.stderr) console.error(String(error.stderr).trim());
    process.exit(1);
  }
}

function getChangedFiles() {
  const explicitRange = readExplicitRange();
  if (explicitRange)
    return changedFilesForRange(explicitRange.base, explicitRange.head);

  const baseRef = process.env.GITHUB_BASE_REF;
  const eventName = process.env.GITHUB_EVENT_NAME;
  const pushBeforeSha = eventName === "push" ? getPushBeforeSha() : null;
  const commands = [
    baseRef
      ? `git diff --name-only --diff-filter=ACMRD origin/${baseRef}...HEAD`
      : null,
    pushBeforeSha
      ? `git diff --name-only --diff-filter=ACMRD ${pushBeforeSha} HEAD`
      : null,
    eventName === "push" && !pushBeforeSha
      ? "git diff --name-only --diff-filter=ACMRD HEAD^ HEAD"
      : null,
    "git diff --name-only --diff-filter=ACMRD",
    "git ls-files --others --exclude-standard",
  ].filter(Boolean);

  const files = new Set();
  for (const command of commands) {
    try {
      const output = execSync(command, {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      output
        .split(/\r?\n/)
        .filter(Boolean)
        .map(normalize)
        .forEach((file) => files.add(file));
    } catch {
      // Keep trying other sources.
    }
  }

  return [...files];
}

const securityRelevantMatchers = [
  {
    label: "schema or migration change",
    test: (file) => file.startsWith("prisma/"),
  },
  {
    label: "release workflow change",
    test: (file) =>
      file === ".github/workflows/deploy.yml" ||
      file === ".github/workflows/quality-gates.yml",
  },
  {
    label: "release or policy script change",
    test: (file) =>
      file === "scripts/deploy-release.sh" ||
      file === "scripts/check-migration-safety.mjs" ||
      file === "scripts/check-ai-proxies.mjs" ||
      file === "scripts/check-security-evidence.mjs",
  },
  {
    label: "authentication or access-control change",
    test: (file) =>
      file.startsWith("src/modules/supporting/auth/") ||
      file.startsWith("src/app/api/auth/") ||
      file.startsWith("src/app/api/v1/auth/") ||
      file.startsWith("src/shared/lib/api/auth-") ||
      file.startsWith("src/platform/auth/"),
  },
  {
    label: "feature flag governance change",
    test: (file) =>
      file.startsWith("src/modules/supporting/feature-flags/") ||
      file.startsWith("src/app/api/feature-flags/") ||
      file.startsWith("src/app/api/v1/feature-flags/") ||
      file === "src/shared/lib/api/feature-flags.api.ts",
  },
  {
    label: "public offer or signing change",
    test: (file) =>
      file.startsWith("src/app/api/offers/public/") ||
      file.includes("/public-offer") ||
      file.includes("/public-offer-") ||
      file.startsWith(
        "src/modules/supporting/offers/api/handlers/public-offer",
      ) ||
      file.startsWith("src/modules/supporting/offers/application/public-offer"),
  },
];

function evidenceDocTouched(file) {
  return (
    file.startsWith("docs/security/") ||
    file === "docs/PRODUCTION_DATA_SAFETY.md"
  );
}

const changedFiles = getChangedFiles();
const relevantFindings = [];
const evidenceDocs = new Set();

for (const file of changedFiles) {
  if (evidenceDocTouched(file)) evidenceDocs.add(file);

  for (const matcher of securityRelevantMatchers) {
    if (matcher.test(file)) {
      relevantFindings.push({ file, label: matcher.label });
      break;
    }
  }
}

if (relevantFindings.length === 0) {
  console.log(
    "Security evidence check passed (no security-relevant changed files detected).",
  );
  process.exit(0);
}

if (evidenceDocs.size > 0) {
  console.log(
    `Security evidence check passed (${relevantFindings.length} security-relevant changed files, evidence docs touched: ${[
      ...evidenceDocs,
    ].join(", ")}).`,
  );
  process.exit(0);
}

console.error("Security evidence check failed.");
console.error(
  "Security-relevant changes were detected, but no security/evidence docs were updated.",
);
console.error(
  "Touch docs/security/* and usually docs/security/AUDIT_EVIDENCE_INDEX.md for these changes:",
);

for (const finding of relevantFindings) {
  console.error(`- ${finding.file} (${finding.label})`);
}

process.exit(1);
