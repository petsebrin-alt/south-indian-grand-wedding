import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import opentype from 'opentype.js';

/**
 * Handwritten script lettering (THEME S-14) built at compile time from the Pinyon Script font
 * itself: one SVG path per letter, so the Thank You message can be "written" letter by letter
 * with DrawSVG (PRD §6.18) and still reads as finished script without JavaScript.
 * Server-only: used from .astro frontmatter.
 */
const FONT_FILE = join(process.cwd(), 'node_modules/@fontsource/pinyon-script/files/pinyon-script-latin-400-normal.woff');
const SIZE = 100; // font units per em in the generated drawing
const LINE_GAP = 1.05; // baseline-to-baseline distance, in ems

let font: opentype.Font | null = null;
const loadFont = () => {
  if (!font) {
    const buf = readFileSync(FONT_FILE);
    font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer);
  }
  return font;
};

export interface Lettering {
  viewBox: string;
  /** One path per visible letter, in writing order. */
  glyphs: { d: string; line: number }[];
}

/** Lay out each line centred, one below the other, and return the letter outlines. */
export function lettering(lines: string[]): Lettering {
  const f = loadFont();
  const widths = lines.map((l) => f.getAdvanceWidth(l, SIZE));
  const width = Math.max(...widths);
  const glyphs: Lettering['glyphs'] = [];
  let top = Infinity;
  let bottom = -Infinity;
  let left = Infinity;
  let right = -Infinity;
  lines.forEach((line, i) => {
    const x = (width - widths[i]) / 2;
    const y = SIZE * (0.9 + i * LINE_GAP);
    for (const path of f.getPaths(line, x, y, SIZE)) {
      if (!path.commands.length) continue; // spaces
      const box = path.getBoundingBox();
      top = Math.min(top, box.y1);
      bottom = Math.max(bottom, box.y2);
      left = Math.min(left, box.x1);
      right = Math.max(right, box.x2);
      // opentype.js 2 flips Y by default when given an options object; these paths are already y-down.
      glyphs.push({ d: path.toPathData({ decimalPlaces: 0, flipY: false }), line: i });
    }
  });
  const pad = 4;
  return {
    viewBox: [left - pad, top - pad, right - left + pad * 2, bottom - top + pad * 2].map((n) => Math.round(n)).join(' '),
    glyphs,
  };
}
