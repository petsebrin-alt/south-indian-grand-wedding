/**
 * Fill a hole in a photograph from the photograph itself (Wexler-style completion with PatchMatch):
 * at each scale, from coarse to fine, every small patch touching the hole finds the most similar
 * patch elsewhere in the picture, and each hole pixel becomes the weighted vote of the patches that
 * cover it. Coarse scales settle the large shapes (the floor line, the soft greenery), fine scales
 * the texture. Matches are drawn from about the same height in the picture (a scene's floor,
 * greenery and sky lie in bands), so the floor is rebuilt from floor and the greenery from greenery.
 * Used to take the seated figure out of the Welcome courtyard photograph.
 */

export interface Picture {
  w: number;
  h: number;
  /** RGB, 0–255 */
  d: Float32Array;
}

const P = 7; // patch size
const R = P >> 1;

function down(img: Picture): Picture {
  const w = img.w >> 1, h = img.h >> 1, d = new Float32Array(w * h * 3);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      for (let c = 0; c < 3; c++) {
        const s = (yy: number, xx: number) => img.d[(yy * img.w + xx) * 3 + c];
        d[(y * w + x) * 3 + c] = (s(2 * y, 2 * x) + s(2 * y, 2 * x + 1) + s(2 * y + 1, 2 * x) + s(2 * y + 1, 2 * x + 1)) / 4;
      }
  return { w, h, d };
}

function downMask(m: Uint8Array, w: number, h: number) {
  const W = w >> 1, H = h >> 1, o = new Uint8Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) o[y * W + x] = m[2 * y * w + 2 * x] | m[2 * y * w + 2 * x + 1] | m[(2 * y + 1) * w + 2 * x] | m[(2 * y + 1) * w + 2 * x + 1];
  return o;
}

function dilate(m: Uint8Array, w: number, h: number, r: number) {
  const o = new Uint8Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!m[y * w + x]) continue;
      for (let yy = Math.max(0, y - r); yy <= Math.min(h - 1, y + r); yy++)
        for (let xx = Math.max(0, x - r); xx <= Math.min(w - 1, x + r); xx++) o[yy * w + xx] = 1;
    }
  return o;
}

/**
 * First guess for the coarsest scale: each row of the hole runs from the picture on its left to
 * the picture on its right (scenes are banded horizontally), then is softened by averaging.
 */
function diffuse(img: Picture, m: Uint8Array) {
  const { w, h, d } = img;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!m[y * w + x] || (x > 0 && m[y * w + x - 1])) continue;
      let e = x;
      while (e < w && m[y * w + e]) e++;
      const l = x > 0 ? x - 1 : e < w ? e : -1, r = e < w ? e : l;
      if (l < 0) continue;
      for (let k = x; k < e; k++)
        for (let c = 0; c < 3; c++) {
          const t = e === x ? 0 : (k - x + 1) / (e - x + 1);
          d[(y * w + k) * 3 + c] = (1 - t) * d[(y * w + l) * 3 + c] + t * d[(y * w + r) * 3 + c];
        }
    }
  for (let it = 0; it < 40; it++)
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (!m[y * w + x]) continue;
        for (let c = 0; c < 3; c++) {
          let s = 0, k = 0;
          if (x > 0) (s += d[(y * w + x - 1) * 3 + c]), k++;
          if (x < w - 1) (s += d[(y * w + x + 1) * 3 + c]), k++;
          if (y > 0) (s += d[((y - 1) * w + x) * 3 + c]), k++;
          if (y < h - 1) (s += d[((y + 1) * w + x) * 3 + c]), k++;
          d[(y * w + x) * 3 + c] = s / k;
        }
      }
}

function level(img: Picture, hole: Uint8Array, avoid: Uint8Array, iters: number, init?: { nx: Int32Array; ny: Int32Array; w: number }) {
  const { w, h, d } = img;
  const touches = dilate(hole, w, h, R); // patch centres whose patch overlaps the hole
  const valid = new Uint8Array(w * h); // source centres: whole patch outside the hole and the areas to avoid
  for (let y = R; y < h - R; y++) for (let x = R; x < w - R; x++) valid[y * w + x] = touches[y * w + x] || avoid[y * w + x] ? 0 : 1;
  const targets: number[] = [];
  for (let y = R; y < h - R; y++) for (let x = R; x < w - R; x++) if (touches[y * w + x]) targets.push(y * w + x);
  const sources: number[] = [];
  for (let i = 0; i < w * h; i++) if (valid[i]) sources.push(i);

  const nx = new Int32Array(w * h), ny = new Int32Array(w * h), nd = new Float32Array(w * h);
  // Height prior: a match a sixth of the picture higher or lower costs as much as a fair mismatch
  const band = (3 * P * P * 12 * 12) / (h / 6) ** 2;
  const dist = (p: number, q: number, best: number) => {
    const px = p % w, py = (p - px) / w, qx = q % w, qy = (q - qx) / w;
    let s = band * (qy - py) * (qy - py);
    if (s > best) return s;
    for (let dy = -R; dy <= R; dy++) {
      const a = ((py + dy) * w + px - R) * 3, b = ((qy + dy) * w + qx - R) * 3;
      for (let k = 0; k < P * 3; k++) {
        const e = d[a + k] - d[b + k];
        s += e * e;
      }
      if (s > best) return s;
    }
    return s;
  };
  const randomSource = () => sources[(Math.random() * sources.length) | 0];
  for (const p of targets) {
    let q = -1;
    if (init) {
      const px = p % w, py = (p - px) / w;
      const cx = Math.min(init.w - 1, px >> 1), cy = py >> 1;
      const qx = init.nx[cy * init.w + cx] * 2 + (px - 2 * cx), qy = init.ny[cy * init.w + cx] * 2 + (py - 2 * cy);
      if (qx >= R && qy >= R && qx < w - R && qy < h - R && valid[qy * w + qx]) q = qy * w + qx;
    }
    if (q < 0) q = randomSource();
    nx[p] = q % w;
    ny[p] = (q - nx[p]) / w;
    nd[p] = dist(p, q, Infinity);
  }

  const acc = new Float32Array(w * h * 3), wsum = new Float32Array(w * h);
  for (let it = 0; it < iters; it++) {
    // Search: propagate good matches from the neighbours, then look around at shrinking radii
    const fwd = it % 2 === 0, step = fwd ? 1 : -1;
    for (let t = fwd ? 0 : targets.length - 1; t >= 0 && t < targets.length; t += step) {
      const p = targets[t], px = p % w, py = (p - px) / w;
      let bx = nx[p], by = ny[p], bd = nd[p];
      const tryQ = (qx: number, qy: number) => {
        if (qx < R || qy < R || qx >= w - R || qy >= h - R) return;
        const q = qy * w + qx;
        if (!valid[q]) return;
        const dd = dist(p, q, bd);
        if (dd < bd) (bd = dd), (bx = qx), (by = qy);
      };
      for (const [ox, oy] of [[-step, 0], [0, -step]]) {
        const n = (py + oy) * w + px + ox;
        if (touches[n]) tryQ(nx[n] - ox, ny[n] - oy);
      }
      for (let rad = Math.max(w, h); rad >= 1; rad >>= 1) {
        tryQ(bx + Math.round((Math.random() * 2 - 1) * rad), by + Math.round((Math.random() * 2 - 1) * rad));
        // …and at the same height anywhere across the picture
        tryQ(Math.round(R + Math.random() * (w - 2 * R - 1)), py + Math.round((Math.random() * 2 - 1) * Math.min(rad, 0.08 * h)));
      }
      nx[p] = bx;
      ny[p] = by;
      nd[p] = bd;
    }
    // Vote: each hole pixel takes the similarity-weighted average of the patches covering it
    const sorted = targets.map((p) => nd[p]).sort((a, b) => a - b);
    const sigma2 = Math.max(1, sorted[Math.floor(sorted.length * 0.75)]);
    acc.fill(0);
    wsum.fill(0);
    for (const p of targets) {
      const px = p % w, py = (p - px) / w, wt = Math.exp(-nd[p] / (2 * sigma2));
      for (let dy = -R; dy <= R; dy++)
        for (let dx = -R; dx <= R; dx++) {
          const x = (py + dy) * w + px + dx;
          if (!hole[x]) continue;
          const s = ((ny[p] + dy) * w + nx[p] + dx) * 3;
          acc[x * 3] += wt * d[s];
          acc[x * 3 + 1] += wt * d[s + 1];
          acc[x * 3 + 2] += wt * d[s + 2];
          wsum[x] += wt;
        }
    }
    for (let x = 0; x < w * h; x++) if (hole[x] && wsum[x] > 0) for (let c = 0; c < 3; c++) d[x * 3 + c] = acc[x * 3 + c] / wsum[x];
  }
  return { nx, ny, w };
}

/** `avoid` marks pixels never to copy from (1 = avoid). */
export function inpaint(img: Picture, hole: Uint8Array, avoid: Uint8Array, log: (msg: string) => void = () => {}) {
  const pics = [img], holes = [hole], avoids = [avoid];
  while (pics[pics.length - 1].w > 96) {
    const last = pics[pics.length - 1];
    pics.push(down(last));
    holes.push(downMask(holes[holes.length - 1], last.w, last.h));
    avoids.push(downMask(avoids[avoids.length - 1], last.w, last.h));
  }
  let nnf: { nx: Int32Array; ny: Int32Array; w: number } | undefined;
  for (let l = pics.length - 1; l >= 0; l--) {
    const pic = pics[l], m = holes[l];
    if (l === pics.length - 1) diffuse(pic, m);
    else {
      // Start from the coarser result, enlarged
      const c = pics[l + 1];
      for (let y = 0; y < pic.h; y++)
        for (let x = 0; x < pic.w; x++) {
          if (!m[y * pic.w + x]) continue;
          const fx = Math.min(c.w - 1.001, Math.max(0, x / 2 - 0.25)), fy = Math.min(c.h - 1.001, Math.max(0, y / 2 - 0.25));
          const x0 = Math.floor(fx), y0 = Math.floor(fy), ax = fx - x0, ay = fy - y0;
          for (let k = 0; k < 3; k++) {
            const v = (xx: number, yy: number) => c.d[(yy * c.w + xx) * 3 + k];
            pic.d[(y * pic.w + x) * 3 + k] = (1 - ay) * ((1 - ax) * v(x0, y0) + ax * v(x0 + 1, y0)) + ay * ((1 - ax) * v(x0, y0 + 1) + ax * v(x0 + 1, y0 + 1));
          }
        }
    }
    const t0 = Date.now();
    nnf = level(pic, m, avoids[l], l === 0 ? 4 : l === 1 ? 6 : 16, nnf);
    log(`  scale ${pic.w}×${pic.h}: ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  }
  return img;
}
