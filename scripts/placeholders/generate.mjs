/**
 * Vector stand-ins for the realistic decorative assets (THEME §7, §15.2).
 * They let every page composition be built and reviewed before the photographed or
 * commissioned WebP assets exist. Drop a real file named `<name>.webp` into
 * src/assets/decor/ and it replaces the placeholder automatically (src/components/Decor.astro).
 *
 *   node scripts/placeholders/generate.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = new URL('../../src/assets/placeholders/', import.meta.url);
mkdirSync(OUT, { recursive: true });

let seed = 20270407;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const r = (a, b) => a + (b - a) * rnd();
const f = (n) => +n.toFixed(1);
const deg = (rad) => (rad * 180) / Math.PI;
// `stretch` lets fabric and door panels fill a box of any proportion (object-fit: fill) instead of letterboxing.
const svg = (w, h, defs, body, { stretch = false } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"${stretch ? ' preserveAspectRatio="none"' : ''}><defs>${defs}</defs>${body}</svg>\n`;
const save = (name, content) => {
  writeFileSync(new URL(`${name}.svg`, OUT), content);
  console.log(`${name}.svg ${(content.length / 1024).toFixed(1)} KB`);
};

/* ------------------------------------------------------------------ shared gradients */

const brass = (id, dir = 'h') => `<linearGradient id="${id}" ${dir === 'h' ? 'x1="0" y1="0" x2="1" y2="0"' : 'x1="0" y1="0" x2="0" y2="1"'}>
<stop offset="0" stop-color="#6b4a1a"/><stop offset=".18" stop-color="#b5873a"/><stop offset=".38" stop-color="#f1d99b"/><stop offset=".5" stop-color="#e2bf6e"/><stop offset=".72" stop-color="#b5873a"/><stop offset="1" stop-color="#5e4115"/></linearGradient>`;
const gold = (id) => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#7a5718"/><stop offset=".22" stop-color="#c49a45"/><stop offset=".44" stop-color="#f4e3b5"/><stop offset=".62" stop-color="#c49a45"/><stop offset=".84" stop-color="#8a6420"/><stop offset="1" stop-color="#c49a45"/></linearGradient>`;
const sandstone = (id) => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">
<stop offset="0" stop-color="#b8946a"/><stop offset=".2" stop-color="#d9bb8c"/><stop offset=".45" stop-color="#f1e1c0"/><stop offset=".6" stop-color="#e6cda2"/><stop offset="1" stop-color="#a98760"/></linearGradient>`;

const jasmineDefs = `
<radialGradient id="bud" cx="38%" cy="30%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#fbf7ec"/><stop offset="1" stop-color="#ded3b5"/></radialGradient>
<linearGradient id="calyx" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9b97f"/><stop offset="1" stop-color="#5f7a38"/></linearGradient>
<radialGradient id="petal" cx="50%" cy="85%" r="90%"><stop offset="0" stop-color="#eee7cf"/><stop offset=".5" stop-color="#fffdf6"/><stop offset="1" stop-color="#e8dfc5"/></radialGradient>
<radialGradient id="rose" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#d0566a"/><stop offset=".6" stop-color="#a8323e"/><stop offset="1" stop-color="#6e1a26"/></radialGradient>
<linearGradient id="leaf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7d9a45"/><stop offset=".5" stop-color="#55722b"/><stop offset="1" stop-color="#3b5419"/></linearGradient>
<g id="b"><ellipse cx="1.4" cy="2.4" rx="6" ry="10.5" fill="#6b5a3a" opacity=".15"/><ellipse rx="6" ry="10.5" fill="url(#bud)" stroke="#d6cbab" stroke-width=".5"/><ellipse cx="-1.7" cy="-4" rx="1.6" ry="3.4" fill="#fff" opacity=".85"/><path d="M-4.2 7.6Q0 13.5 4.2 7.6Q2 11.6 0 12.2Q-2 11.6-4.2 7.6Z" fill="url(#calyx)"/></g>
<g id="fl">${[0, 1, 2, 3, 4, 5]
  .map((i) => `<ellipse cy="-7" rx="4.3" ry="7.6" fill="url(#petal)" stroke="#d9cfb1" stroke-width=".4" transform="rotate(${i * 60 + 15})"/>`)
  .join('')}<circle r="2.7" fill="#e7e1b0"/><circle r="1.2" fill="#c3bb6f"/></g>
<g id="rs"><circle r="7.2" fill="url(#rose)"/><path d="M-4-1Q0-6.2 4-1Q1 2.2-4-1ZM-3.2 2.4Q0 5.4 3.2 2.4" fill="none" stroke="#5e1420" stroke-width=".9" opacity=".7"/></g>
<path id="lf" d="M0 0C14-9 40-9 60 0C40 9 14 9 0 0Z"/>`;

/** Place jasmine buds along a parametric path p(t), t ∈ [0, 1]. */
function garland(p, { spacing = 9, scale = 1, roses = 0, flowers = 18 } = {}) {
  const pts = [];
  let prev = p(0);
  let acc = 0;
  let last = -spacing;
  for (let i = 1; i <= 2000; i++) {
    const cur = p(i / 2000);
    acc += Math.hypot(cur.x - prev.x, cur.y - prev.y);
    if (acc - last >= spacing) {
      last = acc;
      pts.push({ ...cur, a: deg(Math.atan2(cur.y - prev.y, cur.x - prev.x)) });
    }
    prev = cur;
  }
  const s = (k = 1) => f(scale * k * r(0.85, 1.08));
  const upper = pts.map((q) => `<use href="#b" transform="translate(${f(q.x)} ${f(q.y)}) rotate(${f(q.a + r(-55, 55))}) translate(0 -7.5) scale(${s(0.86)})"/>`);
  const lower = pts.map((q) => `<use href="#b" transform="translate(${f(q.x)} ${f(q.y)}) rotate(${f(q.a + 180 + r(-62, 62))}) translate(0 -8) scale(${s()})"/>`);
  const extras = pts
    .filter((_, i) => flowers && i % flowers === 7)
    .map((q) => `<use href="#fl" transform="translate(${f(q.x)} ${f(q.y + 3 * scale)}) rotate(${f(r(0, 60))}) scale(${s(1.05)})"/>`);
  const red = pts.filter((_, i) => roses && i % roses === Math.floor(roses / 2)).map((q) => `<use href="#rs" transform="translate(${f(q.x)} ${f(q.y + 4 * scale)}) scale(${s(1.1)})"/>`);
  return upper.join('') + lower.join('') + extras.join('') + red.join('');
}

/* ------------------------------------------------------------------ D-01 jasmine swag */
{
  const swag = (y0, sag) => (t) => {
    const x = -24 + t * 1128;
    return { x, y: y0 + sag * (1 - ((x - 540) / 564) ** 2) };
  };
  save('jasmine-swag', svg(1080, 300, jasmineDefs, garland(swag(10, 150), { spacing: 9.5 }) + garland(swag(26, 182), { spacing: 9, roses: 16 })));
}

/* ------------------------------------------------------------------ D-02 jasmine strands */
for (const [name, len] of [
  ['jasmine-strand-short', 300],
  ['jasmine-strand-medium', 460],
  ['jasmine-strand-long', 660],
]) {
  const path = (t) => ({ x: 30 + 3 * Math.sin((t * len) / 38), y: 4 + t * (len - 40) });
  const tassel = `<use href="#rs" transform="translate(30 ${len - 26}) scale(1.15)"/><use href="#fl" transform="translate(30 ${len - 12}) scale(1.05)"/>`;
  save(name, svg(60, len, jasmineDefs, `<path d="M30 0V${len - 30}" stroke="#cfc4a4" stroke-width="1"/>${garland(path, { spacing: 8.5, flowers: 0 })}${tassel}`));
}

/* ------------------------------------------------------------------ D-03 jasmine cluster (top-left corner) */
{
  let body = '';
  for (const [a, len] of [
    [18, 118],
    [70, 104],
    [44, 86],
  ])
    body += `<use href="#lf" fill="url(#leaf)" transform="translate(18 18) rotate(${a}) scale(${len / 60} 1.15)"/><path d="M18 18l${f(Math.cos((a * Math.PI) / 180) * len * 0.9)} ${f(Math.sin((a * Math.PI) / 180) * len * 0.9)}" stroke="#a7bd73" stroke-width="1" opacity=".7"/>`;
  for (let i = 0; i < 16; i++) {
    const a = r(4, 86);
    const d = r(30, 150);
    body += `<use href="#b" transform="translate(${f(18 + Math.cos((a * Math.PI) / 180) * d)} ${f(18 + Math.sin((a * Math.PI) / 180) * d)}) rotate(${f(a + 90 + r(-25, 25))}) scale(${f(r(1.1, 1.5))})"/>`;
  }
  for (const [x, y, sc] of [
    [46, 40, 2.3],
    [96, 34, 2],
    [36, 96, 2],
    [84, 86, 2.4],
    [140, 60, 1.7],
    [56, 140, 1.7],
  ])
    body += `<use href="#fl" transform="translate(${x} ${y}) rotate(${f(r(0, 60))}) scale(${sc})"/>`;
  save('jasmine-cluster', svg(240, 240, jasmineDefs, body));
}

/* ------------------------------------------------------------------ D-06 brass kuthuvilakku (flames are CSS) */
{
  const defs = brass('br') + brass('brv', 'v') + `<radialGradient id="oil" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#6b4b1d"/><stop offset="1" stop-color="#2e1e0b"/></radialGradient>`;
  const knop = (y, rx, ry) => `<ellipse cx="180" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#br)"/><ellipse cx="180" cy="${y - ry * 0.35}" rx="${rx * 0.8}" ry="${ry * 0.45}" fill="#f6e3ad" opacity=".35"/>`;
  const lips = [44, 112, 180, 248, 316]
    .map((x) => {
      const y = 196 + 16 * Math.sqrt(Math.max(0, 1 - ((x - 180) / 146) ** 2));
      return `<path d="M${x - 9} ${f(y + 2)}Q${x} ${f(y - 16)} ${x + 9} ${f(y + 2)}Z" fill="url(#br)"/>`;
    })
    .join('');
  const body = `
<ellipse cx="180" cy="888" rx="156" ry="12" fill="#3a2a14" opacity=".22"/>
<path d="M28 884C28 858 70 846 112 840C138 836 150 820 154 800H206C210 820 222 836 248 840C290 846 332 858 332 884Z" fill="url(#br)"/>
<path d="M40 872C80 860 280 860 320 872" fill="none" stroke="#5e4115" stroke-width="2" opacity=".5"/>
<ellipse cx="180" cy="840" rx="72" ry="10" fill="#f4e1a6" opacity=".4"/>
${knop(796, 36, 10)}
<rect x="166" y="300" width="28" height="492" fill="url(#br)"/>
${knop(722, 31, 9)}<circle cx="180" cy="662" r="24" fill="url(#br)"/>${knop(602, 27, 8)}${knop(472, 31, 9)}<circle cx="180" cy="412" r="20" fill="url(#br)"/>${knop(352, 27, 8)}
<path d="M166 304C166 272 140 252 118 240H242C220 252 194 272 194 304Z" fill="url(#br)"/>
<path d="M32 196C58 234 120 246 180 246S302 234 328 196Z" fill="url(#br)"/>
<ellipse cx="180" cy="196" rx="148" ry="16" fill="url(#br)"/><ellipse cx="180" cy="197" rx="134" ry="11" fill="url(#oil)"/>
${lips}
<rect x="174" y="118" width="12" height="80" fill="url(#br)"/>${knop(158, 16, 5)}${knop(124, 13, 4)}
<path d="M180 36C202 66 206 94 180 118C154 94 158 66 180 36Z" fill="url(#br)"/>
<path d="M180 46C170 70 170 96 180 116M180 46C190 70 190 96 180 116" fill="none" stroke="#6b4a1a" stroke-width="1.5" opacity=".6"/>`;
  save('kuthuvilakku', svg(360, 900, defs, body));
}

/* ------------------------------------------------------------------ D-07 agal diya (flame is CSS) */
save(
  'agal-diya',
  svg(
    160,
    120,
    brass('br'),
    `<ellipse cx="80" cy="110" rx="62" ry="6" fill="#3a2a14" opacity=".2"/><path d="M14 64C26 104 118 112 140 74L156 60C140 62 132 66 126 66C96 72 46 72 14 64Z" fill="url(#br)"/><ellipse cx="72" cy="66" rx="58" ry="9" fill="#4a3416"/><path d="M14 64C46 72 96 72 126 66" fill="none" stroke="#f4e1a6" stroke-width="2" opacity=".6"/>`,
  ),
);

/* ------------------------------------------------------------------ D-08 temple bell */
{
  let chain = '';
  for (let y = 4, i = 0; y < 104; y += 12, i++) chain += `<ellipse cx="45" cy="${y}" rx="${i % 2 ? 3 : 4.5}" ry="6" fill="none" stroke="url(#br)" stroke-width="2.4"/>`;
  save(
    'temple-bell',
    svg(
      90,
      220,
      brass('br'),
      `${chain}<circle cx="45" cy="112" r="6" fill="url(#br)"/><path d="M45 114C22 114 19 150 16 186L9 198H81L74 186C71 150 68 114 45 114Z" fill="url(#br)"/><ellipse cx="45" cy="198" rx="36" ry="6" fill="url(#br)"/><path d="M24 150C26 132 34 122 45 120" fill="none" stroke="#fff6d6" stroke-width="3" opacity=".45"/><circle cx="45" cy="208" r="6" fill="url(#br)"/><path d="M16 172H74" stroke="#6b4a1a" stroke-width="1.5" opacity=".5"/>`,
    ),
  );
}

/* ------------------------------------------------------------------ D-09 carved sandstone pillar */
{
  const lotus = (cx, cy, rr) =>
    [...Array(12)].map((_, i) => `<ellipse cx="${cx}" cy="${cy - rr * 0.55}" rx="${rr * 0.18}" ry="${rr * 0.45}" transform="rotate(${i * 30} ${cx} ${cy})"/>`).join('') +
    `<circle cx="${cx}" cy="${cy}" r="${rr * 0.22}"/>`;
  const beads = (y, x0, x1) => {
    let s = '';
    for (let x = x0; x <= x1; x += 12) s += `<circle cx="${x}" cy="${y}" r="3.6"/>`;
    return s;
  };
  const panel = (y) =>
    `<rect x="70" y="${y}" width="100" height="130" rx="6" fill="#d2b183" stroke="#8a6a44" stroke-opacity=".45" stroke-width="2"/><g fill="#e9d3aa" stroke="#8a6a44" stroke-opacity=".4" stroke-width="1.2">${lotus(120, y + 65, 46)}</g>`;
  const band = (y) => `<rect x="48" y="${y}" width="144" height="26" fill="url(#ss)" stroke="#8a6a44" stroke-opacity=".4"/><g fill="#c7a679" stroke="#8a6a44" stroke-opacity=".3">${beads(y + 13, 56, 186)}</g>`;
  const body = `
<rect x="0" y="0" width="240" height="56" fill="url(#ss)" stroke="#8a6a44" stroke-opacity=".45" stroke-width="2"/><path d="M6 18H234M6 38H234" stroke="#8a6a44" stroke-opacity=".35"/>
<path d="M0 56H240V86C214 86 204 108 198 136H42C36 108 26 86 0 86Z" fill="url(#ss)" stroke="#8a6a44" stroke-opacity=".45" stroke-width="2"/>
<path d="M18 86C18 112 28 132 42 136M222 86C222 112 212 132 198 136" fill="none" stroke="#8a6a44" stroke-opacity=".5" stroke-width="2"/>
<rect x="44" y="136" width="152" height="40" fill="url(#ss)" stroke="#8a6a44" stroke-opacity=".4"/><g fill="#c7a679">${beads(156, 52, 188)}</g>
<path d="M52 176C30 212 30 250 62 272H178C210 250 210 212 188 176Z" fill="url(#ss)" stroke="#8a6a44" stroke-opacity=".45" stroke-width="2"/>
<path d="M78 180C70 210 72 240 86 270M104 180C100 210 100 240 106 270M136 180C140 210 140 240 134 270M162 180C170 210 168 240 154 270" fill="none" stroke="#8a6a44" stroke-opacity=".35"/>
<rect x="56" y="272" width="128" height="1330" fill="url(#ss)"/>
<path d="M82 272V1602M98 272V1602M142 272V1602M158 272V1602" stroke="#8a6a44" stroke-opacity=".18" stroke-width="2"/>
${band(300)}${panel(345)}${band(500)}${band(680)}${panel(725)}${band(880)}${band(1060)}${panel(1105)}${band(1260)}${band(1420)}${panel(1460)}
<rect x="40" y="1602" width="160" height="58" fill="url(#ss)" stroke="#8a6a44" stroke-opacity=".45" stroke-width="2"/>
<rect x="24" y="1660" width="192" height="60" fill="url(#ss)" stroke="#8a6a44" stroke-opacity=".45" stroke-width="2"/>
<rect x="8" y="1720" width="224" height="80" fill="url(#ss)" stroke="#8a6a44" stroke-opacity=".45" stroke-width="2"/><path d="M14 1746H226M14 1772H226" stroke="#8a6a44" stroke-opacity=".3"/>`;
  // Slender proportions (≈1:10) so pillars frame a phone page without crowding the centre.
  save('temple-pillar', svg(172, 1800, sandstone('ss'), `<g transform="scale(0.716 1)">${body}</g>`));
}

/* ------------------------------------------------------------------ D-10 carved temple arch with gilded crest */
{
  const opening = 'M176 1340V570C176 412 362 312 540 312S904 412 904 570V1340Z';
  const outer = 'M0 1340V430C0 268 262 156 540 136C818 156 1080 268 1080 430V1340Z';
  let niches = '';
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const a = Math.PI * (1 - t);
    const x = 540 + Math.cos(a) * 452;
    const y = 470 - Math.sin(a) * 262;
    niches += `<path d="M${f(x - 14)} ${f(y + 16)}V${f(y)}A14 14 0 0 1 ${f(x + 14)} ${f(y)}V${f(y + 16)}Z" fill="#c9a878" stroke="#8a6a44" stroke-opacity=".4"/>`;
  }
  const kalasam = (x, s = 1) =>
    `<g transform="translate(${x} 110) scale(${s})"><path d="M-22 0C-30-18-26-36 0-40C26-36 30-18 22 0Z" fill="url(#gd)"/><rect x="-10" y="-50" width="20" height="10" fill="url(#gd)"/><path d="M0-96C10-80 12-62 0-50C-12-62-10-80 0-96Z" fill="url(#gd)"/><rect x="-28" y="0" width="56" height="10" fill="url(#gd)"/></g>`;
  const body = `
<path d="${outer} ${opening}" fill-rule="evenodd" fill="url(#ss)" stroke="#8a6a44" stroke-opacity=".5" stroke-width="3"/>
<path d="M150 1340V560C150 392 350 286 540 286S930 392 930 560V1340" fill="none" stroke="#8a6a44" stroke-opacity=".45" stroke-width="3"/>
<path d="M40 1340V440C40 296 280 196 540 178S1040 296 1040 440V1340" fill="none" stroke="#8a6a44" stroke-opacity=".35" stroke-width="2"/>
${niches}
<g fill="none" stroke="#8a6a44" stroke-opacity=".55" stroke-width="3"><path d="M176 570c-40 6-60 40-40 64s56 8 52-20-36-26-40-6"/><path d="M904 570c40 6 60 40 40 64s-56 8-52-20 36-26 40-6"/></g>
<path d="M60 700H140M60 1000H140M940 700H1020M940 1000H1020" stroke="#8a6a44" stroke-opacity=".35" stroke-width="3"/>
${kalasam(470, 0.8)}${kalasam(540, 1)}${kalasam(610, 0.8)}`;
  save('temple-arch', svg(1080, 1340, sandstone('ss') + gold('gd'), body));
}

/* ------------------------------------------------------------------ D-11 temple doors (left leaf; right is mirrored) */
for (const side of ['left', 'right']) {
  const inner = side === 'left' ? 334 : 46;
  let studs = '';
  for (const [y0, y1] of [
    [70, 290],
    [760, 940],
  ])
    for (let y = y0; y <= y1; y += 44) for (let x = 80; x <= 300; x += 44) studs += `<circle cx="${x}" cy="${y}" r="7" fill="url(#stud)"/>`;
  const body = `
<rect width="380" height="1000" fill="url(#lac)"/>
<rect x="9" y="9" width="362" height="982" fill="none" stroke="url(#gd)" stroke-width="14"/>
<rect x="44" y="44" width="292" height="270" fill="none" stroke="url(#gd)" stroke-width="5"/>
<rect x="44" y="344" width="292" height="380" fill="none" stroke="url(#gd)" stroke-width="5"/>
<rect x="44" y="734" width="292" height="230" fill="none" stroke="url(#gd)" stroke-width="5"/>
${studs}
<g transform="translate(190 534)">${[...Array(16)].map((_, i) => `<ellipse cy="-52" rx="11" ry="30" fill="url(#gd)" opacity=".92" transform="rotate(${i * 22.5})"/>`).join('')}<circle r="26" fill="url(#gd)"/><circle r="12" fill="#5e1c28"/></g>
<rect x="${side === 'left' ? 362 : 0}" y="0" width="18" height="1000" fill="url(#gd)"/>
<circle cx="${inner}" cy="534" r="10" fill="url(#stud)"/><circle cx="${inner}" cy="574" r="30" fill="none" stroke="url(#gd)" stroke-width="7"/>`;
  save(
    `temple-door-${side}`,
    svg(
      380,
      1000,
      `<linearGradient id="lac" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5e1c28"/><stop offset=".5" stop-color="#8a2c3b"/><stop offset="1" stop-color="#4f1520"/></linearGradient>${gold('gd')}<radialGradient id="stud" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#fff2c4"/><stop offset=".5" stop-color="#c49a45"/><stop offset="1" stop-color="#6b4a1a"/></radialGradient>`,
      body,
      { stretch: true },
    ),
  );
}

/* ------------------------------------------------------------------ D-12 misty gopuram backdrop */
{
  let tiers = '';
  let y = 1040;
  let half = 400;
  for (let i = 0; i < 7; i++) {
    const h = 110 - i * 6;
    const top = y - h;
    const halfTop = half - 34;
    tiers += `<path d="M${540 - half} ${y}L${540 - halfTop} ${top}H${540 + halfTop}L${540 + half} ${y}Z" fill="#e6d1aa"/><path d="M${540 - half - 8} ${y}H${540 + half + 8}" stroke="#c9ab7c" stroke-width="6" opacity=".7"/>`;
    for (let x = 540 - halfTop + 30; x < 540 + halfTop - 20; x += 56) tiers += `<path d="M${x} ${y - 12}V${top + 26}A12 12 0 0 1 ${x + 24} ${top + 26}V${y - 12}Z" fill="#d7bd90" opacity=".85"/>`;
    y = top;
    half = halfTop;
  }
  const kal = [...Array(7)].map((_, i) => `<path d="M${470 + i * 23} ${y - 54}c-6-10-4-20 4-24c8 4 10 14 4 24z" fill="#d4b06a"/>`).join('');
  const body = `<rect x="150" y="1040" width="780" height="360" fill="#e9d6b2"/><path d="M490 1400V1210A50 50 0 0 1 590 1210V1400Z" fill="#cdb084"/>${tiers}<path d="M${540 - half - 20} ${y}C${540 - half} ${y - 70} ${540 + half} ${y - 70} ${540 + half + 20} ${y}Z" fill="#e2c99c"/>${kal}<rect width="1080" height="1400" fill="url(#mist)"/>`;
  save(
    'gopuram-misty',
    svg(1080, 1400, `<linearGradient id="mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff9ef" stop-opacity=".25"/><stop offset=".7" stop-color="#fff9ef" stop-opacity=".45"/><stop offset="1" stop-color="#fff9ef" stop-opacity=".95"/></linearGradient>`, body),
  );
}

/* ------------------------------------------------------------------ D-13 mango-leaf thoranam */
{
  let body = '<path d="M-10 16C300 26 780 26 1090 16" fill="none" stroke="#a88a5a" stroke-width="3"/>';
  for (let x = 12, i = 0; x < 1080; x += 30, i++) {
    const y = 16 + 8 * Math.sin((x / 1080) * Math.PI);
    if (i % 4 === 2) {
      body += `<g transform="translate(${x} ${f(y + 4)})"><circle r="13" fill="url(#mg)"/>${[...Array(12)].map((_, k) => `<circle cx="${f(Math.cos((k * Math.PI) / 6) * 9)}" cy="${f(Math.sin((k * Math.PI) / 6) * 9)}" r="4" fill="#e0861c" opacity=".8"/>`).join('')}<circle r="4" fill="#b85e10"/></g>`;
    } else {
      const len = r(74, 96);
      body += `<g transform="translate(${x} ${f(y)}) rotate(${f(r(-7, 7))})"><path d="M0 0C11 20 11 ${f(len * 0.62)} 0 ${f(len)}C-11 ${f(len * 0.62)}-11 20 0 0Z" fill="url(#mango)"/><path d="M0 4V${f(len - 6)}" stroke="#b6c97d" stroke-width="1.2" opacity=".75"/></g>`;
    }
  }
  save(
    'mango-toran',
    svg(
      1080,
      130,
      `<linearGradient id="mango" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7f9c3c"/><stop offset=".55" stop-color="#4f6d22"/><stop offset="1" stop-color="#34501a"/></linearGradient><radialGradient id="mg" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#f8c04a"/><stop offset=".6" stop-color="#ef9a26"/><stop offset="1" stop-color="#c46a12"/></radialGradient>`,
      body,
    ),
  );
}

/* ------------------------------------------------------------------ D-15 ivory silk swag with zari border */
{
  const curve = 'M0 70C180 250 900 250 1080 70';
  let folds = '';
  for (let i = 1; i < 7; i++) folds += `<path d="M${i * 150} 0C${i * 150 + (i - 3.5) * 14} 80 ${540 + (i - 3.5) * 120} 150 ${540 + (i - 3.5) * 110} 196" fill="none" stroke="#cdb48a" stroke-width="2" opacity=".35"/>`;
  const body = `<path d="M0 0H1080V70C900 250 180 250 0 70Z" fill="url(#silk)"/>${folds}<path d="${curve}" fill="none" stroke="url(#gd)" stroke-width="20"/><path d="${curve}" fill="none" stroke="#7a2635" stroke-width="4" stroke-dasharray="2 14" opacity=".7"/><path d="M0 48C180 228 900 228 1080 48" fill="none" stroke="#c49a45" stroke-width="2" opacity=".7"/>
<g fill="url(#gd)"><circle cx="24" cy="70" r="16"/><circle cx="1056" cy="70" r="16"/><path d="M14 84L8 150M24 86V156M34 84L40 150M1046 84L1040 150M1056 86V156M1066 84L1072 150" stroke="#c49a45" stroke-width="3"/></g>`;
  save(
    'silk-drape',
    svg(
      1080,
      260,
      `<radialGradient id="silk" cx="50%" cy="30%" r="80%"><stop offset="0" stop-color="#fffdf8"/><stop offset=".55" stop-color="#f7efde"/><stop offset="1" stop-color="#e8d9b9"/></radialGradient>${gold('gd')}`,
      body,
    ),
  );
}

/* ------------------------------------------------------------------ D-20 scroll roller */
save(
  'scroll-roller',
  svg(
    960,
    44,
    `<linearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4b2f1b"/><stop offset=".45" stop-color="#a87a4f"/><stop offset="1" stop-color="#4b2f1b"/></linearGradient>${gold('gd')}`,
    `<rect x="24" y="9" width="912" height="26" rx="13" fill="url(#wood)"/><rect x="6" y="5" width="34" height="34" rx="8" fill="url(#gd)"/><rect x="920" y="5" width="34" height="34" rx="8" fill="url(#gd)"/><circle cx="4" cy="22" r="6" fill="url(#gd)"/><circle cx="956" cy="22" r="6" fill="url(#gd)"/>`,
  ),
);

/* ------------------------------------------------------------------ S-12 sacred emblem: Shankha · Srivari Namam · Chakra */
{
  const petals = [...Array(11)].map((_, i) => `<path d="M${30 + i * 24} 166C${18 + i * 24} 150 ${22 + i * 24} 136 ${30 + i * 24} 128C${38 + i * 24} 136 ${42 + i * 24} 150 ${30 + i * 24} 166Z" fill="url(#gd)" opacity=".9"/>`).join('');
  const flames = [...Array(16)]
    .map((_, i) => {
      const a = (i * Math.PI) / 8;
      const p = (rr, da = 0) => `${f(238 + Math.cos(a + da) * rr)} ${f(74 + Math.sin(a + da) * rr)}`;
      return `<path d="M${p(44, -0.12)}Q${p(54, -0.05)} ${p(60)}Q${p(54, 0.05)} ${p(44, 0.12)}Z" fill="url(#gd)"/>`;
    })
    .join('');
  const spokes = [...Array(12)]
    .map((_, i) => {
      const a = (i * Math.PI) / 6;
      return `<path d="M${f(238 + Math.cos(a) * 11)} ${f(74 + Math.sin(a) * 11)}L${f(238 + Math.cos(a) * 38)} ${f(74 + Math.sin(a) * 38)}" stroke="url(#gd)" stroke-width="3"/>`;
    })
    .join('');
  const body = `${petals}
<g stroke="url(#gd)" stroke-width="2.4" stroke-linejoin="round">
<path d="M84 54C104 62 108 98 86 122L70 136" fill="#fbf4e3"/>
<path d="M58 30C78 30 92 44 92 64C92 90 80 112 64 134L60 150L56 134C44 114 34 92 34 66C34 46 42 32 58 30Z" fill="#fffdf8"/>
<path d="M44 34C48 22 56 14 62 10C68 14 74 22 76 32" fill="#fffdf8"/><path d="M50 26Q62 20 72 26M54 18Q62 14 68 18" fill="none" stroke-width="1.4"/>
<path d="M40 56Q62 48 88 56M37 78Q62 70 90 78M41 100Q62 93 84 100M48 120Q62 115 74 120" fill="none" stroke-width="1.5"/>
<path d="M86 62C98 72 99 98 84 114" fill="none" stroke-width="1.3"/></g>
<path d="M124 28C124 16 142 16 142 28V110C142 124 158 124 158 110V28C158 16 176 16 176 28V112C176 142 124 142 124 112Z" fill="#fffdf8" stroke="url(#gd)" stroke-width="2.4"/>
<rect x="146" y="20" width="8" height="112" rx="4" fill="#a8323e"/>
<circle cx="238" cy="74" r="44" fill="none" stroke="url(#gd)" stroke-width="5"/>${flames}<circle cx="238" cy="74" r="38" fill="none" stroke="url(#gd)" stroke-width="1.5"/>${spokes}<circle cx="238" cy="74" r="11" fill="url(#gd)"/><circle cx="238" cy="74" r="4" fill="#a8323e"/>`;
  save('sacred-emblem', svg(300, 172, gold('gd'), body));
}

/* ------------------------------------------------------------------ D-30 / D-31 petals for particles */
for (let i = 1; i <= 3; i++) {
  const w = [20, 24, 18][i - 1];
  save(
    `rose-petal-${i}`,
    svg(
      64,
      64,
      `<radialGradient id="p" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#d4677a"/><stop offset=".6" stop-color="#a8323e"/><stop offset="1" stop-color="#6e1a26"/></radialGradient>`,
      `<path d="M32 60C${32 - w} 48 ${32 - w - 4} 18 32 6C${32 + w + 4} 18 ${32 + w} 48 32 60Z" fill="url(#p)" transform="rotate(${i * 25 - 30} 32 32)"/><path d="M32 54C30 40 31 24 33 12" stroke="#f2a4b0" stroke-width="1" opacity=".5" fill="none" transform="rotate(${i * 25 - 30} 32 32)"/>`,
    ),
  );
  save(
    `jasmine-petal-${i}`,
    svg(
      64,
      64,
      jasmineDefs,
      i === 3
        ? `<use href="#fl" transform="translate(32 32) scale(2.6)"/>`
        : `<ellipse cx="32" cy="32" rx="${i === 1 ? 9 : 7}" ry="22" fill="url(#petal)" stroke="#d9cfb1" stroke-width=".6" transform="rotate(${i * 40} 32 32)"/>`,
    ),
  );
}

/* ------------------------------------------------------------------ S-15 zari band (repeating tile) */
{
  let s = '';
  for (let x = 3; x < 240; x += 6) s += `<circle cx="${x}" cy="3" r="1.3"/><circle cx="${x}" cy="25" r="1.3"/>`;
  for (let x = 30; x < 240; x += 60)
    s += `<path d="M${x} 21C${x - 9} 21 ${x - 10} 8 ${x - 1} 6C${x + 7} 5 ${x + 10} 10 ${x + 6} 15C${x + 4} 18 ${x + 1} 15 ${x + 3} 13" /><g transform="translate(${x + 30} 14)">${[0, 1, 2, 3].map((k) => `<ellipse cy="-4" rx="2" ry="4" transform="rotate(${k * 90})"/>`).join('')}</g>`;
  save('zari-band', svg(240, 28, gold('gd'), `<g fill="url(#gd)">${s}</g>`));
}

/* ------------------------------------------------------------------ D-17 gold filigree corner (top-left) */
save(
  'gold-filigree',
  svg(
    160,
    160,
    gold('gd'),
    `<g fill="none" stroke="url(#gd)" stroke-width="3.2" stroke-linecap="round"><path d="M8 8H112M8 8V112"/><path d="M8 24C40 24 56 40 56 64C56 80 44 86 36 80C28 74 34 62 42 66"/><path d="M24 8C24 40 40 56 64 56C80 56 86 44 80 36C74 28 62 34 66 42"/><path d="M60 14C82 14 96 24 102 40M14 60C14 82 24 96 40 102"/></g><g fill="url(#gd)"><circle cx="8" cy="8" r="6"/><path d="M112 8C120 2 128 4 132 8C128 12 120 14 112 8Z"/><path d="M8 112C2 120 4 128 8 132C12 128 14 120 8 112Z"/></g>`,
  ),
);

/* ------------------------------------------------------------------ D-17 kalasam crest */
save(
  'kalasam-crest',
  svg(
    120,
    120,
    gold('gd') + `<linearGradient id="lv" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8aa04a"/><stop offset="1" stop-color="#4f6d22"/></linearGradient>`,
    `${[-50, -25, 0, 25, 50].map((a) => `<path d="M60 52C66 38 66 22 60 8C54 22 54 38 60 52Z" fill="url(#lv)" transform="rotate(${a} 60 56)"/>`).join('')}<ellipse cx="60" cy="40" rx="13" ry="15" fill="#8a6a44"/><path d="M38 108C22 92 26 64 48 58H72C94 64 98 92 82 108Z" fill="url(#gd)"/><rect x="44" y="50" width="32" height="10" rx="3" fill="url(#gd)"/><path d="M34 86H86" stroke="#7a5718" stroke-width="2" opacity=".6"/>`,
  ),
);

/* ------------------------------------------------------------------ S-06 gold arch nameplate frame + D-04 garland along it */
{
  const archPath = (inset) => {
    const l = 20 + inset;
    const rr = 320 - inset;
    const top = 60 + inset * 1.3;
    return `M${l} 452V${200 + inset * 0.2}C${l} ${top + 50} ${110 + inset * 0.6} ${top} 170 ${top - 10}C${230 - inset * 0.6} ${top} ${rr} ${top + 50} ${rr} ${200 + inset * 0.2}V452Z`;
  };
  const crest = `<g transform="translate(130 0) scale(0.66)"><use href="#k"/></g>`;
  const kal = `<g id="k">${[-50, -25, 0, 25, 50].map((a) => `<path d="M60 52C66 38 66 22 60 8C54 22 54 38 60 52Z" fill="#6f8a3a" transform="rotate(${a} 60 56)"/>`).join('')}<path d="M38 108C22 92 26 64 48 58H72C94 64 98 92 82 108Z" fill="url(#gd)"/></g>`;
  save(
    'arch-nameplate',
    svg(
      340,
      460,
      gold('gd') + `<linearGradient id="plate" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf8"/><stop offset="1" stop-color="#f4ead6"/></linearGradient>${kal}`,
      `<path d="${archPath(0)}" fill="url(#plate)" stroke="url(#gd)" stroke-width="5"/><path d="${archPath(12)}" fill="none" stroke="url(#gd)" stroke-width="1.6"/><path d="${archPath(18)}" fill="none" stroke="#c49a45" stroke-width=".8" opacity=".6"/>${crest}`,
    ),
  );
  const top = 60;
  const arcPoint = (t) => {
    // follows the outer arch from the left foot (t=0) over the apex to the right foot (t=1)
    const pts = [
      [20, 300],
      [20, 200],
      [20, top + 50],
      [110, top],
      [170, top - 10],
    ];
    const cubic = (p0, p1, p2, p3, u) => [0, 1].map((k) => (1 - u) ** 3 * p0[k] + 3 * (1 - u) ** 2 * u * p1[k] + 3 * (1 - u) * u ** 2 * p2[k] + u ** 3 * p3[k]);
    const side = t < 0.5 ? t * 2 : (1 - t) * 2;
    let x;
    let y;
    if (side < 0.35) {
      x = 20;
      y = 300 - (side / 0.35) * 100;
    } else {
      [x, y] = cubic(pts[1], pts[2], pts[3], pts[4], (side - 0.35) / 0.65);
    }
    return { x: t < 0.5 ? x : 340 - x, y };
  };
  save('arch-garland', svg(340, 460, jasmineDefs, garland(arcPoint, { spacing: 7, scale: 0.62, roses: 9, flowers: 0 })));
}

/* ------------------------------------------------------------------ S-09 beaded oval frame */
{
  let beads = '';
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    beads += `<circle cx="${f(80 + Math.cos(a) * 74)}" cy="${f(100 + Math.sin(a) * 94)}" r="2.4"/>`;
  }
  save(
    'oval-frame',
    svg(
      160,
      200,
      gold('gd'),
      `<ellipse cx="80" cy="100" rx="70" ry="90" fill="none" stroke="url(#gd)" stroke-width="5"/><ellipse cx="80" cy="100" rx="64" ry="84" fill="none" stroke="#c49a45" stroke-width="1"/><g fill="url(#gd)">${beads}<path d="M80 2C90 8 92 16 80 22C68 16 70 8 80 2ZM80 198C90 192 92 184 80 178C68 184 70 192 80 198Z"/><path d="M62 10C70 4 76 6 80 12M98 10C90 4 84 6 80 12M62 190C70 196 76 194 80 188M98 190C90 196 84 194 80 188" stroke="#c49a45" stroke-width="2" fill="none"/></g>`,
    ),
  );
}

/* ================================================================== Phase 3 */

const marigoldDefs = `<radialGradient id="mgo" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#f8c04a"/><stop offset=".6" stop-color="#ef9a26"/><stop offset="1" stop-color="#c46a12"/></radialGradient>
<radialGradient id="mgy" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#fde27a"/><stop offset=".6" stop-color="#f4bf2e"/><stop offset="1" stop-color="#cf8f12"/></radialGradient>
<g id="mo"><circle r="12" fill="url(#mgo)"/>${[...Array(12)].map((_, k) => `<circle cx="${f(Math.cos((k * Math.PI) / 6) * 8.5)}" cy="${f(Math.sin((k * Math.PI) / 6) * 8.5)}" r="4" fill="#e0861c" opacity=".75"/>`).join('')}<circle r="4" fill="#b85e10"/></g>
<g id="my"><circle r="12" fill="url(#mgy)"/>${[...Array(12)].map((_, k) => `<circle cx="${f(Math.cos((k * Math.PI) / 6) * 8.5)}" cy="${f(Math.sin((k * Math.PI) / 6) * 8.5)}" r="4" fill="#e9a91e" opacity=".75"/>`).join('')}<circle r="4" fill="#c8840f"/></g>
<linearGradient id="gleaf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7f9c3c"/><stop offset="1" stop-color="#3f5a1b"/></linearGradient>`;

/** Marigold heads along a parametric path p(t). */
function marigolds(p, { spacing = 20, scale = 1 } = {}) {
  let s = '';
  let prev = p(0);
  let acc = 0;
  let last = -spacing;
  let i = 0;
  for (let k = 1; k <= 1500; k++) {
    const cur = p(k / 1500);
    acc += Math.hypot(cur.x - prev.x, cur.y - prev.y);
    if (acc - last >= spacing) {
      last = acc;
      s += `<use href="#${i++ % 2 ? 'my' : 'mo'}" transform="translate(${f(cur.x)} ${f(cur.y)}) scale(${f(scale * r(0.9, 1.08))})"/>`;
    }
    prev = cur;
  }
  return s;
}

/* D-04 jasmine-and-rose wreath (event medallions) */
{
  const circle = (t) => ({ x: 160 + Math.cos(t * Math.PI * 2) * 124, y: 160 + Math.sin(t * Math.PI * 2) * 124 });
  save('jasmine-wreath', svg(320, 320, jasmineDefs, `<circle cx="160" cy="160" r="124" fill="none" stroke="#7f9c3c" stroke-width="5" opacity=".55"/>${garland(circle, { spacing: 7.5, scale: 0.95, roses: 8, flowers: 11 })}`));
}

/* D-04 carved teak signboard (lettering is live text) */
{
  const board = 'M30 70H360C390 70 410 40 450 26C490 40 510 70 540 70H870Q886 70 886 86V214Q886 230 870 230H30Q14 230 14 214V86Q14 70 30 70Z';
  const rosette = (x, y) => `<g transform="translate(${x} ${y})">${[...Array(8)].map((_, k) => `<ellipse cy="-9" rx="4" ry="9" fill="url(#gd)" transform="rotate(${k * 45})"/>`).join('')}<circle r="5" fill="#7a2635"/></g>`;
  save(
    'celebration-signboard',
    svg(
      900,
      250,
      gold('gd') + `<linearGradient id="teak" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5a32"/><stop offset=".5" stop-color="#a8774a"/><stop offset="1" stop-color="#5e3a1d"/></linearGradient>`,
      `<path d="${board}" fill="url(#teak)" stroke="#4a2c14" stroke-width="3"/><path d="M44 90H866V210H34V90Z" fill="none" stroke="url(#gd)" stroke-width="4"/><path d="M52 98H858V202H42V98Z" fill="none" stroke="url(#gd)" stroke-width="1.4"/>${rosette(60, 150)}${rosette(840, 150)}<path d="M430 46Q450 34 470 46" fill="none" stroke="url(#gd)" stroke-width="3"/><circle cx="450" cy="54" r="7" fill="url(#gd)"/>`,
    ),
  );
}

/* D-05 marigold swag, strand and corner cluster */
{
  const swag = (t) => {
    const x = -10 + t * 1100;
    return { x, y: 14 + 120 * (1 - ((x - 540) / 550) ** 2) };
  };
  save('marigold-swag', svg(1080, 170, marigoldDefs, marigolds(swag, { spacing: 19 })));
  save('marigold-strand', svg(40, 420, marigoldDefs, `<path d="M20 0V396" stroke="#a88a5a" stroke-width="1.4"/>${marigolds((t) => ({ x: 20, y: 12 + t * 384 }), { spacing: 21, scale: 0.95 })}`));
  let c = '';
  for (const [a, len] of [
    [15, 120],
    [72, 110],
  ])
    c += `<use href="#lf2" fill="url(#gleaf)" transform="translate(14 14) rotate(${a}) scale(${len / 60} 1.2)"/>`;
  for (const [x, y, s] of [
    [40, 38, 1.7],
    [86, 30, 1.5],
    [32, 86, 1.5],
    [78, 78, 1.8],
    [126, 52, 1.2],
    [52, 126, 1.2],
    [118, 104, 1.1],
  ])
    c += `<use href="#${(x + y) % 3 ? 'mo' : 'my'}" transform="translate(${x} ${y}) scale(${s})"/>`;
  save('marigold-cluster', svg(200, 200, marigoldDefs + `<path id="lf2" d="M0 0C14-9 40-9 60 0C40 9 14 9 0 0Z"/>`, c));
}

/* D-23 mehndi still-life: brass bowl of henna, cones, jasmine, a fold of maroon silk */
save(
  'mehndi-bowl',
  svg(
    320,
    260,
    brass('br') + jasmineDefs + `<linearGradient id="silk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a2c3b"/><stop offset="1" stop-color="#5e1c28"/></linearGradient>${gold('gd')}`,
    `<path d="M10 236L120 168L310 206L240 252Z" fill="url(#silk)"/><path d="M14 233L120 170" stroke="url(#gd)" stroke-width="4"/>
<ellipse cx="150" cy="226" rx="96" ry="12" fill="#3a2a14" opacity=".2"/>
<path d="M62 168C66 214 102 232 150 232S234 214 238 168Z" fill="url(#br)"/><ellipse cx="150" cy="168" rx="88" ry="18" fill="url(#br)"/><ellipse cx="150" cy="169" rx="78" ry="13" fill="#4f5a2a"/>
<path d="M102 168C124 150 176 150 198 168" fill="#5d6a31"/><path d="M118 164C134 158 150 166 164 160" fill="none" stroke="#3c461f" stroke-width="2"/>
<g transform="translate(236 132) rotate(28)"><path d="M0 0L16 0L10 70L6 70Z" fill="url(#gd)"/><path d="M6 70L10 70L8 82Z" fill="#4f5a2a"/></g>
<g transform="translate(262 150) rotate(48)"><path d="M0 0L14 0L9 62L5 62Z" fill="url(#gd)"/><path d="M5 62L9 62L7 72Z" fill="#4f5a2a"/></g>
<use href="#fl" transform="translate(52 150) scale(1.8)"/><use href="#fl" transform="translate(80 128) scale(1.4)"/><use href="#b" transform="translate(40 120) rotate(-40) scale(1.3)"/><use href="#b" transform="translate(64 108) rotate(-10) scale(1.2)"/>`,
  ),
);

/* D-24 turmeric still-life: brass bowls, raw turmeric, marigolds on a banana leaf */
save(
  'turmeric-bowls',
  svg(
    320,
    260,
    brass('br') + marigoldDefs + `<linearGradient id="bl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5f8a2e"/><stop offset=".5" stop-color="#86b043"/><stop offset="1" stop-color="#4b7023"/></linearGradient><radialGradient id="tu" cx="40%" cy="30%" r="70%"><stop offset="0" stop-color="#f7cf3c"/><stop offset="1" stop-color="#d99a0a"/></radialGradient>`,
    `<path d="M6 214C70 170 250 166 314 200C250 246 70 254 6 214Z" fill="url(#bl)"/><path d="M12 212C100 196 220 194 308 200" stroke="#cfe39b" stroke-width="2" opacity=".7"/>${[...Array(9)].map((_, i) => `<path d="M${40 + i * 30} 203L${30 + i * 30} 230" stroke="#cfe39b" stroke-width="1" opacity=".5"/>`).join('')}
<path d="M54 160C58 196 84 210 116 210S174 196 178 160Z" fill="url(#br)"/><ellipse cx="116" cy="160" rx="62" ry="13" fill="url(#br)"/><ellipse cx="116" cy="161" rx="54" ry="9" fill="url(#tu)"/><path d="M84 160C96 140 136 140 148 160" fill="url(#tu)"/>
<path d="M176 178C179 204 196 214 218 214S258 204 262 178Z" fill="url(#br)"/><ellipse cx="219" cy="178" rx="43" ry="10" fill="url(#br)"/><ellipse cx="219" cy="179" rx="37" ry="7" fill="#e6a912"/>
<g fill="#b8732a" stroke="#7a4a18" stroke-width="1.2"><path d="M246 222c10-6 26-4 34 2 4 3 2 8-3 8-8-1-20 2-28-1-5-2-6-6-3-9z"/><path d="M20 196c8-8 22-10 30-6 4 2 3 7-1 8-7 2-17 4-24 3-5-1-7-3-5-5z"/></g>
<use href="#mo" transform="translate(290 168) scale(1.3)"/><use href="#my" transform="translate(36 160) scale(1.2)"/><use href="#mo" transform="translate(178 214) scale(.9)"/>`,
  ),
);

/* D-26 veena and mridangam */
save(
  'music-instruments',
  svg(
    400,
    300,
    gold('gd') + `<linearGradient id="wd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5a32"/><stop offset=".45" stop-color="#b98653"/><stop offset="1" stop-color="#5e3a1d"/></linearGradient><radialGradient id="res" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#c8925a"/><stop offset="1" stop-color="#6b4423"/></radialGradient>`,
    `<g transform="rotate(-12 200 120)"><rect x="70" y="100" width="230" height="18" rx="6" fill="url(#wd)"/>${[...Array(12)].map((_, i) => `<path d="M${100 + i * 16} 99V119" stroke="url(#gd)" stroke-width="2"/>`).join('')}
<ellipse cx="320" cy="112" rx="56" ry="50" fill="url(#res)"/><ellipse cx="320" cy="112" rx="44" ry="38" fill="none" stroke="url(#gd)" stroke-width="2"/><circle cx="96" cy="140" r="22" fill="url(#res)"/>
<path d="M70 108C48 96 40 78 52 66C62 56 76 62 72 74" fill="none" stroke="url(#wd)" stroke-width="10" stroke-linecap="round"/><circle cx="66" cy="70" r="5" fill="url(#gd)"/>
<path d="M76 104L372 110M76 112L372 114M76 116L372 118" stroke="#e8d3a2" stroke-width="1"/></g>
<g transform="translate(90 214)"><path d="M0 20C0 -8 210 -8 210 20V52C210 80 0 80 0 52Z" fill="url(#wd)"/>${[...Array(11)].map((_, i) => `<path d="M${10 + i * 19} 4L${20 + i * 19} 70" stroke="#e8d3a2" stroke-width="1.2" opacity=".7"/>`).join('')}
<ellipse cx="0" cy="36" rx="14" ry="34" fill="#d9c08f"/><ellipse cx="0" cy="36" rx="6" ry="14" fill="#1f1610"/><ellipse cx="210" cy="36" rx="16" ry="36" fill="#d9c08f"/><ellipse cx="210" cy="36" rx="8" ry="18" fill="#cdb07a"/></g>`,
  ),
);

/* D-29b brass hanging lamp (thooku vilakku); flames are CSS */
{
  let chain = '';
  for (let y = 4, i = 0; y < 240; y += 13, i++) chain += `<ellipse cx="60" cy="${y}" rx="${i % 2 ? 3 : 4.6}" ry="6.5" fill="none" stroke="url(#br)" stroke-width="2.4"/>`;
  save(
    'hanging-lamp',
    svg(
      120,
      400,
      brass('br'),
      `${chain}<path d="M44 248C48 236 72 236 76 248Z" fill="url(#br)"/><path d="M6 270C18 300 102 300 114 270Z" fill="url(#br)"/><ellipse cx="60" cy="270" rx="54" ry="10" fill="url(#br)"/><ellipse cx="60" cy="271" rx="46" ry="6" fill="#4a3416"/>${[12, 36, 60, 84, 108].map((x) => `<path d="M${x - 6} 272Q${x} 260 ${x + 6} 272Z" fill="url(#br)"/>`).join('')}<path d="M40 296C42 322 52 340 60 352C68 340 78 322 80 296Z" fill="url(#br)"/><circle cx="60" cy="360" r="8" fill="url(#br)"/><path d="M60 368V392" stroke="url(#br)" stroke-width="3"/><circle cx="60" cy="394" r="4" fill="url(#br)"/>`,
    ),
  );
}

/* D-25 brass kalasam with mango leaves and coconut */
save(
  'brass-kalasam',
  svg(
    300,
    400,
    brass('br') + `<linearGradient id="lv" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8aa04a"/><stop offset="1" stop-color="#4f6d22"/></linearGradient><radialGradient id="co" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#a87a4f"/><stop offset="1" stop-color="#5b3a22"/></radialGradient>`,
    `<ellipse cx="150" cy="388" rx="100" ry="10" fill="#3a2a14" opacity=".2"/>${[-62, -38, -14, 14, 38, 62].map((a) => `<path d="M150 170C160 130 162 90 150 40C138 90 140 130 150 170Z" fill="url(#lv)" transform="rotate(${a} 150 176)"/>`).join('')}
<ellipse cx="150" cy="120" rx="44" ry="52" fill="url(#co)"/><path d="M116 104C132 96 168 96 184 104M112 124C132 116 168 116 188 124" fill="none" stroke="#3e2614" stroke-width="2" opacity=".5"/>
<path d="M78 370C30 320 40 236 104 206H196C260 236 270 320 222 370Z" fill="url(#br)"/><rect x="100" y="176" width="100" height="32" rx="8" fill="url(#br)"/><ellipse cx="150" cy="176" rx="62" ry="10" fill="url(#br)"/>
<path d="M98 214C130 226 170 226 202 214" fill="none" stroke="#e7b10a" stroke-width="5"/><path d="M98 222C130 234 170 234 202 222" fill="none" stroke="#a8323e" stroke-width="3"/>
<circle cx="150" cy="290" r="10" fill="#e7b10a"/><circle cx="150" cy="290" r="4" fill="#a8323e"/><path d="M96 250C80 290 88 330 104 352" fill="none" stroke="#fff6d6" stroke-width="6" opacity=".35"/>`,
  ),
);

/* D-22 thali plate: mangalsutram (two gold discs on a turmeric thread), turmeric, kumkum, flowers, betel leaves */
save(
  'thali-plate',
  svg(
    400,
    260,
    brass('br') + gold('gd') + jasmineDefs + `<linearGradient id="bl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5f8a2e"/><stop offset=".5" stop-color="#86b043"/><stop offset="1" stop-color="#4b7023"/></linearGradient><linearGradient id="betel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7fae3c"/><stop offset="1" stop-color="#3f6a1c"/></linearGradient>`,
    `<path d="M4 170C60 100 340 96 396 150C340 236 60 246 4 170Z" fill="url(#bl)"/><path d="M14 168C130 150 270 146 386 152" stroke="#cfe39b" stroke-width="2" opacity=".6"/>
<ellipse cx="200" cy="168" rx="150" ry="52" fill="url(#br)"/><ellipse cx="200" cy="164" rx="132" ry="42" fill="#d9b76a"/><ellipse cx="200" cy="164" rx="132" ry="42" fill="none" stroke="#fff2c4" stroke-width="2" opacity=".6"/>
<path d="M98 150C100 130 132 128 136 150Z" fill="#e7b10a"/><path d="M262 150C264 130 296 128 300 150Z" fill="#b8202e"/>
<path d="M150 150C150 196 250 196 250 150C250 126 150 126 150 150Z" fill="none" stroke="#e8b923" stroke-width="3.5"/>
<circle cx="190" cy="186" r="10" fill="url(#gd)"/><circle cx="212" cy="186" r="10" fill="url(#gd)"/><circle cx="190" cy="186" r="4" fill="none" stroke="#7a5718" stroke-width="1.4"/><circle cx="212" cy="186" r="4" fill="none" stroke="#7a5718" stroke-width="1.4"/>
<path d="M300 182C316 166 340 170 344 186C336 200 312 200 300 182Z" fill="url(#betel)"/><path d="M92 186C76 170 54 174 50 190C58 204 82 204 92 186Z" fill="url(#betel)"/>
<use href="#fl" transform="translate(150 196) scale(1.3)"/><use href="#rs" transform="translate(252 196) scale(1.2)"/><use href="#fl" transform="translate(276 140) scale(1.1)"/>`,
  ),
);

/* D-14 banana plant for the mandapam pillars */
{
  const leaf = (a, len, x = 150, y = 560) =>
    `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M0 0C${len * 0.2} ${-len * 0.26} ${len * 0.75} ${-len * 0.32} ${len} -6C${len * 0.75} ${len * 0.2} ${len * 0.2} ${len * 0.22} 0 0Z" fill="url(#bnl)"/><path d="M0 0C${len * 0.4} -10 ${len * 0.75} -14 ${len} -6" fill="none" stroke="#c9dc93" stroke-width="3"/></g>`;
  save(
    'banana-plant',
    svg(
      600,
      1400,
      `<linearGradient id="bnt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8aa45a"/><stop offset=".45" stop-color="#d8e0a8"/><stop offset="1" stop-color="#7d9450"/></linearGradient><linearGradient id="bnl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4e7a22"/><stop offset=".6" stop-color="#7fae3c"/><stop offset="1" stop-color="#5f8a2e"/></linearGradient><radialGradient id="bf" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#a8323e"/><stop offset="1" stop-color="#5e1c28"/></radialGradient>`,
      `<g transform="translate(150 0)"><path d="M128 1400L136 560H164L172 1400Z" fill="url(#bnt)"/><path d="M140 1400V600M158 1400V600" stroke="#6f8a40" stroke-width="2" opacity=".5"/>${leaf(-165, 270)}${leaf(-128, 300)}${leaf(-90, 290)}${leaf(-52, 300)}${leaf(-15, 270)}${leaf(-110, 220, 150, 640)}${leaf(-70, 220, 150, 640)}<path d="M150 560C176 610 184 680 168 740C158 760 146 760 140 740C130 690 134 620 150 560Z" fill="url(#bf)"/></g>`,
    ),
  );
}

/* D-21 mandapam beam with carved band and kalasam finials */
{
  let band = '';
  for (let x = 40; x < 1060; x += 60) band += `<path d="M${x} 150V124A16 16 0 0 1 ${x + 32} 124V150Z" fill="#c9a878" stroke="#8a6a44" stroke-opacity=".45"/>`;
  const kal = (x, s) => `<g transform="translate(${x} 62) scale(${s})"><path d="M-14 0C-20-12-17-24 0-27C17-24 20-12 14 0Z" fill="url(#gd)"/><path d="M0-58C7-48 8-36 0-28C-8-36-7-48 0-58Z" fill="url(#gd)"/><rect x="-18" y="0" width="36" height="7" fill="url(#gd)"/></g>`;
  save(
    'mandapam-beam',
    svg(
      1080,
      190,
      sandstone('ss') + gold('gd'),
      `<rect x="0" y="70" width="1080" height="24" fill="url(#ss)" stroke="#8a6a44" stroke-opacity=".5" stroke-width="2"/><rect x="10" y="94" width="1060" height="70" fill="url(#ss)" stroke="#8a6a44" stroke-opacity=".5" stroke-width="2"/>${band}<path d="M10 164H1070L1050 184H30Z" fill="url(#ss)" stroke="#8a6a44" stroke-opacity=".45"/>${[60, 250, 830, 1020].map((x) => kal(x, 0.75)).join('')}${kal(540, 1.2)}`,
    ),
  );
}

/* D-21 flower chandelier: jasmine strands converging on a marigold ball */
{
  let s = '<ellipse cx="150" cy="36" rx="110" ry="14" fill="none" stroke="url(#gd)" stroke-width="5"/>';
  for (let i = 0; i < 7; i++) {
    const x0 = 150 + Math.cos(Math.PI * (i / 6)) * -110;
    const path = (t) => ({ x: x0 + (150 - x0) * t * t, y: 40 + t * 270 + Math.sin(t * Math.PI) * 18 });
    s += garland(path, { spacing: 12, scale: 0.62, flowers: 0 });
  }
  s += marigolds((t) => ({ x: 150 + Math.cos(t * Math.PI * 4) * 22 * (1 - t * 0.6), y: 300 + t * 50 + Math.sin(t * Math.PI * 4) * 8 }), { spacing: 11, scale: 0.8 });
  s += '<path d="M150 360V396" stroke="#c49a45" stroke-width="2"/><circle cx="150" cy="398" r="2" fill="#c49a45"/>';
  save('flower-chandelier', svg(300, 400, jasmineDefs + marigoldDefs + gold('gd'), s));
}

/* D-27 reception backdrop: gold-framed ivory panel with jasmine and white-rose cascades */
{
  const wrose = `<g id="wr"><circle r="11" fill="url(#wro)"/><path d="M-6-1Q0-8 6-1Q2 3-6-1ZM-5 3Q0 7 5 3" fill="none" stroke="#c9bfa2" stroke-width="1"/></g>`;
  const cascade = (x0, dir) => (t) => ({ x: x0 + dir * (Math.sin(t * Math.PI * 1.2) * 34 + t * 10), y: 60 + t * 820 });
  let flowers = '';
  for (const [x0, dir] of [
    [80, 1],
    [820, -1],
  ]) {
    flowers += garland(cascade(x0, dir), { spacing: 9, scale: 0.85, flowers: 6 });
    for (let k = 0; k < 9; k++) flowers += `<use href="#wr" transform="translate(${f(x0 + dir * r(-10, 40))} ${f(60 + k * 90 + r(0, 30))}) scale(${f(r(1, 1.5))})"/>`;
  }
  save(
    'reception-backdrop',
    svg(
      900,
      1100,
      gold('gd') + jasmineDefs + `<radialGradient id="pnl" cx="50%" cy="35%" r="80%"><stop offset="0" stop-color="#fffdf8"/><stop offset=".6" stop-color="#f6ecd8"/><stop offset="1" stop-color="#e6d3ae"/></radialGradient><radialGradient id="wro" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e9e0c6"/></radialGradient>${wrose}`,
      `<path d="M40 1090V260C40 120 240 40 450 40S860 120 860 260V1090Z" fill="url(#pnl)" stroke="url(#gd)" stroke-width="14"/><path d="M70 1090V270C70 150 250 76 450 76S830 150 830 270V1090" fill="none" stroke="url(#gd)" stroke-width="3"/><g transform="translate(450 200)" fill="url(#gd)" opacity=".85">${[...Array(16)].map((_, k) => `<ellipse cy="-46" rx="9" ry="26" transform="rotate(${k * 22.5})"/>`).join('')}<circle r="20"/></g>${flowers}`,
    ),
  );
}

/* D-27 floral urn */
save(
  'floral-urn',
  svg(
    240,
    360,
    gold('gd') + jasmineDefs + `<radialGradient id="wro" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e3d9bd"/></radialGradient>`,
    `${[...Array(5)].map((_, i) => `<use href="#lf" fill="url(#leaf)" transform="translate(120 150) rotate(${-160 + i * 35}) scale(1.3 1)"/>`).join('')}${[
      [120, 110, 2.2],
      [86, 128, 1.8],
      [154, 128, 1.8],
      [100, 90, 1.6],
      [140, 92, 1.6],
      [64, 150, 1.4],
      [176, 150, 1.4],
    ]
      .map(([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s})"><circle r="11" fill="url(#wro)"/><path d="M-6-1Q0-8 6-1Q2 3-6-1ZM-5 3Q0 7 5 3" fill="none" stroke="#c9bfa2" stroke-width="1"/></g>`)
      .join('')}<use href="#fl" transform="translate(70 116) scale(1.6)"/><use href="#fl" transform="translate(170 112) scale(1.6)"/>
<path d="M60 170H180C178 214 154 236 138 246L146 300H94L102 246C86 236 62 214 60 170Z" fill="url(#gd)"/><rect x="78" y="300" width="84" height="16" rx="4" fill="url(#gd)"/><rect x="64" y="316" width="112" height="22" rx="6" fill="url(#gd)"/><path d="M66 184H174" stroke="#7a5718" stroke-width="2" opacity=".5"/>`,
  ),
);

/* D-28 ivory silk curtain (left panel; the right is mirrored) */
{
  let folds = '';
  for (let x = 0; x < 540; x += 36) folds += `<rect x="${x}" y="0" width="36" height="1700" fill="url(#fold)"/>`;
  const curtainDefs = gold('gd') + `<linearGradient id="fold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e7d8b8"/><stop offset=".35" stop-color="#fffaf0"/><stop offset=".7" stop-color="#f3e8d2"/><stop offset="1" stop-color="#dccaa4"/></linearGradient>`;
  const curtain = `${folds}<rect x="510" y="0" width="30" height="1700" fill="url(#gd)"/><rect x="0" y="0" width="540" height="40" fill="url(#gd)"/><g transform="translate(500 900)"><circle r="18" fill="url(#gd)"/><path d="M-6 16L-14 120M0 18V128M6 16L14 120" stroke="#c49a45" stroke-width="4"/><path d="M-30-8C-10 4 10 4 30-8" fill="none" stroke="url(#gd)" stroke-width="8"/></g>`;
  save(
    'silk-curtain',
    svg(
      540,
      1700,
      curtainDefs,
      curtain,
      { stretch: true },
    ),
  );
  // Right panel: the same curtain mirrored, so each side gathers towards its own edge
  save('silk-curtain-right', svg(540, 1700, curtainDefs, `<g transform="translate(540 0) scale(-1 1)">${curtain}</g>`, { stretch: true }));
}

/* Map stand-in until the illustrated venue map is commissioned (PRD §6.13) */
save(
  'venue-map',
  svg(
    800,
    460,
    `<linearGradient id="pm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6ecd8"/><stop offset="1" stop-color="#e9d9b6"/></linearGradient>`,
    `<rect width="800" height="460" rx="18" fill="url(#pm)"/><path d="M0 330C160 300 260 380 420 340S700 260 800 300V460H0Z" fill="#cfd8c4" opacity=".7"/>
<g fill="#c7d3a9" opacity=".7"><ellipse cx="140" cy="120" rx="70" ry="40"/><ellipse cx="640" cy="150" rx="90" ry="46"/><ellipse cx="520" cy="400" rx="60" ry="28"/></g>
<g fill="none" stroke="#fffaf0" stroke-width="16" stroke-linecap="round"><path d="M-10 210C200 190 360 260 520 210S760 120 810 140"/><path d="M380 -10C360 120 420 240 400 470"/><path d="M60 470C140 360 220 300 380 250"/></g>
<g fill="none" stroke="#d8c39a" stroke-width="2"><path d="M-10 210C200 190 360 260 520 210S760 120 810 140"/><path d="M380 -10C360 120 420 240 400 470"/></g>
<g transform="translate(720 70)" fill="none" stroke="#8a6420" stroke-width="2"><circle r="28"/><path d="M0-36V36M-36 0H36"/><path d="M0-28L6 0L0 28L-6 0Z" fill="#c49a45"/></g>`,
  ),
);

/* S-20 attire silhouettes used as masks (tinted per event in CSS) */
save(
  'attire-woman',
  svg(
    200,
    520,
    '',
    `<g fill="#000"><ellipse cx="100" cy="36" rx="14" ry="17"/><circle cx="114" cy="30" r="9"/><rect x="94" y="50" width="12" height="14"/><path d="M80 64Q100 58 120 64L124 120Q100 128 76 120Z"/><path d="M80 66Q70 70 68 90L64 168Q63 176 70 174L77 120Z"/><path d="M120 66Q130 70 132 90L136 168Q137 176 130 174L123 120Z"/><path d="M78 118Q100 124 122 118L146 506Q100 516 54 506Z"/><path d="M118 64Q142 70 148 124Q152 210 160 300L148 304Q140 210 128 128Z"/></g>`,
  ),
);
save(
  'attire-man',
  svg(
    180,
    520,
    '',
    `<g fill="#000"><ellipse cx="90" cy="36" rx="14" ry="17"/><rect x="84" y="50" width="12" height="12"/><path d="M64 62Q90 56 116 62L122 252Q90 260 58 252Z"/><path d="M64 64Q54 70 52 92L48 210Q47 218 54 216L62 120Z"/><path d="M116 64Q126 70 128 92L132 210Q133 218 126 216L118 120Z"/><path d="M60 248H120L126 500Q90 508 54 500Z"/><path d="M108 62L124 68L70 208L58 198Z"/><ellipse cx="74" cy="506" rx="12" ry="6"/><ellipse cx="106" cy="506" rx="12" ry="6"/></g>`,
  ),
);
