/**
 * npm run welcome:assets → the Welcome page's layers, from the client's pictures in
 * src/assets/welcome/source/ and the measurements in src/assets/welcome/scene.json:
 *   courtyard   the temple courtyard photograph with the seated figure taken out: its right side
 *               becomes the clean left side mirrored (temple courtyards are symmetrical), and what
 *               remains is rebuilt from the photograph (inpaint.ts)
 *   couple      the seated couple, trimmed and enlarged 2× with a Lanczos filter (AVIF + WebP)
 *   ../decor/rose-petal-N.webp  rose petals from the opening's courtyard path, for the falling petals
 * Re-run after replacing a source picture or adjusting scene.json.
 */
import { readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp, { type Sharp } from 'sharp';
import { inpaint } from './inpaint';

const dir = join(process.cwd(), 'src/assets/welcome');
const scene = JSON.parse(readFileSync(join(dir, 'scene.json'), 'utf8'));

const write = async (name: string, img: Sharp, formats: ('avif' | 'webp')[], q = { avif: 55, webp: 80 }) => {
  const png = await img.png().toBuffer();
  for (const f of formats) {
    const s = sharp(png);
    const buf = await (f === 'avif' ? s.avif({ quality: q.avif, effort: 6 }) : s.webp({ quality: q.webp, effort: 6, smartSubsample: true, alphaQuality: 90 })).toBuffer();
    writeFileSync(join(dir, `${name}.${f}`), buf);
    console.log(`✓ ${name}.${f}  ${(buf.length / 1024).toFixed(0)} KB`);
  }
};

// 1. The courtyard without the seated figure
const { data, info } = await sharp(join(dir, 'source/courtyard.webp')).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;
const outline: number[][] = scene.figure.outline;
const inside = (x: number, y: number) => {
  let c = false;
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const [xi, yi] = outline[i], [xj, yj] = outline[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const hole = new Uint8Array(W * H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (inside(x + 0.5, y + 0.5)) hole[y * W + x] = 1;
const g = scene.figure.grow;
const grown = new Uint8Array(W * H);
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    if (!hole[y * W + x]) continue;
    for (let yy = Math.max(0, y - g); yy <= Math.min(H - 1, y + g); yy++)
      for (let xx = Math.max(0, x - g); xx <= Math.min(W - 1, x + g); xx++) if ((xx - x) ** 2 + (yy - y) ** 2 <= g * g) grown[yy * W + xx] = 1;
  }
// The right side, from the clean left side mirrored, feathered into the picture
const px = Float32Array.from(data);
const { x: mx, y: my, feather: fz } = scene.figure.mirror;
for (let y = Math.max(0, my - fz); y < H; y++)
  for (let x = mx - fz; x < W; x++) {
    const a = Math.min(1, (x - (mx - fz)) / fz) * Math.min(1, (y - (my - fz)) / fz);
    if (a <= 0) continue;
    const s = (y * W + (W - 1 - x)) * 3, t = (y * W + x) * 3;
    for (let c = 0; c < 3; c++) px[t + c] = a * data[s + c] + (1 - a) * px[t + c];
    if (a >= 1) grown[y * W + x] = 0;
  }
const avoid = new Uint8Array(W * H);
for (const [x0, y0, x1, y1] of scene.figure.noSource) for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) avoid[y * W + x] = 1;
const t0 = Date.now();
const pic = inpaint({ w: W, h: H, d: px }, grown, avoid, console.log);
console.log(`  figure taken out in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
const rgb = Buffer.from(Uint8ClampedArray.from(pic.d));
await write('courtyard', sharp(rgb, { raw: { width: W, height: H, channels: 3 } }), ['avif', 'webp']);
if (process.env.WELCOME_DEBUG) writeFileSync(process.env.WELCOME_DEBUG, await sharp(rgb, { raw: { width: W, height: H, channels: 3 } }).png().toBuffer());

// 2. The couple: trimmed, and enlarged with a Lanczos filter (the supplied picture is 364 px wide)
const couple = await sharp(join(dir, 'source/couple.png')).trim({ threshold: 1 }).png().toBuffer();
const cm = await sharp(couple).metadata();
await write('couple', sharp(couple).resize({ width: cm.width! * 2, kernel: 'lanczos3' }).sharpen({ sigma: 0.6 }), ['avif', 'webp'], { avif: 62, webp: 86 });
console.log(`  couple ${cm.width}×${cm.height} → ${cm.width! * 2}×${cm.height! * 2}`);

// 3. Falling petals: single rose petals lying on the path in the opening's courtyard photograph,
//    lifted off the pale stone by their redness (the largest red patch in each box, grown a pixel)
const decor = join(process.cwd(), 'src/assets/decor');
const path = await sharp(join(process.cwd(), 'src/assets/opening/source/courtyard.webp')).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const PWd = path.info.width, pd = path.data;
for (const f of readdirSync(decor).filter((n) => /^rose-petal-\d+\.webp$/.test(n))) unlinkSync(join(decor, f));
for (const [i, [x0, y0, x1, y1]] of (scene.petals.boxes as number[][]).entries()) {
  const w = x1 - x0, h = y1 - y0;
  const at = (xx: number, yy: number) => ((y0 + yy) * PWd + x0 + xx) * 3;
  const redness = new Float32Array(w * h);
  const stone: number[][] = [[], [], []];
  for (let yy = 0; yy < h; yy++)
    for (let xx = 0; xx < w; xx++) {
      const s = at(xx, yy), r = pd[s], g = pd[s + 1], b = pd[s + 2];
      const sat = (r - Math.min(g, b)) / Math.max(r, 1);
      redness[yy * w + xx] = Math.min(1, Math.max(0, (sat - 0.4) / 0.25));
      if (sat < 0.3) for (let c = 0; c < 3; c++) stone[c].push(pd[s + c]);
    }
  const bg = stone.map((v) => (v.sort((a, b) => a - b), v[v.length >> 1] ?? 230));
  const seen = new Int32Array(w * h).fill(-1);
  let best = -1, bestSize = 0;
  for (let k = 0; k < w * h; k++) {
    if (seen[k] >= 0 || redness[k] < 0.5) continue;
    const stack = [k];
    seen[k] = k;
    let size = 0;
    while (stack.length) {
      const q = stack.pop()!, qx = q % w;
      size++;
      for (const n of [qx > 0 ? q - 1 : -1, qx < w - 1 ? q + 1 : -1, q - w, q + w])
        if (n >= 0 && n < w * h && seen[n] < 0 && redness[n] >= 0.5) (seen[n] = k), stack.push(n);
    }
    if (size > bestSize) (bestSize = size), (best = k);
  }
  const out = Buffer.alloc(w * h * 4);
  for (let yy = 0; yy < h; yy++)
    for (let xx = 0; xx < w; xx++) {
      let near = false;
      for (let dy = -1; dy <= 1 && !near; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const ny = yy + dy, nx = xx + dx;
          if (ny >= 0 && ny < h && nx >= 0 && nx < w && seen[ny * w + nx] === best) {
            near = true;
            break;
          }
        }
      const a = near ? redness[yy * w + xx] : 0;
      const s = at(xx, yy), t = (yy * w + xx) * 4;
      for (let c = 0; c < 3; c++) out[t + c] = a > 0.02 ? Math.min(255, Math.max(0, Math.round((pd[s + c] - (1 - a) * bg[c]) / a))) : 0;
      out[t + 3] = Math.round(a * 255);
    }
  // Doubled with a smooth filter, so a petal drawn at 20–26 px stays crisp
  const buf = await sharp(out, { raw: { width: w, height: h, channels: 4 } }).trim({ threshold: 1 }).resize({ width: w * 2, kernel: 'lanczos3' }).webp({ quality: 90, alphaQuality: 95 }).toBuffer();
  writeFileSync(join(decor, `rose-petal-${i + 1}.webp`), buf);
  console.log(`✓ decor/rose-petal-${i + 1}.webp  ${(buf.length / 1024).toFixed(1)} KB`);
}
