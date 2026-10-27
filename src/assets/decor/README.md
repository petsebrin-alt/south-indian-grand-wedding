# Realistic decoration assets

Drop the photographed or commissioned artwork here (THEME.md §7 and §15.2). A file named after a slot replaces that slot's vector placeholder everywhere, with no layout change.

## Opening screen (cover): the client's photographs

The temple-entrance opening is built from six pictures the client supplied, kept in `src/assets/opening/source/`:

| File | What it shows |
|---|---|
| `entrance.webp` | The decorated temple entrance with the doors closed: carved frame, garlands, banana leaves, brass lamps, steps with petals. The door leaves, the doorway, the hanging pieces in front of the doors and the pieces that move in the wind are all cut from this one photograph. |
| `courtyard.webp` | The view through the open doors: the gopuram, the lamps and the petal path. |
| `bell.webp` | The heritage brass bell guests tap (peacock handles), on white. It is cut out and kept from its last chain link down. |
| `bell-chain.webp` | Two bells on beaded chains, on white. Only the chain is used: one repeat of it (bead and links) is tiled up from the bell to the beam, drawn 1.43× so its links match the bell's own. |
| `monogram.webp` | The R·D logo (asset D-54): pink and gold letters with lotus, buds and a jhumka, on a transparent background. It comes out of the temple's shrine door after the walk-in, and shows inside the card when it opens. |
| `card.webp` | The maroon velvet invitation card with gold foil, on a transparent background. Its printed "Dear Guest" is painted out so each guest's name can be set there in the same gold; the divider below it moves down a little to make room for the couple's names; everything else, including the printed "Open the Invitation" (the button), is used as printed. |

`src/assets/opening/scene.json` records where things sit in the entrance photograph, in % of its width and height: the doorway outline, the hanging buds and bells, the garland, swag and banana-leaf pieces that sway (with their pivot and strength), the bell, and how far the courtyard zooms as we walk in. Its `card` entry gives, in pixels of `card.webp`, the card's edges, the lettering to clear, a plain patch of velvet to copy grain from, where the divider moves to, and where the greeting, names and button sit.

After replacing a photograph or changing `scene.json`, run:

```bash
npm run opening:assets
```

It writes the layers next to `scene.json`: AVIF with a WebP fallback for the large pictures (`entrance`, `frame`, `leaves`, `courtyard`, `bell`, `card`, `monogram`), WebP for the small pieces (`hangings`, `chain`), and `bell.json` (where the chain sits on the bell). Pictures on white are cut out automatically (`scripts/opening/pieces.ts`). A replacement photograph with different framing or a different design needs `scene.json` measured again: `bell.crop`, `bell.link` and `bell.chain` for the bell and chain, `court.shrine` for the shrine door the logo comes from.

The same command makes the desktop background in `src/assets/stage/` from `card.webp` (`scene.json` → `stage`): a seamless tile of the card's maroon velvet, the card's gold border as a nine-slice frame, and the gold paisley spray from its lower corner.

Still to be supplied for the opening:

| File | Asset ID | What it shows | Size and format |
|---|---|---|---|
| `public/audio/temple-bell.mp3` | A-01 | A licensed temple-bell recording, 2–4 seconds, played on the tap. A synthesised bell is used until then. | MP3, under 150 KB |

Other studios' work cannot be used as artwork: the frames of the reference reel and the reference envelope photograph are someone else's copyrighted designs. They guided the motion and staging only.

## Welcome page: the courtyard and the couple

The Welcome page uses two pictures the client supplied, kept in `src/assets/welcome/source/`:

| File | What it shows |
|---|---|
| `courtyard.webp` | A temple courtyard with garlands, bells, brass lamps and the gopuram, with a figure seated in the middle. The figure is taken out: the right side is replaced by the clean left side mirrored (the courtyard is symmetrical), and what remains is rebuilt from the photograph itself (`scripts/welcome/inpaint.ts`). |
| `couple.png` | The couple seated together, on a transparent background (364 px wide, enlarged 2× with a Lanczos filter). |

`src/assets/welcome/scene.json` holds the figure's outline, the swaying pieces (garland strands, bells, banana leaf, palms), where the couple sits, and the rose petals taken from the opening's courtyard path. After changing a picture or `scene.json`, run:

```bash
npm run welcome:assets
```

A larger couple picture (at least 1100 px tall) would be sharper on high-resolution phones; the same file name replaces it.

## All decoration slots

| File name (`.webp`, `.avif` or `.png`) | Asset ID | Used on |
|---|---|---|
| `jasmine-swag` | D-01 | Love Story, Venues, Wishing Wall |
| `jasmine-strand-short`, `jasmine-strand-medium`, `jasmine-strand-long` | D-02 | Blessings, Countdown, Bride |
| `jasmine-cluster` (top-left corner bunch) | D-03 | Save the Date, Bride, Family |
| `arch-garland` | D-04 | Family |
| `kuthuvilakku` (no flames; flames are drawn in code) | D-06 | Blessings, Countdown, Ceremony, Thank You |
| `agal-diya` | D-07 | Family |
| `temple-bell` (one hanging brass bell, chain at top centre) | D-08 | Countdown, Events, Wishing Wall |
| `temple-pillar` | D-09 | Rahul, Divya, Ceremony, Venues |
| `temple-arch` | D-10 | Blessings |
| `temple-door-left`, `temple-door-right` | D-11 | Blessings |
| `gopuram-misty` | D-12 | Blessings, Rahul, Divya |
| `mango-toran` | D-13 | Blessings |
| `silk-drape` | D-15 | Ceremony, Thank You |
| `kalasam-crest`, `gold-filigree` | D-17 | Rahul |
| `scroll-roller` | D-20 | Blessings |
| `rose-petal-1…4` (made from the opening courtyard photograph by `npm run welcome:assets`), `jasmine-petal-1…3` | D-30, D-31 | Falling petals |
| `arch-nameplate` | S-06 / D-18 | Family |
| `oval-frame` | S-09 | Family |
| `sacred-emblem` (family-approved, Q-C1) | S-12 | Blessings |
| `jasmine-wreath` | D-04 | Events timeline medallions |
| `celebration-signboard` (no lettering; text is live) | D-04 | Events timeline |
| `marigold-swag`, `marigold-strand`, `marigold-cluster` | D-05 | Events, Venues, Travel |
| `mehndi-bowl` | D-23 | Mehndi |
| `turmeric-bowls` | D-24 | Haldi |
| `music-instruments` (veena and mridangam) | D-26 | Sangeet |
| `hanging-lamp` (no flames) | D-29 | Sangeet |
| `brass-kalasam` | D-25 | Ceremony |
| `thali-plate` (family check) | D-22 | Wedding, Ceremony |
| `banana-plant` | D-14 | Ceremony |
| `mandapam-beam`, `flower-chandelier` | D-21 | Ceremony |
| `reception-backdrop`, `floral-urn` | D-27 | Reception, Events |
| `silk-curtain`, `silk-curtain-right` (stretch to the page height) | D-28 | Reception |
| `venue-map` (one illustrated map per confirmed venue) | MAP | Venues |
| `attire-woman`, `attire-man` (used as tinted masks) | S-20 | Dress Code |

Rules: keep the placeholder's proportions (see `src/assets/placeholders/<name>.svg` for the exact canvas size), transparent background, clean defringed edges, warm light from the top-left, and the file-size budgets in THEME.md §15.2. Supplied artwork is used as provided and never replaced with generated graphics.
