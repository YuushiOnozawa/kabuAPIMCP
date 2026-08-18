import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const srcDir = resolve(process.cwd(), 'src');
const sourceFiles = (await readdir(srcDir, { recursive: true }))
  .filter((file) => file.endsWith('.ts') && !file.endsWith('.test.ts'))
  .sort();

describe('source trading endpoint policy', () => {
  it.each(sourceFiles)('%s: sendorder/cancelorderを含まない', async (file) => {
    const source = await readFile(resolve(srcDir, file), 'utf8');

    expect(source).not.toMatch(/sendorder|cancelorder/i);
  });
});
