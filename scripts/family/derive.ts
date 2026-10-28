/**
 * npm run family:assets → the Parents and Family gallery's picture frame and portraits, from the
 * client's pictures in src/assets/family/source/:
 *   frame.webp           the client's ornate gold oval frame (photographed on a cream wall)
 *   temple.webp          the client's picture of a temple courtyard, the page's background
 *   <person>.webp        the portraits: bride-father, bride-mother, groom-father, groom-mother
 * and writes
 *   src/assets/family/background.*  the temple picture as it is (AVIF + WebP)
 *   src/assets/family/frame.webp   the frame cut out of the wall (transparent, with its openwork and
 *                                  its opening), trimmed to its edges (the wall's soft shadow, which is
 *                                  brown but much paler than the gold, is left out)
 *   src/assets/family/frame.json   its size and the oval opening, in % of the trimmed frame
 *   public/photos/family/<person>.webp   each portrait at web size (src/data/wedding.ts names them)
 * Re-run after replacing a picture.
 */
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const dir = join(process.cwd(), 'src/assets/family');
const photos = join(process.cwd(), 'public/photos/family');
mkdirSync(photos, { recursive: true });

// 0. The background: the client's temple picture, as it is
{
  const png = await sharp(join(dir, 'source/temple.webp')).removeAlpha().png().toBuffer();
  for (const f of ['avif', 'webp'] as const) {
    const out = await (f === 'avif' ? sharp(png).avif({ quality: 62, effort: 6 }) : sharp(png).webp({ quality: 84, effort: 6 })).toBuffer();
    writeFileSync(join(dir, `background.${f}`), out);
    console.log(`✓ family/background.${f}  ${(out.length / 1024).toFixed(0)} KB`);
  }
}

// 1. The frame: gold is far more colourful than the cream wall and its shadow
const { data, info } = await sharp(join(dir, 'source/frame.webp')).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const alpha = new Float32Array(W * H);
for (let i = 0; i < W * H; i++) alpha[i] = smooth(78, 100, Math.max(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]) - Math.min(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]));
// Where the gold only partly covers a pixel the wall is mixed in: take the colour of the solid gold beside it
const rgb = Float32Array.from(data);
for (let y = 3; y < H - 3; y++)
  for (let x = 3; x < W - 3; x++) {
    const i = y * W + x;
    if (alpha[i] <= 0.01 || alpha[i] > 0.97) continue;
    let r = 0, g = 0, b = 0, n = 0;
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const j = (y + dy) * W + x + dx;
      if (alpha[j] > 0.97) (r += data[j * 3]), (g += data[j * 3 + 1]), (b += data[j * 3 + 2]), n++;
    }
    if (n) (rgb[i * 3] = r / n), (rgb[i * 3 + 1] = g / n), (rgb[i * 3 + 2] = b / n);
  }
// The opening: the transparent area joined to the middle of the picture
const opening = new Uint8Array(W * H);
{
  const stack = [Math.floor(H / 2) * W + Math.floor(W / 2)];
  opening[stack[0]] = 1;
  while (stack.length) {
    const i = stack.pop()!, x = i % W;
    for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) if (j >= 0 && j < W * H && alpha[j] < 0.5 && !opening[j]) (opening[j] = 1), stack.push(j);
  }
}
let ox0 = W, oy0 = H, ox1 = 0, oy1 = 0, fx0 = W, fy0 = H, fx1 = 0, fy1 = 0;
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (opening[i]) (ox0 = Math.min(ox0, x)), (ox1 = Math.max(ox1, x)), (oy0 = Math.min(oy0, y)), (oy1 = Math.max(oy1, y));
    if (alpha[i] > 0.05) (fx0 = Math.min(fx0, x)), (fx1 = Math.max(fx1, x)), (fy0 = Math.min(fy0, y)), (fy1 = Math.max(fy1, y));
  }
const fw = fx1 - fx0 + 1, fh = fy1 - fy0 + 1;
const rgba = Buffer.alloc(fw * fh * 4);
for (let y = 0; y < fh; y++)
  for (let x = 0; x < fw; x++) {
    const i = (fy0 + y) * W + fx0 + x, o = (y * fw + x) * 4;
    rgba[o] = rgb[i * 3];
    rgba[o + 1] = rgb[i * 3 + 1];
    rgba[o + 2] = rgb[i * 3 + 2];
    rgba[o + 3] = Math.round(alpha[i] * 255);
  }
const outW = 560, outH = Math.round((fh / fw) * outW);
const buf = await sharp(rgba, { raw: { width: fw, height: fh, channels: 4 } }).resize(outW, outH, { kernel: 'lanczos3' }).webp({ quality: 90, alphaQuality: 95, effort: 6 }).toBuffer();
writeFileSync(join(dir, 'frame.webp'), buf);
const pct = (v: number, total: number) => +((v / total) * 100).toFixed(2);
writeFileSync(
  join(dir, 'frame.json'),
  JSON.stringify({ width: outW, height: outH, opening: [pct(ox0 - fx0, fw), pct(oy0 - fy0, fh), pct(ox1 - ox0 + 1, fw), pct(oy1 - oy0 + 1, fh)] }, null, 2) + '\n',
);
console.log(`✓ family/frame.webp  ${(buf.length / 1024).toFixed(0)} KB, ${outW} × ${outH}`);

// 2. The portraits, at web size
for (const f of readdirSync(join(dir, 'source')).filter((n) => n.endsWith('.webp') && !['frame.webp', 'temple.webp'].includes(n))) {
  const out = await sharp(join(dir, 'source', f)).resize({ width: 520, withoutEnlargement: true }).webp({ quality: 84, effort: 6 }).toBuffer();
  writeFileSync(join(photos, f), out);
  console.log(`✓ photos/family/${f}  ${(out.length / 1024).toFixed(0)} KB`);
}
