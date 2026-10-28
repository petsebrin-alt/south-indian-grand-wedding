/**
 * npm run events:assets → the Wedding Events pages (src/assets/events/) and the Family page's
 * background (src/assets/family/), from the client's two-page picture source/events.webp (page 1 on
 * the left half, page 2 on the right) and the measurements in scene.json:
 *   page-1, page-2  each half of the picture exactly as it is (the signboard, garlands, pillars,
 *                   lamps, flowers, medallions and their gold rods), except that the printed wording
 *                   inside each cream disc is painted out so the current details can be set there
 *                   in live text (AVIF + WebP)
 *   discs.json      each disc's centre, radius and ring in the page's own pixels
 *   ../family/background  page 1's background with the signboard, medallions and rods taken out
 *                   (the medallions are lifted out by their sharpness, since the picture's
 *                   background is in soft focus, and the background is rebuilt from its own texture)
 * Re-run after replacing the picture or adjusting scene.json.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp, { type Sharp } from 'sharp';
import { inpaint } from '../welcome/inpaint';

const dir = join(process.cwd(), 'src/assets/events');
const familyDir = join(process.cwd(), 'src/assets/family');
mkdirSync(familyDir, { recursive: true });
const scene = JSON.parse(readFileSync(join(dir, 'scene.json'), 'utf8'));

const write = async (path: string, img: Sharp, formats: ('avif' | 'webp')[], q = { avif: 58, webp: 82 }) => {
  const png = await img.png().toBuffer();
  for (const f of formats) {
    const s = sharp(png);
    const buf = await (f === 'avif' ? s.avif({ quality: q.avif, effort: 6 }) : s.webp({ quality: q.webp, effort: 6, smartSubsample: true, alphaQuality: 92 })).toBuffer();
    writeFileSync(`${path}.${f}`, buf);
    console.log(`✓ ${path.split('/src/assets/')[1]}.${f}  ${(buf.length / 1024).toFixed(0)} KB`);
  }
};
const insidePoly = (poly: number[][], x: number, y: number) => {
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
const grow = (m: Uint8Array, w: number, h: number, r: number) => {
  const a = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) a[i] = m[i];
  const b = boxBlur(a, w, h, r);
  const o = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) o[i] = b[i] > 0.001 ? 1 : 0;
  return o;
};
const shrink = (m: Uint8Array, w: number, h: number, r: number) => {
  const a = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) a[i] = m[i];
  const b = boxBlur(a, w, h, r);
  const o = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) o[i] = b[i] > 0.999 ? 1 : 0;
  return o;
};

const { data: d, info } = await sharp(join(dir, 'source/events.webp')).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, n = W * H;

// Sharpness: local contrast, averaged a little. The picture's background is in soft focus, so the
// medallions, flowers, still-lifes, rods and strands all stand out from it.
const L = new Float32Array(n);
for (let i = 0; i < n; i++) L[i] = 0.299 * d[i * 3] + 0.587 * d[i * 3 + 1] + 0.114 * d[i * 3 + 2];
const grad = new Float32Array(n);
for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x; grad[i] = Math.hypot(L[i + 1] - L[i - 1], L[i + W] - L[i - W]); }
const energy = boxBlur(grad, W, H, scene.sharp.radius);
const sharpAt = (i: number) => energy[i] > scene.sharp.threshold;

// 1. The medallions' areas (for the Family page's background)
const unitMasks: Uint8Array[] = [];
for (const u of scene.medallions) {
  const [cx, cy, r] = u.circle;
  const m = new Uint8Array(n);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) m[i] = 1;
      else if (insidePoly(u.outline, x + 0.5, y + 0.5) && sharpAt(i)) m[i] = 1;
    }
  // Close small gaps, keep the piece joined to the ring, fill holes
  let mask = shrink(grow(m, W, H, 5), W, H, 5);
  const keep = new Uint8Array(n);
  const stack = [cy * W + cx];
  keep[stack[0]] = 1;
  while (stack.length) {
    const i = stack.pop()!, x = i % W;
    for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) if (j >= 0 && j < n && mask[j] && !keep[j]) (keep[j] = 1), stack.push(j);
  }
  mask = keep;
  const outside = new Uint8Array(n);
  {
    const st: number[] = [];
    const seed = (i: number) => { if (!mask[i] && !outside[i]) (outside[i] = 1), st.push(i); };
    for (let x = 0; x < W; x++) seed(x), seed((H - 1) * W + x);
    for (let y = 0; y < H; y++) seed(y * W), seed(y * W + W - 1);
    while (st.length) { const i = st.pop()!, x = i % W; for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) if (j >= 0 && j < n) seed(j); }
  }
  for (let i = 0; i < n; i++) mask[i] = outside[i] ? 0 : 1;
  unitMasks.push(mask);
}

// 2. The areas to rebuild for the Family page's background: the medallions, and the thin gold connectors
//    and hanging strands between them (thin sharp lines in the band below the signboard)
const backgrounds: { name: string; span: number[]; band: number[][]; also: number[][][] }[] = scene.pages;
const holes: Record<string, Uint8Array> = {};
for (const page of backgrounds) {
  const [hx0, hx1] = page.span;
  const hw = hx1 - hx0;
  const hole = new Uint8Array(hw * H);
  // Thin sharp things in the band (rods, arcs, hanging strands): sharp, but gone after an opening
  const sharpBand = new Uint8Array(hw * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < hw; x++) {
      const sx = hx0 + x;
      if (insidePoly(page.band, sx + 0.5, y + 0.5) && grad[y * W + sx] > scene.sharp.edge) sharpBand[y * hw + x] = 1;
    }
  const thick = grow(shrink(sharpBand, hw, H, scene.thin), hw, H, scene.thin);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < hw; x++) {
      const sx = hx0 + x, i = y * W + sx, k = y * hw + x;
      if (unitMasks.some((m) => m[i])) hole[k] = 1;
      else if (sharpBand[k] && !thick[k]) hole[k] = 1;
      else if (page.also.some((p) => insidePoly(p, sx + 0.5, y + 0.5))) hole[k] = 1;
    }
  holes[page.name] = grow(hole, hw, H, scene.grow);
}
const rebuild = (span: number[], hole: Uint8Array) => {
  const [hx0, hx1] = span;
  const hw = hx1 - hx0;
  const pic = new Float32Array(hw * H * 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < hw; x++) for (let c = 0; c < 3; c++) pic[(y * hw + x) * 3 + c] = d[(y * W + hx0 + x) * 3 + c];
  const avoid = new Uint8Array(hw * H);
  const fine = inpaint({ w: hw, h: H, d: Float32Array.from(pic) }, hole, avoid, () => {});
  const calm = inpaint({ w: hw, h: H, d: Float32Array.from(pic) }, hole, avoid, () => {}, { finest: 1, grain: 2.2 });
  // Copied soft texture, easing towards a smooth blend only deep inside the largest areas
  const dist = new Float32Array(hw * H);
  for (let i = 0; i < hw * H; i++) dist[i] = hole[i] ? 1e9 : 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < hw; x++) { const i = y * hw + x; if (x) dist[i] = Math.min(dist[i], dist[i - 1] + 1); if (y) dist[i] = Math.min(dist[i], dist[i - hw] + 1); }
  for (let y = H - 1; y >= 0; y--) for (let x = hw - 1; x >= 0; x--) { const i = y * hw + x; if (x < hw - 1) dist[i] = Math.min(dist[i], dist[i + 1] + 1); if (y < H - 1) dist[i] = Math.min(dist[i], dist[i + hw] + 1); }
  for (let i = 0; i < hw * H; i++) {
    if (!hole[i]) continue;
    const t = Math.min(1, Math.max(0, (dist[i] - 30) / 60)) * scene.calm;
    for (let c = 0; c < 3; c++) pic[i * 3 + c] = (1 - t) * fine.d[i * 3 + c] + t * calm.d[i * 3 + c];
  }
  return { pic, hw };
};
// 3. The Family page's background: page 1's, with the signboard taken out as well
{
  const page = backgrounds[0];
  const hw = page.span[1] - page.span[0];
  const hole = Uint8Array.from(holes[page.name]);
  for (let y = 0; y < H; y++) for (let x = 0; x < hw; x++) if (insidePoly(scene.signboard, page.span[0] + x + 0.5, y + 0.5)) hole[y * hw + x] = 1;
  const { pic } = rebuild(page.span, grow(hole, hw, H, 2));
  await write(join(familyDir, 'background'), sharp(Buffer.from(Uint8ClampedArray.from(pic)), { raw: { width: hw, height: H, channels: 3 } }), ['avif', 'webp'], { avif: 58, webp: 80 });
}

// 4. The Wedding Events pages: the picture as it is, with only the printed wording inside each cream
//    disc painted out
const discsOut: Record<string, { page: number; cx: number; cy: number; r: number; ring: number }> = {};
for (const [pageNo, page] of backgrounds.entries()) {
  const [hx0, hx1] = page.span;
  const hw = hx1 - hx0;
  const pic = new Float32Array(hw * H * 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < hw; x++) for (let c = 0; c < 3; c++) pic[(y * hw + x) * 3 + c] = d[(y * W + hx0 + x) * 3 + c];
  for (const u of scene.discs.filter((k: { page: string }) => k.page === page.name)) {
    const cx = u.cx - hx0, cy = u.cy, r = u.r, M = 18;
    const x0 = Math.floor(cx - r - M), y0 = Math.floor(cy - r - M), bw = Math.ceil(2 * (r + M) + 1), bh = bw;
    const inDisc = new Uint8Array(bw * bh), lum = new Float32Array(bw * bh), reddish = new Uint8Array(bw * bh);
    for (let y = 0; y < bh; y++)
      for (let x = 0; x < bw; x++) {
        const i = y * bw + x, s0 = ((y0 + y) * hw + x0 + x) * 3;
        inDisc[i] = Math.hypot(x0 + x + 0.5 - cx, y0 + y + 0.5 - cy) <= r || (u.extra ?? []).some((b: number[]) => hx0 + x0 + x >= b[0] && hx0 + x0 + x < b[2] && y0 + y >= b[1] && y0 + y < b[3]) ? 1 : 0;
        lum[i] = 0.299 * pic[s0] + 0.587 * pic[s0 + 1] + 0.114 * pic[s0 + 2];
        reddish[i] = pic[s0 + 1] < 0.36 * pic[s0] && pic[s0 + 2] >= 0.8 * pic[s0 + 1] ? 1 : 0; // the wording's dark red (blue above green), not the ring's gold (green above blue)
      }
    // The printed wording is darker than the smooth cream around it: estimate the cream, flag what is
    // darker, estimate again without it
    let ink = new Uint8Array(bw * bh);
    for (let pass = 0; pass < 3; pass++) {
      const wgt = new Float32Array(bw * bh), val = new Float32Array(bw * bh);
      for (let i = 0; i < bw * bh; i++) if (inDisc[i] && !ink[i]) (wgt[i] = 1), (val[i] = lum[i]);
      const w2 = boxBlur(wgt, bw, bh, scene.paper.radius), v2 = boxBlur(val, bw, bh, scene.paper.radius);
      ink = new Uint8Array(bw * bh);
      for (let i = 0; i < bw * bh; i++) if (inDisc[i] && w2[i] > 0.02 && lum[i] < v2[i] / w2[i] - scene.paper.darker) ink[i] = 1;
    }
    // A flourish can run a little past the disc's measured edge: follow it there (dark red only)
    const edgeOf = new Uint8Array(bw * bh);
    for (let step = 0; step < 14; step++) {
      const add: number[] = [];
      for (let i = 0; i < bw * bh; i++) {
        if (ink[i]) continue;
        const x = i % bw, y = (i / bw) | 0;
        if (x < 1 || y < 1 || x >= bw - 1 || y >= bh - 1 || !reddish[i] || lum[i] > 185) continue;
        if (ink[i - 1] || ink[i + 1] || ink[i - bw] || ink[i + bw]) add.push(i);
      }
      for (const i of add) (ink[i] = 1), (edgeOf[i] = 1);
      if (!add.length) break;
    }
    const cells = grow(ink, bw, bh, scene.paper.grow);
    // Fillable: the disc, and the flourish where it runs past it; nothing else (the gold ring, the flowers)
    const fillable = new Uint8Array(bw * bh);
    const pastEdge = grow(edgeOf, bw, bh, 2);
    for (let i = 0; i < bw * bh; i++) fillable[i] = inDisc[i] || edgeOf[i] || (pastEdge[i] && reddish[i]) || (pastEdge[i] && lum[i] < 215 && pic[(((y0 + ((i / bw) | 0)) * hw) + x0 + (i % bw)) * 3 + 2] >= 0.7 * pic[(((y0 + ((i / bw) | 0)) * hw) + x0 + (i % bw)) * 3 + 1]) ? 1 : 0;
    for (let i = 0; i < bw * bh; i++) if (!fillable[i]) cells[i] = 0;
    for (let i = 0; i < bw * bh; i++) if (pastEdge[i] && fillable[i]) cells[i] = 1;
    const list: number[] = [];
    for (let i = 0; i < bw * bh; i++) if (cells[i]) list.push(i);
    // Smooth fill: each painted-out pixel takes the average of its neighbours; the cream beside it is
    // fixed, and nothing outside the disc and the flourish (the gold ring) is used
    for (let c = 0; c < 3; c++) {
      const f = new Float32Array(bw * bh);
      let sum = 0, cnt = 0;
      for (let i = 0; i < bw * bh; i++) {
        f[i] = pic[(((y0 + ((i / bw) | 0)) * hw) + x0 + (i % bw)) * 3 + c];
        if (inDisc[i] && !cells[i]) (sum += f[i]), cnt++;
      }
      for (const i of list) f[i] = sum / Math.max(cnt, 1);
      for (let it = 0; it < 1500; it++)
        for (const i of list) {
          const x = i % bw, y = (i / bw) | 0;
          let t = 0, k = 0;
          for (const j of [x > 0 ? i - 1 : -1, x < bw - 1 ? i + 1 : -1, y > 0 ? i - bw : -1, y < bh - 1 ? i + bw : -1]) if (j >= 0 && (inDisc[j] || cells[j])) (t += f[j]), k++;
          if (k) f[i] += 1.9 * (t / k - f[i]);
        }
      for (const i of list) pic[(((y0 + ((i / bw) | 0)) * hw) + x0 + (i % bw)) * 3 + c] = f[i];
    }
    discsOut[u.id] = { page: pageNo + 1, cx: +cx.toFixed(1), cy: +cy.toFixed(1), r: u.r, ring: u.ring };
  }
  await write(join(dir, page.name), sharp(Buffer.from(Uint8ClampedArray.from(pic)), { raw: { width: hw, height: H, channels: 3 } }), ['avif', 'webp'], { avif: 62, webp: 84 });
}
writeFileSync(join(dir, 'discs.json'), JSON.stringify(discsOut, null, 2) + '\n');
