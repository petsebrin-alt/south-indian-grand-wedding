/**
 * npm run couple:assets → the Rahul and Divya pages' layers (src/assets/couple/), from the client's
 * picture source/groom-bride.webp (the groom's page on the left half, the bride's on the right), the
 * Events picture's temple background (npm run scenery:assets) and the measurements in scene.json:
 *   groom, bride      each page's photograph (AVIF + WebP): the Events picture's soft temple background
 *                     (garlands, bells, banana leaves, lamps, the tower and palms), made taller above (so
 *                     the couple can be shown smaller) by stretching its soft middle, with the person
 *                     cut out of the client's picture (source/mask-*.png, python3 scripts/couple/matte.py)
 *                     sitting on stone steps that run on below where the client's picture ends
 *   card-<id>         each polaroid (and the groom's gaming cluster), lifted out along its outline:
 *                     the rough corners in scene.json are snapped to the edges of the white frame
 *   cards.json        each card's size and the order it appears in
 * Re-run after replacing the picture or adjusting scene.json.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp, { type Sharp } from 'sharp';

const dir = join(process.cwd(), 'src/assets/couple');
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
const inside = (poly: number[][], x: number, y: number) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};

const { data: d, info } = await sharp(join(dir, 'source/groom-bride.webp')).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width;
let H = info.height;
const px = (x: number, y: number, c: number) => d[(Math.min(H - 1, Math.max(0, Math.round(y))) * W + Math.min(W - 1, Math.max(0, Math.round(x)))) * 3 + c];
// The polaroids' frames are warm white
const white = (x: number, y: number) => {
  const r = px(x, y, 0), g = px(x, y, 1), b = px(x, y, 2);
  return Math.min(r, g, b) > 212 && Math.max(r, g, b) - Math.min(r, g, b) < 42;
};

/**
 * Snap a rough quad (clockwise corners) to the frame: each edge moves along its outward normal to
 * the last white pixel before the background (the median over samples along the edge), and the
 * corners become the intersections of the moved edges.
 */
function snap(quad: number[][]) {
  const lines: { p: number[]; dir: number[] }[] = [];
  for (let e = 0; e < 4; e++) {
    const a = quad[e], b = quad[(e + 1) % 4];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const t = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
    const n = [t[1], -t[0]]; // outward for clockwise corners in screen coordinates
    const found: number[] = [];
    for (let k = 3; k <= 17; k++) {
      const s = k / 20;
      const p = [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s];
      let best: number | null = null;
      for (let o = -10; o <= 10; o++) {
        const q = (j: number) => white(p[0] + n[0] * (o + j), p[1] + n[1] * (o + j));
        if (q(0) && !q(1) && !q(2)) best = o;
      }
      if (best !== null) found.push(best);
    }
    found.sort((x, y) => x - y);
    const off = found.length >= 5 ? found[found.length >> 1] + 0.5 : 0;
    lines.push({ p: [a[0] + n[0] * off, a[1] + n[1] * off], dir: t });
  }
  const meet = (l1: { p: number[]; dir: number[] }, l2: { p: number[]; dir: number[] }) => {
    const den = l1.dir[0] * l2.dir[1] - l1.dir[1] * l2.dir[0];
    const s = ((l2.p[0] - l1.p[0]) * l2.dir[1] - (l2.p[1] - l1.p[1]) * l2.dir[0]) / den;
    return [l1.p[0] + l1.dir[0] * s, l1.p[1] + l1.dir[1] * s];
  };
  return [meet(lines[3], lines[0]), meet(lines[0], lines[1]), meet(lines[1], lines[2]), meet(lines[2], lines[3])];
}

const cardsOut: Record<string, unknown[]> = {};
const holes: Uint8Array[] = [];
for (const side of ['groom', 'bride'] as const) {
  const half = scene[side];
  const [hx0, hx1] = half.span;
  const hw = hx1 - hx0;
  const hole = new Uint8Array(W * H);
  const out: unknown[] = [];

  for (const card of half.cards) {
    const outline: number[][] = card.quad ? snap(card.quad) : card.outline;
    const polys: number[][][] = [outline, ...(card.tape ? [card.tape] : [])];
    const xs = polys.flat().map((p) => p[0]), ys = polys.flat().map((p) => p[1]);
    const bx0 = Math.floor(Math.min(...xs)) - 1, by0 = Math.floor(Math.min(...ys)) - 1;
    const bx1 = Math.ceil(Math.max(...xs)) + 1, by1 = Math.ceil(Math.max(...ys)) + 1;
    const bw = bx1 - bx0, bh = by1 - by0;
    const rgba = Buffer.alloc(bw * bh * 4);
    for (let y = 0; y < bh; y++)
      for (let x = 0; x < bw; x++) {
        // Coverage of a 4×4 grid of samples, for a smooth edge
        let cov = 0;
        for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) if (polys.some((p) => inside(p, bx0 + x + (a + 0.5) / 4, by0 + y + (b + 0.5) / 4))) cov++;
        const o = (y * bw + x) * 4;
        for (let c = 0; c < 3; c++) rgba[o + c] = px(bx0 + x, by0 + y, c);
        rgba[o + 3] = Math.round((cov / 16) * 255);
        if (cov) hole[(by0 + y) * W + bx0 + x] = 1;
      }
    await write(`card-${card.id}`, sharp(rgba, { raw: { width: bw, height: bh, channels: 4 } }), ['webp'], { avif: 0, webp: 86 });
    out.push({ id: card.id, label: card.label, column: card.column, width: bw, height: bh });
  }
  cardsOut[side] = out;

  holes.push(hole);
}


// ---------------------------------------------------------------------------------------------------
// The pages: temple backdrop, stone steps, the person
const C = scene.compose;
const PW = 768;
const TOP = C.top, FOOT = C.steps;
const PH = H + TOP + FOOT; // the page's picture, in the picture's own pixels
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const blurBox = (src: Float32Array, w: number, h: number, r: number) => {
  const tmp = new Float32Array(w * h), out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    let acc = 0;
    for (let x = -r; x <= r; x++) acc += src[y * w + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) {
      tmp[y * w + x] = acc / (2 * r + 1);
      acc += src[y * w + Math.min(w - 1, x + r + 1)] - src[y * w + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let y = -r; y <= r; y++) acc += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = acc / (2 * r + 1);
      acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
    }
  }
  return out;
};
let seed = 31;
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
/** Smooth noise, mean 0, spread about 1 */
const noise = (w: number, h: number, r: number) => {
  const n = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) n[i] = rand() * 2 - 1;
  const b = blurBox(blurBox(blurBox(n, w, h, r), w, h, r), w, h, r);
  let sq = 0;
  for (let i = 0; i < w * h; i++) sq += b[i] * b[i];
  const sd = Math.sqrt(sq / (w * h)) || 1;
  for (let i = 0; i < w * h; i++) b[i] /= sd;
  return b;
};

/** The temple, taller: the rows of `band` are stretched (the rest keep their size), the stretch easing in and out */
function taller(pic: Float32Array, band: number[], extra: number, feather: number) {
  const [a, b] = band;
  const weight = (y: number) => smoothstep(a - feather, a + feather, y) * (1 - smoothstep(b - feather, b + feather, y));
  let total = 0;
  for (let y = 0; y < H; y++) total += weight(y);
  const k = extra / total;
  const edge = new Float64Array(H + 1);
  let acc = 0;
  for (let y = 0; y <= H; y++) {
    edge[y] = y + acc;
    acc += k * weight(y);
  }
  const rows = Math.round(edge[H]);
  const out = new Float32Array(PW * rows * 3);
  let y = 0;
  for (let y2 = 0; y2 < rows; y2++) {
    while (y < H - 1 && edge[y + 1] <= y2 + 0.5) y++;
    const sy = y + (y2 + 0.5 - edge[y]) / (edge[y + 1] - edge[y]) - 0.5;
    const y0 = Math.max(0, Math.floor(sy)), y1 = Math.min(H - 1, y0 + 1), fy = Math.min(1, Math.max(0, sy - y0));
    for (let i = 0; i < PW * 3; i++) out[y2 * PW * 3 + i] = pic[y0 * PW * 3 + i] * (1 - fy) + pic[y1 * PW * 3 + i] * fy;
  }
  return { pic: out, rows };
}

/** A repeatable pseudo-random number from an integer */
const hash = (n: number) => {
  const t = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return t - Math.floor(t);
};

/** Stone steps: treads and risers in the picture's own stone colours, with grain, seams and a soft shadow at each foot */
function steps(rows: number, top: number) {
  const out = new Float32Array(PW * rows * 4); // RGBA, alpha 0 above `top`
  const P = C.stone.period, tread = Math.round(P * C.stone.tread);
  const big = noise(PW, rows, 14), mid = noise(PW, rows, 4), fine = noise(PW, rows, 1);
  const lerp = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);
  for (let y = top; y < rows; y++) {
    const depth = Math.min(1, (y - top) / (rows - top));
    const base = lerp(C.stone.light, C.stone.dark, depth);
    const n = (y - top) % P;
    const onTread = n < tread;
    const riserT = onTread ? 0 : (n - tread) / (P - tread); // 0 at the front edge of the tread above, 1 at the foot of the riser
    // The front edge of each tread is lit, the riser darkens towards its foot (the next tread's shadow)
    const lit = onTread ? 1.05 - 0.09 * (n / tread) + (n < 3 ? 0.1 : 0) : 0.78 - 0.14 * riserT + (riserT > 0.9 ? -0.12 : 0);
    const seamRow = Math.floor((y - top) / P);
    for (let x = 0; x < PW; x++) {
      // vertical seams between the stone blocks, staggered from step to step
      const blockIdx = Math.floor((x + seamRow * 67) / C.stone.block);
      const blockTone = 1 + (hash(blockIdx * 31 + seamRow * 7) - 0.5) * C.stone.blockTone;
      const sx = (x + seamRow * 67) % C.stone.block;
      const seam = (sx < 2 || sx > C.stone.block - 2) ? (onTread ? 0.93 : 0.84) : 1;
      const grain = (rand() + rand() + rand() - 1.5) * C.stone.grain;
      const pit = fine[y * PW + x] > 1.55 ? -C.stone.pit : 0; // small pits in the stone
      const v = big[y * PW + x] * C.stone.blotch + mid[y * PW + x] * C.stone.speckle + fine[y * PW + x] * 2.2 + pit;
      const o = (y * PW + x) * 4;
      for (let c = 0; c < 3; c++) out[o + c] = Math.max(0, Math.min(255, (base[c] + v) * lit * seam * blockTone + grain));
      out[o + 3] = smoothstep(top, top + C.stone.fade, y);
    }
  }
  return out;
}

/** Petals strewn on the steps: soft ellipses in the picture's reds, pinks and creams, each with a lit side */
function strewPetals(pic: Float32Array, top: number, count: number) {
  const palette = [[196, 24, 52], [214, 52, 76], [232, 96, 112], [186, 18, 44], [204, 36, 60], [222, 74, 92], [242, 214, 190]];
  for (let n = 0; n < count; n++) {
    const cx = rand() * PW, cy = top + 14 + rand() * (PH - top - 20);
    const len = 5 + rand() * 8, wid = len * (0.45 + rand() * 0.2), rot = rand() * Math.PI;
    const col = palette[Math.floor(rand() * palette.length)];
    const cr = Math.cos(rot), sr = Math.sin(rot);
    for (let y = Math.floor(cy - len); y <= Math.ceil(cy + len); y++)
      for (let x = Math.floor(cx - len); x <= Math.ceil(cx + len); x++) {
        if (x < 0 || y < 0 || x >= PW || y >= PH) continue;
        const u = (x - cx) * cr + (y - cy) * sr, v = -(x - cx) * sr + (y - cy) * cr;
        const d = (u / len) ** 2 + (v / wid) ** 2;
        if (d > 1) continue;
        const a = smoothstep(1, 0.55, d) * 0.96;
        const lit = 0.82 + 0.3 * (v / wid) * -0.5 + 0.12 * (1 - d); // the upper edge catches the light
        const i = (y * PW + x) * 3;
        for (let c = 0; c < 3; c++) pic[i + c] = pic[i + c] * (1 - a) + Math.min(255, col[c] * lit) * a;
        // a little shadow below it
        if (d > 0.75 && v > 0) for (let c = 0; c < 3; c++) pic[i + c] *= 0.93;
      }
  }
}

const personAlpha: Float32Array[] = [];
for (const [si, side] of (['groom', 'bride'] as const).entries()) {
  const [hx0] = scene[side].span;
  // The temple: this page's backdrop from the Events picture, taller by stretching its soft middle
  const bg = await sharp(join(process.cwd(), 'src/assets/events/source', `scenery-${C[side].scenery}.webp`)).removeAlpha().raw().toBuffer();
  const stretched = taller(Float32Array.from(bg), C.band, TOP, C.feather);
  const pic = new Float32Array(PW * PH * 3);
  pic.set(stretched.pic.subarray(0, Math.min(stretched.pic.length, PW * PH * 3)));
  // Below it, where the client's picture had ended, the temple floor carries on as its own reflection
  const reflect = stretched.rows;
  for (let y2 = reflect; y2 < PH; y2++) {
    const sy = reflect - 1 - (y2 - reflect);
    for (let x = 0; x < PW; x++) for (let c = 0; c < 3; c++) pic[(y2 * PW + x) * 3 + c] = stretched.pic[(Math.max(0, sy) * PW + x) * 3 + c] * 0.9;
  }
  // The steps, from the row where the person sits to the foot
  const stoneTop = C[side].stepsFrom + TOP;
  const st = steps(PH, stoneTop);
  for (let i = 0; i < PW * PH; i++) {
    const a = st[i * 4 + 3];
    if (a <= 0) continue;
    for (let c = 0; c < 3; c++) pic[i * 3 + c] = pic[i * 3 + c] * (1 - a) + st[i * 4 + c] * a;
  }
  // The person: the client's picture cut out along its mask (without the polaroids' edges), set down on the steps
  const half = await sharp(join(dir, 'source/groom-bride.webp')).extract({ left: hx0, top: 0, width: PW, height: H }).removeAlpha().raw().toBuffer();
  const mask = await sharp(join(dir, `source/mask-${side}.png`)).greyscale().raw().toBuffer();
  const cardEdge = new Float32Array(PW * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < PW; x++) cardEdge[y * PW + x] = holes[si][y * W + hx0 + x];
  const away = blurBox(blurBox(cardEdge, PW, H, 3), PW, H, 3);
  const alpha = new Float32Array(PW * PH);
  // (the picture's foot, where the person is cut off, melts into the steps over a few rows)
  for (let y = 0; y < H; y++) for (let x = 0; x < PW; x++) alpha[(y + TOP) * PW + x] = (mask[y * PW + x] / 255) * (1 - Math.min(1, away[y * PW + x] * 6)) * smoothstep(H - 1, H - 1 - C.footFade, y);
  strewPetals(pic, stoneTop + 8, C.petals);
  // A shadow on the steps below and behind the person
  const shadowSrc = new Float32Array(PW * PH);
  for (let y = H + TOP - 90; y < H + TOP - C.footFade; y++) for (let x = 0; x < PW; x++) shadowSrc[(y + 14) * PW + x] = alpha[y * PW + x];
  const shadow = blurBox(blurBox(shadowSrc, PW, PH, 10), PW, PH, 10);
  for (let i = 0; i < PW * PH; i++) {
    const sh = Math.min(0.34, shadow[i] * 0.9) * (st[i * 4 + 3] > 0 ? 1 : 0);
    if (sh > 0) for (let c = 0; c < 3; c++) pic[i * 3 + c] *= 1 - sh;
  }
  for (let y = 0; y < H; y++)
    for (let x = 0; x < PW; x++) {
      const a = alpha[(y + TOP) * PW + x];
      if (a <= 0.003) continue;
      const i = (y + TOP) * PW + x;
      for (let c = 0; c < 3; c++) pic[i * 3 + c] = pic[i * 3 + c] * (1 - a) + half[(y * PW + x) * 3 + c] * a;
    }
  personAlpha.push(alpha);
  await write(side, sharp(Buffer.from(Uint8ClampedArray.from(pic)), { raw: { width: PW, height: PH, channels: 3 } }), ['avif', 'webp'], { avif: 60, webp: 82 });
}
writeFileSync(join(dir, 'cards.json'), JSON.stringify(cardsOut, null, 2) + '\n');
