/**
 * The bell, its chain and the R·D logo (part of npm run opening:assets), from the client's pictures:
 *   source/bell.webp        the heritage brass bell, on white
 *   source/bell-chain.webp  two bells on beaded chains, on white: only the chain is used
 *   source/monogram.webp    the R·D logo, already transparent
 * Writes bell.avif/.webp, chain.webp (one seamless repeat, tiled up to the beam), bell.json (where
 * the chain sits on the bell) and monogram.avif/.webp.
 */
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
import sharp, { type Sharp } from 'sharp';

type Rect = [number, number, number, number];

export interface BellScene {
  /** The bell kept from source/bell.webp, from its last chain link down (source pixels). */
  crop: Rect;
  /** Centre of the bell's chain, x in source pixels. */
  link: number;
  chain: {
    /** Columns of source/bell-chain.webp holding one chain; rows to search for its repeat. */
    columns: [number, number];
    search: [number, number];
    /** First row of the repeat (inside a narrow side-on link, where it meets the bell's chain). */
    start: number;
    /** How much larger the chain is drawn so its links match the bell's own. */
    scale: number;
  };
}

/**
 * Lift a picture off its white background. The background is the near-white reached from the
 * edges, plus any pure-white hole inside (the bell's ring); highlights on the metal stay solid.
 * Edges get a soft alpha from how far each pixel has moved from white towards the nearby metal.
 */
export async function cutout(file: string) {
  const { data: d, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, n = W * H;
  const lo = (i: number) => Math.min(d[i * 3], d[i * 3 + 1], d[i * 3 + 2]);
  const hi = (i: number) => Math.max(d[i * 3], d[i * 3 + 1], d[i * 3 + 2]);
  const nearWhite = (i: number) => lo(i) > 232 && hi(i) - lo(i) < 16;
  const pureWhite = (i: number) => lo(i) > 244 && hi(i) - lo(i) < 10;

  const bg = new Uint8Array(n);
  const fill = (seeds: number[], ok: (i: number) => boolean) => {
    const stack = seeds.filter((i) => !bg[i] && ok(i));
    stack.forEach((i) => (bg[i] = 1));
    while (stack.length) {
      const i = stack.pop()!, x = i % W, y = (i - x) / W;
      for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1])
        if (j >= 0 && !bg[j] && ok(j)) (bg[j] = 1), stack.push(j);
    }
  };
  const border: number[] = [];
  for (let x = 0; x < W; x++) border.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) border.push(y * W, y * W + W - 1);
  fill(border, nearWhite);
  // Enclosed holes: pure-white patches of some size not reached from the edges
  const seen = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (bg[i] || seen[i] || !pureWhite(i)) continue;
    const comp = [i], stack = [i];
    seen[i] = 1;
    while (stack.length) {
      const k = stack.pop()!, x = k % W, y = (k - x) / W;
      for (const j of [x > 0 ? k - 1 : -1, x < W - 1 ? k + 1 : -1, y > 0 ? k - W : -1, y < H - 1 ? k + W : -1])
        if (j >= 0 && !seen[j] && !bg[j] && pureWhite(j)) (seen[j] = 1), stack.push(j), comp.push(j);
    }
    if (comp.length > 40) fill(comp, nearWhite);
  }

  // Alpha: solid metal, clear background, and a soft two-pixel edge between them
  const out = Buffer.alloc(n * 4);
  const near = (i: number, r: number, want: number) => {
    const x = i % W, y = (i - x) / W;
    for (let yy = Math.max(0, y - r); yy <= Math.min(H - 1, y + r); yy++)
      for (let xx = Math.max(0, x - r); xx <= Math.min(W - 1, x + r); xx++) if (bg[yy * W + xx] === want) return true;
    return false;
  };
  for (let i = 0; i < n; i++) {
    const edge = bg[i] ? near(i, 1, 0) : near(i, 2, 1);
    let a = bg[i] ? 0 : 1;
    if (edge) {
      // The metal's darkest channel nearby, away from the edge
      const x = i % W, y = (i - x) / W, vals: number[] = [];
      for (let yy = Math.max(0, y - 5); yy <= Math.min(H - 1, y + 5); yy++)
        for (let xx = Math.max(0, x - 5); xx <= Math.min(W - 1, x + 5); xx++) {
          const j = yy * W + xx;
          if (!bg[j] && !near(j, 2, 1)) vals.push(lo(j));
        }
      vals.sort((p, q) => p - q);
      const metal = vals.length ? vals[vals.length >> 1] : 60;
      a = Math.min(1, Math.max(0, (255 - lo(i)) / Math.max(30, 255 - metal)));
    }
    for (let c = 0; c < 3; c++) out[i * 4 + c] = a > 0.02 ? Math.min(255, Math.max(0, Math.round((d[i * 3 + c] - (1 - a) * 255) / a))) : 0;
    out[i * 4 + 3] = Math.round(a * 255);
  }
  return { data: out, width: W, height: H };
}

const encode = async (dir: string, name: string, img: Sharp, formats: ('avif' | 'webp')[], webpQuality = 86) => {
  const png = await img.png().toBuffer();
  for (const f of formats) {
    const s = sharp(png);
    const buf = await (f === 'avif' ? s.avif({ quality: 60, effort: 6 }) : s.webp({ quality: webpQuality, effort: 6, alphaQuality: 90 })).toBuffer();
    writeFileSync(join(dir, `${name}.${f}`), buf);
    console.log(`✓ ${name}.${f}  ${(buf.length / 1024).toFixed(0)} KB`);
  }
};

export async function makeBell(dir: string, bell: BellScene) {
  // The bell, from its last link down, sized for phones (about 90 px wide on screen, so 360 px
  // stays sharp at three device pixels per point)
  const b = await cutout(join(dir, 'source/bell.webp'));
  const [x0, y0, x1, y1] = bell.crop;
  await encode(dir, 'bell', sharp(b.data, { raw: { width: b.width, height: b.height, channels: 4 } }).extract({ left: x0, top: y0, width: x1 - x0, height: y1 - y0 }).resize({ width: 360 }), ['avif', 'webp']);

  // The beaded chain: find its repeat (bead to bead) and cut one, starting in a side-on link
  const c = await cutout(join(dir, 'source/bell-chain.webp'));
  const [c0, c1] = bell.chain.columns, [s0, s1] = bell.chain.search;
  const row = (y: number) => { let a = 0; for (let x = c0; x < c1; x++) a += c.data[(y * c.width + x) * 4 + 3]; return a; };
  const profile = Array.from({ length: s1 - s0 }, (_, i) => row(s0 + i));
  let period = 0, best = Infinity;
  for (let p = 120; p < 300; p++) {
    let diff = 0;
    for (let i = 0; i + p < profile.length; i++) diff += Math.abs(profile[i] - profile[i + p]);
    diff /= profile.length - p;
    if (diff < best) (best = diff), (period = p);
  }
  await encode(dir, 'chain', sharp(c.data, { raw: { width: c.width, height: c.height, channels: 4 } }).extract({ left: c0, top: bell.chain.start, width: c1 - c0, height: period }), ['webp'], 90);

  // Where the chain sits on the bell image, in % of its width
  const w = x1 - x0;
  const fit = { chainCenter: +(((bell.link - x0) / w) * 100).toFixed(2), chainWidth: +((((c1 - c0) * bell.chain.scale) / w) * 100).toFixed(2) };
  writeFileSync(join(dir, 'bell.json'), JSON.stringify(fit, null, 2) + '\n');
  console.log(`  chain repeat: ${period} px; on the bell at ${fit.chainCenter}% across, ${fit.chainWidth}% wide`);
}

export async function makeMonogram(dir: string) {
  // Trimmed to the artwork; 1100 px wide stays sharp as it comes close
  const trimmed = await sharp(join(dir, 'source/monogram.webp')).trim({ threshold: 1 }).png().toBuffer();
  await encode(dir, 'monogram', sharp(trimmed).resize({ width: 1100, withoutEnlargement: true }), ['avif', 'webp'], 84);
}
