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
  /** The leafy shade of the area, as a share of the garden's own leaf colour (< 1 is darker), and its least brightness */
  shade: number;
  minLight: number;
  /** The sharp leaves and flowers laid over the area and a little way past it: how many per area covered
   *  (1 covers it about once), their radius range in px, the least share of a cut-out's source that is
   *  leafy, and px they may hang past the edge */
  leaves: { density: number; radius: [number, number]; minFoliage: number; fringe: number; flowers: number };
  seed?: number;
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
    const k = smooth(edge[i] / o.ramp);
    const grain = (rand() + rand() + rand() - 1.5) * o.grain * 2 * k;
    const lift = Math.max(1, o.minLight / Math.max(1, (0.3 * leafMean[0][i] + 0.59 * leafMean[1][i] + 0.11 * leafMean[2][i]) * o.shade));
    for (let c = 0; c < 3; c++) {
      const target = leafMean[c][i] * o.shade * lift * (1 + 0.16 * slow[i] + 0.08 * mid[i]);
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

  // Sharp leaves and flowers from the picture itself, in small rotated and scaled cut-outs (only the
  // leafy pixels), over the area and hanging a little past its edge
  const eroded = new Float32Array(W * H);
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      eroded[i] = known[i] * o.foliage[i] * o.foliage[i - 1] * o.foliage[i + 1] * o.foliage[i - W] * o.foliage[i + W];
    }
  const alpha = boxBlur(eroded, W, H, 1);
  const half = Math.ceil(o.leaves.radius[1] * 1.25) + 2;
  const integ = (value: (i: number) => number) => {
    const t = new Float64Array((W + 1) * (H + 1));
    for (let y = 0; y < H; y++) {
      let row = 0;
      for (let x = 0; x < W; x++) {
        row += value(y * W + x);
        t[(y + 1) * (W + 1) + x + 1] = t[y * (W + 1) + x + 1] + row;
      }
    }
    return (x0: number, y0: number, x1: number, y1: number) => t[y1 * (W + 1) + x1] - t[y0 * (W + 1) + x1] - t[y1 * (W + 1) + x0] + t[y0 * (W + 1) + x0];
  };
  const fol = integ((i) => alpha[i]);
  const sums = [0, 1, 2].map((c) => integ((i) => alpha[i] * orig[i * 3 + c]));
  const sources: { x: number; y: number; mean: number[] }[] = [];
  for (let y = half; y < H - half; y += 4)
    for (let x = half; x < W - half; x += 4) {
      const a = fol(x - half, y - half, x + half, y + half);
      if (a < o.leaves.minFoliage * (2 * half) ** 2) continue;
      sources.push({ x, y, mean: sums.map((t) => t(x - half, y - half, x + half, y + half) / a) });
    }
  const flowery = sources.filter((c) => c.mean[0] > c.mean[1] * 1.12);
  log(`  ${sources.length} places to take leaves and flowers from (${flowery.length} flower-rich)`);
  const inside: number[] = [], fringe: number[] = [];
  for (let i = 0; i < W * H; i++) {
    if (o.hole[i]) inside.push(i);
    else if (away[i] <= o.leaves.fringe && !o.keep[i]) fringe.push(i);
  }
  const meanR = (o.leaves.radius[0] + o.leaves.radius[1]) / 2;
  const stampsWanted = Math.round((inside.length * o.leaves.density) / (Math.PI * meanR * meanR * 0.45));
  const bilinear = (map: Float32Array, stride: number, c: number, ix: number, iy: number, fx: number, fy: number) =>
    map[(iy * W + ix) * stride + c] * (1 - fx) * (1 - fy) + map[(iy * W + ix + 1) * stride + c] * fx * (1 - fy) + map[((iy + 1) * W + ix) * stride + c] * (1 - fx) * fy + map[((iy + 1) * W + ix + 1) * stride + c] * fx * fy;
  for (let n = 0; n < stampsWanted && sources.length; n++) {
    const wantFringe = fringe.length && rand() < 0.22;
    const pool = wantFringe ? fringe : inside;
    const i = pool[Math.floor(rand() * pool.length)];
    if (wantFringe && rand() < smooth(away[i] / o.leaves.fringe)) continue;
    const cx = i % W, cy = (i / W) | 0;
    const r = o.leaves.radius[0] + rand() * (o.leaves.radius[1] - o.leaves.radius[0]);
    const scale = 0.85 + rand() * 0.4, rot = rand() * Math.PI * 2, flip = rand() < 0.5 ? -1 : 1;
    // About a third of the cut-outs are the flower-rich ones, the rest whatever fits the colours here
    const from = flowery.length && rand() < o.leaves.flowers ? flowery : sources;
    let pick = from[0], bestCost = Infinity;
    for (let t = 0; t < 14; t++) {
      const cand = from[Math.floor(rand() * from.length)];
      const cost = Math.abs(cand.mean[0] - mean[0][i]) + Math.abs(cand.mean[1] - mean[1][i]) + Math.abs(cand.mean[2] - mean[2][i]) + rand() * 25;
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
        if (ix < 0 || iy < 0 || ix >= W - 1 || iy >= H - 1) continue;
        let a = bilinear(alpha, 1, 0, ix, iy, sx - ix, sy - iy) * smooth((1 - dist / r) * 2);
        if (!o.hole[j]) a *= smooth(1 - away[j] / o.leaves.fringe) * 0.95;
        if (a < 0.02) continue;
        for (let c = 0; c < 3; c++) out[j * 3 + c] = out[j * 3 + c] * (1 - a) + (bilinear(orig, 3, c, ix, iy, sx - ix, sy - iy) + (mean[c][j] - pick.mean[c]) * 0.2) * a;
      }
  }
  log(`  ${cells.length} px rebuilt as soft, leafy background`);
}
