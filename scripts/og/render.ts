/**
 * npm run og → public/og-image.jpg, the 1200 × 630 link-preview image (PRD §12.3, AC-31).
 * Composed from the invitation's own fonts, ornaments and decoration slots, and rendered with the
 * installed Google Chrome. Re-run after changing the names, date or city, or when real artwork
 * replaces a placeholder in src/assets/decor/.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { wedding } from '../../src/data/wedding';
import { formatDateLong } from '../../src/lib/format';

const root = process.cwd();
const OUT = join(root, 'public/og-image.jpg');
const read = (p: string) => readFileSync(join(root, p));
const font = (pkg: string, file: string) => `data:font/woff2;base64,${read(`node_modules/@fontsource/${pkg}/files/${file}`).toString('base64')}`;
const svg = (p: string) => read(p).toString('utf8');
/** A real decoration (src/assets/decor/<name>.webp) wins over its vector placeholder, as on the site. */
const decor = (name: string) => {
  const real = ['webp', 'png', 'jpg'].map((ext) => `src/assets/decor/${name}.${ext}`).find((p) => existsSync(join(root, p)));
  if (real) return `data:image/${real.split('.').pop()};base64,${read(real).toString('base64')}`;
  return `data:image/svg+xml;base64,${read(`src/assets/placeholders/${name}.svg`).toString('base64')}`;
};

const { groom, bride } = wedding.couple;
const date = formatDateLong(wedding.ceremony.startISO);
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Cormorant; font-weight: 600; src: url(${font('cormorant-garamond', 'cormorant-garamond-latin-600-normal.woff2')}); }
@font-face { font-family: Cormorant; font-weight: 500; font-style: italic; src: url(${font('cormorant-garamond', 'cormorant-garamond-latin-500-italic.woff2')}); }
@font-face { font-family: Cinzel; font-weight: 500; src: url(${font('cinzel', 'cinzel-latin-500-normal.woff2')}); }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; overflow: hidden; position: relative; color: #4b3026;
  background: radial-gradient(ellipse 60% 70% at 50% 42%, #fffaf0 0%, #f6ead2 55%, #ead3a4 100%); }
.paper { position: absolute; inset: 0; background: url(data:image/webp;base64,${read('public/textures/paper-noise.webp').toString('base64')}); mix-blend-mode: multiply; opacity: .55; }
.gopuram { position: absolute; left: 50%; top: 40px; width: 560px; transform: translateX(-50%); opacity: .16; filter: sepia(.4); }
.medallion { position: absolute; left: 50%; top: 50%; width: 760px; transform: translate(-50%, -50%); color: #c49a45; opacity: .10; }
.medallion svg, .corner svg, .divider svg { width: 100%; height: auto; display: block; }
.border { position: absolute; inset: 22px; border: 2px solid #c49a45; }
.border::after { content: ''; position: absolute; inset: 8px; border: 1px solid rgba(196,154,69,.6); }
.corner { position: absolute; width: 120px; color: #c49a45; opacity: .8; }
.corner.tl { left: 38px; top: 38px; } .corner.tr { right: 38px; top: 38px; transform: scaleX(-1); }
.corner.bl { left: 38px; bottom: 38px; transform: scaleY(-1); } .corner.br { right: 38px; bottom: 38px; transform: scale(-1); }
.swag { position: absolute; left: 60px; top: 30px; width: calc(100% - 120px); height: 128px; object-fit: fill; }
.content { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; text-align: center; padding-top: 70px; }
.eyebrow { font: 500 24px/1 Cinzel; letter-spacing: .32em; color: #8a6420; text-transform: uppercase; }
.names { margin-top: 26px; font: 600 132px/1 Cormorant; color: #4b3026; }
.amp { font: italic 500 104px/1 Cormorant; color: #7a2635; padding: 0 .22em; }
.divider { width: 300px; margin-top: 26px; color: #c49a45; }
.details { margin-top: 22px; font: 500 26px/1.3 Cinzel; letter-spacing: .2em; text-transform: uppercase; color: #8a6420; }
</style></head><body>
<div class="paper"></div>
<img class="gopuram" src="${decor('gopuram-misty')}" alt="">
<div class="medallion">${svg('src/assets/svg/kolam-medallion.svg')}</div>
<div class="border"></div>
${['tl', 'tr', 'bl', 'br'].map((c) => `<div class="corner ${c}">${svg('src/assets/svg/kolam-corner.svg')}</div>`).join('')}
<img class="swag" src="${decor('jasmine-swag')}" alt="">
<div class="content">
  <p class="eyebrow">Wedding Invitation</p>
  <p class="names">${esc(groom.name)}<span class="amp">&amp;</span>${esc(bride.name)}</p>
  <div class="divider">${svg('src/assets/svg/divider.svg')}</div>
  <p class="details">${esc(date)} · ${esc(wedding.ceremony.city.split(',')[0])}</p>
</div>
</body></html>`;

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: OUT, type: 'jpeg', quality: 86 });
await browser.close();
console.log(`✓ ${OUT.replace(root + '/', '')} (${Math.round(statSync(OUT).size / 1024)} KB)`);
