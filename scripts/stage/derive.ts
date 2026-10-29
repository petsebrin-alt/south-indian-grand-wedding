/**
 * npm run stage:assets → the desktop background and the Love Story page's background
 * (src/assets/stage/), from the client's cream temple picture source/scene.webp (a phone mockup in the
 * middle, golden pillars, hanging jasmine and red-flower garlands, brass lamps and bells, flower
 * vases, petals on marble) and the measurements in scene.json:
 *   panel-l, panel-r   the two sides of the picture, without the picture's own border, corner
 *                      ornaments or phone, and without the garlands, lamp and bells (rebuilt from
 *                      the cream around them), so those can hang in front and sway (WebP)
 *   strip              the plain cream and marble between the two sides, one column taken from the
 *                      columns beside the phone
 *   piece-<side>-<id>  each garland, lamp or bell, cut out with a soft edge, for the swaying
 *   page-scene         a portrait background for the Love Story page: the left side and its mirror
 *   stage.json         the panels' sizes and where every piece hangs (in % of its panel)
 * Re-run after replacing the picture or adjusting scene.json.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp, { type Sharp } from 'sharp';

const dir = join(process.cwd(), 'src/assets/stage');
const scene = JSON.parse(readFileSync(join(dir, 'scene.json'), 'utf8'));
const SCALE = 1.5;

const write = async (name: string, img: Sharp, formats: ('avif' | 'webp')[], q = { avif: 60, webp: 84 }) => {
  const png = await img.png().toBuffer();
  for (const f of formats) {
    const s = sharp(png);
    const buf = await (f === 'avif' ? s.avif({ quality: q.avif, effort: 6 }) : s.webp({ quality: q.webp, effort: 6, smartSubsample: true, alphaQuality: 92 })).toBuffer();
    writeFileSync(join(dir, `${name}.${f}`), buf);
    console.log(`✓ ${name}.${f}  ${(buf.length / 1024).toFixed(0)} KB`);
  }
};
const inside = (poly: number[][], x: number, y: number) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
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
const dilate = (m: Uint8Array, w: number, h: number, r: number) => {
  const a = Float32Array.from(m);
  const b = boxBlur(a, w, h, r);
  return Uint8Array.from(b, (v) => (v > 0.0005 ? 1 : 0));
};
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Fill a hole smoothly from the pixels around it: each pixel becomes the average of its neighbours
 * (a harmonic fill), started from a straight blend across each row. Where the background is soft
 * cream and warm bokeh this carries the gradient through unbroken; a little grain is added after.
 */
function harmonic(pix: Float32Array, w: number, h: number, hole: Uint8Array, grain: number) {
  const out = Float32Array.from(pix);
  const cells: number[] = [];
  for (let i = 0; i < w * h; i++) if (hole[i]) cells.push(i);
  // Start: a blend between the nearest known pixels left and right in each row
  for (let y = 0; y < h; y++) {
    let x = 0;
    while (x < w) {
      if (!hole[y * w + x]) { x++; continue; }
      let e = x;
      while (e < w && hole[y * w + e]) e++;
      const l = x > 0 ? x - 1 : e < w ? e : x, r = e < w ? e : l;
      for (let k = x; k < e; k++) {
        const t = r === l ? 0 : (k - l) / (r - l);
        for (let c = 0; c < 3; c++) out[(y * w + k) * 3 + c] = pix[(y * w + l) * 3 + c] * (1 - t) + pix[(y * w + r) * 3 + c] * t;
      }
      x = e;
    }
  }
  for (let it = 0; it < 500; it++)
    for (const i of cells) {
      const x = i % w, y = (i / w) | 0;
      const a = i - (x > 0 ? 1 : 0), b = i + (x < w - 1 ? 1 : 0), c = i - (y > 0 ? w : 0), d = i + (y < h - 1 ? w : 0);
      for (let k = 0; k < 3; k++) out[i * 3 + k] += 1.88 * ((out[a * 3 + k] + out[b * 3 + k] + out[c * 3 + k] + out[d * 3 + k]) / 4 - out[i * 3 + k]);
    }
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (const i of cells) {
    const g = (rand() + rand() + rand() - 1.5) * grain * 2;
    for (let k = 0; k < 3; k++) out[i * 3 + k] = Math.min(255, Math.max(0, out[i * 3 + k] + g));
  }
  return out;
}

const { data: src, info } = await sharp(join(dir, 'source/scene.webp')).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const SW = info.width;
const { top, bottom, mirror } = scene.crop;
const PH = bottom - top;
const out: { panel: { width: number; height: number }; pieces: Record<string, unknown>[]; page: Record<string, unknown> } = { panel: { width: 0, height: 0 }, pieces: [], page: {} };
const baseOf: Record<string, Float32Array> = {};
const origOf: Record<string, Float32Array> = {};

for (const side of ['l', 'r'] as const) {
  const [cx0, cx1] = scene.crop[side];
  const PW = cx1 - cx0;
  out.panel = { width: PW, height: PH };
  const orig = new Float32Array(PW * PH * 3);
  for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) for (let c = 0; c < 3; c++) orig[(y * PW + x) * 3 + c] = src[((top + y) * SW + cx0 + x) * 3 + c];

  // Each piece's polygon in panel pixels (the right side is the left's mirror)
  const polys = scene.pieces.map((p: { polygon: number[][] }) =>
    p.polygon.map(([x, y]) => [(side === 'l' ? x : mirror - x) - cx0, y - top]),
  );
  const hole = new Uint8Array(PW * PH);
  for (const poly of polys) for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) if (inside(poly, x + 0.5, y + 0.5)) hole[y * PW + x] = 1;
  const holeGrown = dilate(hole, PW, PH, 4);
  const t0 = Date.now();
  const base = { d: harmonic(orig, PW, PH, holeGrown, 1.1) };
  console.log(`  ${side}: rebuilt without the garlands in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  baseOf[side] = base.d;
  origOf[side] = orig;

  // The panel, enlarged a little and sharpened a touch so it holds up on a large screen
  const enlarge = (pix: Float32Array, w: number, h: number, channels: number) =>
    sharp(Buffer.from(Uint8ClampedArray.from(pix)), { raw: { width: w, height: h, channels: channels as 3 | 4 } })
      .resize({ width: Math.round(w * SCALE), kernel: 'lanczos3' })
      .sharpen({ sigma: 0.7, m1: 0.6, m2: 1.2 });
  await write(`panel-${side}`, enlarge(base.d, PW, PH, 3), ['webp'], { avif: 0, webp: 84 });

  // The pieces: the original, enlarged, cut by a feathered polygon and by how much each pixel differs
  // from the rebuilt panel (so only the garland, not the cream between its flowers, is lifted)
  const ow = Math.round(PW * SCALE), oh = Math.round(PH * SCALE);
  const upO = await enlarge(orig, PW, PH, 3).raw().toBuffer();
  const upB = await enlarge(base.d, PW, PH, 3).raw().toBuffer();
  for (const [pi, piece] of scene.pieces.entries()) {
    const poly = polys[pi].map(([x, y]: number[]) => [x * (ow / PW), y * (oh / PH)]);
    let x0 = ow, y0 = oh, x1 = 0, y1 = 0;
    for (const [x, y] of poly) (x0 = Math.min(x0, x)), (x1 = Math.max(x1, x)), (y0 = Math.min(y0, y)), (y1 = Math.max(y1, y));
    x0 = Math.max(0, Math.floor(x0) - 3); y0 = Math.max(0, Math.floor(y0)); x1 = Math.min(ow, Math.ceil(x1) + 3); y1 = Math.min(oh, Math.ceil(y1) + 3);
    const bw = x1 - x0, bh = y1 - y0;
    const mask = new Float32Array(bw * bh);
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) mask[y * bw + x] = inside(poly, x0 + x + 0.5, y0 + y + 0.5) ? 1 : 0;
    const soft = boxBlur(mask, bw, bh, 2);
    const rgba = Buffer.alloc(bw * bh * 4);
    for (let y = 0; y < bh; y++)
      for (let x = 0; x < bw; x++) {
        const i = (y * ow + x0 + x) * 3, k = (y * bw + x) * 4;
        const diff = Math.max(Math.abs(upO[i] - upB[i]), Math.abs(upO[i + 1] - upB[i + 1]), Math.abs(upO[i + 2] - upB[i + 2]));
        const a = soft[y * bw + x] * smoothstep(4, 14, diff);
        rgba[k] = upO[i]; rgba[k + 1] = upO[i + 1]; rgba[k + 2] = upO[i + 2]; rgba[k + 3] = Math.round(a * 255);
      }
    await write(`piece-${side}-${piece.id}`, sharp(rgba, { raw: { width: bw, height: bh, channels: 4 } }), ['webp'], { avif: 0, webp: 90 });
    out.pieces.push({
      id: piece.id,
      side,
      file: `piece-${side}-${piece.id}`,
      // where the piece hangs, in % of its panel
      box: [+((x0 / ow) * 100).toFixed(3), +((y0 / oh) * 100).toFixed(3), +((bw / ow) * 100).toFixed(3), +((bh / oh) * 100).toFixed(3)],
      size: [bw, bh],
      amp: piece.amp,
      period: piece.period,
      lag: piece.lag,
      phase: piece.phase + (side === 'r' ? 1.9 : 0),
      flames: (piece.flames ?? []).map(([fx, fy, fr]: number[]) => [+(((((side === 'l' ? fx : mirror - fx) - cx0) * SCALE - x0) / bw) * 100).toFixed(2), +((((fy - top) * SCALE - y0) / bh) * 100).toFixed(2), +((fr * SCALE / bw) * 100).toFixed(2)]),
    });
  }
}

// The plain middle: the cream and marble beside the phone, one column
{
  const col = new Float32Array(PH * 3);
  const [c0, c1] = scene.centre;
  let n = 0;
  for (const range of [[c0, c1], [mirror - c1, mirror - c0]]) for (let x = range[0]; x < range[1]; x++) { n++; for (let y = 0; y < PH; y++) for (let c = 0; c < 3; c++) col[y * 3 + c] += src[((top + y) * SW + x) * 3 + c]; }
  for (let i = 0; i < col.length; i++) col[i] /= n;
  // Smooth down the column, so the paisley beside the phone does not leave a pattern
  for (let c = 0; c < 3; c++) {
    const ch = new Float32Array(PH);
    for (let y = 0; y < PH; y++) ch[y] = col[y * 3 + c];
    const b = boxBlur(ch, 1, PH, 7);
    for (let y = 0; y < PH; y++) col[y * 3 + c] = b[y];
  }
  const strip = Buffer.alloc(8 * PH * 3);
  for (let y = 0; y < PH; y++) for (let x = 0; x < 8; x++) for (let c = 0; c < 3; c++) strip[(y * 8 + x) * 3 + c] = Math.round(col[y * 3 + c]);
  await write('strip', sharp(strip, { raw: { width: 8, height: PH, channels: 3 } }), ['webp'], { avif: 0, webp: 90 });
}

// The Love Story page's portrait background: the left side and its mirror, in three parts that fit any
// page height: the top (where the garlands hang), the foot (only petals on the marble: the vases are left out) and, between them, a
// plain blend of the cream wall that stretches. The rows beside each cut are softened into the blend.
{
  const lw = scene.page.width;
  const PW = scene.crop.l[1] - scene.crop.l[0];
  const CW = lw * 2;
  const T = scene.page.top, B0 = scene.page.bottom, F = scene.page.fade;
  const mirrored = new Float32Array(CW * PH * 3);
  for (let y = 0; y < PH; y++)
    for (let x = 0; x < lw; x++)
      for (let c = 0; c < 3; c++) {
        const v = baseOf.l[(y * PW + x) * 3 + c];
        mirrored[(y * CW + x) * 3 + c] = v;
        mirrored[(y * CW + (CW - 1 - x)) * 3 + c] = v;
      }
  // A very soft copy of the picture, which the rows beside each cut fade into
  const soft = new Float32Array(mirrored.length);
  for (let c = 0; c < 3; c++) {
    const ch = new Float32Array(CW * PH);
    for (let i = 0; i < CW * PH; i++) ch[i] = mirrored[i * 3 + c];
    let b = boxBlur(boxBlur(ch, CW, PH, 10), CW, PH, 10);
    b = boxBlur(b, CW, PH, 10);
    for (let i = 0; i < CW * PH; i++) soft[i * 3 + c] = b[i];
  }
  // The foot has no vases: its soft copy is made from the marble alone (the rows above it repeat its first row)
  const footOnly = Float32Array.from(mirrored);
  for (let y = 0; y < B0; y++) for (let x = 0; x < CW; x++) for (let c = 0; c < 3; c++) footOnly[(y * CW + x) * 3 + c] = mirrored[(B0 * CW + x) * 3 + c];
  const softFoot = new Float32Array(mirrored.length);
  for (let c = 0; c < 3; c++) {
    const ch = new Float32Array(CW * PH);
    for (let i = 0; i < CW * PH; i++) ch[i] = footOnly[i * 3 + c];
    let b = boxBlur(boxBlur(ch, CW, PH, 10), CW, PH, 10);
    b = boxBlur(b, CW, PH, 10);
    for (let i = 0; i < CW * PH; i++) softFoot[i * 3 + c] = b[i];
  }
  const row = (y: number, x: number, c: number, fadeIn: number, from: Float32Array = soft) => mirrored[(y * CW + x) * 3 + c] * (1 - fadeIn) + from[(y * CW + x) * 3 + c] * fadeIn;
  const top = new Float32Array(CW * T * 3);
  for (let y = 0; y < T; y++) {
    const f = smoothstep(T - F, T, y);
    for (let x = 0; x < CW; x++) for (let c = 0; c < 3; c++) top[(y * CW + x) * 3 + c] = row(y, x, c, f);
  }
  const bh = PH - B0;
  const bottom = new Float32Array(CW * bh * 3);
  for (let y = 0; y < bh; y++) {
    const f = 1 - smoothstep(0, F, y);
    for (let x = 0; x < CW; x++) for (let c = 0; c < 3; c++) bottom[(y * CW + x) * 3 + c] = row(B0 + y, x, c, f, softFoot);
  }
  // The blend: two rows, the colours at the foot of the top part and at the head of the foot
  const gap = new Float32Array(CW * 2 * 3);
  // The upper row is averaged across a wide stretch, so the blend is a gentle gradient (the pillar's gold
  // would otherwise stretch into stripes); the lower row is the marble's own colour, taken from the middle
  // of the foot (the flowers at its corners would stretch into red stripes)
  for (let x = 0; x < CW; x++)
    for (let c = 0; c < 3; c++) {
      let acc = 0, cnt = 0;
      for (let k = -60; k <= 60; k++) { const xx = Math.min(CW - 1, Math.max(0, x + k)); acc += soft[((T - 1) * CW + xx) * 3 + c]; cnt++; }
      gap[x * 3 + c] = acc / cnt;
    }
  for (let c = 0; c < 3; c++) {
    let acc = 0, cnt = 0;
    for (let y = B0 + 4; y < B0 + 16; y++) for (let x = Math.round(CW * 0.34); x < Math.round(CW * 0.66); x++) { acc += footOnly[(y * CW + x) * 3 + c]; cnt++; }
    for (let x = 0; x < CW; x++) gap[(CW + x) * 3 + c] = acc / cnt;
  }
  const up = (pix: Float32Array, h: number) => sharp(Buffer.from(Uint8ClampedArray.from(pix)), { raw: { width: CW, height: h, channels: 3 } }).resize({ width: Math.round(CW * SCALE), height: Math.round(h * SCALE), kernel: 'lanczos3' }).sharpen({ sigma: 0.7, m1: 0.6, m2: 1.2 });
  await write('page-top', up(top, T), ['webp'], { avif: 0, webp: 84 });
  await write('page-bottom', up(bottom, bh), ['webp'], { avif: 0, webp: 84 });
  await write('page-gap', sharp(Buffer.from(Uint8ClampedArray.from(gap)), { raw: { width: CW, height: 2, channels: 3 } }), ['webp'], { avif: 0, webp: 92 });
  out.page = { width: CW, top: T, bottom: bh, pieces: scene.page.pieces };
}
writeFileSync(join(dir, 'stage.json'), JSON.stringify(out, null, 2) + '\n');
