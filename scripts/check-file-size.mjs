import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const warnAt = 500;
const failAt = 1000;
const extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.md']);
const ignoredSegments = [
  'node_modules',
  '.git',
  '.next',
  '.claude/worktrees',
  '.codex-artifacts',
  'src/generated',
  'coverage',
  'playwright-report',
  'test-results',
];

function normalize(filePath) {
  return filePath.replaceAll('\\', '/');
}

function shouldIgnore(file) {
  const normalized = normalize(file);
  return ignoredSegments.some((segment) => normalized.includes(segment));
}

function getChangedFiles() {
  const commands = [
    'git diff --name-only --diff-filter=ACMR origin/main...HEAD',
    'git diff --name-only --diff-filter=ACMR',
    'git ls-files --others --exclude-standard',
  ];
  const files = new Set();
  for (const command of commands) {
    try {
      const output = execSync(command, {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      output.split(/\r?\n/).filter(Boolean).forEach((file) => files.add(file));
    } catch {
      // Keep trying other sources.
    }
  }
  return [...files];
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    const relative = path.relative(root, fullPath);
    if (shouldIgnore(relative)) continue;
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (extensions.has(path.extname(entry.name))) {
      files.push(relative);
    }
  }
  return files;
}

const allMode = process.argv.includes('--all');
const changedFiles = getChangedFiles();
const files = allMode || changedFiles.length === 0
  ? walk(root)
  : changedFiles.filter((file) => extensions.has(path.extname(file)) && !shouldIgnore(file));

const warnings = [];
const failures = [];

for (const file of files) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) continue;
  const lines = fs.readFileSync(fullPath, 'utf8').split(/\r?\n/).length;
  const finding = { file: normalize(file), lines };
  if (lines > failAt) failures.push(finding);
  else if (lines > warnAt) warnings.push(finding);
}

for (const warning of warnings) {
  console.warn(`File-size warning: ${warning.file} has ${warning.lines} lines (>${warnAt}).`);
}

if (failures.length > 0) {
  console.error(`File-size check failed: hand-written changed files may not exceed ${failAt} lines.`);
  for (const failure of failures) {
    console.error(`- ${failure.file}: ${failure.lines} lines`);
  }
  process.exit(1);
}

console.log(`File-size check passed (${files.length} files scanned).`);
