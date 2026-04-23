import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const extensions = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.css',
  '.md',
  '.yml',
  '.yaml',
  '.json',
  '.toml',
  '.txt',
]);

const ignoredSegments = new Set([
  'node_modules',
  '.git',
  '.next',
  '.claude',
  '.codex-artifacts',
  'coverage',
  'playwright-report',
  'test-results',
  'src/generated',
]);

const suspiciousLinePatterns = [
  { name: 'replacement-character', regex: /\uFFFD/ },
  { name: 'utf8-latin1-mojibake', regex: /Ã.|Â.|â€[^\s]?|â€™|â€œ|â€�|â€“|â€”|â€¦|ï»¿/ },
];

function normalize(filePath) {
  return filePath.replaceAll('\\', '/');
}

function splitSegments(filePath) {
  return normalize(filePath).split('/').filter(Boolean);
}

function shouldIgnore(filePath) {
  const normalized = normalize(filePath);
  const segments = splitSegments(filePath);
  return [...ignoredSegments].some((segment) => normalized === segment || normalized.startsWith(`${segment}/`) || segments.includes(segment));
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
    console.error(`Failed to compute encoding-check diff range ${base}..${head}.`);
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

function findWordInternalQuestionMarks(line) {
  const findings = [];
  const stringRegex = /(["'`])((?:\\.|(?!\1).)*)\1/g;
  let match;

  while ((match = stringRegex.exec(line)) !== null) {
    const literal = match[2];
    if (/[A-Za-zÅÄÖåäö]\?[A-Za-zÅÄÖåäö]/.test(literal)) {
      findings.push(literal);
    }
  }

  return findings;
}

function isLikelyUrlOrQuery(text) {
  return /https?:\/\/|\/api\/|[?&][A-Za-z0-9_-]+=/.test(text);
}

function isIntentionalNormalizationLine(line) {
  const trimmed = line.trim();
  return trimmed.startsWith('//')
    || trimmed.startsWith('/*')
    || trimmed.startsWith('*')
    || trimmed.includes('.replace(/')
    || trimmed.includes('regex: /');
}

const allMode = process.argv.includes('--all');
const changedFiles = getChangedFiles();
const files = allMode
  ? walk(root)
  : changedFiles.filter((file) => extensions.has(path.extname(file)) && !shouldIgnore(file));

const findings = [];

for (const file of files) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) continue;

  const text = fs.readFileSync(fullPath, 'utf8');
  const lines = text.split(/\r?\n/);

  if (text.startsWith('\uFEFF')) {
    findings.push({
      file: normalize(file),
      line: 1,
      pattern: 'utf8-bom',
      text: lines[0]?.trim() ?? '',
    });
  }

  lines.forEach((line, index) => {
    if (!isIntentionalNormalizationLine(line)) {
      for (const pattern of suspiciousLinePatterns) {
        if (pattern.regex.test(line)) {
          findings.push({
            file: normalize(file),
            line: index + 1,
            pattern: pattern.name,
            text: line.trim(),
          });
        }
      }
    }

    const suspiciousStrings = findWordInternalQuestionMarks(line).filter((value) => !isLikelyUrlOrQuery(value));
    for (const value of suspiciousStrings) {
      findings.push({
        file: normalize(file),
        line: index + 1,
        pattern: 'word-internal-question-mark',
        text: value,
      });
    }
  });
}

if (findings.length > 0) {
  console.error('Text-encoding check failed: suspicious mojibake or corrupted copy detected.');
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} [${finding.pattern}] ${finding.text}`);
  }
  process.exit(1);
}

console.log(`Text-encoding check passed (${files.length} files scanned).`);
