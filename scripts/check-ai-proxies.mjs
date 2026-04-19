import fs from 'node:fs';

const proxyFiles = [
  'AGENTS.md',
  'CLAUDE.md',
  '.github/copilot-instructions.md',
];

const requiredReferences = [
  'docs/AI_ENGINEERING.md',
];

const missing = [];

for (const file of proxyFiles) {
  if (!fs.existsSync(file)) {
    missing.push(`${file} is missing`);
    continue;
  }

  const text = fs.readFileSync(file, 'utf8');
  for (const reference of requiredReferences) {
    if (!text.includes(reference) && !text.includes(reference.replace('docs/', '../docs/'))) {
      missing.push(`${file} does not reference ${reference}`);
    }
  }
}

if (!fs.existsSync('docs/AI_ENGINEERING.md')) {
  missing.push('docs/AI_ENGINEERING.md is missing');
}

if (missing.length > 0) {
  console.error('AI proxy consistency check failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('AI proxy consistency check passed.');

