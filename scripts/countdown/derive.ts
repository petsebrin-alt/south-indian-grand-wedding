/**
 * npm run countdown:assets → the Countdown page's layers (src/assets/countdown/), from the client's
 * elephant board (source/board.webp) and gold rod (source/rod.png), measured in scene.json:
 *   board            the elephant-and-peacock board, lifted off its white background, with the two
 *                    trunks painted out (the board's cream and florals rebuilt behind them)
 *   trunk-*          each trunk in two jointed pieces (lower and curled upper), for the swing
 *   rod              the client's gold rod, lifted off its white background and turned level: the
 *                    carrying pole each board hangs from, like a palanquin
 *   board.json       sizes, the panel inside the board, and each trunk piece's box and pivot
 * Re-run after replacing a source picture or adjusting scene.json.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp, { type Sharp } from 'sharp';
import { inpaint } from '../welcome/inpaint';

const dir = join(process.cwd(), 'src/assets/countdown');
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
const insidePolygon = (poly: number[][], x: number, y: number) => {
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

// 1. The board: the white background goes; the trunks are cut out in jointed pieces and painted
//    out of the board beneath
{
  const { data: d, info } = await sharp(join(dir, 'source/board.webp')).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, n = W * H;
  const lo = (i: number) => Math.min(d[i * 3], d[i * 3 + 1], d[i * 3 + 2]);
  const hi = (i: number) => Math.max(d[i * 3], d[i * 3 + 1], d[i * 3 + 2]);
  const white = (i: number) => lo(i) > 244 && hi(i) - lo(i) < 12;
  const outside = new Uint8Array(n);
  const stack: number[] = [];
  const seed = (i: number) => { if (!outside[i] && white(i)) (outside[i] = 1), stack.push(i); };
  for (let x = 0; x < W; x++) seed(x), seed((H - 1) * W + x);
  for (let y = 0; y < H; y++) seed(y * W), seed(y * W + W - 1);
  while (stack.length) {
    const i = stack.pop()!, x = i % W;
    for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) if (j >= 0 && j < n) seed(j);
  }

  // Trunks out of the board: rebuilt from the board around them (never from the trunks or tusks)
  const hole = new Uint8Array(n);
  const avoid = new Uint8Array(n);
  for (const t of scene.trunks) {
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (insidePolygon(t.outline, x + 0.5, y + 0.5)) {
          avoid[i] = 1;
          if (y < t.base) hole[i] = 1;
        }
      }
  }
  // Grow the hole a few pixels past the trunk's outline
  const grown = new Uint8Array(n);
  const g = scene.grow;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!hole[y * W + x]) continue;
      for (let yy = Math.max(0, y - g); yy <= Math.min(H - 1, y + g); yy++)
        for (let xx = Math.max(0, x - g); xx <= Math.min(W - 1, x + g); xx++) if (yy < scene.trunks[0].base) grown[yy * W + xx] = 1;
    }
  for (const [x0, y0, x1, y1] of scene.keepOut) for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) avoid[y * W + x] = 1;
  const painted = inpaint({ w: W, h: H, d: Float32Array.from(d) }, grown, avoid, console.log);

  const rgba = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < 3; c++) rgba[i * 4 + c] = Math.round(Math.min(255, Math.max(0, painted.d[i * 3 + c])));
    rgba[i * 4 + 3] = outside[i] ? 0 : 255;
  }
  // Soften the outer edge by a pixel
  const alpha = new Float32Array(n);
  for (let i = 0; i < n; i++) alpha[i] = rgba[i * 4 + 3] / 255;
  const edge = boxBlur(alpha, W, H, 1);
  for (let i = 0; i < n; i++) rgba[i * 4 + 3] = Math.round(Math.min(alpha[i], edge[i] * 1.2) * 255);
  await write('board', sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).resize({ width: scene.width }), ['avif', 'webp'], { avif: 62, webp: 86 });
  const k = scene.width / W;

  // The trunk pieces, from the original board: the lower piece fades into the trunk's base below
  // its pivot; the upper (curled) piece fades into the lower piece at the joint
  const fit: Record<string, unknown> = { ratio: +(H / W).toFixed(4), panel: scene.panel.map((v: number, j: number) => +((v / (j % 2 ? H : W)) * 100).toFixed(2)) };
  for (const t of scene.trunks) {
    for (const part of ['lower', 'upper'] as const) {
      const [y0, y1, fade] = part === 'lower' ? [t.joint[1] - t.overlap, t.base + t.overlap, [t.base - t.overlap, t.base + t.overlap]] : [0, t.joint[1] + t.overlap, [t.joint[1] - t.overlap, t.joint[1] + t.overlap]];
      let bx0 = W, by0 = H, bx1 = 0, by1 = 0;
      for (let y = Math.max(0, y0); y < Math.min(H, y1); y++) for (let x = 0; x < W; x++) if (insidePolygon(t.outline, x + 0.5, y + 0.5)) (bx0 = Math.min(bx0, x)), (bx1 = Math.max(bx1, x)), (by0 = Math.min(by0, y)), (by1 = Math.max(by1, y));
      bx0 -= 2; by0 -= 2; bx1 += 2; by1 += 2;
      const bw = bx1 - bx0 + 1, bh = by1 - by0 + 1;
      const px = Buffer.alloc(bw * bh * 4);
      for (let y = 0; y < bh; y++)
        for (let x = 0; x < bw; x++) {
          const sx = bx0 + x, sy = by0 + y;
          // Soft edge: coverage of a 3×3 grid of samples inside the outline
          let cov = 0;
          for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if (insidePolygon(t.outline, sx + (a + 0.5) / 3, sy + (b + 0.5) / 3)) cov++;
          let alphaV = cov / 9;
          if (sy > fade[0]) alphaV *= Math.max(0, 1 - (sy - fade[0]) / (fade[1] - fade[0]));
          if (part === 'lower' && sy < t.joint[1] - t.overlap) alphaV = 0;
          const s = (sy * W + sx) * 3, o = (y * bw + x) * 4;
          px[o] = d[s]; px[o + 1] = d[s + 1]; px[o + 2] = d[s + 2]; px[o + 3] = Math.round(alphaV * 255);
        }
      const name = `trunk-${t.id}-${part}`;
      await write(name, sharp(px, { raw: { width: bw, height: bh, channels: 4 } }).resize({ width: Math.max(1, Math.round(bw * k)) }), ['webp'], { avif: 0, webp: 90 });
      const pivot = part === 'lower' ? t.pivot : t.joint;
      fit[name] = { box: [bx0, by0, bx1 + 1, by1 + 1].map((v, j) => +((v / (j % 2 ? H : W)) * 100).toFixed(3)), pivot: [+(((pivot[0] - bx0) / bw) * 100).toFixed(2), +(((pivot[1] - by0) / bh) * 100).toFixed(2)] };
    }
  }
  writeFileSync(join(dir, 'board.json'), JSON.stringify(fit, null, 2) + '\n');
  console.log(`  board ${W}×${H} → ${scene.width} px wide`);
}

// 2. The carrying pole: the gold rod, off its white background (flooded in from the edges, with a
//    soft one-pixel edge), trimmed and turned level
{
  const { data: d, info } = await sharp(join(dir, 'source/rod.png')).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, n = W * H;
  const lo = (i: number) => Math.min(d[i * 3], d[i * 3 + 1], d[i * 3 + 2]);
  const bg = new Uint8Array(n);
  const stack: number[] = [];
  const seed = (i: number) => { if (!bg[i] && lo(i) > 238) (bg[i] = 1), stack.push(i); };
  for (let x = 0; x < W; x++) seed(x), seed((H - 1) * W + x);
  for (let y = 0; y < H; y++) seed(y * W), seed(y * W + W - 1);
  while (stack.length) {
    const i = stack.pop()!, x = i % W;
    for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) if (j >= 0 && j < n) seed(j);
  }
  const rgba = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < 3; c++) rgba[i * 4 + c] = d[i * 3 + c];
    rgba[i * 4 + 3] = bg[i] ? 0 : Math.round(Math.min(1, (255 - lo(i)) / 40 + 0.3) * 255);
  }
  await write('rod', sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).trim({ threshold: 1 }).rotate(90), ['webp'], { avif: 0, webp: 90 });
}
