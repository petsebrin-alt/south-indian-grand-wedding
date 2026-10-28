/**
 * npm run save-the-date:assets → the Save the Date page's layers, from the client's pictures in
 * src/assets/save-the-date/source/ and the measurements in src/assets/save-the-date/scene.json:
 *   couple-board   the couple holding the gold board, its off-white middle made transparent
 *                  (AVIF + WebP)
 *   board-inside   the board's opening as a mask (PNG): the curtain and the card show only there
 *   curtain        one closed curtain panel, made from the photographed curtain's fabric (WebP;
 *                  the other half is its mirror image)
 *   board.json     where the board and its opening sit in the picture (for laying out the page)
 * Re-run after replacing a source picture or adjusting scene.json.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp, { type Sharp } from 'sharp';

const dir = join(process.cwd(), 'src/assets/save-the-date');
const scene = JSON.parse(readFileSync(join(dir, 'scene.json'), 'utf8'));

// 1. The couple holding the board: the picture's background is already transparent; the board's
//    off-white middle becomes transparent too (found by flooding out from its centre), so the
//    curtain and the card show through it, behind the frame and the couple's hands
const { data: b, info: bi } = await sharp(join(dir, 'source/couple-board.webp')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const BW = bi.width, BH = bi.height, n = BW * BH;
const [pr, pg, pb] = scene.board.paper;
const near = (i: number, tol: number) => Math.abs(b[i * 4] - pr) <= tol && Math.abs(b[i * 4 + 1] - pg) <= tol && Math.abs(b[i * 4 + 2] - pb) <= tol;
const inside = new Uint8Array(n);
{
  const [cx, cy] = scene.board.centre;
  const stack = [cy * BW + cx];
  inside[stack[0]] = 1;
  while (stack.length) {
    const i = stack.pop()!, x = i % BW;
    for (const j of [x > 0 ? i - 1 : -1, x < BW - 1 ? i + 1 : -1, i - BW, i + BW])
      if (j >= 0 && j < n && !inside[j] && near(j, 12)) (inside[j] = 1), stack.push(j);
  }
}
const rgba = Buffer.from(b);
for (let i = 0; i < n; i++) {
  if (inside[i]) { rgba[i * 4 + 3] = 0; continue; }
  // Next to the opening: fade the paper-coloured fringe, keep the gold
  const x = i % BW, y = (i - x) / BW;
  let touch = false;
  for (let k = -2; k <= 2 && !touch; k++) for (let l = -2; l <= 2; l++) { const yy = y + k, xx = x + l; if (yy >= 0 && yy < BH && xx >= 0 && xx < BW && inside[yy * BW + xx]) { touch = true; break; } }
  if (touch && near(i, 40)) {
    const dist = Math.max(Math.abs(b[i * 4] - pr), Math.abs(b[i * 4 + 1] - pg), Math.abs(b[i * 4 + 2] - pb));
    rgba[i * 4 + 3] = Math.round(rgba[i * 4 + 3] * Math.min(1, dist / 40));
  }
}
const encode = async (name: string, img: Sharp, formats: ('avif' | 'webp' | 'png')[], q = 86) => {
  const png = await img.png().toBuffer();
  for (const f of formats) {
    const s = sharp(png);
    const buf = await (f === 'avif' ? s.avif({ quality: 62, effort: 6 }) : f === 'webp' ? s.webp({ quality: q, alphaQuality: 92, effort: 6 }) : s.png({ compressionLevel: 9, palette: true })).toBuffer();
    writeFileSync(join(dir, `${name}.${f}`), buf);
    console.log(`✓ ${name}.${f}  ${(buf.length / 1024).toFixed(0)} KB`);
  }
};
await encode('couple-board', sharp(rgba, { raw: { width: BW, height: BH, channels: 4 } }), ['avif', 'webp']);

// The opening as a mask, grown a few pixels under the frame so no gap shows at its edge
const grow = scene.board.grow;
const maskRgba = Buffer.alloc(n * 4);
for (let y = 0; y < BH; y++)
  for (let x = 0; x < BW; x++) {
    let v = 0;
    for (let k = -grow; k <= grow && !v; k++)
      for (let l = -grow; l <= grow; l++) {
        const yy = y + k, xx = x + l;
        if (yy >= 0 && yy < BH && xx >= 0 && xx < BW && inside[yy * BW + xx]) { v = 255; break; }
      }
    maskRgba[(y * BW + x) * 4 + 3] = v;
  }
await encode('board-inside', sharp(maskRgba, { raw: { width: BW, height: BH, channels: 4 } }).resize({ width: Math.round(BW / 2) }), ['png']);

// Where the opening and the board are, in % of the picture
let ix0 = BW, iy0 = BH, ix1 = 0, iy1 = 0;
for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) if (inside[y * BW + x]) (ix0 = Math.min(ix0, x)), (ix1 = Math.max(ix1, x)), (iy0 = Math.min(iy0, y)), (iy1 = Math.max(iy1, y));
const pct = (v: number, of: number) => +((v / of) * 100).toFixed(2);
// Where the arch's sides straighten: the first row the opening reaches its full width
const shoulder = (() => { for (let y = iy0; y < BH; y++) if (inside[y * BW + ix0 + 3] && inside[y * BW + ix1 - 3]) return y; return iy0; })();
const [fl, fr] = scene.board.frame;
writeFileSync(
  join(dir, 'board.json'),
  JSON.stringify(
    { ratio: +(BH / BW).toFixed(4), frame: { left: pct(fl, BW), right: pct(fr, BW) }, opening: { left: pct(ix0, BW), top: pct(iy0, BH), right: pct(ix1, BW), bottom: pct(iy1, BH), shoulder: pct(shoulder, BH) } },
    null,
    2,
  ) + '\n',
);
console.log(`  couple and board ${BW}×${BH}; opening ${ix1 - ix0}×${iy1 - iy0} from (${ix0}, ${iy0}), sides straight from ${shoulder}`);

// 2. A closed curtain panel from the photographed one, which is drawn back and tied. Above the tie
//    the fabric hangs from the rod to an embroidered gold edge that slants back towards the tie;
//    each row of that fabric is widened to the full half-width, so the gold edge becomes the
//    panel's straight leading edge and the folds hang straight. The rows are then drawn down to
//    the full height of the opening.
const { data: c, info: ci } = await sharp(join(dir, 'source/curtain.webp')).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const CW = ci.width;
const { rows, from, edge, width: PW, height: PH } = scene.curtain;
const edgeAt = (y: number) => {
  for (let i = 1; i < edge.length; i++) {
    const [ya, xa] = edge[i - 1], [yb, xb] = edge[i];
    if (y <= yb) return xa + ((xb - xa) * (y - ya)) / (yb - ya);
  }
  return edge[edge.length - 1][1];
};
const srcH = rows[1] - rows[0];
const panel = Buffer.alloc(PW * PH * 3);
const sample = (x: number, y: number, ch: number) => {
  const xi = Math.min(CW - 2, Math.max(0, Math.floor(x))), yi = Math.min(ci.height - 2, Math.max(0, Math.floor(y)));
  const ax = x - xi, ay = y - yi;
  const v = (xx: number, yy: number) => c[(yy * CW + xx) * 3 + ch];
  return (1 - ay) * ((1 - ax) * v(xi, yi) + ax * v(xi + 1, yi)) + ay * ((1 - ax) * v(xi, yi + 1) + ax * v(xi + 1, yi + 1));
};
for (let y = 0; y < PH; y++) {
  const sy = rows[0] + (y / (PH - 1)) * (srcH - 1);
  const right = edgeAt(sy);
  for (let x = 0; x < PW; x++) {
    const sx = from + (x / (PW - 1)) * (right - from);
    for (let ch = 0; ch < 3; ch++) panel[(y * PW + x) * 3 + ch] = Math.round(sample(sx, sy, ch));
  }
}
await encode('curtain', sharp(panel, { raw: { width: PW, height: PH, channels: 3 } }), ['webp'], 84);
