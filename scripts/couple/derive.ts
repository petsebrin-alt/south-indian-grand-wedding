/**
 * npm run couple:assets → the Rahul and Divya pages' layers (src/assets/couple/), from the client's
 * photographs and the measurements in scene.json:
 *   groom, bride      each page's photograph (AVIF + WebP): the client's temple courtyard (sharp carved
 *                     pillars, jasmine garlands, banana leaves, brass lamps, the gopuram, a polished marble
 *                     floor; src/assets/family/source/temple.webp) with the real Rahul or Divya, cut out of
 *                     the client's groom-and-bride picture (source/mask-*.png, python3 scripts/couple/matte.py),
 *                     sitting on its floor with a soft shadow. Their picture ends at the hem, so the lower
 *                     edge of the page is where it ends.
 *   card-<id>         each polaroid (and the groom's gaming cluster), lifted out of the groom-and-bride
 *                     picture along its outline: the rough corners in scene.json are snapped to the edges of
 *                     the white frame
 *   cards.json        each card's size and the order it appears in
 * Re-run after replacing a picture or adjusting scene.json.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp, { type Sharp } from 'sharp';

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
const W = info.width;
let H = info.height;
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
const holes: Uint8Array[] = []; // each half's polaroids, where the picture behind them is not known
for (const side of ['groom', 'bride'] as const) {
  const half = scene[side];
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
  holes.push(hole);

}



// The pages: the real person on the courtyard's floor
const PG = scene.pages;
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const blurBox = (src: Float32Array, w: number, h: number, r: number) => {
  const tmp = new Float32Array(w * h), out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    let acc = 0;
    for (let x = -r; x <= r; x++) acc += src[y * w + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) {
      tmp[y * w + x] = acc / (2 * r + 1);
      acc += src[y * w + Math.min(w - 1, x + r + 1)] - src[y * w + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let y = -r; y <= r; y++) acc += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = acc / (2 * r + 1);
      acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
    }
  }
  return out;
};
const courtyardPath = join(process.cwd(), 'src/assets/family/source/temple.webp');
for (const [si, side] of (['groom', 'bride'] as const).entries()) {
  const [hx0, hx1] = scene[side].span;
  const hw = hx1 - hx0;
  const opt = PG[side];
  // The person: the picture's half, with the mask as its alpha, polaroid-covered places filled with the cloth around
  const half = await sharp(join(dir, 'source/groom-bride.webp')).extract({ left: hx0, top: 0, width: hw, height: H }).removeAlpha().raw().toBuffer();
  const mask = await sharp(join(dir, `source/mask-${side}.png`)).greyscale().raw().toBuffer();
  const alpha = new Float32Array(hw * H);
  for (let i = 0; i < hw * H; i++) alpha[i] = mask[i] / 255;
  // In places where the cut by colour is ragged (the cloth was under a polaroid), the person's outline itself is the edge
  for (const [zx0, zy0, zx1, zy1] of (scene[side].outlineZones ?? []) as number[][]) {
    const poly = scene[side].person.map((p: number[]) => [p[0] - hx0, p[1]]);
    const zone = new Float32Array(hw * H);
    for (let y = zy0; y < Math.min(H, zy1); y++)
      for (let x = zx0; x < Math.min(hw, zx1); x++) {
        let cov = 0;
        for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if (inside(poly, x + (a + 0.5) / 3, y + (b + 0.5) / 3)) cov++;
        zone[y * hw + x] = cov / 9;
      }
    const soft = blurBox(zone, hw, H, 1);
    for (let y = zy0; y < Math.min(H, zy1); y++) for (let x = zx0; x < Math.min(hw, zx1); x++) alpha[y * hw + x] = soft[y * hw + x];
  }
  // Where a polaroid lay over the person (its place inside the person's outline), the cloth behind is not in the picture:
  // fill it smoothly from the cloth around it, with a little grain, and keep it as part of the person
  const cardCover = new Uint8Array(hw * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < hw; x++) if (holes[si][y * W + hx0 + x]) cardCover[y * hw + x] = 1;
  const grown = Float32Array.from(blurBox(Float32Array.from(cardCover), hw, H, 10), (v) => (v > 0.001 ? 1 : 0));
  const pic = Float32Array.from(half);
  const cells: number[] = [];
  for (let i = 0; i < hw * H; i++) if (grown[i] && alpha[i] > 0.5) cells.push(i);
  if (cells.length) {
    const known = (i: number) => alpha[i] > 0.5 && !grown[i];
    for (let c = 0; c < 3; c++) {
      let sum = 0, n = 0;
      for (let i = 0; i < hw * H; i++) if (known(i)) (sum += pic[i * 3 + c]), n++;
      for (const i of cells) pic[i * 3 + c] = sum / n;
      for (let it = 0; it < 400; it++)
        for (const i of cells) {
          const x = i % hw, y = (i / hw) | 0;
          // only the person's own cloth counts: beyond the person's edge the value is the cell's own (no bleeding of what lies outside)
          const at = (j: number) => (alpha[j] > 0.5 ? pic[j * 3 + c] : pic[i * 3 + c]);
          const a = i - (x > 0 ? 1 : 0), b = i + (x < hw - 1 ? 1 : 0), u = i - (y > 0 ? hw : 0), d = i + (y < H - 1 ? hw : 0);
          pic[i * 3 + c] += 1.9 * ((at(a) + at(b) + at(u) + at(d)) / 4 - pic[i * 3 + c]);
        }
    }
    let seed = 13;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    // The cloth's faint creases run down it: a soft random streak per column (smoothed across), plus grain
    const streak = new Float32Array(hw);
    for (let x = 0; x < hw; x++) streak[x] = rand() * 2 - 1;
    const streakSoft = blurBox(blurBox(streak, hw, 1, 2), hw, 1, 2);
    let peak = 1e-6;
    for (let x = 0; x < hw; x++) peak = Math.max(peak, Math.abs(streakSoft[x]));
    for (const i of cells) {
      const x = i % hw;
      const g = (rand() + rand() + rand() - 1.5) * 3 + (streakSoft[x] / peak) * 5.5;
      for (let c = 0; c < 3; c++) pic[i * 3 + c] = Math.min(255, Math.max(0, pic[i * 3 + c] + g));
    }
  }
  // Cut to the person's box
  let bx0 = hw, by0 = H, bx1 = 0, by1 = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < hw; x++) if (alpha[y * hw + x] > 0.05) (bx0 = Math.min(bx0, x)), (bx1 = Math.max(bx1, x)), (by0 = Math.min(by0, y)), (by1 = Math.max(by1, y));
  const pw = bx1 - bx0 + 1, ph = by1 - by0 + 1;
  const rgba = Buffer.alloc(pw * ph * 4);
  for (let y = 0; y < ph; y++)
    for (let x = 0; x < pw; x++) {
      const i = (by0 + y) * hw + bx0 + x, o = (y * pw + x) * 4;
      for (let c = 0; c < 3; c++) rgba[o + c] = Math.round(pic[i * 3 + c]);
      rgba[o + 3] = Math.round(alpha[i] * 255);
    }
  const sw = Math.round(pw * opt.scale), sh = Math.round(ph * opt.scale);
  const person = await sharp(rgba, { raw: { width: pw, height: ph, channels: 4 } }).resize({ width: sw, height: sh, kernel: 'lanczos3' }).png().toBuffer();
  // The courtyard, covering the page (mirrored for one of the two so the pages differ)
  let court = sharp(courtyardPath).removeAlpha().resize({ width: PG.width, height: PG.height, fit: 'cover', position: opt.flip ? 'left' : 'right' });
  if (opt.flip) court = court.flop();
  const courtBuf = await court.png().toBuffer();
  // Where the person sits: the foot of the picture runs `drop` px below the page's bottom edge
  const left = Math.round(PG.width * opt.cx - sw / 2), top = PG.height - sh + opt.drop;
  // A soft shadow on the floor, from the person's own shape
  const pa = await sharp(person).ensureAlpha().extractChannel(3).raw().toBuffer();
  const shadowAlpha = blurBox(Float32Array.from(pa, (v) => v / 255), sw, sh, PG.shadow.blur);
  const shadowBuf = Buffer.alloc(sw * sh * 4);
  for (let i = 0; i < sw * sh; i++) {
    shadowBuf[i * 4] = 20; shadowBuf[i * 4 + 1] = 8; shadowBuf[i * 4 + 2] = 2;
    shadowBuf[i * 4 + 3] = Math.round(Math.min(1, shadowAlpha[i] * 1.6) * PG.shadow.opacity * 255);
  }
  const shadow = await sharp(shadowBuf, { raw: { width: sw, height: sh, channels: 4 } }).png().toBuffer();
  const pageImg = sharp(courtBuf).composite([
    { input: shadow, left: left + 6, top: top + PG.shadow.dy },
    { input: person, left, top },
  ]);
  await write(side, pageImg, ['avif', 'webp'], { avif: 60, webp: 84 });
}
writeFileSync(join(dir, 'cards.json'), JSON.stringify(cardsOut, null, 2) + '\n');
