/**
 * npm run opening:assets → the opening scene's image layers, made from the supplied photographs in
 * src/assets/opening/source/ and the measurements in src/assets/opening/scene.json:
 *   entrance        the closed-door photograph (AVIF + WebP)
 *   frame           the same with the doorway cut out (transparent), shown once the doors move
 *   leaves          the two door leaves, with the buds, leaves and bells that hang in front of
 *                   the door top painted out, so they do not swing open with the doors
 *   hangings.webp   those hanging pieces alone (transparent), kept still in front of the doors
 *   courtyard       the view through the open doors (AVIF + WebP)
 *   card            the invitation card, its printed greeting cleared for live text (card.ts)
 *   bell, chain     the heritage bell on the beaded chain (pieces.ts)
 *   monogram        the R·D logo (pieces.ts)
 *   ../stage/       the desktop background: velvet, gold frame and corner spray from the card (stage.ts)
 * Re-run after replacing a source photograph or adjusting scene.json. Uses the installed Chrome.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import { makeCard } from './card';
import { makeBell, makeMonogram } from './pieces';
import { makeStage } from './stage';

const dir = join(process.cwd(), 'src/assets/opening');
const scene = JSON.parse(readFileSync(join(dir, 'scene.json'), 'utf8'));
const src = (f: string) => `data:image/webp;base64,${readFileSync(join(dir, 'source', f)).toString('base64')}`;

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
// tsx wraps named functions in a `__name` helper that does not exist inside the page.
await page.evaluate('globalThis.__name = (f) => f');

const out = await page.evaluate(
  async ({ scene, entranceSrc }) => {
    const load = (s: string) => new Promise<HTMLImageElement>((r) => { const i = new Image(); i.onload = () => r(i); i.src = s; });
    const canvas = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
    // Lossless here; the final AVIF and WebP files are encoded once, by sharp, in Node
    const encode = (c: HTMLCanvasElement) => c.toDataURL('image/png').split(',')[1];

    const img = await load(entranceSrc);
    const W = img.width, H = img.height;
    const base = canvas(W, H);
    const bg = base.getContext('2d')!;
    bg.drawImage(img, 0, 0);
    const pix = bg.getImageData(0, 0, W, H);
    const d = pix.data;
    const px = (xp: number) => Math.round((xp / 100) * W);
    const py = (yp: number) => Math.round((yp / 100) * H);

    // Inside the doorway: between the door edges, below the carved arch, above the step.
    const arch: number[][] = scene.door.arch;
    const archTop = (xp: number) => {
      for (let i = 1; i < arch.length; i++) {
        const [x0, y0] = arch[i - 1], [x1, y1] = arch[i];
        if (xp <= x1) return y0 + ((y1 - y0) * (xp - x0)) / (x1 - x0 || 1);
      }
      return arch[arch.length - 1][1];
    };
    const inDoor = (x: number, y: number) => {
      const xp = (x / W) * 100, yp = (y / H) * 100;
      return xp >= scene.door.x0 && xp <= scene.door.x1 && yp <= scene.door.y1 && yp >= archTop(xp);
    };

    // The hanging buds, leaves and bells in front of the door top, each outlined by ellipses (and
    // rectangles for clappers and chains). Inside an outline the door is painted out entirely;
    // the front layer keeps only the flower, leaf and brass pixels there.
    const region = new Uint8Array(W * H); // painted out of the door leaves
    const deco = new Uint8Array(W * H); // kept in the front layer
    // Kept in front: leaf green, petal white or pink, and brass (green is high relative to red, unlike the door's maroon and the arch's brown).
    const keep = (i: number) => {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const green = g > r + 8 && g > b + 8;
      const light = Math.min(r, g, b) > 140;
      const pink = r > 170 && g > 90 && b > 100;
      const brass = r > 90 && g > 0.52 * r && b < g;
      return green || light || pink || brass;
    };
    for (const h of scene.hangings) {
      const shapes: number[][] = h.shapes ?? [];
      const rects: number[][] = h.rects ?? [];
      const xs = [...shapes.flatMap(([cx, , rx]) => [cx - rx, cx + rx]), ...rects.flatMap(([a, , c]) => [a, c])];
      const ys = [...shapes.flatMap(([, cy, , ry]) => [cy - ry, cy + ry]), ...rects.flatMap(([, b, , e]) => [b, e])];
      for (let y = py(Math.min(...ys)); y <= py(Math.max(...ys)); y++)
        for (let x = px(Math.min(...xs)); x <= px(Math.max(...xs)); x++) {
          if (x < 0 || y < 0 || x >= W || y >= H || !inDoor(x, y)) continue;
          const xp = (x / W) * 100, yp = (y / H) * 100;
          const inside = shapes.some(([cx, cy, rx, ry]) => ((xp - cx) / rx) ** 2 + ((yp - cy) / ry) ** 2 <= 1) || rects.some(([a, b, c, e]) => xp >= a && xp <= c && yp >= b && yp <= e);
          if (!inside) continue;
          region[y * W + x] = 1;
          if (keep((y * W + x) * 4)) deco[y * W + x] = 1;
        }
    }

    // hangings.webp: the decoration alone, edges softened by one pixel
    const hang = canvas(W, H);
    const hg = hang.getContext('2d')!;
    const hp = hg.createImageData(W, H);
    for (let y = 1; y < H - 1; y++)
      for (let x = 1; x < W - 1; x++) {
        let a = 0;
        for (let k = -1; k <= 1; k++) for (let l = -1; l <= 1; l++) a += deco[(y + k) * W + x + l];
        if (!a) continue;
        const i = (y * W + x) * 4;
        hp.data[i] = d[i];
        hp.data[i + 1] = d[i + 1];
        hp.data[i + 2] = d[i + 2];
        hp.data[i + 3] = Math.round((deco[y * W + x] ? 0.55 + 0.45 * (a / 9) : 0.4 * (a / 9)) * 255);
      }
    hg.putImageData(hp, 0, 0);

    // leaves.webp: paint the decoration out of the door by carrying the door surface up from below
    const leaf = new Uint8ClampedArray(d);
    for (let x = 0; x < W; x++)
      for (let y = H - 2; y >= 0; y--) {
        if (!region[y * W + x]) continue;
        let yy = y + 1;
        while (yy < H - 1 && region[yy * W + x]) yy++;
        const s = (yy * W + x) * 4, t = (y * W + x) * 4;
        leaf[t] = leaf[s];
        leaf[t + 1] = leaf[s + 1];
        leaf[t + 2] = leaf[s + 2];
      }
    const leafFull = canvas(W, H);
    leafFull.getContext('2d')!.putImageData(new ImageData(leaf, W, H), 0, 0);

    // frame.webp: the photograph with the doorway cut out (soft 1 px edge), shown once the doors move
    const frame = canvas(W, H);
    const fg = frame.getContext('2d')!;
    fg.drawImage(img, 0, 0);
    fg.globalCompositeOperation = 'destination-out';
    fg.beginPath();
    const hole: number[][] = [[scene.door.x0, scene.door.y1], ...arch, [scene.door.x1, scene.door.y1]];
    hole.forEach(([hx, hy], i) => (i ? fg.lineTo((hx / 100) * W, (hy / 100) * H) : fg.moveTo((hx / 100) * W, (hy / 100) * H)));
    fg.closePath();
    fg.fill();

    const crop = (c: HTMLCanvasElement, x0: number, y0: number, x1: number, y1: number) => {
      const o = canvas(px(x1) - px(x0), py(y1) - py(y0));
      o.getContext('2d')!.drawImage(c, px(x0), py(y0), o.width, o.height, 0, 0, o.width, o.height);
      return o;
    };
    const dr = scene.door;
    const leaves = crop(leafFull, dr.x0, dr.y0, dr.x1, dr.y1);
    const hb = [dr.x0, dr.y0, dr.x1, 22.6];
    const hangings = crop(hang, hb[0], hb[1], hb[2], hb[3]);

    return {
      frame: encode(frame),
      leaves: encode(leaves),
      hangings: encode(hangings),
      hangingsBox: hb,
      decoPixels: deco.reduce((n, v) => n + v, 0),
    };
  },
  { scene, entranceSrc: src('entrance.webp') },
);
await browser.close();

// The large photographs get AVIF (about half the size at the same quality) plus a WebP fallback
// for older phones; the small transparent piece is WebP only.
const write = async (name: string, input: Buffer | string, formats: ('avif' | 'webp')[]) => {
  for (const f of formats) {
    const img = sharp(input);
    const buf = await (f === 'avif' ? img.avif({ quality: 52, effort: 6 }) : img.webp({ quality: name === 'hangings' ? 90 : 76, effort: 6, smartSubsample: true, alphaQuality: 90 })).toBuffer();
    writeFileSync(join(dir, `${name}.${f}`), buf);
    console.log(`✓ ${name}.${f}  ${(buf.length / 1024).toFixed(0)} KB`);
  }
};
await write('entrance', join(dir, 'source/entrance.webp'), ['avif', 'webp']);
await write('courtyard', join(dir, 'source/courtyard.webp'), ['avif', 'webp']);
for (const name of ['frame', 'leaves'] as const) await write(name, Buffer.from(out[name], 'base64'), ['avif', 'webp']);
await write('hangings', Buffer.from(out.hangings, 'base64'), ['webp']);
console.log(`  hanging pieces: ${out.decoPixels} px; layer box ${out.hangingsBox.join(', ')} (%)`);
await makeCard(dir, scene.card);
await makeBell(dir, scene.bell);
await makeMonogram(dir);
await makeStage(dir, join(process.cwd(), 'src/assets/stage'), scene.stage);
