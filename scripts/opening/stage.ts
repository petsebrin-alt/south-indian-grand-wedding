/**
 * The desktop background (part of npm run opening:assets), made from the client's velvet card so
 * the screen around the phone matches the invitation (scene.json `stage`, card.webp pixels):
 *   velvet.webp  a seamless tile of the card's maroon velvet: its colour plus real grain from the
 *                plain velvet margins, laid in overlapping pieces that wrap around the edges
 *   frame.webp   the card's gold border (beaded band and fine rule) as a nine-slice image for CSS
 *                border-image: the card's own corner and one exact repeat of its top band, turned
 *                on its side for the left and right (the photographed card's sides lean very
 *                slightly, so its own side band does not repeat cleanly), mirrored as needed
 *   spray.webp   the gold paisley-and-flower spray from the card's lower corner, for the screen's
 *                corners
 * Gold is lifted off the velvet by its brightness in green (the velvet has almost none).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp, { type Sharp } from 'sharp';

type Rect = [number, number, number, number];

export interface StageScene {
  /** Plain velvet strips of the card (its margins outside the border). */
  donors: Rect[];
  /** The border's top-left corner square; the band runs right and down from it. */
  corner: Rect;
  /** Where along the top band to start, and the length that repeats seamlessly. */
  bandFrom: number;
  length: number;
  spray: Rect;
}

export async function makeStage(dir: string, out: string, stage: StageScene) {
  mkdirSync(out, { recursive: true });
  const { data: d, info } = await sharp(join(dir, 'source/card.webp')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const px = (x: number, y: number, c: number) => d[(y * W + x) * 4 + c];

  // The velvet's own colour (median of the plain strips)
  const reds: number[][] = [[], [], []];
  for (const [x0, y0, x1, y1] of stage.donors)
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) for (let c = 0; c < 3; c++) reds[c].push(px(x, y, c));
  const velvet = reds.map((v) => (v.sort((a, b) => a - b), v[v.length >> 1]));

  // Gold lifted off the velvet: coverage from green, colour with the velvet taken back out
  const gold = (x0: number, y0: number, w: number, h: number) => {
    const o = Buffer.alloc(w * h * 4);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const a = Math.min(1, Math.max(0, (px(x0 + x, y0 + y, 1) - 14) / 60));
        const i = (y * w + x) * 4;
        for (let c = 0; c < 3; c++) o[i + c] = a > 0.02 ? Math.min(255, Math.max(0, Math.round((px(x0 + x, y0 + y, c) - (1 - a) * velvet[c]) / a))) : 0;
        o[i + 3] = Math.round(a * 255);
      }
    return sharp(o, { raw: { width: w, height: h, channels: 4 } });
  };
  const raw = async (s: Sharp) => (await s.raw().toBuffer({ resolveWithObject: true })).data;

  // 1. Velvet tile, 256 px square and seamless (pieces wrap around its edges)
  const T = 256, B = 16, step = 12, r = 4;
  const grain: { w: number; h: number; g: Float32Array }[] = stage.donors.map(([x0, y0, x1, y1]) => {
    const w = x1 - x0, h = y1 - y0, g = new Float32Array(w * h * 3);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++)
        for (let c = 0; c < 3; c++) {
          let s = 0, k = 0;
          for (let yy = Math.max(0, y - r); yy <= Math.min(h - 1, y + r); yy++)
            for (let xx = Math.max(0, x - r); xx <= Math.min(w - 1, x + r); xx++) (s += px(x0 + xx, y0 + yy, c)), k++;
          g[(y * w + x) * 3 + c] = px(x0 + x, y0 + y, c) - s / k;
        }
    return { w, h, g };
  });
  const acc = new Float32Array(T * T * 3), wsum = new Float32Array(T * T);
  let seed = 11;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const tent = (t: number) => Math.min(1, (t + 0.5) / (B - step), (B - t - 0.5) / (B - step));
  for (let by = 0; by < T; by += step)
    for (let bx = 0; bx < T; bx += step) {
      const src = grain[Math.floor(rand() * grain.length)];
      const ox = Math.floor(rand() * (src.w - B)), oy = Math.floor(rand() * (src.h - B));
      for (let y = 0; y < B; y++)
        for (let x = 0; x < B; x++) {
          const i = (bx + x) % T, j = (by + y) % T, w = Math.max(0.001, tent(x) * tent(y));
          for (let c = 0; c < 3; c++) acc[(j * T + i) * 3 + c] += w * src.g[((oy + y) * src.w + ox + x) * 3 + c];
          wsum[j * T + i] += w;
        }
    }
  const tile = Buffer.alloc(T * T * 3);
  for (let i = 0; i < T * T; i++) for (let c = 0; c < 3; c++) tile[i * 3 + c] = Math.min(255, Math.max(0, Math.round(velvet[c] + acc[i * 3 + c] / wsum[i])));
  // Near-lossless: ordinary compression smooths the fine grain away
  const velvetBuf = await sharp(tile, { raw: { width: T, height: T, channels: 3 } }).webp({ nearLossless: true, quality: 60, effort: 6 }).toBuffer();
  writeFileSync(join(out, 'velvet.webp'), velvetBuf);
  console.log(`✓ stage/velvet.webp  ${(velvetBuf.length / 1024).toFixed(0)} KB (velvet ${velvet.join(', ')})`);

  // 2. Frame: corner + one band length each way, mirrored into a nine-slice image
  const [kx0, ky0, kx1, ky1] = stage.corner;
  const C = kx1 - kx0; // band depth (the corner is square)
  const L = stage.length;
  const corner = await raw(gold(kx0, ky0, C, ky1 - ky0));
  const top = await raw(gold(stage.bandFrom, ky0, L, C));
  // The left band is the top band transposed: its outer edge to the left, its fine rule inside
  const left = Buffer.alloc(C * L * 4);
  for (let y = 0; y < L; y++) for (let x = 0; x < C; x++) top.copy(left, (y * C + x) * 4, (x * L + y) * 4, (x * L + y) * 4 + 4);
  const S = 2 * C + L;
  const frame = Buffer.alloc(S * S * 4);
  const put = (img: Buffer, w: number, h: number, ox: number, oy: number, flipX: boolean, flipY: boolean) => {
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const sx = flipX ? w - 1 - x : x, sy = flipY ? h - 1 - y : y;
        img.copy(frame, ((oy + y) * S + ox + x) * 4, (sy * w + sx) * 4, (sy * w + sx) * 4 + 4);
      }
  };
  put(corner, C, C, 0, 0, false, false);
  put(corner, C, C, C + L, 0, true, false);
  put(corner, C, C, 0, C + L, false, true);
  put(corner, C, C, C + L, C + L, true, true);
  put(top, L, C, C, 0, false, false);
  put(top, L, C, C, C + L, false, true);
  put(left, C, L, 0, C, false, false);
  put(left, C, L, C + L, C, true, false);
  const frameBuf = await sharp(frame, { raw: { width: S, height: S, channels: 4 } }).webp({ quality: 90, alphaQuality: 95, effort: 6 }).toBuffer();
  writeFileSync(join(out, 'frame.webp'), frameBuf);
  console.log(`✓ stage/frame.webp  ${(frameBuf.length / 1024).toFixed(0)} KB (slice ${C} px of ${S})`);

  // 3. The corner spray, its cut top edge faded so trimmed tendrils do not end abruptly
  const [sx0, sy0, sx1, sy1] = stage.spray;
  const spray = await raw(gold(sx0, sy0, sx1 - sx0, sy1 - sy0));
  const sw = sx1 - sx0;
  for (let y = 0; y < 14; y++) for (let x = 0; x < sw; x++) spray[(y * sw + x) * 4 + 3] = Math.round(spray[(y * sw + x) * 4 + 3] * (y / 14));
  const sprayBuf = await sharp(spray, { raw: { width: sw, height: sy1 - sy0, channels: 4 } }).webp({ quality: 88, alphaQuality: 95, effort: 6 }).toBuffer();
  writeFileSync(join(out, 'spray.webp'), sprayBuf);
  console.log(`✓ stage/spray.webp  ${(sprayBuf.length / 1024).toFixed(0)} KB`);
  return { slice: C, size: S };
}
