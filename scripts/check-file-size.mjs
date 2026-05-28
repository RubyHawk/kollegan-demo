import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, execSync } from 'node:child_process';

const root = process.cwd();
const warnAt = 500;
const failAt = 1000;
const extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.css', '.md', '.yml', '.yaml']);
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

function getPushBeforeSha() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !fs.existsSync(eventPath)) return null;

  try {
    const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
    const before = typeof event.before === 'string' ? event.before : null;
    if (!before || /^0+$/.test(before)) return null;
    return before;
  } catch {
    return null;
  }
}

function isGitSha(value) {
  return typeof value === 'string' && /^[0-9a-f]{7,40}$/i.test(value) && !/^0+$/.test(value);
}

function isGitHead(value) {
  return value === 'HEAD';
}

function readExplicitRange() {
  const rawBase = process.env.QUALITY_BASE_SHA;
  const rawHead = process.env.QUALITY_HEAD_SHA;
  if (!rawBase && !rawHead) return null;

  if (!isGitSha(rawBase)) {
    console.error('QUALITY_BASE_SHA is set but is not a valid non-zero git SHA.');
    process.exit(1);
  }

  if (rawHead && !isGitSha(rawHead) && !isGitHead(rawHead)) {
    console.error('QUALITY_HEAD_SHA is set but is not a valid non-zero git SHA or HEAD.');
    process.exit(1);
  }

  return { base: rawBase, head: rawHead ?? 'HEAD' };
}

function changedFilesForRange(base, head) {
  try {
    const output = execSync(`git diff --name-only --diff-filter=ACMR ${base} ${head}`, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return output.split(/\r?\n/).filter(Boolean);
  } catch (error) {
    console.error(`Failed to compute file-size diff range ${base}..${head}.`);
    if (error.stderr) console.error(String(error.stderr).trim());
    process.exit(1);
  }
}

function getChangedFiles() {
  const explicitRange = readExplicitRange();
  if (explicitRange) return changedFilesForRange(explicitRange.base, explicitRange.head);

  const baseRef = process.env.GITHUB_BASE_REF;
  const eventName = process.env.GITHUB_EVENT_NAME;
  const pushBeforeSha = eventName === 'push' ? getPushBeforeSha() : null;
  const includeUntracked = process.env.CHECK_FILE_SIZE_INCLUDE_UNTRACKED === '1';
  const commands = [
    baseRef ? `git diff --name-only --diff-filter=ACMR origin/${baseRef}...HEAD` : null,
    pushBeforeSha ? `git diff --name-only --diff-filter=ACMR ${pushBeforeSha} HEAD` : null,
    eventName === 'push' && !pushBeforeSha ? 'git diff --name-only --diff-filter=ACMR HEAD^ HEAD' : null,
    'git diff --name-only --diff-filter=ACMR',
    includeUntracked ? 'git ls-files --others --exclude-standard' : null,
  ].filter(Boolean);
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
const files = allMode
  ? walk(root)
  : changedFiles.filter((file) => extensions.has(path.extname(file)) && !shouldIgnore(file));

const warnings = [];
const failures = [];
const reductions = [];

function readFileFromRef(ref, file) {
  try {
    return execFileSync('git', ['show', `${ref}:${normalize(file)}`], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return null;
  }
}

function getBaselineLineCount(file) {
  const candidateRefs = [
    process.env.QUALITY_BASE_SHA,
    process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : null,
    process.env.GITHUB_EVENT_NAME === 'push' ? getPushBeforeSha() : null,
    'HEAD',
  ].filter(Boolean);

  for (const ref of candidateRefs) {
    const content = readFileFromRef(ref, file);
    if (content != null) return content.split(/\r?\n/).length;
  }

  return null;
}

for (const file of files) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) continue;
  const lines = fs.readFileSync(fullPath, 'utf8').split(/\r?\n/).length;
  const finding = { file: normalize(file), lines };
  if (lines > failAt) {
    const baselineLines = getBaselineLineCount(file);
    if (baselineLines != null && baselineLines > failAt && lines < baselineLines) {
      reductions.push({ ...finding, baselineLines });
    } else {
      failures.push(finding);
    }
  }
  else if (lines > warnAt) warnings.push(finding);
}

for (const warning of warnings) {
  console.warn(`File-size warning: ${warning.file} has ${warning.lines} lines (>${warnAt}).`);
}

for (const reduction of reductions) {
  console.warn(
    `Existing monolith reduced: ${reduction.file} has ${reduction.lines} lines ` +
      `(was ${reduction.baselineLines}, still >${failAt}).`,
  );
}

if (failures.length > 0) {
  console.error(`File-size check failed: hand-written changed files may not exceed ${failAt} lines.`);
  for (const failure of failures) {
    console.error(`- ${failure.file}: ${failure.lines} lines`);
  }
  process.exit(1);
}

console.log(`File-size check passed (${files.length} files scanned).`);
