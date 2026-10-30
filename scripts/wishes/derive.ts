/**
 * npm run wishes:assets → the Wishing Wall's pictures (src/assets/wishes/), from the client's two
 * pictures in src/assets/wishes/source/ (wall.webp: a temple hall with a jasmine garland, hanging blessing
 * boards, a heading and a "Write a Blessing" card; door.webp: a pair of golden doors).
 *
 * scripts/wishes/cut.py (Python, OpenCV) cuts the pieces out and cleans the hall; this script makes the
 * web pictures from them and writes src/assets/wishes/wishes.json (sizes, and where the board's lettering
 * and the card's fields go):
 *   scene.avif/.webp          the hall without its boards, chains, heading and card, in a phone's shape
 *   door-l / door-r .avif/.webp   the golden doors, cut down the middle
 *   board.webp                one hanging board (medallion, cream board, jasmine, bell), lettering rubbed out
 *   chain.webp                a few links of the gold chain, to tile
 *   orn-top / orn-bottom .webp    the gold flourishes round the heading
 *   card.webp                 the card, lettering and fields rubbed out
 * Needs python3 with numpy and opencv-python. Re-run after replacing a picture or changing scene.json.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';

const dir = join(process.cwd(), 'src/assets/wishes');
const work = mkdtempSync(join(tmpdir(), 'wishes-'));
const run = spawnSync('python3', [join(process.cwd(), 'scripts/wishes/cut.py'), work], { stdio: 'inherit' });
if (run.status !== 0) throw new Error('scripts/wishes/cut.py failed');

const kb = (n: number) => `${(n / 1024).toFixed(0)} KB`;
async function photo(name: string, { avifQ = 50, webpQ = 80 } = {}) {
  const input = join(work, `${name}.png`);
  const avif = await sharp(input).avif({ quality: avifQ, effort: 6 }).toBuffer();
  const webp = await sharp(input).webp({ quality: webpQ, effort: 6 }).toBuffer();
  writeFileSync(join(dir, `${name}.avif`), avif);
  writeFileSync(join(dir, `${name}.webp`), webp);
  console.log(`✓ wishes/${name}  avif ${kb(avif.length)}, webp ${kb(webp.length)}`);
}
async function cutout(name: string, { q = 90 } = {}) {
  const webp = await sharp(join(work, `${name}.png`)).webp({ quality: q, alphaQuality: 100, effort: 6 }).toBuffer();
  writeFileSync(join(dir, `${name}.webp`), webp);
  console.log(`✓ wishes/${name}.webp  ${kb(webp.length)}`);
}

await photo('scene');
await photo('door-l', { avifQ: 55, webpQ: 82 });
await photo('door-r', { avifQ: 55, webpQ: 82 });
await cutout('board');
await cutout('chain');
await cutout('orn-top');
await cutout('orn-bottom');
await cutout('card');
writeFileSync(join(dir, 'wishes.json'), readFileSync(join(work, 'meta.json'), 'utf8') + '\n');
