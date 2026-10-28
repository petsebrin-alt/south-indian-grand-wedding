/**
 * npm run couple:assets → the Rahul and Divya pages' layers (src/assets/couple/), from the client's
 * picture source/groom-bride.webp (the groom's page on the left half, the bride's on the right) and
 * the measurements in scene.json:
 *   groom, bride      each half, with its interest polaroids and its printed title taken out (the
 *                     photograph rebuilt behind them, inpaint.ts), so the title can be set in live
 *                     lettering and the polaroids can pop in one by one (AVIF + WebP)
 *   card-<id>         each polaroid (and the groom's gaming cluster), lifted out along its outline:
 *                     the rough corners in scene.json are snapped to the edges of the white frame
 *   cards.json        each card's size and the order it appears in
 * Re-run after replacing the picture or adjusting scene.json.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp, { type Sharp } from 'sharp';
import { inpaint } from '../welcome/inpaint';

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
  for (let y = half.title[1]; y < half.title[3]; y++) for (let x = half.title[0]; x < half.title[2]; x++) {
    // Only the lettering and its soft edge, not the sky around it (dark red, well away from the sky)
    const r = px(x, y, 0), g = px(x, y, 1), b = px(x, y, 2);
    if (r - g > 40 && r < 200 && g < 120) hole[y * W + x] = 1;
  }

  // Grow the hole so no frame edge or letter fringe is left
  const grow = scene.grow;
  const grown = new Uint8Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = hx0; x < hx1; x++) {
      if (!hole[y * W + x]) continue;
      for (let yy = Math.max(0, y - grow); yy <= Math.min(H - 1, y + grow); yy++)
        for (let xx = Math.max(hx0, x - grow); xx <= Math.min(hx1 - 1, x + grow); xx++) grown[yy * W + xx] = 1;
    }

  // Rebuild the half from itself, never from the other half or the person. Each area is rebuilt
  // only from its own surroundings: the title from the sky and palms, the left cards from the
  // flowers and pillars on the left, the right cards from those on the right (so no temple tower
  // turns up among the garlands). The card areas are out of focus, so their middles are a smooth
  // blend of the surrounding colours (with fine grain), meeting copied detail at their edges.
  const pic = { w: hw, h: H, d: new Float32Array(hw * H * 3) };
  for (let y = 0; y < H; y++) for (let x = 0; x < hw; x++) for (let c = 0; c < 3; c++) pic.d[(y * hw + x) * 3 + c] = d[(y * W + hx0 + x) * 3 + c];
  const person = new Uint8Array(hw * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < hw; x++) if (inside(half.person, hx0 + x + 0.5, y + 0.5)) person[y * hw + x] = 1;
  for (const area of half.areas as { from: number[]; region: number[]; calm: boolean }[]) {
    const [rx0, rx1] = area.region.map((v: number) => Math.round((v / 100) * hw));
    const [ax0, ax1] = area.from.map((v: number) => Math.round((v / 100) * hw));
    const areaHole = new Uint8Array(hw * H), avoid = new Uint8Array(hw * H);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < hw; x++) {
        const i = y * hw + x;
        if (x >= rx0 && x < rx1 && grown[y * W + hx0 + x]) areaHole[i] = 1;
        if (x < ax0 || x >= ax1 || person[i]) avoid[i] = 1;
      }
    const fine = inpaint({ w: hw, h: H, d: Float32Array.from(pic.d) }, areaHole, avoid, () => {});
    if (!area.calm) {
      for (let i = 0; i < hw * H; i++) if (areaHole[i]) for (let c = 0; c < 3; c++) pic.d[i * 3 + c] = fine.d[i * 3 + c];
      continue;
    }
    // Out of focus: a smooth blend of the surrounding colours, enlarged from the coarsest scale, with grain
    const calm = inpaint({ w: hw, h: H, d: Float32Array.from(pic.d) }, areaHole, avoid, () => {}, { finest: 1, grain: 2.4 });
    // Distance into the hole
    const dist = new Float32Array(hw * H);
    for (let i = 0; i < hw * H; i++) dist[i] = areaHole[i] ? 1e9 : 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < hw; x++) { const i = y * hw + x; if (x) dist[i] = Math.min(dist[i], dist[i - 1] + 1); if (y) dist[i] = Math.min(dist[i], dist[i - hw] + 1); }
    for (let y = H - 1; y >= 0; y--) for (let x = hw - 1; x >= 0; x--) { const i = y * hw + x; if (x < hw - 1) dist[i] = Math.min(dist[i], dist[i + 1] + 1); if (y < H - 1) dist[i] = Math.min(dist[i], dist[i + hw] + 1); }
    for (let i = 0; i < hw * H; i++) {
      if (!areaHole[i]) continue;
      const t = Math.min(1, Math.max(0, (dist[i] - 3) / 12));
      for (let c = 0; c < 3; c++) pic.d[i * 3 + c] = (1 - t) * fine.d[i * 3 + c] + t * calm.d[i * 3 + c];
    }
  }
  const rgb = Buffer.from(Uint8ClampedArray.from(pic.d));
  await write(side, sharp(rgb, { raw: { width: hw, height: H, channels: 3 } }), ['avif', 'webp'], { avif: 60, webp: 82 });
}
writeFileSync(join(dir, 'cards.json'), JSON.stringify(cardsOut, null, 2) + '\n');
