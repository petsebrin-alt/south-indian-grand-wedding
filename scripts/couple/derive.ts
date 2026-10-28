/**
 * npm run couple:assets → the Rahul and Divya pages' layers (src/assets/couple/), from the client's
 * picture source/groom-bride.webp (the groom's page on the left half, the bride's on the right) and
 * the measurements in scene.json:
 *   groom, bride      each half, with its interest polaroids and its printed title taken out, so the
 *                     title can be set in live lettering and the polaroids can pop in one by one
 *                     (AVIF + WebP). The sky and palms behind a title are borrowed from the picture
 *                     (inpaint.ts); the garden behind the polaroids is rebuilt as leaves and flowers
 *                     cut from the picture's own garden (bokeh.ts)
 *   card-<id>         each polaroid (and the groom's gaming cluster), lifted out along its outline:
 *                     the rough corners in scene.json are snapped to the edges of the white frame
 *   cards.json        each card's size and the order it appears in
 * Re-run after replacing the picture or adjusting scene.json.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp, { type Sharp } from 'sharp';
import { inpaint } from '../welcome/inpaint';
import { softBackground } from './bokeh';

const dir = join(process.cwd(), 'src/assets/couple');
const scene = JSON.parse(readFileSync(join(dir, 'scene.json'), 'utf8'));

const write = async (name: string, img: Sharp, formats: ('avif' | 'webp')[], q = { avif: 58, webp: 82 }) => {
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

const { data: d, info } = await sharp(join(dir, 'source/groom-bride.webp')).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;
const px = (x: number, y: number, c: number) => d[(Math.min(H - 1, Math.max(0, Math.round(y))) * W + Math.min(W - 1, Math.max(0, Math.round(x)))) * 3 + c];
// The polaroids' frames are warm white
const white = (x: number, y: number) => {
  const r = px(x, y, 0), g = px(x, y, 1), b = px(x, y, 2);
  return Math.min(r, g, b) > 212 && Math.max(r, g, b) - Math.min(r, g, b) < 42;
};

/**
 * Snap a rough quad (clockwise corners) to the frame: each edge moves along its outward normal to
 * the last white pixel before the background (the median over samples along the edge), and the
 * corners become the intersections of the moved edges.
 */
function snap(quad: number[][]) {
  const lines: { p: number[]; dir: number[] }[] = [];
  for (let e = 0; e < 4; e++) {
    const a = quad[e], b = quad[(e + 1) % 4];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const t = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
    const n = [t[1], -t[0]]; // outward for clockwise corners in screen coordinates
    const found: number[] = [];
    for (let k = 3; k <= 17; k++) {
      const s = k / 20;
      const p = [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s];
      let best: number | null = null;
      for (let o = -10; o <= 10; o++) {
        const q = (j: number) => white(p[0] + n[0] * (o + j), p[1] + n[1] * (o + j));
        if (q(0) && !q(1) && !q(2)) best = o;
      }
      if (best !== null) found.push(best);
    }
    found.sort((x, y) => x - y);
    const off = found.length >= 5 ? found[found.length >> 1] + 0.5 : 0;
    lines.push({ p: [a[0] + n[0] * off, a[1] + n[1] * off], dir: t });
  }
  const meet = (l1: { p: number[]; dir: number[] }, l2: { p: number[]; dir: number[] }) => {
    const den = l1.dir[0] * l2.dir[1] - l1.dir[1] * l2.dir[0];
    const s = ((l2.p[0] - l1.p[0]) * l2.dir[1] - (l2.p[1] - l1.p[1]) * l2.dir[0]) / den;
    return [l1.p[0] + l1.dir[0] * s, l1.p[1] + l1.dir[1] * s];
  };
  return [meet(lines[3], lines[0]), meet(lines[0], lines[1]), meet(lines[1], lines[2]), meet(lines[2], lines[3])];
}

const cardsOut: Record<string, unknown[]> = {};
const holes: Uint8Array[] = [];
const titleHoles: Uint8Array[] = [];
for (const side of ['groom', 'bride'] as const) {
  const half = scene[side];
  const [hx0, hx1] = half.span;
  const hw = hx1 - hx0;
  const hole = new Uint8Array(W * H);
  const out: unknown[] = [];

  for (const card of half.cards) {
    const outline: number[][] = card.quad ? snap(card.quad) : card.outline;
    const polys: number[][][] = [outline, ...(card.tape ? [card.tape] : [])];
    const xs = polys.flat().map((p) => p[0]), ys = polys.flat().map((p) => p[1]);
    const bx0 = Math.floor(Math.min(...xs)) - 1, by0 = Math.floor(Math.min(...ys)) - 1;
    const bx1 = Math.ceil(Math.max(...xs)) + 1, by1 = Math.ceil(Math.max(...ys)) + 1;
    const bw = bx1 - bx0, bh = by1 - by0;
    const rgba = Buffer.alloc(bw * bh * 4);
    for (let y = 0; y < bh; y++)
      for (let x = 0; x < bw; x++) {
        // Coverage of a 4×4 grid of samples, for a smooth edge
        let cov = 0;
        for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) if (polys.some((p) => inside(p, bx0 + x + (a + 0.5) / 4, by0 + y + (b + 0.5) / 4))) cov++;
        const o = (y * bw + x) * 4;
        for (let c = 0; c < 3; c++) rgba[o + c] = px(bx0 + x, by0 + y, c);
        rgba[o + 3] = Math.round((cov / 16) * 255);
        if (cov) hole[(by0 + y) * W + bx0 + x] = 1;
      }
    await write(`card-${card.id}`, sharp(rgba, { raw: { width: bw, height: bh, channels: 4 } }), ['webp'], { avif: 0, webp: 86 });
    out.push({ id: card.id, label: card.label, column: card.column, width: bw, height: bh });
  }
  cardsOut[side] = out;

  // The printed title
  const titleHole = new Uint8Array(W * H);
  for (let y = half.title[1]; y < half.title[3]; y++) for (let x = half.title[0]; x < half.title[2]; x++) {
    // Only the lettering and its soft edge, not the sky around it (dark red, well away from the sky)
    const r = px(x, y, 0), g = px(x, y, 1), b = px(x, y, 2);
    if (r - g > 40 && r < 200 && g < 120) titleHole[y * W + x] = 1;
  }
  titleHoles.push(titleHole);

  holes.push(hole);
}

// Rebuild the background behind the printed titles (sky and soft palms: borrowed from the picture's
// own sky and palms) and behind the polaroids (a garden of leaves and flowers, built below)
const grow = scene.grow;
const dilate = (src: Uint8Array, r: number) => {
  const out = new Uint8Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!src[y * W + x]) continue;
      for (let yy = Math.max(0, y - r); yy <= Math.min(H - 1, y + r); yy++) for (let xx = Math.max(0, x - r); xx <= Math.min(W - 1, x + r); xx++) out[yy * W + xx] = 1;
    }
  return out;
};
const peopleMask = new Uint8Array(W * H);
for (const side of ['groom', 'bride'] as const) for (let y = 0; y < H; y++) for (let x = scene[side].span[0]; x < scene[side].span[1]; x++) if (inside(scene[side].person, x + 0.5, y + 0.5)) peopleMask[y * W + x] = 1;
const boxMask = (boxes: number[][]) => {
  const m = new Uint8Array(W * H);
  for (const [x0, y0, x1, y1] of boxes) for (let y = Math.max(0, y0); y < Math.min(H, y1); y++) for (let x = Math.max(0, x0); x < Math.min(W, x1); x++) m[y * W + x] = 1;
  return m;
};
const pillars = boxMask(scene.pillars);
const cardHole = new Uint8Array(W * H), titleHole = new Uint8Array(W * H);
for (const h of holes) for (let i = 0; i < W * H; i++) if (h[i]) cardHole[i] = 1;
for (const h of titleHoles) for (let i = 0; i < W * H; i++) if (h[i]) titleHole[i] = 1;
const erode = (src: Uint8Array, r: number) => {
  const inv = Uint8Array.from(src, (v) => 1 - v);
  const grown = dilate(inv, r);
  return Uint8Array.from(grown, (v) => 1 - v);
};
// The polaroids' area, grown past their drop shadows, with the thin strips between neighbouring
// polaroids closed
const cardsClosed = erode(dilate(cardHole, scene.cardGrow + scene.close), scene.close);
const titleGrown = dilate(titleHole, grow);
// The dark strips the polaroids' shadows left beside them join the area (a dark edge would outline it)
const cardsGrown = Uint8Array.from(cardsClosed);
{
  let frontier: number[] = [];
  for (let i = 0; i < W * H; i++) if (cardsClosed[i]) frontier.push(i);
  for (let step = 0; step < scene.shadowReach && frontier.length; step++) {
    const next: number[] = [];
    for (const i of frontier) {
      const x = i % W, y = (i / W) | 0;
      for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) {
        if (j < 0 || cardsGrown[j] || peopleMask[j] || pillars[j]) continue;
        const l = 0.3 * d[j * 3] + 0.59 * d[j * 3 + 1] + 0.11 * d[j * 3 + 2];
        if (l < scene.shadowDark) (cardsGrown[j] = 1), next.push(j);
      }
    }
    frontier = next;
  }
}

// Titles: the sky and palms around them
const t0 = Date.now();
const titleAvoid = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) if (peopleMask[i] || pillars[i]) titleAvoid[i] = 1;
const withTitles = inpaint({ w: W, h: H, d: Float32Array.from(d) }, titleGrown, titleAvoid, () => {}, { grain: scene.grain });

// Cards: the garden of leaves and flowers behind them (bokeh.ts)
const keep = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) if ((peopleMask[i] || pillars[i]) && !cardsGrown[i]) keep[i] = 1;
const rebuilt = { w: W, h: H, d: Float32Array.from(withTitles.d) };
const foliage = new Uint8Array(W * H), greens = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) {
  const r = withTitles.d[i * 3], g = withTitles.d[i * 3 + 1], b = withTitles.d[i * 3 + 2];
  const l = 0.3 * r + 0.59 * g + 0.11 * b;
  // Leaves (green), their shade, and red and orange flowers: not sky, stone, gold or skin
  if ((g > b + 22 && g > r - 12 && l < 175) || (l >= 58 && l < 85 && b < g + 10) || (r > 120 && r > g * 1.6 && Math.max(r, g, b) - Math.min(r, g, b) > 85)) foliage[i] = 1;
  if ((g > b + 22 && g > r - 5 && l < 175) || (l >= 62 && l < 85 && g > r && g > b + 6)) greens[i] = 1;
}
softBackground(rebuilt, { hole: cardsGrown, keep, foliage, greens, ...scene.bokeh }, (l) => console.log(l));
console.log(`  backgrounds rebuilt in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
for (const side of ['groom', 'bride'] as const) {
  const [hx0, hx1] = scene[side].span;
  const hw = hx1 - hx0;
  const out = new Float32Array(hw * H * 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < hw; x++) for (let c = 0; c < 3; c++) out[(y * hw + x) * 3 + c] = rebuilt.d[(y * W + hx0 + x) * 3 + c];
  await write(side, sharp(Buffer.from(Uint8ClampedArray.from(out)), { raw: { width: hw, height: H, channels: 3 } }), ['avif', 'webp'], { avif: 60, webp: 82 });
}
writeFileSync(join(dir, 'cards.json'), JSON.stringify(cardsOut, null, 2) + '\n');
