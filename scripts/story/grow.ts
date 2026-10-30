/**
 * Makes a picture taller inside a band of its rows by adding low-detail "seams" there (seam carving
 * run in reverse: content-aware enlarging). A seam is a path of one pixel per column, from the left edge
 * to the right, that runs through the plainest pixels it can find: the cream of the board, the velvet
 * round it, the straight gold lines. Each seam is repeated once, so the plain areas grow and the
 * ornaments (the gems, the curls, the lotus petals) keep their shape.
 *
 * Used by derive.ts to make the Love Story board taller, so its lettering can be larger. The band
 * must hold only things that can stretch: the cream interior, not the gold rims above and below it.
 */

const lum = (r: number, g: number, b: number) => 0.3 * r + 0.59 * g + 0.11 * b;

/** `src` is straight-alpha RGBA, `w` × `h`. Returns RGBA, `w` × (`h` + `extra`). `top` and `bottom` bound the band (inclusive). */
export function growBand(src: Buffer, w: number, h: number, top: number, bottom: number, extra: number): Buffer {
  const bh = bottom - top + 1;
  if (extra > bh * 0.75) throw new Error(`growBand: ${extra} extra rows is too many for a band of ${bh}`);

  const px = (x: number, r: number) => (top + r) * w + x;
  // orig[x][r]: which band row of the original picture is now row r of column x
  const orig: Int32Array[] = Array.from({ length: w }, () => Int32Array.from({ length: bh }, (_, r) => r));
  const taken: Uint8Array[] = Array.from({ length: w }, () => new Uint8Array(bh));

  const L = new Float32Array(w * bh), A = new Float32Array(w * bh);
  for (let x = 0; x < w; x++)
    for (let r = 0; r < bh; r++) {
      const i = px(x, r) * 4;
      L[x * bh + r] = lum(src[i], src[i + 1], src[i + 2]);
      A[x * bh + r] = src[i + 3];
    }

  let rows = bh;
  for (let s = 0; s < extra; s++) {
    // Energy: how much the picture changes at each pixel, in the picture as it is after the seams taken so far
    const E = new Float32Array(w * rows);
    const l = (x: number, r: number) => L[x * bh + orig[x][r]];
    const a = (x: number, r: number) => A[x * bh + orig[x][r]];
    for (let x = 0; x < w; x++) {
      const xl = Math.max(0, x - 1), xr = Math.min(w - 1, x + 1);
      for (let r = 0; r < rows; r++) {
        const ru = Math.max(0, r - 1), rd = Math.min(rows - 1, r + 1);
        E[x * rows + r] =
          Math.abs(l(xr, r) - l(xl, r)) + Math.abs(l(x, rd) - l(x, ru)) + 0.5 * (Math.abs(a(xr, r) - a(xl, r)) + Math.abs(a(x, rd) - a(x, ru)));
      }
    }
    // The cheapest left-to-right path
    const M = new Float32Array(w * rows);
    for (let r = 0; r < rows; r++) M[r] = E[r];
    for (let x = 1; x < w; x++)
      for (let r = 0; r < rows; r++) {
        let best = M[(x - 1) * rows + r];
        if (r > 0) best = Math.min(best, M[(x - 1) * rows + r - 1]);
        if (r < rows - 1) best = Math.min(best, M[(x - 1) * rows + r + 1]);
        M[x * rows + r] = E[x * rows + r] + best;
      }
    let r = 0;
    for (let k = 1; k < rows; k++) if (M[(w - 1) * rows + k] < M[(w - 1) * rows + r]) r = k;
    const seam = new Int32Array(w);
    for (let x = w - 1; x >= 0; x--) {
      seam[x] = r;
      if (x > 0) {
        let br = r, bv = M[(x - 1) * rows + r];
        if (r > 0 && M[(x - 1) * rows + r - 1] < bv) (bv = M[(x - 1) * rows + r - 1]), (br = r - 1);
        if (r < rows - 1 && M[(x - 1) * rows + r + 1] < bv) (bv = M[(x - 1) * rows + r + 1]), (br = r + 1);
        r = br;
      }
    }
    // Take it out
    for (let x = 0; x < w; x++) {
      const col = orig[x], out = new Int32Array(rows - 1);
      taken[x][col[seam[x]]] = 1;
      out.set(col.subarray(0, seam[x]), 0);
      out.set(col.subarray(seam[x] + 1), seam[x]);
      orig[x] = out;
    }
    rows--;
  }

  // Put the seams back, each pixel on a seam twice (the second a blend with the pixel below it)
  const out = Buffer.alloc(w * (h + extra) * 4);
  const put = (x: number, y: number, rgba: number[]) => {
    const o = (y * w + x) * 4;
    out[o] = rgba[0]; out[o + 1] = rgba[1]; out[o + 2] = rgba[2]; out[o + 3] = rgba[3];
  };
  const get = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    return [src[i], src[i + 1], src[i + 2], src[i + 3]];
  };
  const blend = (p: number[], q: number[]) => {
    const wp = p[3] + 1e-6, wq = q[3] + 1e-6;
    const al = (p[3] + q[3]) / 2;
    return [(p[0] * wp + q[0] * wq) / (wp + wq), (p[1] * wp + q[1] * wq) / (wp + wq), (p[2] * wp + q[2] * wq) / (wp + wq), al];
  };
  for (let x = 0; x < w; x++) {
    let y = 0;
    for (let k = 0; k < top; k++) put(x, y++, get(x, k));
    for (let r = 0; r < bh; r++) {
      const p = get(x, top + r);
      put(x, y++, p);
      if (taken[x][r]) put(x, y++, blend(p, get(x, Math.min(h - 1, top + r + 1))));
    }
    for (let k = bottom + 1; k < h; k++) put(x, y++, get(x, k));
  }
  return out;
}
