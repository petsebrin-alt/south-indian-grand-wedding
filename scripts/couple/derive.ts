/**
 * npm run couple:assets → the Rahul and Divya pages' layers (src/assets/couple/):
 *   groom, bride      each page's photograph (AVIF + WebP): panels 1 and 2 of the client's picture of the
 *                     couple sitting casually in a temple courtyard (source/scenes.webp: carved sandstone
 *                     pillars with jasmine garlands, banana leaves, brass lamps, the gopuram and palms, a
 *                     marble floor, their feet on it), as they are, enlarged a little for sharper edges
 *   card-<id>         each polaroid (and the groom's gaming cluster), lifted out of the client's
 *                     groom-and-bride picture (source/groom-bride.webp) along its outline: the rough
 *                     corners in scene.json are snapped to the edges of the white frame
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
for (const side of ['groom', 'bride'] as const) {
  const half = scene[side];
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
      }
    await write(`card-${card.id}`, sharp(rgba, { raw: { width: bw, height: bh, channels: 4 } }), ['webp'], { avif: 0, webp: 86 });
    out.push({ id: card.id, label: card.label, column: card.column, width: bw, height: bh });
  }
  cardsOut[side] = out;

}



// The pages: the couple's scenes, cut from the client's three-panel picture
const SC = scene.scenes;
for (const side of ['groom', 'bride'] as const) {
  const [x0, w] = SC[side] as number[];
  const page = sharp(join(dir, 'source/scenes.webp'))
    .extract({ left: x0, top: 0, width: w, height: SC.height })
    .resize({ width: SC.width, kernel: 'lanczos3' })
    .sharpen({ sigma: 0.6, m1: 0.5, m2: 1 });
  await write(side, page, ['avif', 'webp'], { avif: 60, webp: 84 });
}
writeFileSync(join(dir, 'cards.json'), JSON.stringify(cardsOut, null, 2) + '\n');
