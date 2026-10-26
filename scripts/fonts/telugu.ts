/**
 * npm run fonts → src/assets/fonts/noto-serif-telugu-500-subset.woff2
 * The invitation uses Telugu only for a few words (the Subhalekha title and the invocation), so
 * the 51 KB Noto Serif Telugu font is cut down to exactly the characters in src/data/wedding.ts.
 * Runs before `npm run dev` and every build, so edited Telugu text is always covered.
 */
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import subsetFont from 'subset-font';
import { wedding } from '../../src/data/wedding';

const root = process.cwd();
const SOURCE = join(root, 'node_modules/@fontsource/noto-serif-telugu/files/noto-serif-telugu-telugu-500-normal.woff2');
const OUT = join(root, 'src/assets/fonts/noto-serif-telugu-500-subset.woff2');

/** Every Telugu character used anywhere in the wedding data. */
const telugu = new Set<string>();
const walk = (v: unknown) => {
  if (typeof v === 'string') {
    for (const ch of v) if (/[ఀ-౿]/.test(ch)) telugu.add(ch);
  } else if (v && typeof v === 'object') {
    Object.values(v).forEach(walk);
  }
};
walk(wedding);
if (!telugu.size) throw new Error('No Telugu text found in src/data/wedding.ts');

// Space, zero-width (non-)joiners and the dotted circle keep shaping and spacing intact.
const text = [...telugu].join('') + ' ‌‍◌';
const out = await subsetFont(readFileSync(SOURCE), text, { targetFormat: 'woff2' });
writeFileSync(OUT, out);
console.log(`✓ Telugu font: ${telugu.size} characters, ${(statSync(OUT).size / 1024).toFixed(1)} KB (full font ${(statSync(SOURCE).size / 1024).toFixed(0)} KB)`);
