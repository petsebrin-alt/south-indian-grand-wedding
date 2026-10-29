/**
 * Rebuilds the background behind the polaroids. The photograph has no picture of what was behind them,
 * so the area continues the colours around it (a harmonic fill from every side that is background, not
 * the gold pillars or the people), takes the structure of the client's temple picture (its carved
 * stone and pillars, as detail on top of that smooth colour, so the seam between the area and the
 * picture beside it never shows), and the picture beside it softens gradually into it, with an
 * irregular reach so no edge or box shows. Used by derive.ts for the Rahul and Divya pages.
 */
import type { Picture } from '../welcome/inpaint';

export interface BackdropOptions {
  /** The area to rebuild */
  hole: Uint8Array;
  /** Pixels that are not background and never change or lend colour (the people, the pillars) */
  keep: Uint8Array;
  /** The column range of each half of the picture: the temple's left side is used for a half's left
   *  columns and its right side for the right columns */
  halves: number[][];
  /** px over which the picture around the area softens into it, and the radius of the softening blur */
  reach: number;
  blur: number;
  /** Grain (σ, 0–255 scale) matched to the picture */
  grain: number;
  /** px over which the temple's structure builds up from the area's edge */
  ramp: number;
  /** How far (px) the area's straight edge may be pushed out, by a smooth random amount, so it is never a line */
  wobble: number;
  /** The most the temple's structure may lighten or darken a pixel (0–255 scale), so a dark edge of the temple picture cannot leave a dark smear */
  limit: number;
  /** The temple picture (RGB, 0–255) and how it is used: `amp` is the strength of its structure (1 = as it
   *  is), `scale` the radius (px) below which a feature counts as structure (larger features are
   *  left to the smooth colour), `tone` how far the area's colour is drawn towards the temple's own
   *  (0 keeps the colours around the area), `soften` a little blur (px) so it sits softly behind */
  texture: { pix: Float32Array; w: number; h: number; amp: number; scale: number; tone: number; soften: number };
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

export function rebuildBackdrop(img: Picture, o: BackdropOptions, log: (line: string) => void = () => {}) {
  const { w: W, h: H } = img;
  let s = o.seed ?? 11;
  const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const orig = Float32Array.from(img.d);
  const out = img.d;

  // The area's edge is pushed out by a smooth random amount (never into the people or pillars), so it
  // is a wandering line, not a straight one
  const hole = Uint8Array.from(o.hole);
  {
    const reachOut = distanceTo(o.hole, W, H);
    const n0 = noise(W, H, 22, rand);
    for (let i = 0; i < W * H; i++) if (!hole[i] && !o.keep[i] && reachOut[i] < o.wobble * (0.1 + 0.9 * (0.5 + 0.5 * Math.tanh(n0[i] * 1.3)))) hole[i] = 1;
  }

  // The background around the area: its known colour (everything but the people and pillars)
  const known = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) known[i] = hole[i] || o.keep[i] ? 0 : 1;
  const wBig = blur3(known, W, H, 30);
  // (where nothing known is near, the average of all of it, so a pocket never starts black)
  let totalKnown = 0;
  for (let i = 0; i < W * H; i++) totalKnown += known[i];
  const mean = [0, 1, 2].map((c) => {
    const v = new Float32Array(W * H);
    let sum = 0;
    for (let i = 0; i < W * H; i++) ((v[i] = known[i] * orig[i * 3 + c]), (sum += v[i]));
    const global = sum / Math.max(totalKnown, 1), eps = 0.06;
    const m = blur3(v, W, H, 30);
    for (let i = 0; i < W * H; i++) m[i] = (m[i] + global * eps) / (wBig[i] + eps);
    return m;
  });

  // Harmonic fill: every hole pixel takes the average of its neighbours; the background around is fixed
  // and the people and pillars are ignored. Started from the smooth average above.
  const cells: number[] = [];
  for (let i = 0; i < W * H; i++) if (hole[i]) cells.push(i);
  const fill = [0, 1, 2].map((c) => {
    const f = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) f[i] = hole[i] ? mean[c][i] : orig[i * 3 + c];
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

  // The temple, laid over the picture "cover" fashion (each half takes the temple's left side on its left
  // columns and its right side on its right columns), softened a little, split into its smooth colour and
  // its structure (what is finer than `scale`)
  const T = o.texture;
  const scale = H / T.h;
  const tw2 = T.w * scale;
  const sample = (x: number, y: number, c: number) => {
    const half = o.halves.find(([a, b]) => x >= a && x < b) ?? o.halves[0];
    const xh = x - half[0], hw = half[1] - half[0];
    const inset = T.w * 0.08; // the temple picture's own dark edges are left out
    const tx = inset + ((xh + (xh >= hw / 2 ? Math.max(0, tw2 - hw) : 0)) / scale) * (1 - 0.16), ty = y / scale;
    const ix = Math.min(T.w - 2, Math.max(0, Math.floor(tx))), iy = Math.min(T.h - 2, Math.max(0, Math.floor(ty)));
    const fx = Math.min(1, Math.max(0, tx - ix)), fy = Math.min(1, Math.max(0, ty - iy));
    const p = (xx: number, yy: number) => T.pix[(yy * T.w + xx) * 3 + c];
    return p(ix, iy) * (1 - fx) * (1 - fy) + p(ix + 1, iy) * fx * (1 - fy) + p(ix, iy + 1) * (1 - fx) * fy + p(ix + 1, iy + 1) * fx * fy;
  };
  const raw = [0, 1, 2].map((c) => {
    const t = new Float32Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) t[y * W + x] = sample(x, y, c);
    return T.soften > 0 ? blur3(t, W, H, Math.max(1, Math.round(T.soften))) : t;
  });
  // The temple's stone and shadow, not its leaves: its colours are drawn most of the way to grey, so the
  // banana leaf and greenery in the picture give no green
  const tex = [0, 1, 2].map((c) => {
    const t = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) {
      const lum = 0.3 * raw[0][i] + 0.59 * raw[1][i] + 0.11 * raw[2][i];
      t[i] = raw[c][i] * 0.25 + lum * 0.75;
    }
    return t;
  });
  const low = tex.map((t) => blur3(t, W, H, Math.max(2, Math.round(T.scale / 3))));

  // Distances to the area's edge, inside and outside, and an irregular reach for the outside
  const edge = distanceTo(Uint8Array.from(hole, (v) => 1 - v), W, H);
  const away = distanceTo(hole, W, H);
  const reachNoise = noise(W, H, 16, rand);

  // The area: the smooth fill, drawn towards the temple's tone and given its structure, a little grain
  const picture = new Float32Array(W * H * 3);
  for (let i = 0; i < W * H; i++) {
    for (let c = 0; c < 3; c++) picture[i * 3 + c] = hole[i] ? fill[c][i] : orig[i * 3 + c];
    if (!hole[i]) continue;
    const k = smooth(edge[i] / o.ramp);
    const grain = (rand() + rand() + rand() - 1.5) * o.grain * 2 * k;
    for (let c = 0; c < 3; c++) {
      const structure = Math.max(-o.limit, Math.min(o.limit, (tex[c][i] - low[c][i]) * T.amp));
      const base = fill[c][i] * (1 - T.tone * k) + low[c][i] * T.tone * k;
      picture[i * 3 + c] = base + structure * k + grain;
    }
  }

  // The picture beside the area softens into it: a masked blur (never taking colour from the people or the
  // pillars), mixed in more and more towards the area, with an irregular reach; the temple's structure
  // spills a little past the edge too
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
  for (let i = 0; i < W * H; i++) {
    const reach = o.reach * (0.75 + 0.3 * Math.tanh(reachNoise[i]));
    const inArea = hole[i] === 1;
    const w = inArea || o.keep[i] ? 0 : smooth(1 - away[i] / reach);
    for (let c = 0; c < 3; c++) {
      let v = picture[i * 3 + c] * (1 - w) + soft[c][i] * w;
      if (!inArea && !o.keep[i]) v += Math.max(-o.limit, Math.min(o.limit, (tex[c][i] - low[c][i]) * T.amp)) * smooth(1 - away[i] / (o.reach * 0.7 * (0.5 + 0.5 * Math.tanh(reachNoise[i]) + 0.5))) * 0.8;
      out[i * 3 + c] = Math.min(255, Math.max(0, v));
    }
  }
  log(`  ${cells.length} px rebuilt as the temple behind the cards`);
}
