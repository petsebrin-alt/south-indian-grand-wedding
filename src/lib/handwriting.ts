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

const r = (n: number) => Math.round(n * 10) / 10;
const ok = (...n: (number | undefined)[]) => n.every((v) => Number.isFinite(v));

/**
 * SVG path data written directly from the glyph's commands (y already points down). opentype.js 2's
 * own toPathData flips Y by default and can emit NaN for a rounded control point.
 */
function pathData(path: opentype.Path): string {
  return path.commands
    .map((c) => {
      if (c.type === 'Z') return 'Z';
      if (c.type === 'Q' && ok(c.x1, c.y1)) return `Q${r(c.x1!)} ${r(c.y1!)} ${r(c.x)} ${r(c.y)}`;
      if (c.type === 'C' && ok(c.x1, c.y1, c.x2, c.y2)) return `C${r(c.x1!)} ${r(c.y1!)} ${r(c.x2!)} ${r(c.y2!)} ${r(c.x)} ${r(c.y)}`;
      return `${c.type === 'M' ? 'M' : 'L'}${r(c.x)} ${r(c.y)}`; // M, L, or a curve missing a control point
    })
    .join('');
}

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
      glyphs.push({ d: pathData(path), line: i });
    }
  });
  const pad = 4;
  return {
    viewBox: [left - pad, top - pad, right - left + pad * 2, bottom - top + pad * 2].map((n) => Math.round(n)).join(' '),
    glyphs,
  };
}
