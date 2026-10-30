/**
 * npm run story:assets → the Love Story page's peacock frame and photographs (src/assets/story/,
 * public/photos/story/), from the client's pictures in src/assets/story/source/:
 *   frame.webp      the red-and-gold peacock frame (a big ring held by two peacocks, with a cream
 *                   board below). The picture came with a grey-and-white chequered "transparent"
 *                   background baked in, so the frame is cut out by colour: the chequers are plain
 *                   grey or white, the frame is gold, red and cream.
 *   story-N.webp    the couple's photographs, in the order of the story
 * and writes
 *   src/assets/story/frame.webp   the frame with a real transparent background (outside it and inside
 *                                 the ring), trimmed to its edges
 *   src/assets/story/opening.webp the ring's see-through inside, as a mask: the photographs show only
 *                                 there, and the frame's art lies over them
 *   src/assets/story/frame.json   the frame's size, the ring's centre and radius, and the board
 *                                 (the cream plaque) as % of the frame
 *   public/photos/story/story-N.webp   each photograph at web size
 * Re-run after replacing a picture.
 */
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { growBand } from './grow.ts';

const dir = join(process.cwd(), 'src/assets/story');
const photos = join(process.cwd(), 'public/photos/story');
mkdirSync(photos, { recursive: true });

const { data, info } = await sharp(join(dir, 'source/frame.webp')).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, n = W * H;
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const chroma = new Float32Array(n), light = new Float32Array(n);
for (let i = 0; i < n; i++) {
  const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
  chroma[i] = Math.max(r, g, b) - Math.min(r, g, b);
  light[i] = Math.min(r, g, b);
}
// The board (the cream plaque below the ring) is kept whole: cream is warmer than the chequers
const cream = (i: number) => data[i * 3] > 232 && data[i * 3 + 1] > 214 && data[i * 3 + 2] > 160 && data[i * 3 + 2] < 232 && data[i * 3] - data[i * 3 + 2] > 22 && data[i * 3] - data[i * 3 + 2] < 70;
const plaque = new Uint8Array(n);
{
  const seed = Math.round(H * 0.73) * W + Math.round(W * 0.5);
  const stack = [seed];
  plaque[seed] = 1;
  while (stack.length) {
    const i = stack.pop()!, x = i % W;
    for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) if (j >= 0 && j < n && !plaque[j] && cream(j)) (plaque[j] = 1), stack.push(j);
  }
}
const keepPlaque = new Uint8Array(n);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (plaque[y * W + x]) for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const yy = y + dy, xx = x + dx; if (yy >= 0 && yy < H && xx >= 0 && xx < W) keepPlaque[yy * W + xx] = 1; }

// The chequers: bright and without much colour. Plain grey or white ones are certain; the ones lit by the
// frame's sparkles are warm but still pale. Whole areas of such pixels go; small ones (pearls, glints)
// stay, and so does the board.
const weak = new Uint8Array(n);
for (let i = 0; i < n; i++) if (!keepPlaque[i] && light[i] >= 186 && chroma[i] <= 46) weak[i] = 1;
const flooded = new Uint8Array(n);
const inside = new Uint8Array(n);
const others: number[][] = [];
{
  const seen = new Uint8Array(n);
  const ringSeed = Math.round(H * 0.36) * W + Math.round(W * 0.5);
  for (let s = 0; s < n; s++) {
    if (!weak[s] || seen[s]) continue;
    const comp: number[] = [s];
    seen[s] = 1;
    for (let k = 0; k < comp.length; k++) {
      const i = comp[k], x = i % W;
      for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) if (j >= 0 && j < n && weak[j] && !seen[j]) (seen[j] = 1), comp.push(j);
    }
    // Below the board the frame hangs bells and pendants between small gaps: smaller pale areas go there
    let sumY = 0;
    for (const i of comp) sumY += (i / W) | 0;
    const lowZone = sumY / comp.length > H * 0.8;
    if (comp.length < (lowZone ? 220 : 700)) continue;
    const isInside = comp.includes(ringSeed);
    for (const i of comp) { flooded[i] = 1; if (isInside) inside[i] = 1; }
    if (!isInside) others.push(comp);
  }
}
// Pale gaps beside the ring's pendants that the main opening does not reach (the strings divide them
// from it) are part of the opening too: any enclosed gap whose middle is within the ring's circle
{
  let ix0 = W, ix1 = 0, iy0 = H;
  for (let i = 0; i < n; i++) if (inside[i]) (ix0 = Math.min(ix0, i % W)), (ix1 = Math.max(ix1, i % W)), (iy0 = Math.min(iy0, (i / W) | 0));
  const R = (ix1 - ix0) / 2, ccx = (ix0 + ix1) / 2, ccy = iy0 + R;
  for (const comp of others) {
    let sx = 0, sy = 0;
    for (const i of comp) (sx += i % W), (sy += (i / W) | 0);
    const mx = sx / comp.length, my = sy / comp.length;
    const touchesEdge = comp.some((i) => i % W === 0 || i % W === W - 1 || i < W || i >= n - W);
    if (!touchesEdge && Math.hypot(mx - ccx, my - ccy) < R * 1.02 && my < ccy + R * 0.55) for (const i of comp) inside[i] = 1;
  }
}

// Soft edges: next to the cut-out area, a pixel is part-chequer, part-frame; its opacity follows how
// colourful it is, and its colour is cleaned of the grey it was mixed with
const near = new Float32Array(n);
for (let i = 0; i < n; i++) near[i] = flooded[i] ? 1 : 0;
const grown = new Float32Array(n);
for (const rad of [1, 2, 3]) {
  for (let y = rad; y < H - rad; y++)
    for (let x = rad; x < W - rad; x++) {
      const i = y * W + x;
      if (near[i] || grown[i]) continue;
      if (near[i - rad] || near[i + rad] || near[i - rad * W] || near[i + rad * W]) grown[i] = rad;
    }
}
const rgba = Buffer.alloc(n * 4);
for (let i = 0; i < n; i++) {
  const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
  let a = flooded[i] ? 0 : 1;
  let rr = r, gg = g, bb = b;
  if (!flooded[i] && grown[i]) {
    a = smooth(5, 34, chroma[i]) * 0.3 + smooth(12, 60, 255 - light[i] + chroma[i] * 0.5) * 0.7;
    a = Math.min(1, Math.max(0.0, a));
    if (a > 0.04 && a < 0.98) {
      const grey = 233; // between the two chequer greys
      rr = Math.min(255, Math.max(0, (r - (1 - a) * grey) / a));
      gg = Math.min(255, Math.max(0, (g - (1 - a) * grey) / a));
      bb = Math.min(255, Math.max(0, (b - (1 - a) * grey) / a));
    }
  }
  rgba[i * 4] = rr; rgba[i * 4 + 1] = gg; rgba[i * 4 + 2] = bb; rgba[i * 4 + 3] = Math.round(a * 255);
}

// Trim, then measure the ring's inside and the board
let x0 = W, y0 = H, x1 = 0, y1 = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (rgba[(y * W + x) * 4 + 3] > 12) (x0 = Math.min(x0, x)), (x1 = Math.max(x1, x)), (y0 = Math.min(y0, y)), (y1 = Math.max(y1, y));
const fw = x1 - x0 + 1, fh = y1 - y0 + 1;

// The ring's inner edge: from the ring's middle, the first frame pixel in each direction; the median
// of those radii is the ring (the hanging pendants and the lower scrolls are shorter or longer)
let cx = W * 0.5, cy = H * 0.36;
let ring = 300;
for (let it = 0; it < 6; it++) {
  const rs: number[] = [], pts: number[][] = [];
  for (let a = -160; a <= -20; a += 4) {
    const t = (a * Math.PI) / 180;
    let r = 120;
    for (; r < 520; r += 1) {
      const x = Math.round(cx + r * Math.cos(t)), y = Math.round(cy + r * Math.sin(t));
      if (x < 0 || y < 0 || x >= W || y >= H || !inside[y * W + x]) break;
    }
    rs.push(r); pts.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
  }
  const sorted = [...rs].sort((p, q) => p - q);
  ring = sorted[sorted.length >> 1];
  const good = pts.filter((_, i) => Math.abs(rs[i] - ring) < 8);
  if (good.length > 8) {
    // refit the centre: the circle through the good points (least squares, Kåsa)
    let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0, sz = 0, sxz = 0, syz = 0;
    for (const [px, py] of good) { const z = px * px + py * py; sx += px; sy += py; sxx += px * px; syy += py * py; sxy += px * py; sz += z; sxz += px * z; syz += py * z; }
    const m = good.length;
    const A = [[sxx, sxy, sx], [sxy, syy, sy], [sx, sy, m]], B = [sxz, syz, sz];
    const det = (M: number[][]) => M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
    const d0 = det(A);
    const col = (k: number) => A.map((row, i) => row.map((v, j) => (j === k ? B[i] : v)));
    const a1 = det(col(0)) / d0, b1 = det(col(1)) / d0, c1 = det(col(2)) / d0;
    cx = a1 / 2; cy = b1 / 2; ring = Math.sqrt(c1 + cx * cx + cy * cy);
  }
}

let px0 = W, py0 = H, px1 = 0, py1 = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (plaque[y * W + x]) (px0 = Math.min(px0, x)), (px1 = Math.max(px1, x)), (py0 = Math.min(py0, y)), (py1 = Math.max(py1, y));

// The ring's see-through inside as a mask for the photographs. The pendants hanging inside the ring are
// part of the frame and are drawn over the photographs, so the mask closes over them; it stops short of the
// frame's edge by a few pixels so the photographs tuck under the gold.
const mask = Buffer.alloc(fw * fh * 4, 255);
{
  const blur = (src: Float32Array, r: number) => {
    const tmp = new Float32Array(n), out = new Float32Array(n);
    for (let y = 0; y < H; y++) {
      let acc = 0;
      for (let x = -r; x <= r; x++) acc += src[y * W + Math.min(W - 1, Math.max(0, x))];
      for (let x = 0; x < W; x++) { tmp[y * W + x] = acc / (2 * r + 1); acc += src[y * W + Math.min(W - 1, x + r + 1)] - src[y * W + Math.max(0, x - r)]; }
    }
    for (let x = 0; x < W; x++) {
      let acc = 0;
      for (let y = -r; y <= r; y++) acc += tmp[Math.min(H - 1, Math.max(0, y)) * W + x];
      for (let y = 0; y < H; y++) { out[y * W + x] = acc / (2 * r + 1); acc += tmp[Math.min(H - 1, y + r + 1) * W + x] - tmp[Math.max(0, y - r) * W + x]; }
    }
    return out;
  };
  const start = Float32Array.from(inside);
  const grown = blur(start, 30);
  const dil = Float32Array.from(grown, (v) => (v > 0.002 ? 1 : 0));
  const eroded = blur(dil, 30);
  const closed = Float32Array.from(eroded, (v) => (v > 0.998 ? 1 : 0));
  const shrunk = blur(closed, 2);
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) mask[(y * fw + x) * 4 + 3] = Math.round(Math.max(0, Math.min(1, (shrunk[(y0 + y) * W + x0 + x] - 0.995) / 0.005)) * 255);
}

// The opening's bounding box (the ring's inside) and the middle of its widest, roundest part
let ox0 = W, ox1 = 0, oy0 = H, oy1 = 0;
for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) if (mask[(y * fw + x) * 4 + 3] > 128) (ox0 = Math.min(ox0, x)), (ox1 = Math.max(ox1, x)), (oy0 = Math.min(oy0, y)), (oy1 = Math.max(oy1, y));

const cut = Buffer.alloc(fw * fh * 4);
for (let y = 0; y < fh; y++) rgba.copy(cut, y * fw * 4, ((y0 + y) * W + x0) * 4, ((y0 + y) * W + x0 + fw) * 4);

// The board is made taller (the client found its lettering too small): seams of plain pixels inside the
// cream plaque are repeated (grow.ts), so the cream, the velvet and the straight gold lines grow and the
// gems and curls keep their shape. Sizes are in pixels of the 1000-wide result. The ring and its pendants
// lie above the plaque, the bells and drops hang below it and move down with its foot.
const BOARD = { grow: 75, margin: 4 };
const toSrc = (v: number) => Math.round((v / 1000) * fw);
const bandTop = py0 - y0 + toSrc(BOARD.margin), bandBottom = py1 - y0 - toSrc(BOARD.margin);
const extra = toSrc(BOARD.grow);
const trimmed = growBand(cut, fw, fh, bandTop, bandBottom, extra);
const fh2 = fh + extra;
// The photographs' mask stops above the plaque, so it just gains transparent rows at its foot
for (let y = bandTop; y < fh; y++) for (let x = 0; x < fw; x++) if (mask[(y * fw + x) * 4 + 3] > 0) throw new Error('the ring opening reaches the board');
const maskTall = Buffer.alloc(fw * fh2 * 4, 255);
for (let y = 0; y < fh2; y++) for (let x = 0; x < fw; x++) maskTall[(y * fw + x) * 4 + 3] = y < fh ? mask[(y * fw + x) * 4 + 3] : 0;

const OUT_W = 1000;
const outH = Math.round((fh2 / fw) * OUT_W);
const frameBuf = await sharp(trimmed, { raw: { width: fw, height: fh2, channels: 4 } }).resize(OUT_W, outH, { kernel: 'lanczos3' }).webp({ quality: 88, alphaQuality: 95, effort: 6 }).toBuffer();
writeFileSync(join(dir, 'frame.webp'), frameBuf);
const maskBuf = await sharp(maskTall, { raw: { width: fw, height: fh2, channels: 4 } }).resize(Math.round(OUT_W / 2), Math.round(outH / 2)).blur(1.2).webp({ quality: 80, alphaQuality: 90 }).toBuffer();
writeFileSync(join(dir, 'opening.webp'), maskBuf);
const pct = (v: number, total: number) => +((v / total) * 100).toFixed(3);
writeFileSync(
  join(dir, 'frame.json'),
  JSON.stringify(
    {
      width: OUT_W,
      height: outH,
      ring: { cx: pct(cx - x0, fw), cy: pct(cy - y0, fh2), r: pct(ring, fw) },
      opening: { x: pct(ox0, fw), y: pct(oy0, fh2), w: pct(ox1 - ox0 + 1, fw), h: pct(oy1 - oy0 + 1, fh2) },
      board: { x: pct(px0 - x0, fw), y: pct(py0 - y0, fh2), w: pct(px1 - px0 + 1, fw), h: pct(py1 - py0 + 1 + extra, fh2) },
    },
    null,
    2,
  ) + '\n',
);
console.log(`✓ story/frame.webp  ${(frameBuf.length / 1024).toFixed(0)} KB, ${OUT_W} × ${outH}; ring centre (${(cx - x0).toFixed(0)}, ${(cy - y0).toFixed(0)}) radius ${ring.toFixed(0)}; board ${px1 - px0 + 1} × ${py1 - py0 + 1}`);

// The photographs, at web size
for (const f of readdirSync(join(dir, 'source')).filter((name) => /^story-\d+\.webp$/.test(name))) {
  const out = await sharp(join(dir, 'source', f)).resize({ width: 480, withoutEnlargement: true }).webp({ quality: 82, effort: 6 }).toBuffer();
  writeFileSync(join(photos, f), out);
  console.log(`✓ photos/story/${f}  ${(out.length / 1024).toFixed(0)} KB`);
}
