/**
 * npm run ceremony:assets → the Wedding Ceremony page's layers (src/assets/ceremony/), from the client's
 * picture of a real golden mandapam source/mandapam.webp (carved pillars and beam, a mango-leaf toran,
 * hanging jasmine garlands, banana plants, brass lamps and kalasams, a bowl of petals, a rangoli on
 * marble, and a cream board) and the measurements in scene.json:
 *   clean.webp             the whole picture with the wording printed on its board painted out (the board's
 *                          cream paper is filled in smoothly), so the board can carry live text
 *   base.webp              a very soft, warm blur of it: the hall as a glow, before anything has arrived
 *   piece-<id>.webp        the elements that arrive one by one, each cut out with a soft edge (a feathered
 *                          rectangle, or by colour for the mango leaves), in the picture's own pixels
 *   ceiling.webp           the picture's top row, softened: the roof carried on above the picture
 *   ceremony.json          the picture's size, each piece's place (in % of the picture) and the board
 * Re-run after replacing the picture or adjusting scene.json.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp, { type Sharp } from 'sharp';

const dir = join(process.cwd(), 'src/assets/ceremony');
const scene = JSON.parse(readFileSync(join(dir, 'scene.json'), 'utf8'));

const write = async (name: string, img: Sharp, quality = 84, alphaQuality = 92) => {
  const buf = await img.webp({ quality, alphaQuality, effort: 6, smartSubsample: true }).toBuffer();
  writeFileSync(join(dir, `${name}.webp`), buf);
  console.log(`✓ ${name}.webp  ${(buf.length / 1024).toFixed(0)} KB`);
  return buf.length;
};
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const boxBlur = (src: Float32Array, w: number, h: number, r: number) => {
  const tmp = new Float32Array(w * h), out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    let s = 0;
    for (let x = -r; x <= r; x++) s += src[y * w + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) {
      tmp[y * w + x] = s / (2 * r + 1);
      s += src[y * w + Math.min(w - 1, x + r + 1)] - src[y * w + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < w; x++) {
    let s = 0;
    for (let y = -r; y <= r; y++) s += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = s / (2 * r + 1);
      s += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
    }
  }
  return out;
};

const { data: src, info } = await sharp(join(dir, 'source/mandapam.webp')).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;
const pix = Float32Array.from(src);

// 1. The board's printed wording, painted out of its cream paper
{
  const [bx0, by0, bx1, by1] = scene.board.inner;
  const bw = bx1 - bx0, bh = by1 - by0;
  const lum = new Float32Array(bw * bh);
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
    const i = ((by0 + y) * W + bx0 + x) * 3;
    lum[y * bw + x] = 0.299 * pix[i] + 0.587 * pix[i + 1] + 0.114 * pix[i + 2];
  }
  // The wording is darker than the smooth paper: estimate the paper, flag what is darker, estimate again
  let ink = new Uint8Array(bw * bh);
  for (let pass = 0; pass < 3; pass++) {
    const wgt = new Float32Array(bw * bh), val = new Float32Array(bw * bh);
    for (let i = 0; i < bw * bh; i++) if (!ink[i]) (wgt[i] = 1), (val[i] = lum[i]);
    const w2 = boxBlur(wgt, bw, bh, scene.board.radius), v2 = boxBlur(val, bw, bh, scene.board.radius);
    ink = new Uint8Array(bw * bh);
    for (let i = 0; i < bw * bh; i++) if (w2[i] > 0.02 && lum[i] < v2[i] / w2[i] - scene.board.darker) ink[i] = 1;
  }
  const grown = new Uint8Array(bw * bh);
  const f = Float32Array.from(ink);
  const gb = boxBlur(f, bw, bh, scene.board.grow);
  for (let i = 0; i < bw * bh; i++) grown[i] = gb[i] > 0.001 ? 1 : 0;
  const cells: number[] = [];
  for (let i = 0; i < bw * bh; i++) if (grown[i]) cells.push(i);
  // Smooth fill from the paper beside the wording
  for (let c = 0; c < 3; c++) {
    const ch = new Float32Array(bw * bh);
    let sum = 0, cnt = 0;
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
      const v = pix[((by0 + y) * W + bx0 + x) * 3 + c];
      ch[y * bw + x] = v;
      if (!grown[y * bw + x]) (sum += v), cnt++;
    }
    for (const i of cells) ch[i] = sum / cnt;
    for (let it = 0; it < 1400; it++)
      for (const i of cells) {
        const x = i % bw, y = (i / bw) | 0;
        const a = ch[i - (x > 0 ? 1 : 0)], b = ch[i + (x < bw - 1 ? 1 : 0)], u = ch[i - (y > 0 ? bw : 0)], d = ch[i + (y < bh - 1 ? bw : 0)];
        ch[i] += 1.9 * ((a + b + u + d) / 4 - ch[i]);
      }
    for (const i of cells) pix[(((by0 + ((i / bw) | 0)) * W) + bx0 + (i % bw)) * 3 + c] = ch[i];
  }
  // A little paper grain back into the filled places, so they are not glassy
  let seed = 5;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (const i of cells) {
    const g = (rand() + rand() + rand() - 1.5) * 2.4;
    const o = (((by0 + ((i / bw) | 0)) * W) + bx0 + (i % bw)) * 3;
    for (let c = 0; c < 3; c++) pix[o + c] += g;
  }
}
const clean = Buffer.from(Uint8ClampedArray.from(pix));
const cleanImg = () => sharp(clean, { raw: { width: W, height: H, channels: 3 } });
await write('clean', cleanImg(), 78);

// 2. The hall as a soft glow
{
  // The board hangs in front of the hall, so the glow is made without it: its rectangle takes the average
  // colour of the ring just outside it
  const [x0, y0, x1, y1] = scene.board.rect;
  const m = 36, avg = [0, 0, 0];
  let n = 0;
  for (let y = y0 - m; y < y1 + m; y++)
    for (let x = x0 - m; x < x1 + m; x++) {
      if (x >= x0 - 2 && x < x1 + 2 && y >= y0 - 2 && y < y1 + 2) continue;
      for (let c = 0; c < 3; c++) avg[c] += pix[(y * W + x) * 3 + c];
      n++;
    }
  const glow = Float32Array.from(pix);
  for (let y = y0 - 6; y < y1 + 6; y++) for (let x = x0 - 6; x < x1 + 6; x++) for (let c = 0; c < 3; c++) glow[(y * W + x) * 3 + c] = avg[c] / n;
  await write('base', sharp(Buffer.from(Uint8ClampedArray.from(glow)), { raw: { width: W, height: H, channels: 3 } }).resize({ width: 40 }).blur(1.4).modulate({ brightness: 0.92 }), 80);
}

// 3. The ceiling: the roof carried on above the picture, a smooth gradient from the picture's own top colour
//    up into deep warm gold (a 1 × 64 strip, stretched across the page)
{
  const top = [0, 0, 0];
  let n = 0;
  for (let y = 4; y < 14; y++) for (let x = 0; x < W; x++) { for (let c = 0; c < 3; c++) top[c] += pix[(y * W + x) * 3 + c]; n++; }
  const base = top.map((v) => v / n);
  const deep = [96, 66, 30];
  const strip = Buffer.alloc(64 * 3);
  for (let y = 0; y < 64; y++) {
    const t = smoothstep(0, 1, 1 - y / 63); // 0 at the picture, 1 at the top of the page
    for (let c = 0; c < 3; c++) strip[y * 3 + c] = Math.round(base[c] * (1 - t * 0.9) + deep[c] * t * 0.9);
  }
  await write('ceiling', sharp(strip, { raw: { width: 1, height: 64, channels: 3 } }).resize({ width: 8, height: 64, fit: 'fill' }), 82);
}

// 4. The pieces
const meta: { id: string; box: number[]; size: number[] }[] = [];
let bytes = 0;
for (const p of scene.pieces as { id: string; rect: number[]; feather: number | number[]; colour?: string }[]) {
  const [x0, y0, x1, y1] = p.rect;
  const bw = x1 - x0, bh = y1 - y0;
  const f = Array.isArray(p.feather) ? p.feather : [p.feather, p.feather, p.feather, p.feather]; // left, top, right, bottom
  const rgba = Buffer.alloc(bw * bh * 4);
  const colour = new Float32Array(bw * bh);
  if (p.colour === 'green') {
    // Mango leaves: green (the gold beam and the cream paper have no green)
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
      const i = ((y0 + y) * W + x0 + x) * 3;
      const r = pix[i], g = pix[i + 1], b = pix[i + 2];
      colour[y * bw + x] = smoothstep(6, 26, g - Math.max(r, b)) * smoothstep(40, 70, g);
    }
    const soft = boxBlur(colour, bw, bh, 1);
    for (let k = 0; k < bw * bh; k++) colour[k] = Math.min(1, soft[k] * 1.5);
  }
  for (let y = 0; y < bh; y++)
    for (let x = 0; x < bw; x++) {
      const edge = Math.min(f[0] > 0 ? smoothstep(0, f[0], x) : 1, f[1] > 0 ? smoothstep(0, f[1], y) : 1, f[2] > 0 ? smoothstep(0, f[2], bw - 1 - x) : 1, f[3] > 0 ? smoothstep(0, f[3], bh - 1 - y) : 1);
      const a = p.colour ? edge * colour[y * bw + x] : edge;
      const i = ((y0 + y) * W + x0 + x) * 3, o = (y * bw + x) * 4;
      rgba[o] = pix[i]; rgba[o + 1] = pix[i + 1]; rgba[o + 2] = pix[i + 2]; rgba[o + 3] = Math.round(a * 255);
    }
  bytes += await write(`piece-${p.id}`, sharp(rgba, { raw: { width: bw, height: bh, channels: 4 } }), 82, 90);
  const pct = (v: number, t: number) => +((v / t) * 100).toFixed(4);
  meta.push({ id: p.id, box: [pct(x0, W), pct(y0, H), pct(bw, W), pct(bh, H)], size: [bw, bh] });
}
const b = scene.board.rect;
writeFileSync(
  join(dir, 'ceremony.json'),
  JSON.stringify(
    {
      width: W,
      height: H,
      pieces: meta,
      board: { x: +((b[0] / W) * 100).toFixed(4), y: +((b[1] / H) * 100).toFixed(4), w: +(((b[2] - b[0]) / W) * 100).toFixed(4), h: +(((b[3] - b[1]) / H) * 100).toFixed(4) },
      floor: { y: +((scene.floorY / H) * 100).toFixed(3) },
      crackers: scene.crackers.map((c: number[]) => [+((c[0] / W) * 100).toFixed(3), +((c[1] / H) * 100).toFixed(3)]),
    },
    null,
    2,
  ) + '\n',
);
console.log(`  pieces: ${(bytes / 1024).toFixed(0)} KB`);
