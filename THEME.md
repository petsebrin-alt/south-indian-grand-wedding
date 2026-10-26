# THEME — Rahul & Divya · Royal South Indian Heritage

| Field | Value |
|---|---|
| Document | Visual design direction and implementation-ready layout specifications |
| Companion | [PRD.md](PRD.md): requirements, behaviour, data and acceptance criteria |
| Version | 1.0 — Draft for client review (23 October 2026) |
| Asset IDs | **S-xx** = SVG · **D-xx** = decorative transparent WebP/AVIF/PNG · **P-xx** = photograph · **V-xx** = optional video · **A-xx** = optional audio · **F-xx** = font · **B-xx** = brand/share asset |

---

## 1. Design concept

### 1.1 Concept name: "The Living Subhalekha"

A royal Telugu wedding invitation book, printed on ivory handmade paper and bound in silk, that comes alive in the guest's hands. Each page is a small temple-wedding tableau: **carved stone and brass framing a calm ivory centre, with jasmine everywhere.** The mood is the hour just after dawn at a temple wedding: soft, warm, clean light, the scent of jasmine, the glow of brass lamps, the quiet before the nadaswaram begins.

### 1.2 Mood keywords

Serene · regal · warm · fragrant · hand-crafted · sacred but joyful · light-filled · tactile (paper, silk, brass, stone, petals).

### 1.3 Design principles

1. **Ivory first.** Light pages, generous breathing room. Gold is jewellery, not wallpaper; maroon is a bindi, not a backdrop.
2. **Every page is a composition, never a text slide.** Each page has a frame (architecture or textile), a hero object, readable text, and foreground decoration, built in layers (§9).
3. **Real materials.** Jasmine, marigold, brass, stone, silk and paper must look photographed, not drawn. Vector is reserved for clean ornament (kolam, borders, icons, lines).
4. **Restrained motion with meaning.** Things open, unfold, sway, glow and settle the way real objects do. Nothing bounces, spins, explodes or flashes.
5. **Regional authenticity.** Inspired by Tirupati and Andhra Pradesh: Dravidian temple architecture, the Ananda Nilayam's gold, Venkatagiri and Dharmavaram silks, Srikalahasti Kalamkari line work, *chukkala muggulu* (dot kolam), mango-leaf thoranam and banana plants at the mandapam.
6. **Legibility is sacred too.** Elders must read every word. Text never sits directly on busy imagery and never in Antique Gold on a light background.

### 1.4 Reference video: visual language to borrow

| Borrow | How it appears in our theme |
|---|---|
| Full-bleed portrait pages framed by pillars, arches and garlands | Every page has an architectural or textile frame layer (L2) and a garland or lamp foreground layer (L5) |
| Script headings over painted scenes | Script used **selectively** (Pinyon Script) for short accents; Cinzel and Cormorant carry most headings |
| Parchment-backed page curl | Page back uses `--paper-back #F3E7CF` plus handmade-paper texture (§11) |
| Gold arched nameplate, wreath medallions, polaroids, framed venue photo and map | Pages 7, 9–10, 5–6 and 14 respectively |
| Persistent maroon music disc and pearl handle | UI chrome (§12) |

| Do not borrow | Reason |
|---|---|
| The saturated orange and pink overall palette | Replaced by ivory, gold, maroon, sandalwood |
| Painted, anime-like characters | Real photographs (PRD Q-A1) |
| Petal "firework" rings, lens glows | Restraint principle |
| Any actual artwork from the video | Copyright; everything is original |

---

## 2. Cultural references and inspiration board (descriptive)

| Theme | Visual reference to source or commission | Used on |
|---|---|---|
| Tirupati temple architecture | Dravidian gopuram tiers, carved Vijayanagara-style pillars with yali brackets, sandstone and granite textures, kalasam finials, gold-plated vimana inspiration (artist interpretation; **no photographs of the sanctum, no TTD logos or official imagery**) | Cover, Blessings, Couple, Ceremony, Thank You, desktop background |
| Lord Venkateswara symbolism | Shankha (conch), Chakra (discus), Srivari Namam (white U-shaped mark with central red line), rendered as refined gold line-and-fill emblems | Blessings |
| Jasmine (*malle*) | Densely strung Jasminum sambac buds and open flowers (Madurai/Andhra style strings), sometimes with red rose or orange kanakambaram accents | Everywhere |
| Marigold (*banti*) | Orange and yellow strung garlands and loose heads | Haldi, Events signboard, Travel corners |
| Brass | Kuthuvilakku (tall multi-wick lamp with a hamsa or peacock finial), agal diyas, temple bells, kalasam, chembu, uruli, thooku vilakku (hanging lamp) | Everywhere |
| Silk | Venkatagiri (fine ivory body with gold zari border), Dharmavaram and Kanchipuram (rich maroon and gold, temple-border *korvai*), mango/paisley butta motifs | Envelope, portrait frames, curtains, Dress Code, RSVP edge |
| Kolam / muggu | *Chukkala muggu* (dot-grid), *sikku* (continuous loops around dots), lotus and lamp kolams | Corners, watermarks, mandapam floor |
| Wedding rituals | Mandapam with banana plants and mango-leaf thoranam, jasmine canopy, thali on a brass plate with turmeric and kumkum, talambralu rice | Ceremony, Events |
| Kalamkari (Srikalahasti) | Pen-drawn flowing line art with natural-dye tones; used as **fine line** illustration for the Sangeet couple and attire sketches | Events (Sangeet), Dress Code |

---

## 3. Colour system

### 3.1 Core palette (client-approved)

| Token | Name | Hex | RGB | Role |
|---|---|---|---|---|
| `--ivory` | Ivory White | `#FFF9EF` | 255 249 239 | Primary page background |
| `--jasmine` | Jasmine White | `#FFFDF8` | 255 253 248 | Cards, light pages, sheets, overlays |
| `--sandal` | Sandalwood Beige | `#EAD8B7` | 234 216 183 | Backgrounds behind cards, silk washes, evening warmth |
| `--gold` | Antique Gold | `#C49A45` | 196 154 69 | Borders, ornaments, foil, dividers, icons (decorative) |
| `--maroon` | Temple Maroon | `#7A2635` | 122 38 53 | Primary buttons, selected states, key accents, silk borders |
| `--brown` | Deep Brown | `#4B3026` | 75 48 38 | Body text, numerals, icons on light backgrounds |

### 3.2 Support tokens (derived, for accessibility and depth)

| Token | Hex / value | Role |
|---|---|---|
| `--gold-text` | `#8A6420` | **All gold-coloured text** on light backgrounds (5.11:1 on ivory) |
| `--gold-deep` | `#7A5718` | Foil shadows, pressed gold, small gold text on sandal (4.68:1) |
| `--gold-light` | `#E3C78A` | Foil mid-highlight, sheet grab handle, disabled ornaments |
| `--gold-highlight` | `#F4E3B5` | Foil specular highlight |
| `--maroon-deep` | `#5E1C28` | Pressed buttons, door lacquer shadow |
| `--brown-soft` | `#6B4E3F` | Secondary text, captions (7.19:1 on ivory) |
| `--paper-back` | `#F3E7CF` | Page back during the curl, placeholder fills |
| `--sandal-light` | `#F4EAD6` | Soft washes between ivory and sandal |
| `--hairline` | `rgba(196,154,69,0.45)` | Fine rules, input underlines |
| `--shadow` | `rgba(75,48,38,0.18)` | Card and object shadows |
| `--shadow-deep` | `rgba(75,48,38,0.28)` | Lifted objects, page-curl shadow peak |
| `--veil` | `rgba(255,249,239,0.86)` | Text veils over imagery |
| `--focus` | `#7A2635` ring + `#FFFDF8` outer ring | Keyboard focus |

**Material colours (inside photographic assets only, never UI):** jasmine white with green-cream bud tips · marigold `#E39B2D` / `#F2B52B` · turmeric `#E7B10A` · rose `#A8323E` · mango leaf `#4F6B2A` · banana leaf `#6E8B3D` · brass `#B5873A` to `#E2BF6E` · sandstone `#D9B98C` · granite `#8C8279`. Assets are colour-graded so these sit harmoniously on ivory (slightly desaturated, warm).

### 3.3 Gradients and foil

```css
--foil-gold: linear-gradient(135deg, #7A5718 0%, #C49A45 20%, #F4E3B5 42%, #C49A45 60%, #8A6420 82%, #C49A45 100%);
--foil-sweep: linear-gradient(110deg, transparent 35%, rgba(244,227,181,0.85) 50%, transparent 65%); /* animated highlight */
--evening-wash: linear-gradient(180deg, #EAD8B7 0%, #F4EAD6 38%, #FFF9EF 100%);
--golden-hour: linear-gradient(180deg, #F4E3B5 0%, #F4EAD6 45%, #FFF9EF 100%);
--lamp-glow: radial-gradient(circle, rgba(255,214,140,0.55) 0%, rgba(255,214,140,0) 70%);
```

### 3.4 Contrast table (WCAG ratios, computed)

| Foreground ↓ / Background → | Ivory `#FFF9EF` | Jasmine `#FFFDF8` | Sandal `#EAD8B7` | Parchment `#F3E7CF` | Maroon `#7A2635` |
|---|---|---|---|---|---|
| Deep Brown `#4B3026` | **11.46** | **11.80** | **8.57** | **9.80** | 1.23 ✗ |
| Temple Maroon `#7A2635` | **9.30** | **9.58** | **6.96** | **7.95** | — |
| Brown Soft `#6B4E3F` | **7.19** | **7.41** | **5.38** | **6.15** | ✗ |
| Gold Text `#8A6420` | **5.11** | **5.26** | 3.82 (large text only) | 4.37 (large only) | ✗ |
| Gold Deep `#7A5718` | **6.26** | **6.45** | **4.68** | **5.35** | ✗ |
| Antique Gold `#C49A45` | 2.49 ✗ | 2.56 ✗ | 1.86 ✗ | 2.13 ✗ | 3.74 (large only) |
| Ivory `#FFF9EF` | — | — | — | — | **9.30** |

Rules: body text uses Deep Brown or Brown Soft; gold-coloured words use Gold Text (Gold Deep on sandal); ivory text appears only on maroon (buttons, ribbons); Antique Gold is decoration only.

### 3.5 Usage ratio and page background plan

Target across the book: **60% ivory/jasmine · 22% sandal · 10% gold · 5% maroon · 3% brown text.** No page is predominantly maroon or gold.

| Page | Base | Secondary | Maroon appears as | Mood |
|---|---|---|---|---|
| Cover | Ivory + paper texture | Silk drape | Button, envelope zari border | Anticipation |
| 1 Welcome | Jasmine | Faint stone arch | Ampersand, button-free | Graceful welcome |
| 2 Blessings | Ivory | Sandstone arch | Door lacquer (contained in arch) | Reverent |
| 3 Save the Date | Sandal | Ivory card | Calendar button, date ring | Celebratory |
| 4 Countdown | Ivory | Sandal panel insets | Small "IST" tags | Anticipation |
| 5 Rahul | Ivory | Stone pillar | Silk frame border | Dignified |
| 6 Divya | Jasmine | Silk | Thin zari line | Tender |
| 7 Family | Ivory | Silk wash | Names "&" | Honouring |
| 8 Love Story | Jasmine | Silk sheen | Active dot | Romantic |
| 9–10 Events | Ivory | Sandal plates | Wedding medallion ring, buttons | Festive |
| 11 Ceremony | Ivory | Sandstone mandapam | Silk drapes (small) | Sacred |
| 12 Reception | Evening wash (sandal → ivory) | Ivory curtains | Names | Glamorous, warm |
| 13 Dress Code | Jasmine | Event silk bands | Wedding card band | Playful elegance |
| 14 Venues | Ivory | Garland arch | Map pin, button | Practical, pretty |
| 15 Travel | Sandal-light | Ivory board | Help ribbon | Calm, helpful |
| 16 Wishing Wall | Ivory | Brass rod | Write button | Warm |
| 17 RSVP | Sandal | Ivory card | Confirm button | Personal |
| 18 Contact | Sandal-light | Ivory cards | Call buttons | Reassuring |
| 19 Thank You | Golden-hour wash | Ivory veil | Share button | Peaceful, grateful |

---

## 4. Typography

### 4.1 Families

| ID | Family | Weights | Role | Source |
|---|---|---|---|---|
| F-01 | **Cormorant Garamond** | 500, 600, 500 italic | Couple names, elegant display, numerals, quotes | Google Fonts / Fontsource, self-hosted |
| F-02 | **Cinzel** | 500, 600 | Royal headings, eyebrows, labels (uppercase, letter-spaced) | Same |
| F-03 | **Manrope** | 400, 500, 600 | Body, UI, forms | Same |
| F-04 | **Pinyon Script** | 400 | Selective script accents and handwriting reveals only | Same |
| F-05 | **Noto Serif Telugu** | 500 | Telugu invocation and titles (`lang="te"`) | Same. **Noto Serif Tamil** (F-06) only if Tamil is requested |

### 4.2 Type scale (mobile reference page 390 px wide)

Sizes are fluid against the **page container**: `font-size: clamp(min, Ncqw, max)`.

| Token | Family / weight | Size (min / ref / max) | Line-height | Tracking | Use |
|---|---|---|---|---|---|
| `--t-names-xl` | Cormorant 600 | 40 / 48 / 64 px | 1.05 | 0.01em | "Rahul & Divya" on Welcome, Ceremony |
| `--t-names-l` | Cormorant 600 | 32 / 38 / 52 px | 1.08 | 0.01em | Portrait names, Reception card |
| `--t-display-m` | Cormorant 500 italic | 22 / 26 / 34 px | 1.2 | 0 | Lead lines, quotes, blessing |
| `--t-heading` | Cinzel 600 | 17 / 20 / 26 px | 1.2 | 0.14em, uppercase | Page titles ("WEDDING CELEBRATIONS") |
| `--t-eyebrow` | Cinzel 500 | 11 / 12 / 14 px | 1.3 | 0.18em, uppercase | "THE GROOM", "TOGETHER WITH OUR FAMILIES" |
| `--t-script-l` | Pinyon Script | 38 / 46 / 60 px | 1.0 | 0 | "Save the Date", "Thank You" |
| `--t-script-s` | Pinyon Script | 18 / 22 / 28 px | 1.0 | 0 | "weds", "&" accents |
| `--t-numeral` | Cormorant 600 | 32 / 40 / 56 px | 1.0 | 0 | Countdown, date panels (`lining-nums tabular-nums`) |
| `--t-body` | Manrope 400 | 15 / 15 / 17 px | 1.55 | 0.005em | Paragraphs |
| `--t-body-s` | Manrope 400 | 13 / 13 / 14 px | 1.5 | 0.01em | Captions, helper text |
| `--t-label` | Manrope 600 | 12 / 12 / 13 px | 1.3 | 0.04em | Buttons (15 px), chips, form labels |
| `--t-telugu` | Noto Serif Telugu 500 | 18 / 20 / 26 px | 1.6 | 0 | Invocation, Subhalekha |
| `--t-folio` | Cinzel 500 | 11 px | 1 | 0.2em | Page numbers |

### 4.3 Rules

- **Never oversize.** The largest text on any page is the couple's names (max 64 px). Section headings are small, letter-spaced Cinzel, as in a printed invitation.
- **Script is jewellery.** At most one script element per page, never for information (dates, venues, buttons), always with a real-text equivalent.
- **Ampersand:** Cormorant 500 italic in `--maroon`, 0.8× the names' size, optically lowered by 0.04 em.
- **Numerals:** Cormorant lining figures for dates and countdown; Manrope tabular for form steppers.
- **Measure:** body text max 34 em; centred alignment for ceremonial text, left-aligned for practical text (Travel details, sheets, forms).
- **Telugu:** set 1–2 px larger than adjacent Latin text for equal optical weight; never in script styles.
- **Loading:** subset to Latin + used Telugu glyphs; preload Cormorant 600 and Cinzel 500 only; `font-display: swap` with metric-matched fallbacks (`Georgia` for Cormorant/Cinzel, `system-ui` for Manrope) to avoid layout shift.

---

## 5. Textures and materials

| Material | Treatment | Implementation |
|---|---|---|
| Ivory handmade paper | Subtle fibre flecks and soft tooth; deckled edges on cards | D-33a tileable 1024 px WebP (≤ 60 KB) blended `multiply` at 35–50% over `--ivory`; deckled edges via a mask image on cards |
| Parchment (page back) | Warmer, slightly mottled | D-33b tile on `--paper-back` |
| Silk | Soft directional sheen, fine weave, gold zari borders with temple *korvai* triangles and mango buttas | D-15 drapes (transparent), D-16 tiling borders and swatches; sheen via a slow 2-stop gradient overlay (no animation by default) |
| Carved stone | Warm sandstone, shallow relief, gentle ambient occlusion | Baked into D-09, D-10, D-21; stone texture D-34 for small fills |
| Brass | Warm polished metal with soft speculars, slight patina in recesses | Baked into assets; lit top-left |
| Gold foil | Metallic sheen on print | `--foil-gold` gradient on SVG strokes and text-free shapes; optional `--foil-sweep` animation once on reveal |
| Fresh flowers | Crisp, dewy-fresh, not wilted | Photographic cutouts; individual petals for particles |
| Wood (doors, signboard) | Deep maroon lacquer with brass studs; carved teak signboard | D-11, signboard within D-04 set |

**Lighting rule for all realistic assets:** soft warm key light from **top-left** (about 3500–4000 K), gentle fill, soft contact shadows. Consistent lighting is what makes layered cutouts look real together.

---

## 6. Ornament system (SVG)

| ID | Ornament | Construction | Stroke / fill | Animation hook |
|---|---|---|---|---|
| S-01 | Kolam corner (*chukkala muggu* lotus corner), 4 rotations | Dot grid of 5×5 with continuous looping line | 1.25 px `--gold` stroke, dots 2 px | `stroke-dashoffset` draw (corner by corner) |
| S-02 | Kolam medallion (rosette) | Radial *sikku* loops around a 9-dot core | 1 px, used at 6–10% opacity as watermark, or chalk-textured on the mandapam floor | Optional draw on Countdown |
| S-03 | Temple frieze border | Repeating band: lotus petals, beads, temple-tower triangles (*korvai*) | `--foil-gold` fill, 6–10 px band | Static |
| S-04 | Ornamental divider | Two tapering gold lines meeting at a lotus bud with a bindu | 1.5 px tapering | Draw outward from centre |
| S-05 | Golden thread (timeline) | Gentle S-curve path with bead nodes; node = small bell anchor; end = *mangalyam* knot | 2 px `--gold` with a 0.5 px `--gold-highlight` inner line | DrawSVG synced to event reveals |
| S-06 | Temple arch frame | Dravidian *torana* arch with kalasam crest, inner and outer contour | 1.5 px outline plus foil fill band | Draw, or fade |
| S-07 | Mandapa niche | Cusped (multifoil) arch, rectangular lower body | 1.25 px rim | Fade |
| S-08 | Cartouche / nameplate edge | Symmetrical scrolling cartouche with lotus top | Crisp vector edge over raster foil D-18 | Fade |
| S-09 | Oval portrait ornament | Beaded oval with leaf scrolls at 12 and 6 o'clock | Foil fill | Fade |
| S-10 | Icon set (24 px grid, 1.5 px stroke, rounded joins) | Calendar, map pin, phone, WhatsApp glyph (per brand guidelines), info, close, contents (lotus), music on/off, share, chevrons, plane, train, compass, parking, hotel, shuttle, assistance, blessing (folded hands), check, alert, clock, hanger, family tree, copy | `currentColor` | — |
| S-11 | Event emblems (48 px) | Mehndi (hand with henna cone), Haldi (turmeric bowl), Sangeet (veena), Wedding (kalasam with mango leaves and coconut), Reception (lamp with crown flourish) | 1.25 px line, `--gold-text` | Draw on medallion bloom |
| S-12 | Sacred emblem | Shankha (left), Srivari Namam (centre), Chakra (right), balanced on a lotus base | Foil fill with `--maroon` central line of the Namam | Fade with warm light |
| S-13 | Monogram R · D | Custom: Cormorant-based R and D interlaced by a jasmine strand, enclosed in a lotus-petal ring | Foil fill | Petal ring unfurl |
| S-14 | Handwriting paths | "Save the Date", "Thank You for Blessing Our Journey" converted from Pinyon Script to single-stroke centrelines (hand-traced) plus filled outlines | Stroke for draw, fill revealed after | DrawSVG then fill fade |
| S-15 | Paisley / mango butta zari band | Repeating mango motifs with dot borders | `--foil-gold` | Static |
| S-16 | Folio and flourishes | Small dashes and dots around page numbers, Contents leaders | 1 px | — |
| S-17 | *Sikku* line set | Long continuous kolam lines for decorative line-drawing moments | 1 px | Draw |
| S-18 | Henna pattern | Fine mehndi florals and paisleys for the Mehndi medallion background | 0.75 px `--gold-text` at 30% | Fade |
| S-19 | Sangeet dancing couple | Srikalahasti-Kalamkari-inspired pen line art, elegant proportions, flowing garments, no faces caricatured | 1–2 px variable line, `--brown` with gold accents | Line draw (1.2 s) |
| S-20 | Attire illustrations (×5 pairs) | Fashion-sketch line with light watercolour wash (provided as SVG line plus WebP wash layer) | Line `--brown`, wash in event colours | Fade |

Stroke weights scale with the page: `vector-effect: non-scaling-stroke` is **not** used; strokes are designed at the 390 px reference and scale proportionally.

---

## 7. Realistic decorative asset direction (transparent WebP/AVIF)

General: photographic realism, top-left warm light, clean alpha edges with **no white or dark fringes** (defringe on ivory), soft baked contact shadow (≤ 20% opacity) where an object touches a surface, cast shadows added in CSS (`filter: drop-shadow`) so they can adapt. sRGB colour profile.

| ID | Asset | Art direction |
|---|---|---|
| D-01 | Jasmine garland swag | 3 parallel strands of densely strung jasmine buds with occasional open flowers, natural catenary sag, 110% page width; variant with sparse red rose accents |
| D-02 | Jasmine strands (vertical) | Single and double strands at 3 lengths (18%, 28%, 40% of page height), with a small rose or bud tassel at the end |
| D-03 | Jasmine clusters | Corner bunches (open flowers, buds, two leaves) in 4 orientations; small single flowers |
| D-04 | Jasmine-and-rose wreaths and garlands | Circular wreath (for event medallions, 3 variants), red-and-white garland for door posts and arches; carved teak "Wedding Celebrations" signboard with marigold swags |
| D-05 | Marigold garlands | Orange and yellow strung garlands, vertical and swag; loose heads |
| D-06 | Brass kuthuvilakku | Tall 5-wick lamp with a hamsa finial, left and right versions; **flame layer separate** (D-06f, 3 frames for flicker) plus a glow sprite |
| D-07 | Agal diya | Small clay or brass diyas, lit |
| D-08 | Temple bells | Single bells and a cluster on a brass chain; separate clapper not required |
| D-09 | Carved temple pillars | Sandstone Vijayanagara-style pillar with yali bracket, left and right; full and three-quarter heights |
| D-10 | Carved temple arch / lintel | Dravidian arch with kalasam crest; low-contrast "printed" variant for page watermarks |
| D-11 | Temple doors | Two separate leaves (left and right) of maroon-lacquered carved wood with brass studs, lion-face knockers and elephant reliefs at the base, plus the door frame |
| D-12 | Gopuram / vimana backdrop | Soft, misty, ivory-and-sandalwood rendering of a temple tower; dawn and golden-hour variants |
| D-13 | Mango-leaf thoranam | Glossy mango leaves strung on thread with marigold heads between |
| D-14 | Banana leaves and plants | Single leaves (for platters) and whole banana plants with flower for mandapam pillars |
| D-15 | Silk drapes | Ivory silk with gold zari border: top swag, side drapes, gathered pillar ties |
| D-16 | Silk textures and borders | Tileable zari borders (maroon-and-gold *korvai*, ivory-and-gold Venkatagiri) and fabric swatch folds |
| D-17 | Antique gold ornaments | Filigree corners, temple-jewellery pendants (*kasu* coin motif), small kalasam crests |
| D-18 | Gold nameplate | Raster antique-gold cartouche with embossed lotus, soft specular |
| D-19 | Silk envelope | **a** body, **b** flap (separate, for 3D hinge), **c** gold seal (splits into two halves), **d** inner card in two folding panels |
| D-20 | Invitation scroll | Ivory scroll with wooden rollers and gold caps; separate roller layers for unroll |
| D-21 | Wedding mandapam | Layers: back pillars, front pillars, beam with carvings, canopy frame, base platform, jasmine chandelier |
| D-22 | Sacred thali plate | Brass plate on a banana leaf with the mangalsutram (two gold *pustelu* discs on a turmeric thread), turmeric, kumkum, flowers, betel leaves |
| D-23 | Mehndi still-life | Brass bowl of henna paste, two cones, a few jasmine flowers, silk fold |
| D-24 | Turmeric still-life | Brass bowls of turmeric paste and powder, raw turmeric roots, marigold heads |
| D-25 | Brass vessels | Kalasam with mango leaves and coconut; chembu; uruli with floating flowers |
| D-26 | Instruments | Veena (full and crop), mridangam, optional nadaswaram |
| D-27 | Reception stage | Gold-framed ivory backdrop panel, jasmine and white-rose cascades, floral urns, stage step |
| D-28 | Ivory silk curtains | Left and right panels with gold tassels and tie-backs; a "gathered" variant |
| D-29 | Hanging lights and lamps | **a** warm string lights with crystal pendants (several lengths); **b** brass thooku vilakku (hanging lamp) |
| D-30 | Rose petals | 6 single-petal variants (different curls and angles), 64–96 px source |
| D-31 | Jasmine petals and flowers | 6 variants: single flowers, buds and loose petals |
| D-32 | Polaroid frames | Ivory instant-photo frames with soft paper shadow, washi-tape strips (ivory, sandal, maroon) and a brass pin variant |
| D-33 | Paper textures | **a** ivory handmade (tile), **b** parchment back (tile), **c** deckled-edge card masks |
| D-34 | Stone and wood textures | Sandstone and teak tiles for small fills |
| D-35 | Blessing card | Ivory hanging card with gold border, punched hole and gold thread; 3 shapes (arched top, rectangle, scalloped) |
| D-36 | Travel board | Carved ivory board with gold edge and floral corner clusters |
| D-37 | Realistic rice-flour kolam (optional) | Photographed kolam on stone, for the mandapam floor |
| D-38 | Lotus flowers (optional) | Pink and white lotus heads and buds |
| D-39 | Tamboolam (optional) | Betel leaves, areca nuts, banana, coconut on a plate |
| D-40 | Phone mockup frame (Option B) | Elegant generic modern phone frame (not a specific brand replica), champagne-gold edge, with a transparent screen |
| D-41 | Desktop backdrop (Option B) | Wide temple-inspired scene (§14.1) |

**Authenticity checklist for every realistic asset (reviewed before approval):** correct jasmine form (Jasminum sambac buds, not generic white flowers) · lamp construction plausible (base, stem, oil bowl, wicks, finial) · thali culturally correct for the families' tradition (confirm with family) · no garbled text, warped geometry, extra or merged elements · consistent light direction · no "AI sheen" (plastic textures, over-sharpened edges, impossible symmetry).

---

## 8. Photography direction

| ID | Photo | Aspect and crop | Direction |
|---|---|---|---|
| P-01 | Rahul portrait | 4:5, face in the upper 40%, shoulders visible | Traditional attire (silk shirt and veshti/pancha, or sherwani), soft daylight, warm grade, calm confident expression, plain or softly blurred background (it will be framed) |
| P-02 | Divya portrait | 4:5, face in the upper 40% | Silk saree, jasmine in hair, soft daylight, warm grade |
| P-03 to P-07 | Love-story photos | 4:5 | Candid and posed moments matching each milestone; consistent warm, soft grade; minimum 1600 px on the short side |
| P-08, P-09 | Family photos | 4:5 for the oval frames (key faces in the central 70%) | Group portraits, ideally in traditional attire |
| P-10, P-11 | Memory polaroids | 1:1 | Hobbies, travel, childhood, pets; short handwritten-style captions supplied by the couple |
| P-12, P-13 | Venue photos | 16:10 | Daytime exterior or decorated hall, straight verticals, warm grade |
| P-14, P-15 | Family homes (optional) | 16:10 | Only if the families want them shown (PRD Q-D3); otherwise an illustrated doorway card |
| P-16 | Family-tree member photos (optional) | 1:1 circle-safe | Head and shoulders |

**Grading:** warm white balance (+300 K), lifted shadows, highlights rolled to ivory (never pure white), gentle saturation (−10%), subtle grain. All photos receive the same preset so they sit together.

**Placeholders (preview):** an ivory silk card with the S-13 monogram and "Photo to be provided"; in production a monogram card without text.

---

## 9. Layering and composition system

### 9.1 Layer stack (every page)

| Layer | z-index token | Contents | Rules |
|---|---|---|---|
| L0 Paper | `--z-paper: 0` | Base colour, paper texture | Always full bleed |
| L1 Watermark | `--z-watermark: 10` | Kolam, low-contrast arch, gopuram haze | ≤ 14% opacity |
| L2 Architecture | `--z-architecture: 20` | Pillars, arches, mandapam back, curtains, boards | Edge-anchored |
| L3 Hero | `--z-hero: 30` | Envelope, cards, nameplate, frames, photos, medallions, carousel | Centre-anchored |
| L4 Content | `--z-content: 40` | Text, buttons, inputs | Must stay inside the text safe zone |
| L5 Foreground decor | `--z-foreground: 50` | Garlands, strands, lamps, front pillars, florals | May overlap L3 edges; never L4 text |
| L6 Particles | `--z-particles: 60` | Petals | Pointer-events none |
| L7 Chrome | `--z-chrome: 100` | Contents, folio, music, pearl, SKIP | Fixed to the page box |
| L8 Overlays | `--z-overlay: 200` | Sheets, dialogs, focus mode | Root-mounted |
| L9 Toast | `--z-toast: 300` | Toasts | — |

### 9.2 Reference artboard and safe zones

- **Reference page:** 390 × 844 CSS px (container). Positions below are given as **% of page width (x, w)** and **% of page height (y, h)**.
- **Chrome zones:** top 0–7% (Contents at top-left, SKIP at top-right); bottom 92–100% (folio group in the centre, music at bottom-right); pearl handle at x 94%, y 42%.
- **Text safe zone:** x 12–88%, y 8–90%. All L4 content lives here.
- **Decor bleed zones:** outer 0–12% left and right; top garland zone y 0–16%; bottom lamp zone y 78–100%. Decorations may fill these; where text must enter them, the decoration yields (smaller or hidden on compact).
- **Hero zone:** x 8–92%, y 16–80%.

### 9.3 Variants

| Variant | Trigger (container) | Changes |
|---|---|---|
| **Compact** | height < 700 px | Decorations scale to 85%; optional elements hidden (listed per page); vertical gaps −25%; names −10% |
| **Narrow** | width < 360 px | Countdown 2×2; event rows tighten; polaroids 2 per side |
| **Tall** | height > 900 px | Extra breathing room distributed above and below the hero; decorations may grow to 110% |
| **Large text** | user font scaling > 120% | Text containers expand; decorative L5 layers shrink or hide to protect text |

### 9.4 Scaling rule

All page elements size in `cqw` / `cqh` units of the page container, so a page renders identically on a phone, inside the desktop mockup (Option B), and as one page of a spread (Option A). Full-bleed decoration uses `object-fit: cover` anchored to its edge; hero objects use `contain`.

---

## 10. Motion language

### 10.1 Principles

Real objects, real weight: doors swing on hinges, cloth gathers, flowers sway from their tie points, lamps flicker, paper unfolds. Motion is slow-in and soft-out, never springy beyond a 4% settle, and always finishes quickly enough that guests are never waiting.

### 10.2 Tokens

```css
--ease-silk:   cubic-bezier(0.22, 1, 0.36, 1);    /* default ease-out: entries, slides */
--ease-temple: cubic-bezier(0.65, 0, 0.35, 1);    /* heavy symmetric: doors, curtains */
--ease-page:   cubic-bezier(0.45, 0.05, 0.25, 1); /* auto page turn */
--ease-settle: cubic-bezier(0.34, 1.2, 0.64, 1);  /* gentle ≤4% overshoot: pin drop, card settle */
--t-micro: 150ms;  --t-short: 300ms;  --t-medium: 600ms;  --t-long: 900ms;
--t-reveal: 1400ms; --t-turn: 850ms;  --stagger: 80ms;
```

### 10.3 Motion catalogue

| ID | Animation | Page | Trigger | Duration | Technique | Reduced motion |
|---|---|---|---|---|---|---|
| M-01 | Opening invitation (envelope lift, flap, unfold) | Cover | Tap | 2.6 s | GSAP timeline, 3D rotateX on flap, panel rotateY unfold | 300 ms cross-fade |
| M-02 | Jasmine sway | All | Page settle | 5–7 s loop | rotate ±1.5° from tie point, phase offsets | Off |
| M-03 | Brass lamp reveal and flicker | Welcome, others | Page entry | 600 ms fade, then loop | Flame sprite: scaleY 0.96–1.04, skewX ±2°, glow opacity 0.5–0.65, random 120–260 ms | Static flame |
| M-04 | Temple doors and forward glide | Blessings | Page entry | 1.4 s doors, 1.5 s glide | rotateY ±82°, perspective 900 px; scale 1 → 1.06/1.12 | Doors open, static |
| M-05 | Gold ornamental line draw | Welcome, many | After heading | 800 ms | DrawSVG from centre outward | Visible |
| M-06 | Countdown digit roll | Countdown | Each second | 350 ms | translateY ±60% with opacity, changed digits only | Instant swap |
| M-07 | Portrait reveal (left / right) | 5, 6 | Page entry | 900 ms | translateX ∓14% → 0, rotate ∓2° → 0, opacity | Static |
| M-08 | Polaroid pop-in | 5, 6 | After portrait | 90 ms stagger | scale 0.85 → 1, rotation settles | Static |
| M-09 | Family-tree flowering | Tree overlay | Open | 1.2 s branch + 400 ms nodes | DrawSVG branch, bud scale-open | Fully drawn |
| M-10 | Love-story 3D ring | 8 | Swipe | 700 ms | rotateY ring, translateZ, velocity snap | Flat slider fade |
| M-11 | Golden thread and medallion bloom | 9, 10 | Page entry | ~450 ms per event | DrawSVG synced with bloom (scale 0.9 → 1) | Final state |
| M-12 | Mandapam assembly | 11 | Page entry | 2.2 s | Staggered rise and fade, canopy strands lower | Final state |
| M-13 | Reception curtain opening and lights | 12 | Page entry | 1.3 s + 60 ms/light | scaleX gather with fold texture compress; light opacity | Open, lit |
| M-14 | RSVP confirmation flip | 17 | Success response | 600 ms | rotateY 180°, petals | Instant swap |
| M-15 | Wishing Wall overlay | 16 | Tap | 400 ms | Sheet rises from the bottom; cards drop with pendulum settle | 200 ms fade |
| M-16 | Thank-you handwriting | 19 | Page entry | 2.4 s | DrawSVG on centreline paths, then fill fade | Static text |
| M-17 | Page curl | Global | Gestures | 850 ms auto / drag | §11 | 250 ms cross-fade |
| M-18 | Parchment bloom | Global | Distant jumps | 300 + 700 ms | Fade to `--paper-back`, then content blooms (opacity, 2 px blur → 0) | 250 ms fade |
| M-19 | Petal drift | Selected moments | Event | 5–8 s each | ≤ 12 petals; sine drift 20–40 px; rotation 90–270° | Off |
| M-20 | Scratch reveal | 3 | Pointer | Live | Canvas `destination-out`, brush 28 px, auto-clear at 55% | Pre-revealed |
| M-21 | Foil sweep | 3, 7 | Once on reveal | 700 ms | `--foil-sweep` background-position | Off |
| M-22 | Curtain/strand drag response | 4 | Page-curl drag | Live | Strand rotation proportional to drag velocity, clamp ±6° | Off |

### 10.4 Petal particle spec

Count ≤ 12 · size 14–26 px · spawn above the top edge between x 20–80% · fall 5–8 s · horizontal sine drift amplitude 20–40 px at 0.3–0.5 Hz · rotation 90–270° · opacity 0 → 1 (first 10%) → 0 (last 15%) · DOM `<img>` with `transform` only (or one canvas) · never above the active text block's centre line for more than 1 s.

---

## 11. Page-curl visual specification

| Element | Spec |
|---|---|
| Fold geometry | Flat paper fold along the perpendicular bisector of the drag vector from the grabbed corner (as in the reference); no cylindrical warping |
| Flap back face | `--paper-back #F3E7CF` + D-33b texture (`multiply`, 40%) + mirrored kolam watermark S-02 at 5% + linear gradient from the flap edge (transparent) to the fold (`rgba(75,48,38,0.12)`) |
| Fold highlight | 1 px line along the fold, `rgba(255,253,248,0.7)` |
| Shadow on the page beneath | Linear gradient from the fold line `rgba(75,48,38,0.22)` to transparent across 18% of the page width, intensity proportional to curl progress (peak at 50%) |
| Flap cast shadow | `drop-shadow(0 0 24px rgba(75,48,38,0.25))` |
| Page-stack edge (optional) | 3 px strip on the right edge with 3 hairlines in `--gold-light`, thinning as the guest progresses through the book |
| Corner peek hint | Bottom-right corner lifts 24 px (curl 6%) twice with a 600 ms ease, on first visit to page 1 only |
| Auto turn | 850 ms `--ease-page` |
| Spring back | 350 ms `--ease-silk` |

---

## 12. UI components

| # | Component | Spec |
|---|---|---|
| 12.1 | **Primary button** | Height 48–52 px, pill radius, `--maroon` fill, ivory Manrope 600 15 px, letter-spacing 0.02em; inner 1 px `--gold` hairline inset 3 px (double-border look). Pressed: `--maroon-deep`, scale 0.98. Disabled: `--sandal` fill, `--brown-soft` text, dashed gold hairline. Focus: §3.2 |
| 12.2 | **Secondary button** | Same size; `--jasmine` fill at 80%, 1 px `--gold` border, `--gold-text` label |
| 12.3 | **Icon button** | 44 × 44 px circle, `--jasmine` 85%, 1 px `--hairline` border, 22 px icon in `--brown` |
| 12.4 | **Chip** | 32 px tall (44 px tap area), 1 px gold border, Manrope 600 12 px. Selected: `--maroon` fill, ivory text |
| 12.5 | **Status badge** | "Proposed": `--sandal-light` fill, dotted 1 px `--gold` border, Cinzel 10 px `--gold-deep`, letter-spacing 0.14em. "Muhurtham" (wedding): `--maroon` outline, maroon text |
| 12.6 | **Inputs (RSVP and wishes)** | Underline style: 1 px `--hairline`; focus 2 px `--maroon`. Label Cinzel 11 px `--gold-text` above. Text Manrope 16 px (prevents iOS zoom). Error: maroon 13 px with alert icon and `aria-describedby` |
| 12.7 | **Bottom sheet** | `--jasmine` with paper texture, top radius 20 px, grab handle 36 × 4 px `--gold-light`, close button top-right, max-height 85dvh, independent scroll, shadow `0 -8px 32px var(--shadow)` |
| 12.8 | **Full-screen overlay** | `--ivory` + silk texture, 56 px header with Cinzel title and a 44 px close button (× in maroon on jasmine), content scrolls independently; enters by rising 24 px with a fade (400 ms) |
| 12.9 | **Persistent chrome** | Contents (top-left, 44 px, lotus icon); folio group "‹ — 7 — ›" bottom centre; music disc (bottom-right, 44 px `--maroon` with 1 px gold ring, ivory glyph); pearl handle (28 px, radial `#FFFFFF → #EDE3D3`, 1 px gold border at 40%, pulses scale 1 → 1.12 three times on pages 1–2) |
| 12.10 | **Contents overlay** | Styled as a book index page: "Contents" in Cinzel, 18 entries in Cormorant 18 px with dotted gold leaders and page numbers in Cinzel; footer toggles (Scroll View, Sound, Reduce motion) and Share |
| 12.11 | **Scratch panel** | Ivory card with gold rim; foil layer is a canvas filled with `--foil-gold` plus a fine brushed-metal noise; caption "Scratch to reveal" in Cinzel 10 px |
| 12.12 | **Polaroid** | D-32 frame, photo 1:1, caption in Cormorant italic 13 px, washi-tape strip at the top, rest tilt ±4–8°, shadow `0 6px 14px var(--shadow)` |
| 12.13 | **Event medallion** | D-04 wreath 132 px (wedding 152 px), inner ivory disc with S-11 emblem, still-life cutout breaking the wreath edge on the outer side |
| 12.14 | **Detail plate** | Jasmine card, 1 px gold border with 4 px corner filigree, padding 12 px, event name Cinzel 13 px, date Cormorant 18 px, time Manrope 14 px, venue Manrope 13 px `--brown-soft`, two icon buttons |
| 12.15 | **Toast** | `--brown` at 94%, ivory Manrope 14 px, radius 12 px, above the folio |
| 12.16 | **Loading spinner** | Five jasmine petals rotating slowly around a centre (1.6 s per turn); reduced motion: three pulsing dots |

---

## 13. Page-by-page visual layouts

Each page lists: **wireframe** (390 × 844 reference), **layer table** (x / y / w in % of page), **type**, **compact** changes and **motion cues** (full timing in PRD §6).

### P0 · Cover (Section 1: Splash)

```
┌──────────────────────────────────────┐
│                               [SKIP] │ 0–7%
│  ~~~~~ jasmine arch D-01 ~~~~~~~~~~  │ 4–15%
│    bell   bell   bell   bell (D-08)  │ 10–20%
│ ║                                 ║  │
│ ║   ┌───────────────────────────┐ ║  │
│ ║   │  silk envelope D-19a      │ ║  │ 28–66%
│ ║   │     ( R·D seal S-13 )     │ ║  │
│ ║   │      Rahul & Divya        │ ║  │
│ ║   └───────────────────────────┘ ║  │
│ ║ pillar D-09          pillar D-09║  │ 12–84%
│ lamp D-06                 lamp D-06  │ 64–88%
│    [ Tap to Open Our Invitation ]    │ 84–90%
│   ─── gold border S-03 (inset) ───   │
└──────────────────────────────────────┘
```

| Layer | Element | Asset | x / y / w | Notes |
|---|---|---|---|---|
| L0 | Ivory paper | D-33a | full | Texture 40% |
| L1 | Kolam watermark | S-02 | centre / 46% / 90% | 6% opacity |
| L1 | Gold border | S-03 | inset 12 px | Foil |
| L2 | Pillars (L, R) | D-09 | 3% and 83% / 12% / 14% | **Fully visible** |
| L2 | Silk drape behind envelope | D-15 | centre / 22% / 92% | 70% opacity |
| L3 | Envelope body, flap, seal | D-19a/b/c | centre / 28% / 78% | 3D-ready layers |
| L4 | "Rahul & Divya" | text | on envelope, y 52% | `--t-names-l`, `--brown` |
| L4 | Button | 12.1 | centre / 84% / 72% | "Tap to Open Our Invitation" |
| L5 | Jasmine arch | D-01 | 0 / 4% / 100% | Sway M-02 |
| L5 | Bells | D-08 | 18–82% / 10% | Sway on tap |
| L5 | Lamps (L, R) | D-06 + D-06f | 2% and 80% / 64% / 18% | Flicker M-03 |
| L7 | SKIP | chip | top-right | — |

Compact: envelope w 70%, bells shortened, lamp w 15%. Motion: M-01.

### P1 · Welcome Invitation (Section 2)

```
┌──────────────────────────────────────┐
│ (≡)   ~~~ jasmine swag D-01 ~~~      │ 0–14%
│        |      |        |  strands    │
│              ( R·D ring )            │ 12–18%
│      TOGETHER WITH OUR FAMILIES      │ 22%
│  We joyfully invite you to celebrate │ 26%
│          the wedding of              │
│   ╔═══════ gold nameplate ═══════╗   │ 34–52%
│   ║        Rahul & Divya         ║   │
│   ╚══════════════════════════════╝   │
│          ────── ◆ ──────  (S-04)     │ 54%
│       Wednesday, 7 April 2027        │ 58%
│            10:30 AM IST              │ 62%
│      Tirupati, Andhra Pradesh        │ 66%
│   "Two families, one sacred promise" │ 72–80%
│ lamp                           lamp  │ 74–92%
│             ‹  — 1 —  ›          (♪) │
└──────────────────────────────────────┘
```

| Layer | Element | Asset | x / y / w | Notes |
|---|---|---|---|---|
| L0 | Jasmine paper | D-33a | full | — |
| L1 | Stone arch watermark | D-10 (low-contrast) | centre / 6% / 96% | 14% opacity |
| L3 | Monogram ring | S-13 | centre / 12% / 22% | Unfurl |
| L3 | Nameplate | D-18 + S-08 | centre / 34% / 84% | — |
| L4 | Lead lines | text | centre / 22–30% / 76% | Eyebrow + display-m |
| L4 | Names | text | inside the nameplate | `--t-names-xl`; "&" maroon italic |
| L4 | Divider | S-04 | centre / 54% / 50% | Draw M-05 |
| L4 | Date, time, city | text | centre / 58–68% | Cormorant 20 px / Manrope 15 px |
| L4 | Message C-01 | text | centre / 72–80% / 72% | display-m 18 px, `--brown-soft` |
| L5 | Swag and strands | D-01, D-02 | 0 / 0–24% | Sway |
| L5 | Lamps | D-06 | 0% and 82% / 74% / 18% | Clear of the text column |

Compact: strands hidden; message on one line; lamps 15%. Telugu "శుభలేఖ" (if approved) sits above the eyebrow in `--t-telugu`, `--gold-text`.

### P2 · Divine Blessings (Section 3)

```
┌──────────────────────────────────────┐
│ ═══ mango-leaf thoranam D-13 ═══     │ 2–8%
│   ╭──── carved arch D-10 ────╮       │ 0–62%
│   │ ┌──────┐   ┌──────┐      │       │
│   │ │ door │   │ door │ D-11 │       │ (open to reveal ↓)
│   │ │  L   │   │  R   │      │       │
│   │   gopuram haze D-12      │       │
│   │   Shankha · Namam · Chakra (S-12)│ 30–42%
│   ╰──────────────────────────╯       │
│ lamp  garland        garland  lamp   │
│  ┌──────── ivory scroll D-20 ──────┐ │ 66–88%
│  │      ఓం నమో వేంకటేశాయ            │ │
│  │       OM NAMO VENKATESAYA       │ │
│  │  With the divine grace of …     │ │
│  └─────────────────────────────────┘ │
│             ‹  — 2 —  ›          (♪) │
└──────────────────────────────────────┘
```

| Layer | Element | Asset | x / y / w | Notes |
|---|---|---|---|---|
| L0 | Ivory | — | full | — |
| L1 | Gopuram haze | D-12 dawn | centre / 10% / 70% | Behind the doors |
| L2 | Arch | D-10 | 0 / 0% / 100% (h 62%) | — |
| L3 | Sacred emblem | S-12 | centre / 30% / 34% | Warm radial light behind at ≤ 35% |
| L3 | Doors L and R | D-11 | inside the arch opening | Hinged at the outer edges |
| L4 | Scroll and text | D-20 + text | centre / 66% / 86% | Telugu 20 px, Cinzel 12 px, Cormorant italic 18 px |
| L5 | Garlands on door posts | D-04 | 14% and 78% / 8% | Sway ±1° |
| L5 | Thoranam | D-13 | 0 / 2% / 100% | — |
| L5 | Lamps | D-06 | 0% and 84% / 50% / 16% | — |

Compact: scroll text reduced to invocation + one blessing sentence (the rest in a "Read blessing" sheet). Motion: M-04, then scroll unroll.

### P3 · Save the Date (Section 4)

```
┌──────────────────────────────────────┐
│░░░░░░ sandal silk background ░░░░░░░░│
│ ┌──────────────────────────────────┐ │ 8–88% (card)
│ │jas                          jas  │ │ corners D-03 + S-01
│ │       Save  the  Date (script)   │ │ 10–20% of card
│ │   ┌──────┐ ┌──────┐ ┌──────┐     │ │ 24–40%
│ │   │  07  │ │APRIL │ │ 2027 │     │ │ gold foil scratch
│ │   └──────┘ └──────┘ └──────┘     │ │
│ │        Reveal date (text btn)    │ │
│ │   S  M  T  W  T  F  S            │ │ 46–70% (mini April grid)
│ │               1  2  3            │ │
│ │   4  5  6 (7) 8  9 10            │ │  ← 7 in jasmine wreath
│ │  …                               │ │
│ │            Wednesday             │ │
│ │          Rahul & Divya           │ │ 74%
│ │     [   Add to Calendar   ]      │ │ 84–92%
│ │kolam                       kolam │ │
│ └──────────────────────────────────┘ │
│             ‹  — 3 —  ›          (♪) │
└──────────────────────────────────────┘
```

| Layer | Element | Asset | x / y / w | Notes |
|---|---|---|---|---|
| L0 | Sandal + silk wash | D-16 texture | full | — |
| L3 | Calendar card | D-33a + D-33c deckle | centre / 8% / 88% (h 78%) | Double gold foil border |
| L4 | Script title | S-14 "Save the Date" | card 10–20% | Draw, then fill |
| L4 | Scratch panels ×3 | 12.11 | card 24–40%, each 26% of card width | Labels below: DATE · MONTH · YEAR (Cinzel 9 px) |
| L4 | Month grid | text | card 46–70% | Cinzel 10 px weekday heads, Cormorant 16 px dates; "7" in `--maroon` 600 |
| L4 | Jasmine wreath on 7 | D-04 mini / S-01 stroke | around "7" | Draws after full reveal |
| L4 | Names, weekday, button | text + 12.1 | card 72–92% | — |
| L5 | Corner jasmine | D-03 | 4 corners | Over the card border only |

Compact: month grid replaced by "Wednesday · Muhurtham 10:30 AM IST".

### P4 · Wedding Countdown (Section 5)

```
┌──────────────────────────────────────┐
│     ───── ◆ ─────                    │
│   COUNTING DOWN TO THE MUHURTHAM     │ 18%
│     ───── ◆ ─────                    │
│  bell   bell   bell   bell           │
│ ╭────╮ ╭────╮ ╭────╮ ╭────╮          │ 36–54%
│ │ 166│ │ 07 │ │ 42 │ │ 09 │          │ niche panels S-07
│ │DAYS│ │HRS │ │MIN │ │SEC │          │
│ ╰────╯ ╰────╯ ╰────╯ ╰────╯          │
│   | jasmine strands between panels   │
│  Wednesday, 7 April 2027 · 10:30 IST │ 62%
│  That's 6:00 AM your time (London)   │ 67% (only if not IST)
│             brass lamp D-06          │ 74–92%
│             ‹  — 4 —  ›          (♪) │
└──────────────────────────────────────┘
```
*(Numbers are illustrative only.)*

| Layer | Element | Asset | x / y / w | Notes |
|---|---|---|---|---|
| L0 | Ivory | — | full | — |
| L1 | Kolam rosette | S-02 | centre / 44% / 110% | 8% |
| L3 | Niche panels ×4 | S-07 + silk inset D-16 | 6–94% / 36% / 21% each | Gap 3% |
| L4 | Numerals | text | panel centre | `--t-numeral`, `--brown` |
| L4 | Labels | text | panel bottom | Cinzel 10 px `--gold-text` |
| L4 | Heading, target, local time | text | 18%, 62%, 67% | — |
| L5 | Bells on each apex | D-08 | above each panel | Nod on minute change |
| L5 | Strands between panels | D-02 short | 3 positions | Sway, drag response M-22 |
| L5 | Lamp | D-06 | centre / 74% / 20% | Flicker |

Narrow: 2×2 grid (panels 40% wide). Arrival state: panels replaced by the arrival message in a gold frame (S-08).

### P5 · Meet the Couple: Rahul (Section 6a)

```
┌──────────────────────────────────────┐
│║            THE GROOM                │ 8%
│║              Rahul                  │ 12–18%
│║  [pol]  ╭─── silk frame ───╮  [pol] │
│║  [pol]  │                  │  [pol] │ 22–62%
│║ pillar  │   portrait P-01  │  [pol] │
│║  D-09   │                  │        │
│║         ╰──────────────────╯        │
│║    Biography (max 4 lines) …        │ 66–84%
│║            Read more                │
│             ‹  — 5 —  ›          (♪) │
└──────────────────────────────────────┘
```

| Layer | Element | Asset | x / y / w | Notes |
|---|---|---|---|---|
| L0 | Ivory + courtyard wash | D-12 faint | full | 10% |
| L2 | Left pillar | D-09 | 0 / 4% / 14% | — |
| L3 | Portrait frame | D-16 maroon-gold border + S-06 arch + D-17 corners | centre / 22% / 70% | 4:5 |
| L3 | Portrait | P-01 | inside the frame | Face-safe crop |
| L3 | Polaroids ×6 | D-32 + P-10 | margins x 2–22% and 78–98%, y 24–60% | Overlap frame ≤ 12%, never the face |
| L4 | Eyebrow, name, bio | text | 8%, 12–18%, 66–84% | — |

Compact: 2 polaroids per side; bio 3 lines. Motion: M-07 (from the left), M-08.

### P6 · Meet the Couple: Divya (Section 6b)

Mirror of P5: pillar on the **right**; frame of ivory silk with gold zari (D-15/D-16) decorated with jasmine clusters at the top corners and a jasmine strand down the right side (D-02, D-03); "THE BRIDE · Divya"; polaroids P-11; portrait P-02 enters **from the right**. Base colour jasmine rather than ivory, for a subtle shift.

### P7 · Parents and Family (Section 7)

```
┌──────────────────────────────────────┐
│     ╭~~ jasmine-rose garland ~~╮     │
│    ╭──── gold arch nameplate ────╮   │ 6–60%
│    │ With the blessings of our   │   │
│    │      beloved parents        │   │
│    │          Rahul              │   │
│    │  son of [Father] & [Mother] │   │
│    │            &                │   │
│    │          Divya              │   │
│    │ daughter of [Father] & [Mo] │   │
│ lamp╰────────────────────────────╯lamp│
│   ( oval frame )      ( oval frame ) │ 62–84%
│   Groom's Family      Bride's Family │
│  [View Groom's Tree] [View Bride's]  │ 86–90%
│             ‹  — 7 —  ›          (♪) │
└──────────────────────────────────────┘
```

| Layer | Element | Asset | x / y / w | Notes |
|---|---|---|---|---|
| L0 | Ivory + silk wash | D-15 | full | 30% |
| L3 | Arch nameplate | S-06 + D-18 foil | centre / 6% / 86% (h 54%) | Foil sweep M-21 once |
| L4 | Names text | text | inside the arch | Write-in line by line |
| L3 | Oval frames ×2 | S-09 + P-08 / P-09 | 6% and 54% / 62% / 40% | Jasmine sprigs D-03 at the tops |
| L4 | Tree buttons | 12.2 | under each frame | 44 px |
| L5 | Garland on the arch | D-04 | arch curve | Sway |
| L5 | Lamps at the arch feet | D-07 | 8% and 86% / 54% / 8% | — |

**Family-tree overlay** (12.8): branch S-17 rising from the bottom centre; node medallions 72 px (parents pair 96 px) arranged: Parents (bottom), Grandparents (two pairs, middle), Siblings (row), Others (grouped chips, top). Jasmine buds open into nodes (M-09). Missing nodes hidden in production.

### P8 · Our Love Story (Section 8)

```
┌──────────────────────────────────────┐
│           OUR LOVE STORY             │ 8%
│                                      │
│    ▯   ▮   ┌──────────┐   ▮   ▯      │ 20–60% (3D ring)
│   far side │  front   │ side  far    │
│            │  photo   │              │
│            └──────────┘              │
│     ~~~~ jasmine garland arc ~~~~    │ 64%
│   ┌──────── caption plate ────────┐  │ 70–84%
│   │      OUR FIRST MEETING        │  │
│   │  one or two lines of story …  │  │
│   └───────────────────────────────┘  │
│           o  o  ●  o  o              │ 88%
│             ‹  — 8 —  ›          (♪) │
└──────────────────────────────────────┘
```

| Layer | Element | Asset | x / y / w | Notes |
|---|---|---|---|---|
| L0 | Jasmine + silk sheen | D-16 | full | — |
| L1 | Kolam watermark | S-02 | centre | 6% |
| L3 | Ring of 5 photo cards | P-03…P-07 + ivory border, gold corners D-17 | centre / 20–60%; front card w 62% | Side cards scale 0.72, rotateY ±38°, brightness 0.9, **no heavy blur** (≤ 1 px) |
| L4 | Caption plate | 12.14 variant | centre / 70% / 84% | Cross-fade on change |
| L4 | Dots | jasmine-bud dots | centre / 88% | Active = maroon bud |
| L5 | Garland arc | D-01 | 6–94% / 62% | Sway |

Ring parameters: radius 1.1× card width, perspective 1100 px, 72° between cards.

### P9 · Events Timeline I: Mehndi, Haldi, Sangeet (Section 9a)

```
┌──────────────────────────────────────┐
│  ~marigold~ [ WEDDING CELEBRATIONS ] │ 4–16% (carved signboard)
│  ( MEHNDI  )──┐ ┌──────────────────┐ │ 20–44%
│  ( wreath  )  ╰─│ Mehndi           │ │
│  ( + bowl  )    │ Mon, 5 Apr 2027  │ │
│                 │ 4:00 PM [Proposed]│ │
│        thread ╲ │ Bride's home ⌖ ▣ │ │
│ ┌──────────────────┐ ( HALDI   )     │ 46–70%
│ │ Haldi            │ ( wreath  )     │
│ │ Tue, 6 Apr · 9 AM│ ( turmeric)     │
│ │ Groom's home ⌖ ▣ │──╯              │
│  ( SANGEET )──┐ ┌──────────────────┐ │ 72–94%
│  ( veena + )  ╰─│ Sangeet Night    │ │
│  ( dancers )    │ Tue, 6 Apr 6:30PM│ │
│                 │ Function hall ⌖ ▣│ │
│             ‹  — 9 —  ›          (♪) │
└──────────────────────────────────────┘
```
*(⌖ = Location button, ▣ = Calendar button.)*

| Layer | Element | Asset | x / y / w | Notes |
|---|---|---|---|---|
| L0 | Ivory | — | full | — |
| L1 | Golden thread | S-05 | zigzag 20–96% | Draws with reveals |
| L2 | Signboard | D-04 signboard + D-05 swags | centre / 4% / 84% | Gold Cinzel lettering (text layer, not baked) |
| L3 | Medallions ×3 | D-04 wreath + S-11 | alternating x 4% / 62%, w 34% | Still-lifes D-23, D-24, D-26 break the outer edge |
| L3 | Sangeet line art | S-19 | inside the medallion | Line draw |
| L3 | Hanging lamps | D-29b | above the Sangeet medallion | — |
| L4 | Detail plates ×3 | 12.14 | opposite side, w 60% | Badges 12.5 |
| L5 | Bells at thread joins | D-08 small | joins | Nod once |

Compact: medallions 96 px, still-lifes cropped smaller, venue lines truncated (full in the event sheet).

### P10 · Events Timeline II: Wedding, Reception (Section 9b)

Same system as P9. Two rows: **Wedding** (medallion 152 px with maroon inner ring, still-life: mandapam crop D-21, thali plate D-22, lamps; badge "Muhurtham", **no** "Proposed" badge) at 10–42%; **Reception** (medallion with stage crop D-27, white jasmine, gold) at 46–74%. The thread ends at 80% in the *mangalyam* knot (S-05 end) with two small bells; beneath it the summary line "All times IST · Proposed timings will be confirmed" (Manrope 13 px `--brown-soft`) at 86%.

### P11 · Wedding Ceremony (Section 10)

```
┌──────────────────────────────────────┐
│ ═══ mango-leaf thoranam on beam ═══  │ 6–12%
│ ┃  | | | jasmine canopy | | |  ┃     │ 10–30%
│ ┃        (chandelier)          ┃     │
│ ┃  ┌────────────────────────┐  ┃     │ 34–60%
│ ┃  │ THE SACRED WEDDING     │  ┃     │
│ ┃  │      CEREMONY          │  ┃     │
│ ┃  │   Rahul & Divya        │  ┃     │
│ ┃  │ Wednesday, 7 April 2027│  ┃     │
│ ┃  │ Muhurtham: 10:30 AM IST│  ┃     │
│ ┃  │ Tirupati, Andhra Prad. │  ┃     │
│ ┃  └────────────────────────┘  ┃     │
│ banana     thali plate D-22  banana  │ 64–76%
│ lamp ▓▓▓▓ platform + kolam ▓▓▓▓ lamp │ 78–92%
│             ‹ — 11 — ›           (♪) │
└──────────────────────────────────────┘
```

| Layer | Element | Asset | x / y / w | Notes |
|---|---|---|---|---|
| L0 | Ivory | — | full | — |
| L2 | Back pillars, beam, canopy frame | D-21 | 4–96% / 6–88% | Rise staggered |
| L2 | Platform + kolam | D-21 base + S-02 chalk (or D-37) | 0 / 78% / 100% | — |
| L3 | Text plaque | jasmine card + S-03 border | centre / 34% / 78% | — |
| L3 | Thali plate | D-22 | centre / 64% / 34% | — |
| L5 | Front pillars + banana plants | D-21 front + D-14 | 0–16% and 84–100% | — |
| L5 | Canopy strands + chandelier | D-02, D-05 | 10–30% | Lower in like a curtain, then sway |
| L5 | Thoranam | D-13 | 6% | — |
| L5 | Silk drapes at pillars | D-15 | pillar tops | — |
| L5 | Lamps | D-06 | corners at 70% | Flicker |

Compact: canopy strands shorter; thali plate 28%.

### P12 · Grand Reception (Section 11)

```
┌──────────────────────────────────────┐
│ ' . ' hanging lights D-29a ' . ' .   │ 0–26%
│▒▒▒│   ┌──── gold-framed ivory ───┐│▒▒│
│ c │   │ GRAND WEDDING RECEPTION  ││ c │ 32–68%
│ u │   │      Rahul & Divya       ││ u │
│ r │   │ Proposed: Wed, 7 Apr 2027││ r │
│ t │   │ Proposed: 6:30 PM IST    ││ t │
│ a │   │ Venue: same hall as      ││ a │
│ i │   │        Sangeet           ││ i │
│ n │   └──────────────────────────┘│ n │
│ urn          stage step       urn │  │ 70–94%
│             ‹ — 12 — ›           (♪) │
└──────────────────────────────────────┘
```

| Layer | Element | Asset | x / y / w | Notes |
|---|---|---|---|---|
| L0 | Evening wash | `--evening-wash` | full | — |
| L2 | Stage backdrop | D-27 | centre / 20–80% / 84% | — |
| L3 | Reception card | jasmine card, double gold border | centre / 32% / 74% | Names in `--maroon` |
| L5 | Lights | D-29a | 0–26% | Fade in sequentially, gentle twinkle on 20% |
| L5 | Curtains L, R | D-28 | each 0–18% when open | Closed = 50% each |
| L5 | Floral urns | D-27 part | corners 70–94% | — |

### P13 · Dress Code (Section 12)

```
┌──────────────────────────────────────┐
│             DRESS CODE               │ 8%
│   Suggestions to celebrate in colour │ 12%
│        ╱‾‾‾‾╲  ┌────────┐  ╱‾‾‾‾╲    │
│       │back │  │silk band│ │back │   │ 22–84% (fanned deck)
│       │card │  │ attire  │ │card │   │
│        ╲___╱   │ sketch  │  ╲___╱    │
│                │ ● ● ●   │ swatches  │
│                │ HALDI   │           │
│                │ Yellow or ivory     │
│                │ traditional [Sugg.] │
│                └────────┘            │
│            o  ●  o  o  o             │ 88%
│             ‹ — 13 — ›           (♪) │
└──────────────────────────────────────┘
```

| Layer | Element | Asset | x / y / w | Notes |
|---|---|---|---|---|
| L0 | Jasmine | — | full | — |
| L3 | Card deck ×5 | jasmine card + D-16 band + S-20 | centre / 22% / 76% (3:4.4) | Back cards rotate ±6°, offset 4% |
| L4 | Card text | text | in card | Cinzel 13 px event, Cormorant 18 px suggestion, badge "Suggested" |
| L5 | Corner jasmine | D-03 | page corners | — |

Event colour stories (band and swatches): **Mehndi** leaf green + rose pink + marigold; **Haldi** turmeric yellow + ivory + soft green; **Sangeet** jewel tones (emerald, ruby, sapphire); **Wedding** temple maroon + antique gold + ivory; **Reception** ivory + champagne gold + blush.

### P14 · Venues and Directions (Section 13)

```
┌──────────────────────────────────────┐
│ ~~ jasmine & marigold garland arch ~~│ 0–10%
│ ║               VENUES             ║ │ 6–12%
│ ║ [Wedding][Sangeet & Rec][Mehndi][H]│ 14–19%
│ ║   ┌────── gold photo frame ─────┐ ║│ 22–48%
│ ║   │       venue photo 16:10     │ ║│
│ ║   └─────────────────────────────┘ ║│
│ ║   ┌──── illustrated map card ───┐ ║│ 50–70%
│ ║   │           (maroon pin)      │ ║│
│ ║   └─────────────────────────────┘ ║│
│ ║  Venue name · address            ║ │ 72–82%
│ ║  (Wedding · Wed 7 Apr)           ║ │
│ ║     [   Get Directions   ]       ║ │ 85–92%
│             ‹ — 14 — ›           (♪) │
└──────────────────────────────────────┘
```

| Layer | Element | Asset | x / y / w | Notes |
|---|---|---|---|---|
| L0 | Ivory | — | full | — |
| L2 | Pillars at the edges | D-09 three-quarter | 0–10% and 90–100% | — |
| L3 | Photo frame | S-03 frame + P-12…P-15 | centre / 22% / 84% | Placeholder: monogram card |
| L3 | Map card | commissioned illustration (per venue) | centre / 50% / 84% | Placeholder: kolam pattern + pin emblem |
| L4 | Tabs | 12.4 chips | 14–19% | Horizontal scroll zone |
| L4 | Address, events, button | text, chips, 12.1 | 72–92% | Button disabled until location exists |
| L5 | Garland arch | D-04 + D-05 | 0–10% | Sway |

### P15 · Transportation and Accommodation (Section 14)

```
┌──────────────────────────────────────┐
│ flor ══ thoranam on board ══ flor    │
│ ┌──────── ivory travel board ──────┐ │ 6–90%
│ │       TRAVEL & STAY              │ │
│ │ ┌─────────────┐ ┌─────────────┐  │ │
│ │ │ [plane]     │ │ [train]     │  │ │ tiles 2×3
│ │ │ Airport     │ │ Railway     │  │ │
│ │ │ Tirupati TIR│ │ TPTY · RU   │  │ │
│ │ └─────────────┘ └─────────────┘  │ │
│ │ ┌─────────────┐ ┌─────────────┐  │ │
│ │ │ Getting here│ │ Parking     │  │ │
│ │ └─────────────┘ └─────────────┘  │ │
│ │ ┌─────────────┐ ┌─────────────┐  │ │
│ │ │ Stay        │ │ Shuttle     │  │ │
│ │ └─────────────┘ └─────────────┘  │ │
│ │ ▬▬▬ Need travel help? [Call][WA] │ │ ribbon
│ └──────────────────────────────────┘ │
│             ‹ — 15 — ›           (♪) │
└──────────────────────────────────────┘
```
*(Icons are S-10 line icons, not emoji.)*

| Layer | Element | Asset | x / y / w | Notes |
|---|---|---|---|---|
| L0 | Sandal-light | — | full | — |
| L2 | Travel board | D-36 | centre / 6% / 92% | — |
| L4 | Tiles ×6 | jasmine tiles, 1 px gold border | 2×3 grid, each 44% × 18% | Icon 28 px `--gold-text`, label Cinzel 12 px, summary Manrope 13 px |
| L4 | Help ribbon | `--maroon` ribbon, ivory text | board bottom | Actions disabled until contact provided |
| L5 | Floral corners | D-03 + D-05 | board corners | Gentle sway |

### P16 · Wishing Wall (Section 15)

```
┌──────────────────────────────────────┐
│     BLESSINGS FOR RAHUL & DIVYA      │ 6–14%
│ ═○═══ brass rod with jasmine ═══○═   │ 18%
│     |        |         |      |      │ threads
│  ┌──────┐ ┌──────┐  ┌──────┐         │
│  │ wish │ │ wish │  │ wish │  bells  │ 20–74%
│  │ name │ │ name │  │ name │         │ (staggered heights)
│  └──────┘ └──────┘  └──────┘         │
│      ┌──────┐   ┌──────┐             │
│      │ wish │   │ wish │             │
│      └──────┘   └──────┘             │
│  [ Write a Blessing ] [View All Wishes]│ 80–92%
│             ‹ — 16 — ›           (♪) │
└──────────────────────────────────────┘
```

| Layer | Element | Asset | x / y / w | Notes |
|---|---|---|---|---|
| L0 | Ivory + kolam corners | S-01 | full | — |
| L2 | Brass rod + jasmine | D-25 rod variant / D-01 | 6–94% / 18% | — |
| L3 | Blessing cards ×5 | D-35 | staggered 2 columns, w 40% | Threads 1 px gold, pendulum settle |
| L4 | Card text | text | in cards | Cormorant italic 16 px, Cinzel 11 px name |
| L4 | Buttons | 12.1 + 12.2 | 80–92% | — |
| L5 | Bells between cards | D-08 | rod | — |
| L5 | Small lamp | D-07 | centre / 94% | — |

Overlays: composer (single large D-35 card, full screen) and All Wishes (masonry grid of D-35 cards, 2 columns on mobile).

### P17 · RSVP (Section 16)

```
┌──────────────────────────────────────┐
│░░░░░░ sandal silk background ░░░░░░░░│
│ ┌──────────────────────────────────┐ │ 6–92%
│ │jas      ( kalasam emblem )   jas │ │
│ │          KINDLY RESPOND          │ │
│ │       by [RSVP deadline]         │ │
│ │ GUEST NAME ____________________  │ │
│ │ ┌──────────────┐┌──────────────┐ │ │
│ │ │Joyfully accept││Regretfully   │ │ │ attendance cards
│ │ │              ││decline       │ │ │
│ │ └──────────────┘└──────────────┘ │ │
│ │ ATTENDEES   [ − ]  2  [ + ]      │ │
│ │         (continue to step 2)     │ │
│ │ [        Confirm RSVP         ]  │ │
│ │ ~~~~ paisley zari band S-15 ~~~~ │ │
│ └──────────────────────────────────┘ │
│             ‹ — 17 — ›           (♪) │
└──────────────────────────────────────┘
```

| Layer | Element | Asset | x / y / w | Notes |
|---|---|---|---|---|
| L0 | Sandal + silk | D-16 | full | — |
| L3 | RSVP card | D-33a + D-33c deckle, double gold border, S-01 corners | centre / 6% / 88% | — |
| L4 | Form step 1 | 12.6, attendance cards, stepper | card | Step 2 in focus mode |
| L4 | Confirm RSVP | 12.1 | card bottom, full width − 32 px | 52 px |
| L5 | Corner jasmine | D-03 | card top corners | Sway |
| L5 | Kalasam emblem | D-17 | card top centre | — |

Focus mode: card scales to fill the screen (400 ms), sandal background dims to 60%, form scrolls; success face shows a gold check inside a jasmine wreath and the summary.

### P18 · Need Help / Contact (Section 17)

```
┌──────────────────────────────────────┐
│            NEED HELP?                │ 8%
│   We're happy to help with anything  │ 12%
│  ┌────────────────────────────────┐  │ 18–40%
│  │ (lotus) GROOM'S FAMILY REP.    │  │
│  │ Name to be provided            │  │
│  │ [Call] [WhatsApp] [Details]    │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │ 42–64%
│  │ (jasmine) BRIDE'S FAMILY REP.  │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │ 66–88%
│  │ (bell) EVENT COORDINATOR       │  │
│  └────────────────────────────────┘  │
│             ‹ — 18 — ›           (♪) │
└──────────────────────────────────────┘
```

| Layer | Element | Asset | x / y / w | Notes |
|---|---|---|---|---|
| L0 | Sandal-light + silk | D-16 | full | — |
| L3 | Visiting cards ×3 | jasmine card, gilt edge (1.5 px foil) | centre, w 88%, offsets ±1.5° | — |
| L4 | Role, name, actions | text + icon buttons | in card | Disabled until numbers exist |
| L5 | Jasmine sprig on each card corner | D-03 small | — | — |

### P19 · Thank You (Section 18, back cover)

```
┌──────────────────────────────────────┐
│ jasmine ~~ ivory silk drape ~~ jasm. │ 0–14%
│      golden-hour gopuram haze D-12   │ 10–60%
│   ┌──────── ivory veil ─────────┐    │ 24–66%
│   │  Thank You for Blessing     │    │ (handwriting S-14)
│   │      Our Journey            │    │
│   │      Rahul & Divya          │    │
│   │  WITH LOVE AND BLESSINGS    │    │
│   │ Until we see you in Tirupati│    │
│   └─────────────────────────────┘    │
│   temple courtyard + reflections     │ 60–80%
│ lamp [Return to First Page] [Share]  lamp│ 76–90%
│             ‹ — 19 —             (♪) │
└──────────────────────────────────────┘
```

| Layer | Element | Asset | x / y / w | Notes |
|---|---|---|---|---|
| L0 | Golden-hour wash | `--golden-hour` | full | — |
| L1 | Gopuram + courtyard | D-12 golden-hour | 0 / 10–80% / 100% | Soft, low contrast |
| L3 | Veil card | `--veil` + S-03 border | centre / 24% / 84% | — |
| L4 | Handwriting, names, sign-off, line | S-14 + text | in the veil | `--t-script-l` 40 px, names 30 px |
| L4 | Buttons | 12.2 + 12.1 | 78–88% | — |
| L5 | Jasmine + silk drape | D-03, D-15 | top | — |
| L5 | Lamps | D-06 | corners 70% | Slow breathing glow (8 s) |

---

## 14. Desktop backgrounds

### 14.1 Option B: mobile mockup scene (recommended)

```
┌────────────────────────────────────────────────────────────────────┐
│ jasmine garland (top-left)                    jasmine garland (TR) │
│ ║ carved                                                  carved ║ │
│ ║ pillar     Rahul & Divya        ┌──────────┐            pillar ║ │
│ ║            Wednesday,           │  phone   │   [ QR ]          ║ │
│ ║            7 April 2027         │  mockup  │   Open on         ║ │
│ ║            Tirupati             │  (book   │   your phone      ║ │
│ ║                                 │  inside) │                   ║ │
│ ║        soft-focus gopuram       └──────────┘                   ║ │
│ brass lamp (BL)             kolam watermark            brass lamp │
└────────────────────────────────────────────────────────────────────┘
```

- D-41 at 2560 × 1440 (AVIF ≤ 380 KB, WebP ≤ 480 KB), `object-fit: cover`, centre-anchored. Palette: ivory and sandalwood haze, gold accents; low contrast so the mockup is the hero.
- Mockup D-40 centred, height 88vh (max 932 px), with a soft shadow `0 40px 80px rgba(75,48,38,0.25)`.
- Left caption: Cormorant 40 px names, Cinzel 13 px details. Right: QR code (B-03, `--brown` on jasmine, 132 px) with caption Manrope 13 px.
- Optional 40 s parallax drift (±8 px) of the gopuram layer; off under reduced motion. The background never changes between pages.

### 14.2 Option A: Open Book scene (optional)

- A silk-draped teak table (ivory Venkatagiri silk runner with gold zari) under warm overhead light; a carved stone wall with niches and lamps in soft focus behind.
- The open book sits centred: page height `min(92vh, 0.5 × 92vw × 16/9)`, spine shadow gradient 6% wide, page-stack thickness at both outer edges (grows on the left as the guest advances).
- Names and date embossed in gold on the runner below the book (text layer, not baked).
- Assets: table scene 2560 × 1440 (≤ 450 KB AVIF), spine and edge textures (SVG and small WebP).

---

## 15. Asset checklist

Sizes are **export sizes** (2× for the 390 px reference page; full-width assets exported at 1080 px wide to also serve a desktop spread). Budgets are per file in WebP; AVIF should come in 20–30% smaller. ☐ = to source or create.

### 15.1 SVG

| ID | Asset | Size (viewBox) | Budget | Used on | Status |
|---|---|---|---|---|---|
| S-01 | Kolam corners ×4 | 160 × 160 | ≤ 6 KB each | 3, 16, 17, overlays | ☐ |
| S-02 | Kolam medallion | 600 × 600 | ≤ 14 KB | Cover, 4, 8, 11, page back | ☐ |
| S-03 | Temple frieze border (tile) | 240 × 24 | ≤ 5 KB | Cover, 11, 14, 19 | ☐ |
| S-04 | Ornamental divider | 320 × 24 | ≤ 3 KB | 1, 4, many | ☐ |
| S-05 | Golden thread + nodes + knot | 390 × 844 (per page) | ≤ 10 KB | 9, 10 | ☐ |
| S-06 | Temple arch frame | 340 × 460 | ≤ 8 KB | 5, 6, 7 | ☐ |
| S-07 | Mandapa niche | 90 × 130 | ≤ 3 KB | 4 | ☐ |
| S-08 | Cartouche edge | 330 × 150 | ≤ 6 KB | 1, 4 (arrival) | ☐ |
| S-09 | Oval portrait ornament | 160 × 200 | ≤ 6 KB | 7 | ☐ |
| S-10 | Icon set (26 icons) | 24 × 24 | ≤ 1 KB each (sprite ≤ 18 KB) | Global | ☐ |
| S-11 | Event emblems ×5 | 48 × 48 | ≤ 2 KB each | 9, 10, 13 | ☐ |
| S-12 | Sacred emblem (Shankha, Namam, Chakra) | 300 × 160 | ≤ 10 KB | 2 | ☐ (family approval) |
| S-13 | R · D monogram | 200 × 200 | ≤ 8 KB | Cover, 1, favicon, placeholders | ☐ |
| S-14 | Handwriting paths ×2 | per phrase | ≤ 16 KB each | 3, 19 | ☐ |
| S-15 | Paisley zari band | 240 × 20 | ≤ 4 KB | 17 | ☐ |
| S-16 | Folio flourishes | small | ≤ 1 KB | Chrome, Contents | ☐ |
| S-17 | Sikku line set / tree branch | 390 × 800 | ≤ 8 KB | Tree overlay | ☐ |
| S-18 | Henna pattern | 200 × 200 | ≤ 10 KB | 9 | ☐ |
| S-19 | Sangeet couple (Kalamkari line) | 200 × 200 | ≤ 18 KB | 9 | ☐ |
| S-20 | Attire sketches ×5 pairs (+ WebP wash ≤ 40 KB each) | 300 × 400 | ≤ 20 KB each | 13 | ☐ |

### 15.2 Transparent PNG / WebP (realistic decor)

| ID | Asset | Export size (px) | Budget | Used on | Status |
|---|---|---|---|---|---|
| D-01 | Jasmine garland swag (2 variants) | 1080 × 360 | ≤ 90 KB | Cover, 1, 8, 16 | ☐ |
| D-02 | Jasmine strands (3 lengths × 2) | 80 × 340 / 520 / 740 | ≤ 25 KB | 1, 4, 6, 11 | ☐ |
| D-03 | Jasmine clusters (4 orientations) + singles | 280 × 280 | ≤ 30 KB | 3, 6, 7, 15, 17, 18, 19 | ☐ |
| D-04 | Jasmine-rose wreaths ×3, red-white garland, signboard | 320 × 320 / 1080 × 260 / 900 × 260 | ≤ 45 / 80 / 70 KB | 2, 7, 9, 10, 14 | ☐ |
| D-05 | Marigold garlands (vertical, swag) + heads | 1080 × 220 / 80 × 600 | ≤ 70 KB | 9, 11, 14, 15 | ☐ |
| D-06 | Kuthuvilakku L/R + flame frames ×3 + glow | 360 × 900 (+ 60 × 90 flames) | ≤ 60 KB (+ 4 KB each) | Cover, 1, 2, 4, 7, 11, 19 | ☐ |
| D-07 | Agal diyas | 160 × 140 | ≤ 12 KB | 7, 16 | ☐ |
| D-08 | Temple bells (single, cluster) | 90 × 220 / 260 × 260 | ≤ 14 / 30 KB | Cover, 4, 9, 16 | ☐ |
| D-09 | Carved pillars L/R (full, ¾) | 240 × 1800 / 240 × 1300 | ≤ 80 / 60 KB | Cover, 5, 6, 14 | ☐ |
| D-10 | Temple arch / lintel + watermark variant | 1080 × 1340 | ≤ 140 KB | 1, 2 | ☐ |
| D-11 | Temple doors L, R + frame | 360 × 1000 each | ≤ 90 KB each | 2 | ☐ |
| D-12 | Gopuram backdrop (dawn, golden hour) | 1080 × 1400 | ≤ 120 KB | 2, 5, 19, desktop | ☐ |
| D-13 | Mango-leaf thoranam | 1080 × 160 | ≤ 50 KB | 2, 11, 15 | ☐ |
| D-14 | Banana leaves + banana plants | 300 × 300 / 300 × 1400 | ≤ 30 / 90 KB | 9, 11 | ☐ |
| D-15 | Silk drapes (swag, sides, ties) | 1080 × 500 / 300 × 1400 | ≤ 90 KB | Cover, 6, 7, 11, 19 | ☐ |
| D-16 | Silk textures and zari borders (tiles) | 512 × 512 / 512 × 64 | ≤ 40 / 12 KB | 3, 4, 5, 8, 13, 17, 18 | ☐ |
| D-17 | Gold ornaments (corners, pendants, crest) | 200 × 200 | ≤ 20 KB | 5, 8, 17 | ☐ |
| D-18 | Gold nameplate raster | 900 × 420 | ≤ 70 KB | 1, 7 | ☐ |
| D-19 | Envelope a/b/c/d | 860 × 600 (each part) | ≤ 110 KB total | Cover | ☐ |
| D-20 | Invitation scroll (body + rollers) | 940 × 520 | ≤ 70 KB | 2 | ☐ |
| D-21 | Mandapam layers | 1080 × 1700 total | ≤ 260 KB total | 10, 11 | ☐ |
| D-22 | Thali plate | 400 × 300 | ≤ 45 KB | 10, 11 | ☐ (family check) |
| D-23 | Mehndi still-life | 320 × 260 | ≤ 35 KB | 9 | ☐ |
| D-24 | Turmeric still-life | 320 × 260 | ≤ 35 KB | 9 | ☐ |
| D-25 | Brass vessels (kalasam, chembu, uruli) + brass rod | 300 × 400 | ≤ 35 KB | 9, 11, 16 | ☐ |
| D-26 | Veena, mridangam | 400 × 300 | ≤ 40 KB | 9 | ☐ |
| D-27 | Reception stage layers | 1080 × 1400 | ≤ 200 KB total | 10, 12 | ☐ |
| D-28 | Ivory curtains L/R | 540 × 1700 each | ≤ 90 KB each | 12 | ☐ |
| D-29 | Hanging lights (a) and thooku vilakku (b) | 1080 × 560 / 120 × 400 | ≤ 70 / 20 KB | 9, 12 | ☐ |
| D-30 | Rose petals ×6 | 96 × 96 | ≤ 4 KB each | Particles | ☐ |
| D-31 | Jasmine petals/flowers ×6 | 96 × 96 | ≤ 4 KB each | Particles | ☐ |
| D-32 | Polaroid frames + tapes + pin | 300 × 360 | ≤ 18 KB | 5, 6 | ☐ |
| D-33 | Paper textures a/b (tiles), deckle masks c | 1024 × 1024 / 900 × 1200 | ≤ 60 KB | Global | ☐ |
| D-34 | Stone and wood textures (tiles) | 512 × 512 | ≤ 40 KB | Small fills | ☐ |
| D-35 | Blessing cards ×3 shapes | 340 × 420 | ≤ 25 KB | 16, overlays | ☐ |
| D-36 | Travel board | 1000 × 1500 | ≤ 120 KB | 15 | ☐ |
| D-37 | Realistic rice-flour kolam (optional) | 1080 × 300 | ≤ 70 KB | 11 | ☐ |
| D-38 | Lotus flowers (optional) | 240 × 240 | ≤ 25 KB | Accents | ☐ |
| D-39 | Tamboolam plate (optional) | 400 × 300 | ≤ 40 KB | 11 | ☐ |
| D-40 | Phone mockup frame | 960 × 1960 | ≤ 60 KB (or SVG) | Desktop B | ☐ |
| D-41 | Desktop backdrop | 2560 × 1440 | ≤ 480 KB WebP / 380 KB AVIF | Desktop B | ☐ |

### 15.3 Photographs (client-supplied)

| ID | Photo | Minimum source | Delivery sizes | Budget (largest) | Used on | Status |
|---|---|---|---|---|---|---|
| P-01 | Rahul portrait | 2000 × 2500 | 560, 840, 1120 w | ≤ 180 KB | 5 | ☐ To be provided |
| P-02 | Divya portrait | 2000 × 2500 | 560, 840, 1120 w | ≤ 180 KB | 6 | ☐ To be provided |
| P-03–P-07 | Love-story photos ×5 | 1600 × 2000 | 480, 720, 960 w | ≤ 150 KB | 8 | ☐ To be provided |
| P-08 | Groom's family photo | 1600 × 2000 | 320, 480, 640 w | ≤ 90 KB | 7 | ☐ To be provided |
| P-09 | Bride's family photo | 1600 × 2000 | 320, 480, 640 w | ≤ 90 KB | 7 | ☐ To be provided |
| P-10 | Rahul memories ×≤6 | 1200 × 1200 | 200, 300 w | ≤ 30 KB | 5 | ☐ Optional |
| P-11 | Divya memories ×≤6 | 1200 × 1200 | 200, 300 w | ≤ 30 KB | 6 | ☐ Optional |
| P-12 | Ceremony venue | 2000 × 1250 | 640, 960, 1280 w | ≤ 140 KB | 14 | ☐ After venue confirmed |
| P-13 | Function hall | 2000 × 1250 | 640, 960, 1280 w | ≤ 140 KB | 14 | ☐ After venue confirmed |
| P-14 | Bride's home (optional) | 2000 × 1250 | as above | ≤ 140 KB | 14 | ☐ Q-D3 |
| P-15 | Groom's home (optional) | 2000 × 1250 | as above | ≤ 140 KB | 14 | ☐ Q-D3 |
| P-16 | Family-tree member photos (optional) | 800 × 800 | 144, 216 w | ≤ 20 KB | Tree overlays | ☐ Optional |

### 15.4 Optional video

| ID | Asset | Spec | Budget | Status |
|---|---|---|---|---|
| V-01 | Pre-rendered opening invitation (alternative to code animation) | 1080 × 2340, 3 s, MP4 H.264 + WebM, muted, `playsinline`, poster frame | ≤ 2.5 MB | ☐ Optional |
| V-02 | Desktop temple background motion (gentle haze or lamp flicker) | 1920 × 1080, 10 s seamless loop | ≤ 2.5 MB | ☐ Optional |
| V-03 | Floral transition (petal drift overlay with alpha, HEVC/WebM) | 1080 × 2340, 2 s | ≤ 1.5 MB | ☐ Optional |

### 15.5 Optional audio

| ID | Asset | Spec | Budget | Status |
|---|---|---|---|---|
| A-01 | Background instrumental (licensed veena or nadaswaram) | AAC 96 kbps, loop-friendly, 2–3 min | ≤ 2.2 MB | ☐ Q-B5 |
| A-02 | Page-turn paper sound | 0.6 s | ≤ 15 KB | ☐ Optional |
| A-03 | Soft temple-bell chime | 1.2 s | ≤ 25 KB | ☐ Optional |

### 15.6 Fonts and brand/share assets

| ID | Asset | Spec | Status |
|---|---|---|---|
| F-01–F-05 | Fonts (§4.1) | WOFF2, subset | ☐ |
| B-01 | Open Graph share image | 1200 × 630 JPEG ≤ 200 KB: ivory card, gold border, "Rahul & Divya · 7 April 2027 · Tirupati", jasmine corners | ☐ |
| B-02 | Favicon set | SVG + 32 px PNG + 180 px apple-touch-icon, R·D monogram on ivory | ☐ |
| B-03 | QR code (desktop B) | Generated at build from `site.url` | ☐ |

---

## 16. Asset production and optimisation rules

1. **Naming:** `category-subject-variant@2x.ext`, for example `decor-jasmine-swag-a@2x.webp`, `photo-rahul-portrait-1120.avif`, `svg-kolam-corner-tl.svg`.
2. **Folders:** `src/assets/decor/`, `src/assets/photos/`, `src/assets/svg/`, `public/media/` (video, audio), `src/assets/client/` (client-supplied, untouched originals kept in `client/originals/`).
3. **Colour:** sRGB, 8-bit; photographs graded with the shared preset (§8).
4. **Alpha:** clean, defringed edges tested on ivory and sandal backgrounds; no halo.
5. **Formats:** AVIF (alpha) first, WebP fallback, PNG only if a client file requires it; JPEG only for the OG image.
6. **Responsive:** every raster ships at 1×, 1.5× and 2× of displayed size (`srcset` with `sizes` derived from container width).
7. **SVG:** SVGO-optimised, IDs prefixed, no embedded rasters, animatable paths kept unmerged.
8. **Lazy loading:** cover and page 1 eager and preloaded; pages N+1 and N+2 prefetched; all others lazy.
9. **Layered parts:** anything that moves separately (door leaves, envelope flap and seal halves, lamp flames, curtain panels, scroll rollers, mandapam layers) is a separate file.
10. **Client-supplied assets** (Figma PNG/SVG, photos, videos) keep their intended design, proportions, placement and layering. They are only optimised in a visually lossless way, and are **never** substituted with unrelated generated graphics. Any proposed change is listed for client sign-off first.
11. **Sourcing options** (for the realistic set): (a) a half-day studio shoot of real jasmine strings, marigolds, brass lamps, bells, turmeric and mehndi bowls and a thali plate on a seamless background, then cut out, which gives the highest realism; (b) licensed stock cutouts (for example Adobe Stock, Shutterstock, Envato) with consistent lighting; (c) commissioned photoreal 3D renders for architecture (pillars, doors, mandapam, stage). Any AI-assisted imagery may only be a starting point and must be retouched and pass the authenticity checklist (§7) before approval.
12. **Licensing:** keep a licence register (asset ID, source, licence type, proof) in `ASSETS-LICENCES.md`.

---

## 17. Do and don't

| Do | Don't |
|---|---|
| Keep pages predominantly ivory, jasmine and sandal | Make whole pages dark maroon or solid gold |
| Use Antique Gold for ornament, Gold Text for words | Set body text in Antique Gold |
| Layer real jasmine, brass and stone around a calm centre | Leave a page as a heading and paragraph on a plain background |
| Use symbolic sacred emblems with family approval | Depict the deity in cartoon form or add supernatural light beams |
| Animate like real objects (hinges, cloth, sway, flicker) | Bounce, spin, explode petals, flash lights, add heavy blur |
| Use script for one short accent per page | Set dates, venues or buttons in script |
| Keep text inside the safe zone with veils over imagery | Place text directly over busy photos or garlands |
| Mark proposed details "Proposed" | Present proposed timings as confirmed |
| Hide or gracefully replace missing details | Invent names, numbers, venues or addresses |
| Keep consistent top-left warm lighting across assets | Mix cutouts with conflicting light or white fringes |
| Use original, licensed or commissioned artwork | Reuse frames or artwork from the reference video or other invitations |
| Present Tirupati as the city, venue to be confirmed | Imply the wedding is inside Sri Venkateswara Temple, or use TTD logos and official imagery |
