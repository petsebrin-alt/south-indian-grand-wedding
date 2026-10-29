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
| `card.webp` | The maroon velvet invitation card with gold foil, on a transparent background. Its printed "Dear Guest" is painted out so "Dear" (calligraphy) and the guest's name (serif capitals) can be set there in the same gold; the divider stays where it was printed, above the button, and the couple's names are set under the couple; everything else, including the printed "Open the Invitation" (the button, whose ring blinks), is used as printed. |

`src/assets/opening/scene.json` records where things sit in the entrance photograph, in % of its width and height: the doorway outline, the hanging buds and bells, the garland, swag and banana-leaf pieces that sway (with their pivot and strength), the bell, and how far the courtyard zooms as we walk in. Its `card` entry gives, in pixels of `card.webp`, the card's edges, the lettering to clear, a plain patch of velvet to copy grain from, where the divider is set (where it was printed), and where the greeting, names and button sit.

After replacing a photograph or changing `scene.json`, run:

```bash
npm run opening:assets
```

It writes the layers next to `scene.json`: AVIF with a WebP fallback for the large pictures (`entrance`, `frame`, `leaves`, `courtyard`, `bell`, `card`, `monogram`), WebP for the small pieces (`hangings`, `chain`), and `bell.json` (where the chain sits on the bell). Pictures on white are cut out automatically (`scripts/opening/pieces.ts`). A replacement photograph with different framing or a different design needs `scene.json` measured again: `bell.crop`, `bell.link` and `bell.chain` for the bell and chain, `court.shrine` for the shrine door the logo comes from.

Still to be supplied for the opening:

| File | Asset ID | What it shows | Size and format |
|---|---|---|---|
| `public/audio/temple-bell.mp3` | A-01 | A licensed temple-bell recording, 2–4 seconds, played on the tap. A synthesised bell is used until then. | MP3, under 150 KB |

Other studios' work cannot be used as artwork: the frames of the reference reel and the reference envelope photograph are someone else's copyrighted designs. They guided the motion and staging only.

## Welcome page: the courtyard and the couple

The Welcome page uses two pictures the client supplied, kept in `src/assets/welcome/source/`:

| File | What it shows |
|---|---|
| `courtyard.webp` | A temple courtyard with garlands, bells, brass lamps and the gopuram, with a figure seated in the middle. The figure is taken out: the right side is replaced by the clean left side mirrored (the courtyard is symmetrical), and what remains is rebuilt from the photograph itself (`scripts/welcome/inpaint.ts`). It is also given a little extra sharpness. |
| `couple-hug.webp` | The couple standing together in garlands, his arm around her. They are lifted off the photograph's blurred background along an outline traced in `scene.json` (`hug.outline`, `scripts/welcome/cutout.ts`). |

`src/assets/welcome/scene.json` holds the figure's outline, the couple's outline, the swaying pieces (garland strands, bells, banana leaf, palms), where the couple stands, and the rose petals taken from the opening's courtyard path. After changing a picture or `scene.json`, run:

```bash
npm run welcome:assets
```

A different couple photograph needs its outline traced again in `scene.json` (`hug.outline`).

## Save the Date page: the couple with the gold board, and the curtain

Kept in `src/assets/save-the-date/source/`:

| File | What it shows |
|---|---|
| `couple-board.webp` | The couple holding a gold arch board, on a transparent background. The board's off-white middle is opened, so the curtain and the calendar show inside it, behind the frame and their hands. |
| `curtain.webp` | A red-and-gold theatre curtain, drawn back and tied. Its fabric above the tie is widened into one closed panel (the other is its mirror image), which draws back when the page opens. |

`src/assets/save-the-date/scene.json` holds a point inside the board's opening, its paper colour, the board's outer edges, and where the curtain's fabric and embroidered edge lie. After changing a picture, run `npm run save-the-date:assets`. The page reuses the Welcome page's courtyard photograph behind the board.

## Countdown page: the elephant-board palanquins

Kept in `src/assets/countdown/source/`:

| File | What it shows |
|---|---|
| `board.webp` | The elephant-and-peacock board, on white. It is lifted off the white; the countdown sits on its cream panel. Each elephant's trunk is cut out in two jointed pieces (lower, and the curled tip) and painted out of the board beneath, so the trunks can rise and fall. |
| `rod.png` | The gold rod, on white. It is lifted off the white and turned level: the carrying pole each board hangs from, so each countdown unit looks like a small palanquin. |

The page's background is the client's temple-courtyard picture (the same one as behind the Parents page, `src/assets/family/background.*`, turned the other way), shown at about a third of its strength over ivory so the boards stand out.

`src/assets/countdown/scene.json` holds the sky region and colours, the board's panel, and each trunk's outline, base, pivot and joint. After changing a picture, the Welcome courtyard or `scene.json`, run `npm run countdown:assets`.

## Rahul and Divya pages: the groom-and-bride picture

`src/assets/couple/source/groom-bride.webp` is the client's picture of both pages side by side: the groom with his interest polaroids on the left half, the bride with hers on the right. `npm run couple:assets` turns it into:

- the two photographs with their polaroids and printed titles taken out (the titles become live lettering), made taller so the couple can be shown smaller on their steps (the band of sky above them is stretched, mostly its plain top rows; `extend` in `scene.json`). The picture has no view of what was behind the polaroids, so that area (and the picture's own greenery touching it) is rebuilt as the temple: the colours around it, with the carved stone and pillars of the temple picture (`src/assets/family/source/temple.webp`) laid on top as soft structure, so the sides show a pale temple behind the cards and no leaves (`scripts/couple/backdrop.ts`, settings under `backdrop` in `scene.json`);
- each polaroid, and the groom's gaming cluster, cut out on its own to pop in one by one.

`src/assets/couple/scene.json` holds each polaroid's corners (snapped to its white frame automatically), the title boxes, the people's outlines, and how each side is rebuilt. A replacement picture needs these measured again.

## Wedding Events and Parents pages: the client's events picture

`src/assets/events/source/events.webp` is the client's picture of both Wedding Events pages side by side (page 1 on the left half, page 2 on the right): a temple background, the "Wedding Events" signboard, garlands, pillars and lamps, and six medallions joined by gold rods. `npm run events:assets` turns it into:

- the two Wedding Events pages (`page-1.*`, `page-2.*`): each half of the picture exactly as it is, except that the wording printed in each medallion's cream disc is painted out (smoothly, from the cream beside it) so the live details can be set there. `discs.json` records each disc and its ring in the page's own pixels;

The dates, times and venues on the pages come from `src/data/wedding.ts`, not from the picture (whose printed dates differ). The picture's Engagement medallion has no matching event, so it shows "Engagement" and "Details to be provided" until there is one. `src/assets/events/scene.json` holds each page's span, each disc and ring (`discs`), and how the printed wording is found (`paper`). A replacement picture needs these measured again.

The Parents page's background is the client's temple-courtyard picture (`src/assets/family/source/temple.webp`) as it is: carved pillars with garlands, banana leaves, brass lamps, a gopuram in the distance and the marble floor. `npm run family:assets` encodes it as `src/assets/family/background.*`. The page's lettering sits on soft ivory plaques so it reads over the stonework.

The Parents page's picture frame is the client's ornate gold oval frame (`src/assets/family/source/frame.webp`, photographed on a cream wall). `npm run family:assets` cuts it out of the wall (`src/assets/family/frame.webp`, with its opening measured in `frame.json`) and prepares the portraits from `src/assets/family/source/` (`bride-father`, `bride-mother`, `groom-father`, `groom-mother`) at web size in `public/photos/family/`. Each portrait shows in the frame's opening under a red border. The photographs are named in `family.groom` and `family.bride` in `src/data/wedding.ts` (`fatherPhoto`, `motherPhoto`, and each sibling's `photo`); a new photograph goes in `source/` with the same name, then run the command.

## Desktop background and the Love Story page: the cream temple picture

`src/assets/stage/source/scene.webp` is the client's cream temple picture with a phone in the middle: golden pillars, hanging jasmine and red-flower garlands, brass lamps and bells, flower vases and petals on marble. `npm run stage:assets` (`scripts/stage/derive.ts`, measurements in `scene.json`) turns it into:

- `panel-l`, `panel-r`: the picture's two sides, without its own border, corner ornaments or phone, and with the garlands, lamp and bells taken out (the cream behind them is filled in smoothly). They stand at the screen's edges on a desktop and fade into the middle;
- `strip`: the plain cream and marble between them (one column, stretched);
- `piece-<side>-<id>`: each garland (`s1`, `s2`, `s3`, `s4`), the lamp and the bells, cut out with a soft edge. They are drawn on canvases in thin slices that each swing a little more than the one above (`src/motion/sway.ts`), so a soft wave runs down from where they hang, with slow swells of wind; the lamp's flames flicker. Nothing moves under reduced motion;
- `page-top`, `page-bottom`, `page-gap`: the Love Story page's portrait background, made of the left side and its mirror: the top (where the garlands hang), the foot (only the petals on the marble, no vases) and a plain blend between them that stretches to fit any page height. The foot is only the petals on the marble (the vases are left out). The first garland (`s1`) hangs on it too, shown at 90% opacity;
- `stage.json`: sizes and where every piece hangs.

The desktop pictures and canvases are only requested or created on screens that show the stage (never on a phone).

`src/assets/story/source/frame.webp` is the client's red-and-gold peacock frame (two peacocks holding a big ring, with a cream board below), which came with a grey-and-white chequered "transparent" background baked in. `npm run story:assets` (`scripts/story/derive.ts`) cuts it out by colour into a real transparent `frame.webp`, makes `opening.webp` (the ring's see-through inside, as a mask: the photographs show only there and the frame's art lies over them) and `frame.json` (the ring and the board's places), and prepares the couple's photographs (`source/story-N.webp`, in the order of the story) into `public/photos/story/`. The photographs are named in `loveStory` in `src/data/wedding.ts`; the milestone titles there are proposed and the story text (`text`) is for the family to write. Until then the board shows a short line under each title that claims no place or date (in `src/components/pages/LoveStory.astro`).

## Wedding Ceremony page: the real mandapam

`src/assets/ceremony/source/mandapam.webp` is the client's picture of a golden mandapam: carved pillars and beam, a mango-leaf toran, hanging jasmine garlands with red flowers, banana plants, brass lamps and kalasams, a bowl of petals, a rangoli on marble, and a cream board in the middle. `npm run ceremony:assets` (`scripts/ceremony/derive.ts`, measurements in `scene.json`) turns it into:

- `clean`: the whole picture with the wording printed on the board painted out (the cream paper filled in smoothly with a little grain), so the board carries live text (names, date, Muhurtham, place, venue);
- `base`: a soft warm glow of the hall, shown first. It is a CSS background, since a deliberately blurred picture counts as "low resolution" to Lighthouse;
- `piece-<id>`: what arrives one by one, each cut out with a soft edge: `beam`, `pillar-l`, `pillar-r`, `toran` (cut by colour, only the green leaves), seven `strand-N` jasmine garlands, `hang-l`/`hang-r` (the little hanging lamps), `banana-l`/`banana-r`, `lamp-l`/`lamp-r`, `floor` and `board`;
- `ceiling`: the roof carried on above the picture (a gradient from the picture's own top colour up into deep gold);
- `ceremony.json`: the picture's size, each piece's place in % of the picture, the board, and where the two crackers stand.

The picture keeps its proportions, as wide as the page or a little wider on tall phones (about 78% of the page's height, its plain sides cropped slightly). The two cone crackers are drawn in SVG (deep red, with gold bands) and stand on the floor at the marked places; their sparks are drawn on a canvas only while the celebration runs.

## All decoration slots

| File name (`.webp`, `.avif` or `.png`) | Asset ID | Used on |
|---|---|---|
| `jasmine-swag` | D-01 | Love Story, Venues, Wishing Wall |
| `jasmine-strand-short`, `jasmine-strand-medium`, `jasmine-strand-long` | D-02 | Ceremony |
| `jasmine-cluster` (top-left corner bunch) | D-03 | Dress Code, Travel, RSVP, Thank You |
| `kuthuvilakku` (no flames; flames are drawn in code) | D-06 | Ceremony, Thank You |
| `agal-diya` | D-07 | Wishing Wall |
| `temple-bell` (one hanging brass bell, chain at top centre) | D-08 | Wishing Wall |
| `temple-pillar` | D-09 | Ceremony, Venues |
| `gopuram-misty` | D-12 | Thank You |
| `mango-toran` | D-13 | Ceremony, Travel |
| `silk-drape` | D-15 | Ceremony, Thank You |
| `kalasam-crest` | D-17 | RSVP |
| `rose-petal-1…4` (made from the opening courtyard photograph by `npm run welcome:assets`), `jasmine-petal-1…3` | D-30, D-31 | Falling petals |
| `marigold-swag`, `marigold-strand`, `marigold-cluster` | D-05 | Venues, Travel |
| `brass-kalasam` | D-25 | Ceremony |
| `thali-plate` (family check) | D-22 | Wedding, Ceremony |
| `banana-plant` | D-14 | Ceremony |
| `mandapam-beam`, `flower-chandelier` | D-21 | Ceremony |
| `reception-backdrop`, `floral-urn` | D-27 | Reception |
| `silk-curtain`, `silk-curtain-right` (stretch to the page height) | D-28 | Reception |
| `venue-map` (one illustrated map per confirmed venue) | MAP | Venues |
| `attire-woman`, `attire-man` (used as tinted masks) | S-20 | Dress Code |

Rules: keep the placeholder's proportions (see `src/assets/placeholders/<name>.svg` for the exact canvas size), transparent background, clean defringed edges, warm light from the top-left, and the file-size budgets in THEME.md §15.2. Supplied artwork is used as provided and never replaced with generated graphics.
