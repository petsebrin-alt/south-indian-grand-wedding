/**
 * Rebuilds the garden behind the polaroids. The photograph has no picture of what was behind them, so
 * the area is made from the picture's own garden: it continues the colours around it (a harmonic
 * fill from every side that is garden, not the gold pillars or the people) and deepens into the
 * garden's leafy shade, the picture beside it softens gradually into it, and sharp leaves and
 * flowers cut from the picture are laid over it, hanging a little past its edge in leaf-shaped
 * outlines, so no edge or box shows. Used by derive.ts for the Rahul and Divya pages.
 */
import type { Picture } from '../welcome/inpaint';

export interface BokehOptions {
  /** The area to rebuild */
  hole: Uint8Array;
  /** Pixels that are not garden and never change or lend colour (the people, the pillars) */
  keep: Uint8Array;
  /** px over which the picture around the area softens into it */
  reach: number;
  /** Radius of the softening blur, px */
  blur: number;
  /** Strength of the colour variation inside the area, as a share of the colour variation around it */
  variation: number;
  /** Grain (σ, 0–255 scale) matched to the picture */
  grain: number;
  /** px over which the variation, grain and leaves build up from the area's edge */
  ramp: number;
  /** Pixels that look like leaves and flowers */
  foliage: Uint8Array;
  /** Of those, the green leaves and their shade (the colour of the area behind the leaves) */
  greens: Uint8Array;
  /** The leafy shade of the area, as a share of the garden's own leaf colour (< 1 is darker), its least
   *  brightness, and how far the area is pulled towards that shade (0 keeps the colours around it) */
  shade: number;
  minLight: number;
  shadeMix: number;
  /** The colour of the area from top to bottom (sky, then green, then stone), as [y, [r, g, b]] stops in picture px; used instead of the garden's leaf colour */
  profile?: [number, number[]][];
  /** Palm fronds from the picture, laid in the upper part of the area: where palms are (a mask), how many per area covered, radius range, the least share of a cut-out that is frond, and the rows they may fall in */
  palms?: { mask: Uint8Array; density: number; radius: [number, number]; minFoliage: number; rows: [number, number] };
  /** Big leaves (banana leaves) borrowed from another picture, laid over the area: where they come from
   *  (pixels and a mask of the leafy ones), their radius range and scale in px, how many per area
   *  covered, how far they may tilt (degrees), and the least share of a cut-out that is leaf */
  donor?: { far?: { radius: [number, number]; scale: [number, number]; density: number; blur: number }; pix: Float32Array; w: number; h: number; leaf: Uint8Array; radius: [number, number]; scale: [number, number]; density: number; tilt: number; minFoliage: number; rows: [number, number] };
  /** The sharp leaves and flowers laid over the area and a little way past it: how many per area covered
   *  (1 covers it about once), their radius range in px, the least share of a cut-out's source that is
   *  leafy, and px they may hang past the edge */
  leaves: { density: number; radius: [number, number]; minFoliage: number; fringe: number; fringeShare: number };
  seed?: number;
}

/** Colour at row y between the stops of a profile */
function profileAt(stops: [number, number[]][], y: number) {
  if (y <= stops[0][0]) return stops[0][1];
  for (let k = 1; k < stops.length; k++) {
    if (y <= stops[k][0]) {
      const t = (y - stops[k - 1][0]) / (stops[k][0] - stops[k - 1][0]);
      const e = t * t * (3 - 2 * t);
      return stops[k - 1][1].map((v, c) => v * (1 - e) + stops[k][1][c] * e);
    }
  }
  return stops[stops.length - 1][1];
}

const smooth = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

function boxBlur(src: Float32Array, W: number, H: number, r: number) {
  const tmp = new Float32Array(W * H), out = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    let acc = 0;
    for (let x = -r; x <= r; x++) acc += src[y * W + Math.min(W - 1, Math.max(0, x))];
    for (let x = 0; x < W; x++) {
      tmp[y * W + x] = acc / (2 * r + 1);
      acc += src[y * W + Math.min(W - 1, x + r + 1)] - src[y * W + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < W; x++) {
    let acc = 0;
    for (let y = -r; y <= r; y++) acc += tmp[Math.min(H - 1, Math.max(0, y)) * W + x];
    for (let y = 0; y < H; y++) {
      out[y * W + x] = acc / (2 * r + 1);
      acc += tmp[Math.min(H - 1, y + r + 1) * W + x] - tmp[Math.max(0, y - r) * W + x];
    }
  }
  return out;
}

const blur3 = (src: Float32Array, W: number, H: number, r: number) => boxBlur(boxBlur(boxBlur(src, W, H, r), W, H, r), W, H, r);

/** Distance in px (chamfer) from every pixel to the nearest pixel where `seed` is set */
function distanceTo(seed: Uint8Array, W: number, H: number) {
  const d = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) d[i] = seed[i] ? 0 : 1e9;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (x) d[i] = Math.min(d[i], d[i - 1] + 1);
      if (y) d[i] = Math.min(d[i], d[i - W] + 1);
      if (x && y) d[i] = Math.min(d[i], d[i - W - 1] + 1.4);
      if (x < W - 1 && y) d[i] = Math.min(d[i], d[i - W + 1] + 1.4);
    }
  for (let y = H - 1; y >= 0; y--)
    for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x;
      if (x < W - 1) d[i] = Math.min(d[i], d[i + 1] + 1);
      if (y < H - 1) d[i] = Math.min(d[i], d[i + W] + 1);
      if (x < W - 1 && y < H - 1) d[i] = Math.min(d[i], d[i + W + 1] + 1.4);
      if (x && y < H - 1) d[i] = Math.min(d[i], d[i + W - 1] + 1.4);
    }
  return d;
}

/** Noise with the given smoothness, mean 0 and spread 1 */
function noise(W: number, H: number, r: number, rand: () => number) {
  const n = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) n[i] = rand() * 2 - 1;
  const b = blur3(n, W, H, r);
  let sum = 0, sq = 0;
  for (let i = 0; i < W * H; i++) (sum += b[i]), (sq += b[i] * b[i]);
  const mean = sum / (W * H), sd = Math.sqrt(sq / (W * H) - mean * mean) || 1;
  for (let i = 0; i < W * H; i++) b[i] = (b[i] - mean) / sd;
  return b;
}

export function softBackground(img: Picture, o: BokehOptions, log: (line: string) => void = () => {}) {
  const { w: W, h: H } = img;
  let s = o.seed ?? 11;
  const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const orig = Float32Array.from(img.d);
  const out = img.d;

  // The garden around the area: its known colour (everything but the people and pillars) and its
  // leafy colour (the leaves, their shade and the flowers)
  const known = new Float32Array(W * H), leafy = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    known[i] = o.hole[i] || o.keep[i] ? 0 : 1;
    leafy[i] = known[i] * o.greens[i];
  }
  // Smooth average of the weighted colours; where there is nothing nearby, the picture-wide average
  const normalized = (weight: Float32Array, r: number) => {
    const wBig = blur3(weight, W, H, r);
    let total = 0;
    for (let i = 0; i < W * H; i++) total += weight[i];
    return [0, 1, 2].map((c) => {
      const v = new Float32Array(W * H);
      let sum = 0;
      for (let i = 0; i < W * H; i++) ((v[i] = weight[i] * orig[i * 3 + c]), (sum += v[i]));
      const global = sum / Math.max(total, 1), eps = 0.04;
      const m = blur3(v, W, H, r);
      for (let i = 0; i < W * H; i++) m[i] = (m[i] + global * eps) / (wBig[i] + eps);
      return m;
    });
  };
  const mean = normalized(known, 30);
  const leafMean = normalized(leafy, 40);

  // Harmonic fill: every hole pixel takes the average of its neighbours; the garden around is fixed
  // and the people and pillars are ignored. Started from the smooth average above.
  const cells: number[] = [];
  for (let i = 0; i < W * H; i++) if (o.hole[i]) cells.push(i);
  const fill = [0, 1, 2].map((c) => {
    const f = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) f[i] = o.hole[i] ? mean[c][i] : orig[i * 3 + c];
    return f;
  });
  for (let c = 0; c < 3; c++) {
    const f = fill[c];
    for (let it = 0; it < 500; it++)
      for (const i of cells) {
        const x = i % W, y = (i / W) | 0;
        let sum = 0, n = 0;
        for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) {
          if (j < 0 || o.keep[j]) continue;
          sum += f[j];
          n++;
        }
        if (n) f[i] += 1.85 * (sum / n - f[i]);
      }
  }

  // The area: the join colours at its edge, the garden's leafy shade inside, a little grain
  const edge = distanceTo(Uint8Array.from(o.hole, (v) => 1 - v), W, H);
  const away = distanceTo(o.hole, W, H);
  const slow = noise(W, H, 24, rand), mid = noise(W, H, 9, rand);
  const picture = new Float32Array(W * H * 3);
  for (let i = 0; i < W * H; i++) {
    for (let c = 0; c < 3; c++) picture[i * 3 + c] = o.hole[i] ? fill[c][i] : orig[i * 3 + c];
    if (!o.hole[i]) continue;
    const k = smooth(edge[i] / o.ramp) * o.shadeMix;
    const grain = (rand() + rand() + rand() - 1.5) * o.grain * 2 * k;
    const lift = Math.max(1, o.minLight / Math.max(1, (0.3 * leafMean[0][i] + 0.59 * leafMean[1][i] + 0.11 * leafMean[2][i]) * o.shade));
    for (let c = 0; c < 3; c++) {
      const y = (i / W) | 0;
      const base = o.profile ? profileAt(o.profile, y)[c] : leafMean[c][i] * o.shade * lift;
      const target = base * (1 + 0.1 * slow[i] + 0.05 * mid[i]);
      picture[i * 3 + c] = fill[c][i] * (1 - k) + target * k + grain;
    }
    // no dark halo where a polaroid's shadow lay beside the area
    const lum = 0.3 * picture[i * 3] + 0.59 * picture[i * 3 + 1] + 0.11 * picture[i * 3 + 2];
    if (lum < o.minLight * 0.8) for (let c = 0; c < 3; c++) picture[i * 3 + c] = Math.min(255, picture[i * 3 + c] * ((o.minLight * 0.8) / Math.max(lum, 8)));
  }

  // The picture beside the area softens into it: a masked blur (never taking colour from the people
  // or the pillars), mixed in more and more towards the area, with an irregular reach
  const ok = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) ok[i] = o.keep[i] ? 0 : 1;
  const okBlur = blur3(ok, W, H, o.blur);
  const soft = [0, 1, 2].map((c) => {
    const v = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) v[i] = ok[i] * picture[i * 3 + c];
    const b = blur3(v, W, H, o.blur);
    for (let i = 0; i < W * H; i++) b[i] = okBlur[i] > 1e-3 ? b[i] / okBlur[i] : picture[i * 3 + c];
    return b;
  });
  const reachNoise = noise(W, H, 16, rand);
  for (let i = 0; i < W * H; i++) {
    const reach = o.reach * (0.75 + 0.3 * Math.tanh(reachNoise[i]));
    const w = o.hole[i] || o.keep[i] ? 0 : smooth(1 - away[i] / reach);
    for (let c = 0; c < 3; c++) out[i * 3 + c] = Math.min(255, Math.max(0, picture[i * 3 + c] * (1 - w) + soft[c][i] * w));
  }

  // Leaves from the picture itself and from the donor picture, in rotated and scaled cut-outs (only the
  // leafy pixels), over the area and hanging a little past its edge
  type Pool = { pix: Float32Array; w: number; h: number; alpha: Float32Array; sources: { x: number; y: number; mean: number[] }[] };
  const makePool = (pix: Float32Array, w: number, h: number, mask: Uint8Array, valid: Float32Array | null, halfSize: number, minFoliage: number, alphaBlur = 1): Pool => {
    const eroded = new Float32Array(w * h);
    for (let y = 1; y < h - 1; y++)
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        eroded[i] = (valid ? valid[i] : 1) * mask[i] * mask[i - 1] * mask[i + 1] * mask[i - w] * mask[i + w];
      }
    const alpha = alphaBlur > 1 ? blur3(eroded, w, h, alphaBlur) : boxBlur(eroded, w, h, 1);
    const integ = (value: (i: number) => number) => {
      const t = new Float64Array((w + 1) * (h + 1));
      for (let y = 0; y < h; y++) {
        let row = 0;
        for (let x = 0; x < w; x++) {
          row += value(y * w + x);
          t[(y + 1) * (w + 1) + x + 1] = t[y * (w + 1) + x + 1] + row;
        }
      }
      return (x0: number, y0: number, x1: number, y1: number) => t[y1 * (w + 1) + x1] - t[y0 * (w + 1) + x1] - t[y1 * (w + 1) + x0] + t[y0 * (w + 1) + x0];
    };
    const fol = integ((i) => alpha[i]);
    const sums = [0, 1, 2].map((c) => integ((i) => alpha[i] * pix[i * 3 + c]));
    const sources: Pool['sources'] = [];
    for (let y = halfSize; y < h - halfSize; y += 4)
      for (let x = halfSize; x < w - halfSize; x += 4) {
        const a = fol(x - halfSize, y - halfSize, x + halfSize, y + halfSize);
        if (a < minFoliage * (2 * halfSize) ** 2) continue;
        sources.push({ x, y, mean: sums.map((t) => t(x - halfSize, y - halfSize, x + halfSize, y + halfSize) / a) });
      }
    return { pix, w, h, alpha, sources };
  };
  const bilinear = (map: Float32Array, w: number, stride: number, c: number, ix: number, iy: number, fx: number, fy: number) =>
    map[(iy * w + ix) * stride + c] * (1 - fx) * (1 - fy) + map[(iy * w + ix + 1) * stride + c] * fx * (1 - fy) + map[((iy + 1) * w + ix) * stride + c] * (1 - fx) * fy + map[((iy + 1) * w + ix + 1) * stride + c] * fx * fy;

  const inside: number[] = [], fringe: number[] = [];
  for (let i = 0; i < W * H; i++) {
    if (o.hole[i]) inside.push(i);
    else if (away[i] <= o.leaves.fringe && !o.keep[i]) fringe.push(i);
  }
  const stampPool = (pool: Pool, count: number, radius: [number, number], scaleRange: [number, number], tilt: number | null, rows: [number, number] = [0, H], soft = false) => {
    if (!pool.sources.length) return;
    for (let n = 0; n < count; n++) {
      const wantFringe = fringe.length && rand() < o.leaves.fringeShare;
      const where = wantFringe ? fringe : inside;
      const i = where[Math.floor(rand() * where.length)];
      const row = (i / W) | 0;
      if (row < rows[0] || row > rows[1]) continue;
      if (wantFringe && rand() < smooth(away[i] / (o.leaves.fringe * 1.1))) continue;
      const cx = i % W, cy = (i / W) | 0;
      const r = radius[0] + rand() * (radius[1] - radius[0]);
      const scale = scaleRange[0] + rand() * (scaleRange[1] - scaleRange[0]);
      const rot = tilt === null ? rand() * Math.PI * 2 : ((rand() * 2 - 1) * tilt * Math.PI) / 180;
      const flip = rand() < 0.5 ? -1 : 1;
      let pick = pool.sources[0], bestCost = Infinity;
      for (let t = 0; t < 14; t++) {
        const cand = pool.sources[Math.floor(rand() * pool.sources.length)];
        const cost = Math.abs(cand.mean[0] - mean[0][i]) * 0.3 + Math.abs(cand.mean[1] - mean[1][i]) * 0.3 + Math.abs(cand.mean[2] - mean[2][i]) * 0.3 + rand() * 25;
        if (cost < bestCost) ((bestCost = cost), (pick = cand));
      }
      const cr = Math.cos(rot), sr = Math.sin(rot);
      for (let y = Math.max(0, cy - Math.ceil(r)); y <= Math.min(H - 1, cy + Math.ceil(r)); y++)
        for (let x = Math.max(0, cx - Math.ceil(r)); x <= Math.min(W - 1, cx + Math.ceil(r)); x++) {
          const j = y * W + x;
          if (!o.hole[j] && (o.keep[j] || away[j] > o.leaves.fringe)) continue;
          const u = x - cx, v = y - cy, dist = Math.hypot(u, v);
          if (dist > r) continue;
          const sx = pick.x + ((cr * u - sr * v) / scale) * flip, sy = pick.y + (sr * u + cr * v) / scale;
          const ix = Math.floor(sx), iy = Math.floor(sy);
          if (ix < 0 || iy < 0 || ix >= pool.w - 1 || iy >= pool.h - 1) continue;
          let a = bilinear(pool.alpha, pool.w, 1, 0, ix, iy, sx - ix, sy - iy);
          if (!soft) a = Math.min(1, Math.max(0, (a - 0.2) / 0.4)); // only the solid leaf, not the pale rim where it met the sky
          a *= smooth((1 - dist / r) * 2);
          if (!o.hole[j]) a *= smooth(1 - away[j] / (o.leaves.fringe * (0.25 + 0.85 * (0.5 + 0.5 * Math.tanh(reachNoise[j]))))) * 0.95;
          if (a < 0.02) continue;
          for (let c = 0; c < 3; c++) out[j * 3 + c] = out[j * 3 + c] * (1 - a) + bilinear(pool.pix, pool.w, 3, c, ix, iy, sx - ix, sy - iy) * a;
        }
    }
  };
  const meanR = (o.leaves.radius[0] + o.leaves.radius[1]) / 2;
  // The big banana leaves go in first, behind
  if (o.donor) {
    const d = o.donor;
    const soft = Float32Array.from(d.pix);
    for (let c = 0; c < 3; c++) {
      const ch = new Float32Array(d.w * d.h);
      for (let i = 0; i < d.w * d.h; i++) ch[i] = d.pix[i * 3 + c];
      const b = boxBlur(ch, d.w, d.h, 1);
      for (let i = 0; i < d.w * d.h; i++) soft[i * 3 + c] = b[i];
    }
    // Behind them, big out-of-focus leaves (the same banana leaves, enlarged and blurred)
    if (d.far) {
      const blurred = Float32Array.from(d.pix);
      for (let c = 0; c < 3; c++) {
        const ch = new Float32Array(d.w * d.h);
        for (let i = 0; i < d.w * d.h; i++) ch[i] = d.pix[i * 3 + c];
        const b = blur3(ch, d.w, d.h, d.far.blur);
        for (let i = 0; i < d.w * d.h; i++) blurred[i * 3 + c] = b[i];
      }
      const far = makePool(blurred, d.w, d.h, d.leaf, null, Math.ceil(d.far.radius[0] / d.far.scale[1]), d.minFoliage, d.far.blur);
      const fr = (d.far.radius[0] + d.far.radius[1]) / 2;
      stampPool(far, Math.round((inside.length * d.far.density) / (Math.PI * fr * fr * 0.5)), d.far.radius, d.far.scale, d.tilt, d.rows, true);
    }
    const pool = makePool(soft, d.w, d.h, d.leaf, null, Math.ceil(d.radius[0] / d.scale[1]), d.minFoliage);
    const dr = (d.radius[0] + d.radius[1]) / 2;
    log(`  ${pool.sources.length} places to take big leaves from`);
    stampPool(pool, Math.round((inside.length * d.density) / (Math.PI * dr * dr * 0.5)), d.radius, d.scale, d.tilt, d.rows);
  }
  if (o.palms) {
    const p = o.palms;
    const pool = makePool(orig, W, H, p.mask, null, Math.ceil(p.radius[0] * 0.7), p.minFoliage);
    log(`  ${pool.sources.length} places to take palm fronds from`);
    const pr = (p.radius[0] + p.radius[1]) / 2;
    stampPool(pool, Math.round((inside.length * p.density) / (Math.PI * pr * pr * 0.45)), p.radius, [0.9, 1.2], 30, p.rows);
  }
  if (o.leaves.density > 0) {
    const own = makePool(orig, W, H, o.foliage, known, Math.ceil(o.leaves.radius[1] * 1.25) + 2, o.leaves.minFoliage);
    log(`  ${own.sources.length} places to take leaves from`);
    stampPool(own, Math.round((inside.length * o.leaves.density) / (Math.PI * meanR * meanR * 0.45)), o.leaves.radius, [0.85, 1.25], null);
  }
  log(`  ${cells.length} px rebuilt as soft, leafy background`);
}
