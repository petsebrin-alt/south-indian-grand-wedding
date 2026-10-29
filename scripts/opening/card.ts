/**
 * The invitation card layer (part of npm run opening:assets), from the client's card photograph
 * src/assets/opening/source/card.webp and scene.json's `card` measurements (source pixels):
 *   - the printed "Dear Guest" is painted out, so the guest's own name can be set there in live text
 *     (the velvet is rebuilt from its surrounding light plus grain taken from a plain patch);
 *   - the printed divider moves down a little, making room for the couple's names beneath the greeting;
 *   - the card is made taller: velvet is added under the greeting and the border's own repeat is carried on
 *     down the sides, so a long guest name has room (nothing printed is stretched or cut);
 *   - everything else (borders, paisleys, mandap, "Open the Invitation") is left exactly as printed.
 * Writes card.avif and card.webp, cropped to the card.
 */
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
import sharp from 'sharp';

type Rect = [number, number, number, number]; // x0, y0, x1, y1 (end exclusive)

export interface CardScene {
  box: Rect;
  clear: Rect;
  donor: Rect;
  divider: { from: Rect; y: number };
  /** Makes the card taller (room for long guest names): rows are added at `c` in the middle and at `s` in
   *  the side strips (x < xl and x >= xr), where only the border runs, so no ornament is cut. `rows` is a
   *  whole number of the border's beads (`period` rows each). */
  extend?: { c: number; s: number; xl: number; xr: number; rows: number; period: number };
}

export async function makeCard(dir: string, card: CardScene) {
  const { data, info } = await sharp(join(dir, 'source/card.webp')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const src = new Float32Array(data);
  const out = new Float32Array(data);
  const at = (x: number, y: number) => (y * W + x) * 4;
  // Foil is bright in green; the velvet has almost none
  const gold = (x: number, y: number) => src[at(x, y) + 1] > 34;

  // 1. What to remove: the printed lettering in the cleared area, with its glow and shading
  const [cx0, cy0, cx1, cy1] = card.clear;
  const pad = 60, grow = 5;
  const ex0 = cx0 - pad, ey0 = cy0 - pad, ew = cx1 - cx0 + 2 * pad, eh = cy1 - cy0 + 2 * pad;
  const near = new Uint8Array(ew * eh); // within a few pixels of any foil
  for (let j = 0; j < eh; j++)
    for (let i = 0; i < ew; i++) {
      if (!gold(ex0 + i, ey0 + j)) continue;
      for (let y = Math.max(0, j - grow); y <= Math.min(eh - 1, j + grow); y++)
        for (let x = Math.max(0, i - grow); x <= Math.min(ew - 1, i + grow); x++) near[y * ew + x] = 1;
    }
  const inClear = (i: number, j: number) => i >= pad && j >= pad && i < ew - pad && j < eh - pad;
  const hole = (i: number, j: number) => inClear(i, j) && near[j * ew + i] === 1;

  // 2. The light under each removed stroke: the average of the real velvet around it
  //    (summed-area tables, widening the window until enough velvet is in view)
  const sum = new Float64Array((ew + 1) * (eh + 1) * 4);
  for (let j = 0; j < eh; j++)
    for (let i = 0; i < ew; i++) {
      const o = ((j + 1) * (ew + 1) + i + 1) * 4, a = (j * (ew + 1) + i + 1) * 4, b = ((j + 1) * (ew + 1) + i) * 4, d = (j * (ew + 1) + i) * 4;
      const ok = near[j * ew + i] ? 0 : 1;
      for (let c = 0; c < 4; c++) sum[o + c] = sum[a + c] + sum[b + c] - sum[d + c] + (c < 3 ? ok * src[at(ex0 + i, ey0 + j) + c] : ok);
    }
  const box = (i0: number, j0: number, i1: number, j1: number, c: number) =>
    sum[(j1 * (ew + 1) + i1) * 4 + c] - sum[(j0 * (ew + 1) + i1) * 4 + c] - sum[(j1 * (ew + 1) + i0) * 4 + c] + sum[(j0 * (ew + 1) + i0) * 4 + c];
  const light = (i: number, j: number) => {
    for (const r of [8, 14, 24, 40, 56]) {
      const i0 = Math.max(0, i - r), j0 = Math.max(0, j - r), i1 = Math.min(ew, i + r + 1), j1 = Math.min(eh, j + r + 1);
      const n = box(i0, j0, i1, j1, 3);
      if (n >= 0.3 * (i1 - i0) * (j1 - j0) || r === 56) return [0, 1, 2].map((c) => box(i0, j0, i1, j1, c) / n);
    }
    return [0, 0, 0];
  };

  // 3. Velvet grain: the fine detail of a plain patch, laid in overlapping random pieces
  const [dx0, dy0, dx1, dy1] = card.donor;
  const dw = dx1 - dx0, dh = dy1 - dy0;
  const grain = new Float32Array(dw * dh * 3);
  const r = 4;
  for (let y = 0; y < dh; y++)
    for (let x = 0; x < dw; x++)
      for (let c = 0; c < 3; c++) {
        let s = 0, k = 0;
        for (let yy = Math.max(0, y - r); yy <= Math.min(dh - 1, y + r); yy++)
          for (let xx = Math.max(0, x - r); xx <= Math.min(dw - 1, x + r); xx++) s += src[at(dx0 + xx, dy0 + yy) + c], k++;
        grain[(y * dw + x) * 3 + c] = src[at(dx0 + x, dy0 + y) + c] - s / k;
      }
  const B = 32, step = 24;
  const acc = new Float32Array(ew * eh * 3), wsum = new Float32Array(ew * eh);
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const tent = (t: number) => Math.min(1, (t + 0.5) / (B - step), (B - t - 0.5) / (B - step));
  for (let by = pad - 8; by < eh - pad; by += step)
    for (let bx = pad - 8; bx < ew - pad; bx += step) {
      let ox = 0, oy = 0;
      for (let tries = 0; tries < 40; tries++) {
        ox = Math.floor(rand() * (dw - B));
        oy = Math.floor(rand() * (dh - B));
        let clean = true;
        for (let y = 0; y < B && clean; y += 2) for (let x = 0; x < B; x += 2) if (gold(dx0 + ox + x, dy0 + oy + y)) { clean = false; break; }
        if (clean) break;
      }
      for (let y = 0; y < B; y++)
        for (let x = 0; x < B; x++) {
          const i = bx + x, j = by + y;
          if (i < 0 || j < 0 || i >= ew || j >= eh) continue;
          const w = Math.max(0.001, tent(x) * tent(y));
          const g = ((oy + y) * dw + ox + x) * 3;
          for (let c = 0; c < 3; c++) acc[(j * ew + i) * 3 + c] += w * grain[g + c];
          wsum[j * ew + i] += w;
        }
    }

  // 4. Fill the strokes, feathering two pixels into the untouched velvet
  const f = 2;
  for (let j = pad - f; j < eh - pad + f; j++)
    for (let i = pad - f; i < ew - pad + f; i++) {
      let k = 0, n = 0;
      for (let y = j - f; y <= j + f; y++) for (let x = i - f; x <= i + f; x++) (n++, hole(x, y) && k++);
      if (!k) continue;
      const soft = k / n, L = light(i, j), o = at(ex0 + i, ey0 + j);
      for (let c = 0; c < 3; c++) {
        const fill = L[c] + (wsum[j * ew + i] ? acc[(j * ew + i) * 3 + c] / wsum[j * ew + i] : 0);
        out[o + c] = soft * fill + (1 - soft) * src[o + c];
      }
    }

  // 5. The printed divider, lifted from where it was and set down a little lower
  const [fx0, fy0, fx1, fy1] = card.divider.from;
  const shift = card.divider.y - fy0;
  for (let y = fy0; y < fy1; y++)
    for (let x = fx0; x < fx1; x++) {
      // Soft coverage of the foil, widened by a pixel so its edges keep their shading
      let g = 0;
      for (let k = -1; k <= 1; k++) for (let l = -1; l <= 1; l++) g = Math.max(g, src[at(x + l, y + k) + 1]);
      const a = Math.min(1, Math.max(0, (g - 14) / 46));
      if (!a) continue;
      const s = at(x, y), t = at(x, y + shift);
      for (let c = 0; c < 3; c++) out[t + c] = a * src[s + c] + (1 - a) * out[t + c];
    }

  // 5b. A taller card
  let pixels = out;
  let height = info.height;
  let [bx0, by0, bx1, by1] = card.box;
  if (card.extend) {
    const { c, s, xl, xr, rows: E, period } = card.extend;
    const H2 = info.height + E;
    const big = new Float32Array(W * H2 * 4);
    const get = (arr: Float32Array, x: number, y: number, ch: number) => arr[(y * W + x) * 4 + ch];
    // Mean colour of a row of plain velvet (the middle part, away from foil)
    const memo = new Map<number, number[]>();
    const rowMean = (y: number) => {
      const hit = memo.get(y);
      if (hit) return hit;
      const m = [0, 0, 0];
      let n = 0;
      for (let x = xl + 30; x < xr - 30; x++) {
        if (get(out, x, y, 1) > 34) continue;
        for (let ch = 0; ch < 3; ch++) m[ch] += get(out, x, y, ch);
        n++;
      }
      const mean = m.map((v) => v / Math.max(n, 1));
      memo.set(y, mean);
      return mean;
    };
    const above = rowMean(c - 1), below = rowMean(c);
    // The velvet that fills the middle of the added rows: the plain rows under the lotus, read upwards from the cut and back
    // again, each row's overall colour matched to a blend between the rows either side of the cut
    const clean: number[] = [];
    {
      const foilRow = (y: number) => {
        for (let x = xl; x < xr; x++) if (get(out, x, y, 1) > 30) return true;
        return false;
      };
      const flagged = new Set<number>();
      for (let y = c - 260; y < c; y++) if (foilRow(y)) for (let d = -5; d <= 5; d++) flagged.add(y + d);
      for (let y = c - 1; y >= c - 260; y--) if (!flagged.has(y)) clean.push(y); // nearest the cut first
    }
    const span = clean.length;
    console.log(`  taller card: ${span} plain velvet rows to draw the added ${E} from`);
    for (let y = 0; y < H2; y++) {
      for (let x = 0; x < W; x++) {
        const o = (y * W + x) * 4;
        const side = x < xl || x >= xr;
        let srcRow: number, mode: 'copy' | 'strip' | 'velvet';
        if (side) {
          if (y < s) (srcRow = y), (mode = 'copy');
          else if (y < s + E) {
            // the border's own repeat, carried on: the same rows over and over (the pattern repeats every `period` rows, and
            // the added rows are a whole number of repeats, so the row after them is the row they began from)
            srcRow = s + ((y - s) % period);
            mode = 'strip';
          } else (srcRow = y - E), (mode = 'copy');
        } else {
          if (y < c) (srcRow = y), (mode = 'copy');
          else if (y < c + E) (srcRow = y), (mode = 'velvet');
          else (srcRow = y - E), (mode = 'copy');
        }
        if (mode === 'copy') for (let ch = 0; ch < 4; ch++) big[o + ch] = get(out, x, srcRow, ch);
        else if (mode === 'strip') {
          // a fractional source row (the period is not a whole number of rows)
          const r0 = Math.floor(srcRow), fr = srcRow - r0;
          for (let ch = 0; ch < 4; ch++) big[o + ch] = get(out, x, r0, ch) * (1 - fr) + get(out, x, r0 + 1, ch) * fr;
        } else {
          const k = y - c;
          const idx0 = k % (2 * (span - 1));
          const idx = idx0 < span ? idx0 : 2 * (span - 1) - idx0;
          const r = clean[idx];
          const t = (k + 0.5) / E;
          const m = rowMean(r);
          for (let ch = 0; ch < 3; ch++) {
            const target = above[ch] * (1 - t) + below[ch] * t;
            big[o + ch] = Math.max(0, Math.min(255, get(out, x, r, ch) * (target / Math.max(m[ch], 1))));
          }
          big[o + 3] = 255;
        }
      }
    }
    pixels = big;
    height = H2;
    by1 += E;
  }

  // 6. Crop to the card and encode
  const img = sharp(Buffer.from(Uint8ClampedArray.from(pixels)), { raw: { width: W, height, channels: 4 } })
    .extract({ left: bx0, top: by0, width: bx1 - bx0, height: by1 - by0 });
  const png = await img.png().toBuffer();
  for (const [ext, enc] of [
    ['avif', sharp(png).avif({ quality: 60, effort: 6 })],
    ['webp', sharp(png).webp({ quality: 84, effort: 6, smartSubsample: true, alphaQuality: 90 })],
  ] as const) {
    const buf = await enc.toBuffer();
    writeFileSync(join(dir, `card.${ext}`), buf);
    console.log(`✓ card.${ext}  ${(buf.length / 1024).toFixed(0)} KB`);
  }
}
