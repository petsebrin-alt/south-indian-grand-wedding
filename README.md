# Rahul & Divya — Royal South Indian Hindu Wedding Invitation

An interactive invitation book: 18 sections on a cover plus 19 pages that turn with a realistic page curl. Specification: [PRD.md](PRD.md) · visual direction: [THEME.md](THEME.md) · decisions and phase results: [DECISIONS.md](DECISIONS.md).

## Run it

```bash
npm install
npm run dev          # http://localhost:4321
```

Add `?preview=1` to a production URL to see the "To be provided" placeholder labels.

The dev server also serves the RSVP and Wishing Wall API at `/api`, storing everything in `.data/dev-db.json` (ignored by git). Emails that would be sent are kept in an outbox instead:

| Dev URL | Purpose |
|---|---|
| `/admin` | Family dashboard; use **Sign in (local development)** |
| `/api/__dev/outbox` | Emails that would have been sent |
| `POST /api/__dev/auto-approve` | Approve every pending blessing (to see them on the wall) |
| `POST /api/__dev/reset` | Clear all local RSVPs and blessings |
| `POST /api/__dev/fail` `{"count":1,"status":500}` | Make the next request fail, to see the error states |
| `POST /api/__dev/digest` | Run the daily digest now |

## Edit wedding details

Everything guests see — names, dates, venues, family, contacts, travel notes and blessing text — lives in **`src/data/wedding.ts`**. `null` means "to be provided": it shows as a dashed placeholder in preview builds and is hidden or replaced with a polite line in production. Never replace `null` with a guess.

- Confirm an event time: change its `timeStatus` from `'proposed'` to `'confirmed'`.
- Approve draft text: change its `status` from `'draft'` to `'approved'`.
- Hide a launch-blocking field on purpose: add its path (for example `family.groom.father`) to `site.hiddenFields`.

```bash
npm run content:check    # lists everything still missing
```

## Personal invitation links

Add `?to=` and the guest's name to the site address and the invitation card greets them by name, for example `https://your-site/?to=Meena%20%26%20Ravi` shows "Dear" in calligraphy and MEENA & RAVI beneath it in serif capitals, in the card's gold. Without a name the card says "Dear Guest". A name can be up to 80 characters: a long one is wrapped over up to three or four lines, at a readable size, in the room the card leaves under "Dear". In the link, write spaces as `%20` and `&` as `%26`.

## Add the realistic artwork

The opening (temple doors, bell and courtyard) is built from the client's photographs in `src/assets/opening/source/`. After replacing one, run `npm run opening:assets` to remake the scene's layers; see [src/assets/decor/README.md](src/assets/decor/README.md#opening-screen-cover-the-clients-photographs). The Welcome page's courtyard and couple are in `src/assets/welcome/source/`; after replacing one, run `npm run welcome:assets` ([details](src/assets/decor/README.md#welcome-page-the-courtyard-and-the-couple)).


The other pages' decorations (jasmine, brass lamps, pillars, doors, silk) still show vector placeholders. Put a real image named after its slot in `src/assets/decor/` (for example `kuthuvilakku.webp`) and it replaces the placeholder everywhere. The slot list and art rules are in [src/assets/decor/README.md](src/assets/decor/README.md). `npm run placeholders` regenerates the stand-ins.

## Backend (RSVPs, blessings, family dashboard)

Production uses Supabase (database and functions), Resend (emails) and optionally Cloudflare Turnstile (bot protection). Setup, step by step: [supabase/README.md](supabase/README.md).

```bash
npm run backend:config     # prints the WEDDING_CONFIG secret derived from wedding.ts
```

## Build

```bash
npm run build              # preview build (placeholders visible; RSVP and blessings say "opens soon" without an API)
npm run build:production   # launch check + environment check; stops if details or PUBLIC_API_BASE are missing
```

Builds and `npm run dev` first run `npm run fonts`, which cuts the Telugu font down to the characters used in `wedding.ts`.

After changing the names, date or city, or adding real artwork, refresh the link-preview image (WhatsApp, iMessage):

```bash
npm run og                 # writes public/og-image.jpg (1200 × 630)
```

## Test

```bash
npm test                   # unit tests
npm run check              # type check
npm run qa:book            # browser checks in headless Google Chrome (start `npm run dev` first)
npm run perf               # Lighthouse mobile on the cover of the built site (run `npm run build:preview` first)
```

`qa:book` resets the local dev data in `.data/dev-db.json` while testing the forms.

`QA_SHOTS=./qa-shots npm run qa:book` also saves phone and desktop screenshots.

## Project layout

| Path | Purpose |
|---|---|
| `src/data/wedding.ts` | The central wedding data file |
| `src/data/schema.ts` | Validation rules for the data file |
| `src/data/content-check.ts` | Launch check (PRD §4.2) |
| `src/data/pages.ts` | Book structure: cover plus 19 pages |
| `src/book/` | Page-curl engine, gestures, overlays and navigation |
| `src/motion/` | Page choreographies, petals, scratch card, gallery ring, family-tree animation |
| `src/components/pages/` | One component per page |
| `src/assets/opening/` | The opening's photographs (`source/`), their measurements (`scene.json`) and the layers made from them |
| `src/assets/stage/` | The desktop background and the Love Story page's background: the client's cream temple picture (`source/`), its two sides, plain middle and swaying garlands, lamps and bells (`npm run stage:assets`, `scripts/stage/`) |
| `src/assets/story/` | The Love Story page's red-and-gold peacock frame and the couple's photographs (`source/`) (`npm run story:assets`, `scripts/story/`) |
| `src/assets/ceremony/` | The Wedding Ceremony page: the client's real golden mandapam picture (`source/`), cut into the pieces that arrive one by one (`npm run ceremony:assets`, `scripts/ceremony/`); the celebration is `src/motion/celebrate.ts` and its music `src/lib/fanfare.ts` |
| `src/assets/welcome/` | The Welcome page's courtyard and couple (`source/`), their measurements (`scene.json`) and the layers made from them (`npm run welcome:assets`, `scripts/welcome/`) |
| `src/assets/save-the-date/` | The Save the Date page's couple-with-board picture and curtain (`source/`) and the layers made from them (`npm run save-the-date:assets`, `scripts/save-the-date/`) |
| `src/assets/countdown/` | The Countdown page's elephant board and gold rod (`source/`), and its moving trunk pieces (`npm run countdown:assets`, `scripts/countdown/`) |
| `src/assets/couple/` | The Rahul and Divya pages: the groom-and-bride picture (`source/`), the two cleaned photographs and the cut-out interest cards (`npm run couple:assets`, `scripts/couple/`; the temple behind them comes from the Events picture via `npm run scenery:assets`) |
| `src/assets/events/`, `src/assets/family/` | The Wedding Events pages' medallions and backgrounds, and the Parents page's background, cut from the client's events picture (`npm run events:assets`, `scripts/events/`) |
| `src/assets/decor/`, `src/assets/placeholders/` | Real decoration assets, and their vector stand-ins |
| `src/lib/calendar.ts` | Add to Calendar links and `.ics` files |
| `src/lib/venue.ts` | When Location and Get Directions switch on (public venues with a map link or coordinates) |
| `src/lib/handwriting.ts` | Builds the Thank You page's handwritten lettering from the Pinyon Script font |
| `scripts/og/`, `scripts/fonts/`, `scripts/perf/`, `scripts/opening/` | Link-preview image, Telugu font subset, Lighthouse check, opening layers |
| `src/forms/` | Wishing Wall and RSVP behaviour (drafts, retries, success only after storage) |
| `src/lib/api.ts` | Browser client for the RSVP and blessings API |
| `src/admin/`, `src/pages/admin.astro` | Family dashboard and its sign-in |
| `supabase/` | Database migration and Edge Functions; `functions/_shared/` holds the handlers used everywhere |
| `scripts/dev-api/` | The local API mounted in the dev server |
| `src/styles/tokens.css` | Colours, type scale, layers and motion tokens from THEME.md |
| `src/assets/svg/` | Draft ornaments (kolam, divider, monogram, pillar) |
| `tests/` | Unit tests and the browser QA script |
