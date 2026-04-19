import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const allowlistPath = path.join(root, 'scripts', 'migration-safety-allowlist.json');
const allowlist = fs.existsSync(allowlistPath)
  ? JSON.parse(fs.readFileSync(allowlistPath, 'utf8')).allowedFindings ?? []
  : [];

const sqlDestructivePatterns = [
  { name: 'DROP TABLE', regex: /\bDROP\s+TABLE\b/i },
  { name: 'DROP COLUMN', regex: /\bDROP\s+COLUMN\b/i },
  { name: 'TRUNCATE', regex: /\bTRUNCATE\b/i },
  { name: 'DELETE FROM', regex: /\bDELETE\s+FROM\b/i },
];

const codeDestructivePatterns = [
  { name: 'deleteMany', regex: /\.deleteMany\s*\(\s*\{?\s*\}?\s*\)/i },
];

function normalize(filePath) {
  return filePath.replaceAll('\\', '/');
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

function getChangedFiles() {
  const baseRef = process.env.GITHUB_BASE_REF;
  const eventName = process.env.GITHUB_EVENT_NAME;
  const pushBeforeSha = eventName === 'push' ? getPushBeforeSha() : null;
  const commands = [
    baseRef ? `git diff --name-only --diff-filter=ACMR origin/${baseRef}...HEAD` : null,
    pushBeforeSha ? `git diff --name-only --diff-filter=ACMR ${pushBeforeSha} HEAD` : null,
    eventName === 'push' && !pushBeforeSha ? 'git diff --name-only --diff-filter=ACMR HEAD^ HEAD' : null,
    'git diff --name-only --diff-filter=ACMR',
    'git ls-files --others --exclude-standard',
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
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next') continue;
      walk(fullPath, files);
    } else if (/\.(sql|ts|tsx|js|jsx|mjs|cjs)$/i.test(entry.name)) {
      files.push(path.relative(root, fullPath));
    }
  }
  return files;
}

function isAllowlisted(file, patternName) {
  const normalized = normalize(file);
  return allowlist.some((item) => normalize(item.file) === normalized && item.pattern === patternName);
}

const allMode = process.argv.includes('--all');
const changedFiles = getChangedFiles();
const files = allMode
  ? [
      ...walk(path.join(root, 'prisma')),
      ...walk(path.join(root, 'src')),
      ...walk(path.join(root, 'scripts')),
    ]
  : changedFiles.filter((file) => /\.(sql|ts|tsx|js|jsx|mjs|cjs)$/i.test(file));

const findings = [];

for (const file of files) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) continue;
  const text = fs.readFileSync(fullPath, 'utf8');
  const lines = text.split(/\r?\n/);
  const patterns = file.endsWith('.sql') ? sqlDestructivePatterns : codeDestructivePatterns;

  lines.forEach((line, index) => {
    for (const pattern of patterns) {
      if (pattern.regex.test(line) && !isAllowlisted(file, pattern.name)) {
        findings.push({ file: normalize(file), line: index + 1, pattern: pattern.name, text: line.trim() });
      }
    }
  });
}

if (findings.length > 0) {
  console.error('Destructive data-operation findings require explicit approval, backup, rollback, and evidence:');
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} [${finding.pattern}] ${finding.text}`);
  }
  process.exit(1);
}

console.log(`Migration safety check passed (${files.length} files scanned).`);
