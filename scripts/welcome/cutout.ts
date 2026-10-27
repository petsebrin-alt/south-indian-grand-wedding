/**
 * Lift people off a photograph from a traced outline: everything well inside the outline is kept,
 * everything well outside is dropped, and in a narrow band along it each pixel is weighed by
 * colour against the people just inside and the background just outside, giving a soft edge
 * that follows the real contour (hair, folds, fabric) to the pixel.
 */
import type { Picture } from './inpaint';

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

const insidePolygon = (poly: number[][], x: number, y: number) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};

/** Distance from each pixel to the nearest pixel of the other kind (two-pass chamfer). */
const distanceTo = (m: Uint8Array, w: number, h: number, value: number) => {
  const INF = 1e9, d = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) d[i] = m[i] === value ? 0 : INF;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (x > 0) d[i] = Math.min(d[i], d[i - 1] + 1);
      if (y > 0) d[i] = Math.min(d[i], d[i - w] + 1);
      if (x > 0 && y > 0) d[i] = Math.min(d[i], d[i - w - 1] + 1.414);
      if (x < w - 1 && y > 0) d[i] = Math.min(d[i], d[i - w + 1] + 1.414);
    }
  for (let y = h - 1; y >= 0; y--)
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      if (x < w - 1) d[i] = Math.min(d[i], d[i + 1] + 1);
      if (y < h - 1) d[i] = Math.min(d[i], d[i + w] + 1);
      if (x < w - 1 && y < h - 1) d[i] = Math.min(d[i], d[i + w + 1] + 1.414);
      if (x > 0 && y < h - 1) d[i] = Math.min(d[i], d[i + w - 1] + 1.414);
    }
  return d;
};

export interface CutoutOptions {
  /** The people's outline [[x, y], …], traced on the photograph. */
  outline: number[][];
  /** Half-width in px of the band along the outline that is settled by colour. */
  band?: number;
}

export function cutout(img: Picture, { outline, band = 6 }: CutoutOptions) {
  const { w, h, d } = img;
  const n = w * h;
  const people = new Uint8Array(n);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) people[y * w + x] = insidePolygon(outline, x + 0.5, y + 0.5) ? 1 : 0;
  const toOutside = distanceTo(people, w, h, 0), toInside = distanceTo(people, w, h, 1);
  const alpha = new Float32Array(n);
  const R = band + 5;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const signed = people[i] ? toOutside[i] : -toInside[i]; // + inside, − outside
      if (signed >= band) { alpha[i] = 1; continue; }
      if (signed <= -band) continue;
      // Nearest colours among the people just inside and the background just outside the band
      let dF = Infinity, dB = Infinity;
      for (let yy = Math.max(0, y - R); yy <= Math.min(h - 1, y + R); yy++)
        for (let xx = Math.max(0, x - R); xx <= Math.min(w - 1, x + R); xx++) {
          const j = yy * w + xx;
          const sj = people[j] ? toOutside[j] : -toInside[j];
          if (Math.abs(sj) < band) continue;
          const e = (d[i * 3] - d[j * 3]) ** 2 + (d[i * 3 + 1] - d[j * 3 + 1]) ** 2 + (d[i * 3 + 2] - d[j * 3 + 2]) ** 2;
          if (sj > 0) dF = Math.min(dF, e);
          else dB = Math.min(dB, e);
        }
      const f = Math.sqrt(dF), b = Math.sqrt(dB);
      let a = !Number.isFinite(f) ? 0 : !Number.isFinite(b) ? 1 : b / (f + b + 1e-6);
      // Lean on the outline where colour cannot tell (similar colours either side)
      const prior = Math.min(1, Math.max(0, 0.5 + signed / (2 * band)));
      const conf = Number.isFinite(f) && Number.isFinite(b) ? Math.min(1, Math.abs(f - b) / 40) : 0;
      a = conf * a + (1 - conf) * prior;
      alpha[i] = Math.min(1, Math.max(0, (a - 0.5) * 1.6 + 0.5));
    }
  return { alpha: boxBlur(alpha, w, h, 1), outline: people };
}
