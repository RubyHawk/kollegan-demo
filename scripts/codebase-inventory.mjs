import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const writeMode = process.argv.includes('--write');
const outputPath = path.join(root, 'docs', 'CODEBASE_CLEANUP_INVENTORY.md');

const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const countedExtensions = new Set([...sourceExtensions, '.css', '.md', '.yml', '.yaml']);
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
const nextEntryNames = new Set([
  'page',
  'layout',
  'route',
  'loading',
  'error',
  'not-found',
  'template',
  'default',
  'global-error',
]);
const knownEntryFiles = new Set([
  '.dependency-cruiser.cjs',
  'instrumentation.ts',
  'next.config.ts',
  'postcss.config.mjs',
  'prisma.config.ts',
  'src/instrumentation.ts',
  'src/middleware.ts',
  'src/proxy.ts',
  'vitest.config.ts',
]);
const resolveExtensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.css'];

function normalize(filePath) {
  return filePath.replaceAll('\\', '/');
}

function shouldIgnore(file) {
  const normalized = normalize(file);
  return ignoredSegments.some((segment) => normalized.includes(segment));
}

function git(args) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function getTrackedFiles() {
  return git(['ls-files'])
    .split(/\r?\n/)
    .filter(Boolean)
    .map(normalize)
    .filter((file) => !shouldIgnore(file));
}

function readFile(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function lineCount(file) {
  return readFile(file).split(/\r?\n/).length;
}

function isSourceFile(file) {
  return sourceExtensions.has(path.extname(file));
}

function isCountedFile(file) {
  return countedExtensions.has(path.extname(file));
}

function isDemo(file) {
  return file.startsWith('src/modules/demos/')
    || file.startsWith('src/app/demos/')
    || file.includes('/demo_')
    || file.includes('/demo-');
}

function isTest(file) {
  return file.startsWith('tests/')
    || file.includes('/__tests__/')
    || /\.(test|spec)\.[tj]sx?$/.test(file);
}

function isGenerated(file) {
  return file.startsWith('src/generated/')
    || file.endsWith('.generated.ts')
    || file.endsWith('.generated.tsx');
}

function isLegacyWrapper(file) {
  return file.startsWith('src/app/api/')
    && !file.startsWith('src/app/api/v1/')
    && file.endsWith('/route.ts');
}

function isNextEntry(file) {
  if (!file.startsWith('src/app/')) return false;
  const parsed = path.parse(file);
  return nextEntryNames.has(parsed.name);
}

function isModuleIndex(file) {
  return file.startsWith('src/modules/') && file.endsWith('/index.ts');
}

function isConfigFile(file) {
  const basename = path.basename(file);
  return knownEntryFiles.has(file)
    || basename.startsWith('.')
    || basename.includes('.config.')
    || basename.endsWith('rc.js')
    || basename.endsWith('rc.cjs')
    || basename.endsWith('rc.mjs');
}

function isReferencedByPackageJson(file, packageJsonText) {
  return packageJsonText.includes(file) || packageJsonText.includes(file.replaceAll('/', '\\'));
}

function isEntryPoint(file) {
  return isNextEntry(file)
    || isModuleIndex(file)
    || isConfigFile(file)
    || file.startsWith('scripts/');
}

function classify(file) {
  if (isGenerated(file)) return 'generated-or-cache';
  if (isTest(file)) return 'test-only';
  if (isDemo(file)) return 'active-demo';
  if (isLegacyWrapper(file)) return 'legacy-referenced';
  return 'active-production';
}

function candidatePaths(basePath) {
  const normalizedBase = normalize(basePath);
  const candidates = [];
  candidates.push(normalizedBase);
  for (const ext of resolveExtensions) candidates.push(`${normalizedBase}${ext}`);
  for (const ext of resolveExtensions) candidates.push(normalize(path.join(normalizedBase, `index${ext}`)));
  return candidates;
}

function aliasToPath(specifier) {
  const aliases = [
    ['@/', 'src/'],
    ['@demos/', 'src/modules/demos/'],
    ['@modules/', 'src/modules/'],
    ['@shared/', 'src/shared/'],
    ['@platform/', 'src/platform/'],
    ['@generated/', 'src/generated/'],
  ];
  for (const [prefix, target] of aliases) {
    if (specifier.startsWith(prefix)) return `${target}${specifier.slice(prefix.length)}`;
  }
  return null;
}

function resolveImport(fromFile, specifier, sourceSet) {
  if (specifier.startsWith('node:')) return null;
  if (!specifier.startsWith('.') && !specifier.startsWith('@')) return null;

  const basePath = specifier.startsWith('.')
    ? normalize(path.join(path.dirname(fromFile), specifier))
    : aliasToPath(specifier);
  if (!basePath) return null;

  for (const candidate of candidatePaths(basePath)) {
    if (sourceSet.has(candidate)) return candidate;
  }
  return null;
}

function importedSpecifiers(text) {
  const specifiers = new Set();
  const patterns = [
    /(?:import|export)\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      specifiers.add(match[1]);
    }
  }
  return [...specifiers];
}

function buildImportGraph(sourceFiles) {
  const sourceSet = new Set(sourceFiles);
  const inbound = new Map(sourceFiles.map((file) => [file, new Set()]));
  const outbound = new Map(sourceFiles.map((file) => [file, new Set()]));

  for (const file of sourceFiles) {
    const text = readFile(file);
    for (const specifier of importedSpecifiers(text)) {
      const resolved = resolveImport(file, specifier, sourceSet);
      if (!resolved || resolved === file) continue;
      outbound.get(file)?.add(resolved);
      inbound.get(resolved)?.add(file);
    }
  }

  return { inbound, outbound };
}

function markdownTable(headers, rows) {
  if (rows.length === 0) return '_None._\n';
  const header = `| ${headers.join(' | ')} |`;
  const separator = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map((row) => `| ${row.join(' | ')} |`);
  return [header, separator, ...body].join('\n') + '\n';
}

function renderInventory() {
  const files = getTrackedFiles();
  const packageJsonText = fs.existsSync(path.join(root, 'package.json'))
    ? fs.readFileSync(path.join(root, 'package.json'), 'utf8')
    : '';
  const countedFiles = files.filter(isCountedFile);
  const sourceFiles = files.filter(isSourceFile);
  const productionSource = sourceFiles.filter((file) => classify(file) === 'active-production');
  const graph = buildImportGraph(sourceFiles);

  const largeFiles = countedFiles
    .map((file) => ({ file, lines: lineCount(file), classification: classify(file) }))
    .filter((item) => item.lines > 500)
    .sort((a, b) => b.lines - a.lines);

  const monoliths = largeFiles.filter((item) => item.lines > 1000);
  const warnings = largeFiles.filter((item) => item.lines <= 1000);
  const legacyWrappers = files
    .filter(isLegacyWrapper)
    .sort()
    .map((file) => [file]);

  const deadCandidates = productionSource
    .filter((file) => !isEntryPoint(file))
    .filter((file) => !isReferencedByPackageJson(file, packageJsonText))
    .filter((file) => file.startsWith('src/'))
    .filter((file) => (graph.inbound.get(file)?.size ?? 0) === 0)
    .sort()
    .slice(0, 80)
    .map((file) => [file, 'dead-candidate', 'No static inbound imports found; verify routes, dynamic imports, strings, tests, and runtime usage before deletion.']);

  const monolithRows = monoliths.map((item) => [
    String(item.lines),
    item.classification,
    `\`${item.file}\``,
  ]);
  const warningRows = warnings.map((item) => [
    String(item.lines),
    item.classification,
    `\`${item.file}\``,
  ]);

  return `# Codebase Cleanup Inventory

Files are not deleted just because they look messy. They are inventoried, classified, verified, and removed in focused cleanup PRs.

This document is generated from the current checkout. Run:

\`\`\`txt
npm run inventory:codebase:write
\`\`\`

## Classes

- \`active-production\`
- \`active-demo\`
- \`legacy-referenced\`
- \`generated-or-cache\`
- \`test-only\`
- \`dead-candidate\`
- \`safe-to-delete\`
- \`approved-exception\`

## Inventory Method

- tracked file listing via \`git ls-files\`,
- line-count scan for hand-written source and docs,
- static import/export graph for TypeScript and JavaScript,
- Next.js route entry detection,
- module \`index.ts\` entry detection,
- demo/test/generated classification,
- legacy API wrapper classification.

Static analysis is a triage tool, not deletion proof. A \`dead-candidate\` still needs manual verification for dynamic imports, string routes, framework conventions, tests, public assets, Prisma references, and production usage.

## Snapshot Summary

| Metric | Count |
|---|---:|
| Tracked files scanned | ${files.length} |
| Source files scanned | ${sourceFiles.length} |
| Active production source files | ${productionSource.length} |
| Files above 1000 lines | ${monoliths.length} |
| Files above 500 lines | ${largeFiles.length} |
| Legacy API wrappers | ${legacyWrappers.length} |
| Dead-candidate review rows | ${deadCandidates.length} |

## Current Monolith Inventory

${markdownTable(['Lines', 'Classification', 'File'], monolithRows)}
## Files Above 500 Lines

${markdownTable(['Lines', 'Classification', 'File'], warningRows)}
## Dead-Candidate Review Queue

${markdownTable(['File', 'Classification', 'Reason'], deadCandidates)}
## Legacy API Wrapper Review Queue

These are compatibility wrappers and are not junk until client usage proves they can be retired.

${markdownTable(['File'], legacyWrappers)}
## Rules

- No hand-written production source file may remain above 1000 lines after monolith-split phases unless listed as an approved exception here.
- CI warns above 500 lines and fails above 1000 lines for new or modified hand-written source files.
- Cleanup PRs must not include behavior changes.
- Demo files are not junk if they support demo routes.
- Legacy API wrappers are not junk until usage is verified gone.
- A file may move from \`dead-candidate\` to \`safe-to-delete\` only after import graph, route strings, package scripts, tests, Prisma references, and public asset references have been checked.

## Approved Exceptions

None.

## Cleanup Workflow

1. Generate this inventory.
2. Pick a small batch of \`dead-candidate\` files.
3. Verify each file with import search, route search, package scripts, tests, Prisma schema, and public asset references.
4. Move confirmed files to \`safe-to-delete\` in a dedicated cleanup PR.
5. Delete only confirmed files.
6. Run typecheck, lint, tests, build, dependency checks, file-size checks, and manual smoke tests for affected flows.
`;
}

const markdown = renderInventory();

if (writeMode) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, markdown, 'utf8');
  console.log(`Wrote ${normalize(path.relative(root, outputPath))}`);
} else {
  process.stdout.write(markdown);
}
