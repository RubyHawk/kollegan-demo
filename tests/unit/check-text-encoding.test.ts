import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const scriptPath = resolve(process.cwd(), 'scripts/check-text-encoding.mjs');
const tempDirs: string[] = [];

function createTempRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), 'check-text-encoding-'));
  tempDirs.push(dir);
  execFileSync('git', ['init'], { cwd: dir, stdio: 'ignore' });
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('check-text-encoding script', () => {
  it('fails on untracked files with a real UTF-8 BOM', () => {
    const repoDir = createTempRepo();
    writeFileSync(join(repoDir, 'bom.ts'), '\uFEFFexport const value = 1;\n', 'utf8');

    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: repoDir,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain('[utf8-bom]');
  });
});
