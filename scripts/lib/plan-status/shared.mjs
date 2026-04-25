import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

export const requiredReadFirstDocs = [
  "docs/AI_ENGINEERING.md",
  "docs/PRODUCTION_DATA_SAFETY.md",
  "docs/FRONTEND_GUIDELINES.md",
  "docs/BRANDING_AND_THEMING.md",
  "docs/API_VERSIONING.md",
  "docs/REFACTORING_PLAYBOOK.md",
  "docs/CODEBASE_CLEANUP_INVENTORY.md",
  "docs/security/AUDIT_EVIDENCE_INDEX.md",
];

export const keyVerificationFiles = [
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

export function escapeTableCell(value) {
  return String(value).replaceAll("|", "\\|");
}

export function fileExists(root, relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

export function parseCount(value) {
  const match = String(value).match(/\d+/);
  return match ? Number(match[0]) : 0;
}

export function runScript(root, relativePath) {
  return execFileSync(process.execPath, [relativePath], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}
