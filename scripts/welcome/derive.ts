/**
 * npm run welcome:assets → the Welcome page's layers, from the client's pictures in
 * src/assets/welcome/source/ and the measurements in src/assets/welcome/scene.json:
 *   courtyard   the temple courtyard photograph with the seated figure taken out: its right side
 *               becomes the clean left side mirrored (temple courtyards are symmetrical), and what
 *               remains is rebuilt from the photograph (inpaint.ts)
 *   couple      the couple, lifted off their photograph's blurred background (cutout.ts)
 *   ../decor/rose-petal-N.webp  rose petals from the opening's courtyard path, for the falling petals
 * Re-run after replacing a source picture or adjusting scene.json.
 */
import { readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp, { type Sharp } from 'sharp';
import { cutout } from './cutout';
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
// The rest is rebuilt from the clean picture around it, never from the pillars, lamps or tower.
// This part of the photograph lies behind the people, out of focus, so only its large shapes and
// colours are rebuilt (down to a quarter scale) and enlarged smoothly, with fine grain added:
// copied fine detail would repeat visibly.
const avoid = new Uint8Array(W * H);
for (const [x0, y0, x1, y1] of scene.figure.noSource) for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) avoid[y * W + x] = 1;
const t0 = Date.now();
// Two fills: copied detail (true to the photograph next to the edge) and large shapes only (calm
// further in), blended by distance from the edge so the outline of what was removed never shows
const fine = inpaint({ w: W, h: H, d: Float32Array.from(px) }, grown, avoid, console.log);
const calm = inpaint({ w: W, h: H, d: Float32Array.from(px) }, grown, avoid, console.log, { finest: scene.figure.finest, grain: scene.figure.grain });
const INF = 1e9, dist = new Float32Array(W * H);
for (let i = 0; i < W * H; i++) dist[i] = grown[i] ? INF : 0;
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (x > 0) dist[i] = Math.min(dist[i], dist[i - 1] + 1);
    if (y > 0) dist[i] = Math.min(dist[i], dist[i - W] + 1);
  }
for (let y = H - 1; y >= 0; y--)
  for (let x = W - 1; x >= 0; x--) {
    const i = y * W + x;
    if (x < W - 1) dist[i] = Math.min(dist[i], dist[i + 1] + 1);
    if (y < H - 1) dist[i] = Math.min(dist[i], dist[i + W] + 1);
  }
const { near, far } = scene.figure.blend;
const pic = { w: W, h: H, d: px };
for (let i = 0; i < W * H; i++) {
  if (!grown[i]) continue;
  const t = Math.min(1, Math.max(0, (dist[i] - near) / (far - near)));
  for (let c = 0; c < 3; c++) px[i * 3 + c] = (1 - t) * fine.d[i * 3 + c] + t * calm.d[i * 3 + c];
}
// The polished floor changes with depth, not across: smooth it along each row
const floorTop = scene.figure.floorTop, R = 48;
const smooth = Float32Array.from(px);
for (let y = floorTop; y < H; y++)
  for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (!grown[i]) continue;
    const acc = [0, 0, 0];
    let n = 0;
    for (let k = Math.max(0, x - R); k <= Math.min(W - 1, x + R); k++) {
      for (let yy = Math.max(floorTop, y - 2); yy <= Math.min(H - 1, y + 2); yy++) {
        const j = yy * W + k;
        for (let c = 0; c < 3; c++) acc[c] += px[j * 3 + c];
        n++;
      }
    }
    // The real floor at the edge stays as it is, and the smoothing fades in below the floor line
    const t = Math.min(1, dist[i] / 16) * Math.min(1, (y - floorTop) / 40);
    for (let c = 0; c < 3; c++) smooth[i * 3 + c] = (1 - t) * px[i * 3 + c] + t * (acc[c] / n);
  }
let seed = 3;
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
for (let y = floorTop; y < H; y++)
  for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (!grown[i]) continue;
    const g = Math.sqrt(-2 * Math.log(rand() + 1e-9)) * Math.cos(2 * Math.PI * rand()) * scene.figure.grain;
    for (let c = 0; c < 3; c++) px[i * 3 + c] = smooth[i * 3 + c] + g;
  }
console.log(`  figure taken out in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
const rgb = Buffer.from(Uint8ClampedArray.from(pic.d));
// A little clarity: the photograph's background is in soft focus
const { sigma, m1, m2 } = scene.sharpen;
await write('courtyard', sharp(rgb, { raw: { width: W, height: H, channels: 3 } }).sharpen({ sigma, m1, m2 }), ['avif', 'webp']);
if (process.env.WELCOME_DEBUG) writeFileSync(process.env.WELCOME_DEBUG, await sharp(rgb, { raw: { width: W, height: H, channels: 3 } }).png().toBuffer());

// 2. The couple: lifted off their photograph's blurred background along the traced outline
//    (cutout.ts) and trimmed; the picture's own lower edge is where the page's edge will cut them
const hugSrc = await sharp(join(dir, 'source/couple-hug.webp')).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const HW = hugSrc.info.width, HH = hugSrc.info.height;
const { alpha } = cutout({ w: HW, h: HH, d: Float32Array.from(hugSrc.data) }, { outline: scene.hug.outline, band: scene.hug.band });
const rgba = Buffer.alloc(HW * HH * 4);
for (let i = 0; i < HW * HH; i++) {
  for (let c = 0; c < 3; c++) rgba[i * 4 + c] = hugSrc.data[i * 3 + c];
  rgba[i * 4 + 3] = Math.round(alpha[i] * 255);
}
const hug = await sharp(rgba, { raw: { width: HW, height: HH, channels: 4 } }).trim({ threshold: 1 }).png().toBuffer();
const hm = await sharp(hug).metadata();
await write('couple', sharp(hug), ['avif', 'webp'], { avif: 62, webp: 86 });
console.log(`  couple ${hm.width}×${hm.height}`);

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
