/**
 * npm run dresscode:assets → the Dress Code page's pictures (src/assets/dresscode/), from the client's two
 * pictures in src/assets/dresscode/source/ (cards.webp: the five finished dress-code cards; garden.webp: the page,
 * a garden of jasmine garlands and bells).
 *
 * scripts/dresscode/cut.py (Python, OpenCV) cuts and cleans them; this script makes the web pictures and writes
 * src/assets/dresscode/dresscode.json (sizes, and where each card's title, tagline, label, colour discs and description
 * were, as % of the card, plus the shades the discs had):
 *   card-<id>.webp        each card with its lettering and colour discs rubbed out (the page writes them as real text)
 *   ornament.webp         the gold lotus and rules over the heading
 *   scene.avif/.webp      the garden without its heading, stack of cards and arrows, in a phone's shape
 * Needs python3 with numpy and opencv-python. Re-run after replacing a picture or changing scene.json.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';

const dir = join(process.cwd(), 'src/assets/dresscode');
const work = mkdtempSync(join(tmpdir(), 'dresscode-'));
const run = spawnSync('python3', [join(process.cwd(), 'scripts/dresscode/cut.py'), work], { stdio: 'inherit' });
if (run.status !== 0) throw new Error('scripts/dresscode/cut.py failed');

const kb = (n: number) => `${(n / 1024).toFixed(0)} KB`;
const meta = JSON.parse(readFileSync(join(work, 'meta.json'), 'utf8')) as { cards: Record<string, unknown> };

for (const id of Object.keys(meta.cards)) {
  const webp = await sharp(join(work, `card-${id}.png`)).webp({ quality: 88, alphaQuality: 100, effort: 6 }).toBuffer();
  writeFileSync(join(dir, `card-${id}.webp`), webp);
  console.log(`✓ dresscode/card-${id}.webp  ${kb(webp.length)}`);
}
const orn = await sharp(join(work, 'ornament.png')).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toBuffer();
writeFileSync(join(dir, 'ornament.webp'), orn);
console.log(`✓ dresscode/ornament.webp  ${kb(orn.length)}`);
const avif = await sharp(join(work, 'scene.png')).avif({ quality: 50, effort: 6 }).toBuffer();
const webp = await sharp(join(work, 'scene.png')).webp({ quality: 80, effort: 6 }).toBuffer();
writeFileSync(join(dir, 'scene.avif'), avif);
writeFileSync(join(dir, 'scene.webp'), webp);
console.log(`✓ dresscode/scene  avif ${kb(avif.length)}, webp ${kb(webp.length)}`);
writeFileSync(join(dir, 'dresscode.json'), JSON.stringify(meta, null, 2) + '\n');
