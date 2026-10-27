# Decisions log — Rahul & Divya Wedding Invitation

## 23 October 2026 — PRD.md and THEME.md approved

The client approved both documents as written and asked for the recommended defaults on all open questions (PRD §17). Phase 1 started the same day.

### Defaults applied to the open questions

| Question | Default applied | Where it lives |
|---|---|---|
| Q-A1 Photos or painted portraits | Real photographs in silk frames | `couple.*.portrait` in `src/data/wedding.ts` |
| Q-A2 Navigation model | Book Mode (page curl) by default; Scroll View in Contents and as the no-JavaScript fallback | `src/book/` |
| Q-A3 Desktop presentation | Option B: one phone mockup on a temple-inspired background | `src/components/Stage.astro`, `src/styles/stage.css` |
| Q-A4 Opening | Silk envelope on the cover; temple doors on Divine Blessings (Phase 2) | `Cover.astro`, `Blessings.astro` |
| Q-A5 Meet the Couple | Two pages (Rahul, then Divya) | `Partner.astro` |
| Q-B1 Proposed times | Kept as proposed, shown with a "Proposed" badge | `events[].timeStatus` |
| Q-B2 Calendar for proposed events | Disabled until each time is confirmed (Phase 2) | — |
| Q-B3 Calendar end time | Start-only entries; no invented end time | `ceremony.endISO = null` |
| Q-B4 RSVP deadline and attendee cap | Still needed from the families (launch-blocking) | `rsvp.deadline`, `rsvp.maxAttendees` |
| Q-B5 Music | No audio until a licensed track is supplied; toggle hidden | `site.musicTrack = null` |
| Q-B6 After the wedding | "Happily married" message from 8 April 2027 (draft text C-08) | `copy.postWedding` |
| Q-C1 Divine Blessings imagery | Symbolic Shankha, Srivari Namam and Chakra; no deity image | `site.showDeityImage = false` |
| Q-C2 Language | English with Telugu accents (invocation, Subhalekha title) | `copy.invocationTe`, `copy.teluguTitle` |
| Q-C3 Ritual descriptions | Off until the families confirm their rituals | — |
| Q-C4 Telugu honorifics | Off until approved | `couple.*.honorific = null` |
| Q-C5 Draft copy C-01 to C-06 | Used as drafts with a preview-only "Draft" badge | `copy.*.status = 'draft'` |
| Q-C6 Haldi | Groom's family home only, as in the brief | `events` |
| Q-D3 Family home addresses | "Address shared personally"; not published | `venues[].privacy = 'onRequest'` |
| Q-D4 Venue maps | Elegant map card with a directions button; illustrated maps optional later | Phase 3 |
| Q-E2 Wishes | Manual approval by a family admin | Phase 4 |
| Q-E3 Guest phone or email on RSVP | Not collected | Phase 4 |
| Q-E4 Dietary options | Vegetarian, Jain, No onion & garlic, Allergies | `rsvp.dietaryOptions` |
| Q-E5 Notifications | Email per RSVP plus a daily digest; no WhatsApp | Phase 4 |
| Q-E6 Data retention | 6 months after the wedding | Phase 4 |
| Q-E7 Personalised links | Not included | — |
| Q-F2 Search engines | `noindex, nofollow`; no password | `src/pages/index.astro` |
| Q-F3 Analytics | None | — |
| Q-F5 Assets | We source and commission the realistic asset set per THEME.md §15 | Phase 0/2 |

Still needed from the families before launch: run `npm run content:check` for the live list (32 launch-blocking items on 23 October 2026).

### Phase 1 technical decisions

1. **Custom page-curl engine instead of StPageFlip.** `page-flip` 2.0.7 has not been updated since May 2022, has no vertical-swipe turns (the reference turns with an upward swipe from the bottom-right corner), and re-parents page elements, which conflicts with carousel zones, overlays and per-page choreography. The custom engine (`src/book/geometry.ts`, `src/book/controller.ts`) uses the same flat diagonal fold with a parchment back, built from `clip-path` and a reflection matrix.
2. **Astro 7 static site, vanilla TypeScript for the engine.** Preact will be added in Phase 4 for the RSVP and Wishing Wall forms; GSAP in Phase 2 for page choreography.
3. **Pages are sized with container units** (`cqw`/`cqh` of `.app`), so the same page renders on phones and inside the desktop mockup.
4. **Turns finish even when animation frames pause** (guest switches apps mid-turn): a timer fallback completes the turn.
5. **Music toggle placement:** if music is added later, the toggle goes top-right, not bottom-right as in PRD §5.2, so the bottom-right corner stays free for grabbing the page curl.
6. **Type tuning:** `--t-names-xl` is `clamp(36px, 11cqw, 60px)` (THEME §4.2 had 40/48/64) so "Rahul & Divya" fits on one line on 360–390 px phones.
7. **Copy IDs added:** C-07 (countdown arrival line, client-supplied) and C-08 (post-wedding message, draft).

### Phase 1 results (23 October 2026)

- `npm test`: 24 unit tests pass (fold geometry, gesture rules, IST formatting, data integrity, launch check).
- `npm run qa:book` (headless Google Chrome, real touch input): 29/29 checks pass — AC-01, AC-02 (swipes in four directions, both corner drags, spring-back, keyboard, chevrons, pearl, one page per trackpad gesture), AC-03 (carousel zones), AC-04, AC-05 (deep links), AC-06 (Back closes overlays), AC-07 (Scroll View and no-JavaScript), AC-08 (no overflow at 360×640, 375×667, 390×844, 430×932), AC-32 (reduced motion), AC-35 (desktop mockup).
- Turn smoothness with the CPU slowed 4×: average 60 fps, median and 95th-percentile frame 16.7–16.8 ms, no frames over 20 ms.
- `npm run check`: 0 errors. `npm run build`: succeeds. `npm run build:production`: correctly refuses while launch-blocking content is missing.

**Not yet verified (needs real devices):** a physical mid-range Android phone (the formal Phase 1 performance exit criterion), iPhone Safari, and the WhatsApp and Instagram in-app browsers. The headless Chrome numbers are an indication, not a substitute.

## 23 October 2026 — Phase 2: opening and story pages

Built: Cover (envelope opening), Welcome, Divine Blessings, Save the Date, Countdown, Meet the Couple (Rahul, Divya), Parents and Family with both family-tree overlays, and Our Love Story.

### Phase 2 decisions

1. **Asset slots with vector placeholders.** Every realistic decoration renders through `src/components/Decor.astro`. Until the photographed or commissioned file exists in `src/assets/decor/`, a vector stand-in from `src/assets/placeholders/` (generated by `npm run placeholders`) is shown. Dropping in the real file replaces it everywhere with no layout change; `src/assets/decor/README.md` lists every slot. Each page's preview note names the placeholder IDs it uses.
2. **Opening animation in code, not video.** The envelope opening (PRD §6.1) is a GSAP timeline; optional video V-01 is not needed.
3. **Handwriting reveals.** "Save the Date" and the parents' names use a left-to-right ink wipe over the real text. True stroke-drawn handwriting (S-14) is kept for the Thank You page in Phase 5, once the script lettering is traced to single-stroke paths.
4. **Family tree order.** Siblings sit beside the groom or bride at the base of the branch, then parents, then grandparents, then other relatives at the top, so generations read upward (THEME P7 listed siblings above grandparents).
5. **Sacred emblem orientation (needs family confirmation).** Following THEME S-12, the Shankha is on the left and the Chakra on the right. In temple iconography the Chakra is held in Lord Venkateswara's right hand, which appears on the viewer's left; the families should confirm which arrangement they prefer before the final emblem artwork is commissioned.
6. **Memory polaroids appear only in preview** until photos are supplied; in production they are hidden.
7. **Calendar files are static.** `/calendar/wedding.ics` is generated at build time (more reliable in WhatsApp and Instagram in-app browsers than a script-generated download). Only confirmed events get calendar entries; proposed ones are added once confirmed (Q-B2 default).
8. **Overlays and sheets live at the app root** (outside the book) so they stay usable while the book is inert, and keyboard focus returns to the button that opened them, even after the browser restores its history entry.

### Phase 2 results

- `npm test`: 30 unit tests pass (adds calendar: IST conversion, no invented end time, folded `.ics`, no home address leaked).
- `npm run qa:book`: 45/45 checks pass in headless Chrome with real touch input, including AC-01 (opening lands on Welcome in 2.47 s), AC-13 (countdown correct from London, New York and India, local-time line only outside IST), AC-14 (arrival message), AC-15 (Google and `.ics` at 10:30 AM IST, no end time), AC-16 (scratch, "Reveal date", screen-reader date), AC-17 (portraits enter from the correct side and stay on screen), AC-18 (tree overlays: full screen, independent scroll, close by button, Esc, Back and swipe-down, focus returns), AC-19 (one photo per swipe, two on a flick, keyboard and arrows, no auto-spin after interaction), AC-09 (production view shows no "To be provided" text), AC-08 (no overflow at four phone sizes).
- Smoothness with the CPU slowed 4×: envelope opening and page turns both average 60 fps with no frames over 20 ms.
- JavaScript: 41.7 KB gzipped (budget 140 KB).

**Not yet verified:** real phones and in-app browsers (as for Phase 1), and the look of the real assets, which are still placeholders.

## 23 October 2026 — Phase 3: celebration and logistics pages

Built: Wedding Events Timeline (pages 9–10), Wedding Ceremony, Grand Reception, Dress Code, Venues and Directions, Transportation and Accommodation, plus event detail sheets and travel detail sheets.

### Phase 3 decisions

1. **Unavailable actions explain themselves.** Location, Calendar, Get Directions, Call and WhatsApp stay visible before their data exists, marked `aria-disabled`; a tap shows why ("Location will be shared once the venue is confirmed", "Calendar opens once the timing is confirmed", "The address is shared personally — please contact the family").
2. **Calendar entries only for confirmed events** (Q-B2 default). Today only the wedding ceremony has one; each event gains its own `.ics` and sheet automatically once its `timeStatus` becomes `confirmed`.
3. **Directions only for public venues with a map link or coordinates** (`src/lib/venue.ts`). The families' own Google Maps link wins over coordinates. Family homes marked "shared personally" never publish directions, a photo or an address; they show a "Family home" card.
4. **Timeline venue lines are one line**; the full venue text and dress-code suggestion are in each event's Details sheet.
5. **Golden thread.** Laid at runtime through the medallions as they sit on each screen, so it fits every phone. Turning back past the timeline resets it so it draws again on the next visit (PRD §6.9 asks for a visible retraction during the curl; a reset-and-redraw gives the same effect without fighting the page turn).
6. **Reception lights are drawn in code**, not an image, so they can come on strand by strand with a gentle twinkle. The ivory curtains need separate left and right artwork (`silk-curtain`, `silk-curtain-right`).
7. **Dress-code card backs** show the suggested colours and the event's date; nothing invented about colours to avoid. Attire figures are tinted silhouettes standing in for the commissioned fashion sketches (S-20).
8. **Venue maps** use a stand-in map card until an illustrated map is commissioned for each confirmed venue.
9. **Decoration sizing fix.** Every decoration now carries its artwork's width and height, so height-sized pieces (pillars, banana plants) load reliably and keep their proportions.

### Phase 3 results

- `npm test`: 37 unit tests pass (adds venue directions and privacy, swatch colours, WhatsApp links).
- `npm run qa:book`: 52/52 checks pass, including AC-20 (all five events show name, date, time, venue and actions; Location waits for venues; Calendar only for the confirmed wedding; disabled actions explain themselves; Calendar and Details sheets fit), AC-21 (venue tabs by touch and arrow keys; Get Directions waits for a location), AC-22 (all six travel sheets fit a 375 × 667 phone and close by button, Esc or backdrop), the dress-code deck (one card per swipe each way, tap turns it over, vertical swipe turns the page), the golden thread, and the ceremony and reception entrances; AC-08 still passes at four phone sizes and AC-09 confirms no "To be provided" text in the production view.
- Smoothness with the CPU slowed 4×: opening and page turns average 60 fps. JavaScript: 43.9 KB gzipped.

**Not yet verified:** real phones and in-app browsers; real artwork (all decorations are still placeholders); real venue details, which will switch on the Location and Get Directions buttons.

## 24 October 2026 — Phase 4: guest interaction and backend

Built: Wishing Wall (page 16) with the blessing composer and View All Wishes; RSVP (page 17) with focus mode, editing and the thank-you face; Need Help (page 18) with three visiting cards and contact sheets; a privacy note; the family dashboard at `/admin`; and the backend (Supabase schema, four Edge Functions, notification and digest emails). Deployment steps: [supabase/README.md](supabase/README.md).

### Phase 4 decisions

1. **One set of backend handlers, two runtimes.** The request handling, validation and emails (`supabase/functions/_shared/`) use only web-standard APIs. Supabase runs them as Edge Functions; `npm run dev` runs the same code at `/api` with a file store, so every form can be used and tested locally. Only the thin Deno wiring (Postgres, Resend, Turnstile, Supabase Auth) is specific to production.
2. **Database locked down.** Row-level security is on with no public policies; only the functions (service role) read or write. Guests never talk to the database directly.
3. **No duplicates, by design.** Each submission carries an idempotency key that is reused on retry, so a double tap, a timeout or a lost reply returns the stored record instead of creating a second one (AC-27).
4. **Editing without accounts.** A new RSVP gets a random edit token that stays on the guest's device; the server keeps only its hash. "Edit my response" updates the same record and the families get an "Updated RSVP" email.
5. **Blessings are moderated.** New blessings stay hidden until a family member approves them in `/admin`, which is why the confirmation says the blessing "will appear on the wall once the family has seen it" (PRD §6.15).
6. **Spam protection without friction:** a hidden honeypot field, a minimum fill time (3 seconds), 5 submissions per hour per address (stored only as a salted one-way hash, deleted after 2 days), a link and profanity filter for blessings, and invisible Cloudflare Turnstile once its keys are set.
7. **RSVP focus mode is a full-screen overlay.** The page shows the card with Step 1 (name and the two attendance cards); tapping any of them opens focus mode with that choice already made. A separate overlay (rather than scaling the in-page card) keeps the keyboard from hiding fields on iPhone and Android and turns book gestures off while the form is open.
8. **Attendee limit:** 10 per response until the families set `rsvp.maxAttendees` (M-25).
9. **Need Help shows no invented numbers.** Call and WhatsApp stay visible but disabled; "Number coming soon" appears once under the name (rather than replacing both button labels), and a tap explains it. Emblems are line art (lotus, jasmine, bell) until artwork is supplied.
10. **Family dashboard sign-in by email link** (Supabase Auth, called directly so the page needs no extra library). Links go only to people added as users in Supabase, and the server also checks the email against `site.adminEmails`. CSV exports show India times and neutralise spreadsheet formulas.
11. **Retention:** all RSVPs and blessings are deleted on 7 October 2027, six months after the wedding (Q-E6 default), by a scheduled job; the privacy note states this date.
12. **Builds without a backend** (static previews) keep the form buttons visible but say "RSVPs open soon" / "The Wishing Wall opens soon", rather than accepting answers that could not be saved. `npm run build:production` refuses to build without `PUBLIC_API_BASE`.
13. **Wishing Wall ornaments.** The page frame's corner ornaments serve as the kolam corners; the extra kolam pair under the title was removed because it crowded the heading once five blessings hang on the wall.

### Phase 4 results

- `npm test`: 54 unit tests pass. They cover RSVP and blessing validation, the deadline (end of day, IST), CSV quoting and formula guard, and the handlers against a real store: one record per idempotency key, edit only with the token (whose hash alone is stored), honeypot, too-fast, wrong-website and late submissions refused, 5-per-hour limit, blessings hidden until approved, admin summary and CSV for admins only, and the digest. They also cover WhatsApp links and phone formatting.
- `npm run qa:book`: **60/60 checks pass**, including the new ones:
  - **AC-23:** a failed blessing keeps the text and offers Try again. Success appears only after storage. The blessing stays hidden until approved, and a double tap stores one.
  - **AC-24:** View All shows approved blessings only, 20 then "Load more", with a count, an independent scroller and a 44 px close button.
  - **AC-25:** inline errors focus the field. Offline and server errors keep every answer, and success appears only with a stored ID.
  - **AC-26:** the families get a "New RSVP" and an "Updated RSVP" email. `/admin` lists the response and exports it, and signed-out requests are refused.
  - **AC-27:** a reply lost after storage, then a retry and a double tap, still store exactly one RSVP.
  - **AC-28:** Call and WhatsApp stay disabled with "Number coming soon", and the contact sheets fit a 375 × 667 phone with a close button.
  - **The wall and editing:** five approved blessings are fully visible, and "Edit my response" updates the same RSVP.
  - **Earlier checks:** AC-08 (no overflow at four phone sizes, including the new pages) and AC-09 still pass.
- Smoothness with the CPU slowed 4×: opening 2.5 s, page turns 60 fps. JavaScript: 52.9 KB gzipped (budget 140 KB). `npm run check`: 0 errors. `npm run build` succeeds. `npm run build:production` correctly refuses (32 launch-blocking items; no `PUBLIC_API_BASE`).
- QA script hardening: its waits now poll on a timer, and a timeout reports the page's state. On this Mac, running on battery, Chrome pauses animation frames, which earlier made waits time out even though the page was ready. A final re-run after the ornament removal (decoration only, no layout change) passed every check it reached before the machine was suspended mid-run.

**Not yet verified:**
- The Supabase deployment itself. Account creation is for the families; [supabase/README.md](supabase/README.md) has the steps and an end-to-end checklist.
- Real email delivery through Resend, and Turnstile.
- Real phones and in-app browsers, including the on-screen keyboard behaviour in RSVP focus mode.
- Call and WhatsApp with real numbers. The link format is unit-tested, but no numbers exist yet.

## 26 October 2026 — Phase 5: closing, sharing, desktop and quality

Built: the Thank You page (back cover) with handwritten lettering and the riffle back to Welcome; the share fallback sheet; the link-preview image and tags; the fuller desktop scene; and a performance and accessibility pass across the whole invitation. No music (Q-B5 default: no audio until a licensed track is supplied).

### Phase 5 decisions

1. **Handwriting drawn from the real font.** "Thank You for Blessing Our Journey" is turned into one SVG path per letter at build time from the Pinyon Script font (`src/lib/handwriting.ts`). The page writes each letter's outline in ink and fills it as the pen moves on, 2.4 s in all (PRD §6.18). Without JavaScript, on revisits and with reduced motion, the lettering shows complete. Screen readers get the words as text. A hand-traced single-stroke version (S-14) can replace these paths later without changing the page.
2. **Thank You layout:** a golden-hour temple courtyard (gopuram, temple tank with the lamps' light on the water, silk drape, jasmine, two brass lamps breathing on an 8 s cycle), the veil card from about 22% down, and the buttons toward the bottom (THEME P19).
3. **Return to First Page riffles** through six pages back to Welcome (not the cover) in about 0.9 s; with reduced motion it fades straight there.
4. **Share:** the phone's own share sheet where there is one; otherwise a sheet with "Share on WhatsApp" (message and link pre-filled) and "Copy link".
5. **Link preview:** `public/og-image.jpg` (1200 × 630, 76 KB) is rendered from the invitation's own fonts, ornaments and decoration slots by `npm run og`. Re-run it when the names, date or city change, or when real artwork arrives. WhatsApp needs an absolute image address, so the preview appears once `site.url` is set (M-28).
6. **Desktop (Option B):** the background gains jasmine garlands at the top corners, brass lamps at the bottom corners and a soft-focus gopuram behind the mockup. The distant scene drifts very slowly (40 s each way) and holds still under reduced motion. Tablets in portrait show one page at full height on the same background, without a mockup.
7. **Supplied artwork shows as supplied (AC-36).** Tints and haze used to blend the vector stand-ins (Thank You gopuram, desktop gopuram) apply only to placeholders, so the commissioned art appears unaltered.
8. **Performance:**
   - **Telugu font:** cut from 51 KB to 4.9 KB, keeping exactly the Telugu characters in `wedding.ts` (`npm run fonts`, which runs before `npm run dev` and every build).
   - **Ornaments:** each is defined once and referenced, instead of being repeated about 85 times in the HTML.
   - **Placeholders:** decoration placeholders are cached files instead of copies inlined into the HTML. Compressed HTML went from 58 KB to 38 KB.
   - **Fonts at load:** only the cover is laid out until the book is ready, so the first paint no longer waits for fonts used deep inside the book.
   - **Neighbour pages:** the pages next to the current one stay ready for an instant turn but transparent until a turn starts.
9. **Accessibility fixes from the scan:** the proposed-time note on event sheets moved inside the Time entry (it was invalid inside the definition list), and the dashboard's scrolling RSVP table can now be reached by keyboard.

### Phase 5 results

- **Speed (AC-33):** `npm run perf` reports Lighthouse mobile **95** on the cover (median of 3, target ≥ 85), up from 83–85 at the start of Phase 5. First paint is 1.9 s, largest paint 2.6 s, blocking time 70 ms and layout shift 0.001. Accessibility scores 100 and best practices 96. (SEO is low on purpose: the invitation is `noindex`, per Q-F2.)
- `npm test`: 57 unit tests pass. The new ones cover the handwriting builder, including that letters are drawn upright.
- `npm run qa:book`: **69/69 checks pass.** The new ones:
  - **AC-29:** the message is written letter by letter in about 2.4 s, the names follow, and Return riffles to Welcome in under 2 s through several pages, never the cover. Without JavaScript the lettering is solid and the words reach screen readers.
  - **AC-30:** the native share sheet is used when available; otherwise the WhatsApp link carries the message and address, and Copy link copies it.
  - **AC-31:** the preview title, description and a valid 1200 × 630 JPEG under 300 KB are in place.
  - **AC-32b:** with reduced motion there are no petals, sway, flicker or gallery auto-advance; the lettering is complete at once; Return fades.
  - **AC-34:** axe finds no serious or critical issues on the 20 pages, the chrome, all 23 overlays, and the dashboard signed out and signed in.
  - **AC-35b and AC-35c:** desktop has one unchanging background on every page; tablets in portrait show the page at full height without a mockup.
  - **AC-36:** checked for every supplied asset. None has been supplied yet, so this check will matter once artwork arrives.
- JavaScript: 52 KB gzipped (budget 140 KB). `npm run check`: 0 errors. `npm run build:preview` succeeds. `npm run build:production` correctly refuses (32 launch-blocking items).

**Not yet verified:**
- **AC-33 on a real phone:** a mid-range Android over mobile data. The Lighthouse figure is a simulation.
- **Screen readers (part of AC-34):** manual VoiceOver and TalkBack passes through RSVP and a blessing.
- **WhatsApp link preview:** needs the live domain.
- **Real artwork:** every decoration is still a placeholder.

## 26 October 2026 — New opening: the temple entrance

At the client's request (with reference screenshots and the reference video), the cover's silk envelope (Q-A4 default) is replaced by a temple-entrance opening that ends on the invitation book.

### Decisions

1. **Sequence:**
   - The decorated temple entrance with closed doors, bells and garlands.
   - Tapping the centre bell (or "Tap the bell to enter") rings it.
   - The doors swing open and stay in view.
   - We walk forward through the doorway into the courtyard.
   - The R·D monogram descends from the sky in a shaft of light, greeted by two rings of petals.
   - It settles onto the invitation book as the book rises into place.
   - "Open the Invitation" opens the book with a real page curl onto Welcome (or the deep-linked page).

   About 9.7 s from the tap to the book; 0.9 s to open. Timing follows the reference: doors 2.3 s, walk about 3 s, monogram 1.8 s.
2. **Everything stays one page (the cover),** so deep links, Skip, Contents, Scroll View and reduced motion behave as before. Skip still goes straight to Welcome; it hides once the book is showing. Within a visit, returning to the cover shows the book, not the closed doors. Without JavaScript only the book is shown.
3. **Bell sound:** synthesised in the browser as a brass temple bell (clapper strike, then shimmering inharmonic partials over about 4 s, struck twice). Sound only follows the guest's own tap, and a sound button (bottom left, clear of the page-curl corner) turns it off and remembers the choice. A licensed recording at `public/audio/temple-bell.mp3` replaces the synthesis automatically. This is a sound effect, not music; the no-music default (Q-B5) still stands.
4. **Reduced motion:** the doors fade away and the monogram and book appear in about 1 s, with no walk, 3D swing or petals. The book then opens with a cross-fade.
5. **Photographic artwork:** realism ("every leaf, every flower very real") needs real photographs or photoreal renders, which cannot be drawn in code. The scene is built from asset slots (`src/assets/decor/README.md`): `temple-entrance` (frame with a transparent doorway), the door leaves, `temple-courtyard`, `rd-monogram`, `temple-bell` and the bell recording. Until they arrive, stand-ins assembled from the existing placeholders are shown. Their haze and tint adjustments apply only to placeholders, so supplied photographs appear unaltered (AC-36).
6. **The reference reel's frames are not used as artwork:** they are another studio's watermarked, copyrighted design. They guided the staging and timing only.
7. **Handwriting fix found on the way:** one curve in the Thank You lettering produced an invalid path (`NaN`) through opentype.js 2's path writer. The path data is now written directly from the glyph commands.

### Results

- `npm run qa:book`: **70/70 checks pass.**
  - **AC-01b (rewritten for the new opening):** before the tap the doors are closed, the book is hidden, and "Tap the bell to enter" shows. After the tap the bell sounds and the doors swing open. The monogram is fully shown at 6.4 s, the petal rings appear, and the book is ready at 9.7 s with focus on "Open the Invitation". Open curls to Welcome in 0.9 s.
  - **AC-01c:** returning to the cover shows the book.
  - **AC-32:** with reduced motion the entrance completes in under 2.5 s with a cross-fade.
  - **AC-05 deep links:** these and every earlier check still pass.

## 26 October 2026 — The opening rebuilt from the client's photographs

The client judged the vector stand-ins above "not looking real… like a cartoon" and supplied photographs: the decorated entrance with closed doors, the courtyard beyond, and the brass bell. The brief: tapping the hanging bell rings it and opens the doors very smoothly. Leaves, flowers and banana leaves move in the wind, and birds fly once the doors open. The R·D monogram comes close and is replaced by an invitation card, with "Dear (guest name)" above it, which opens into the book. Everything should look real and smooth, "not a cartoon, not cinematic". This section replaces decision 5 of the previous one.

### Decisions

1. **One photograph, cut apart.** The doors, the doorway, the pieces that hang in front of the doors and the pieces that move in the wind are all cut from the client's entrance photograph, so light and colour match exactly. Nothing is redrawn.
   - `src/assets/opening/scene.json` records the measurements; `npm run opening:assets` makes the layers.
   - The buds and bells hanging in front of the door top are lifted onto a still layer of their own and painted out of the door leaves, so they do not swing away with the doors.
2. **Doors:** each leaf turns on its hinge in 3D (78°) over 2.6 s with a gentle ease-in-out, darkening as it turns away from the light. Warm light comes through the widening gap.
3. **Wind:** the garlands, the top swag and the banana leaves are pieces of the photograph that sway from their tie points. Their edges fade into the still photograph, so the flowers appear to flex rather than slide. The bell sways a little too, and the breeze picks up while the doors open. Motion is slow and irregular, like a real breeze.
4. **Birds:** small distant silhouettes with wingbeats cross the sky once the doors are open.
5. **Walking in:** the doorway grows past us while the courtyard comes slowly closer.
6. **Monogram to card:** the monogram descends from the sky, comes toward us and gives way to the invitation card. The petal rings of the earlier version are gone: they were not in the client's sequence and read as an effect rather than something real.
7. **Invitation card:** an envelope in the style of the client's envelope reference: cream paper, a shaped flap, gold foil, a ribbon with tassels and a wax seal. All text is live. "Open the Invitation" breaks the seal, opens the flap and turns the page to Welcome (or the deep-linked page).
8. **Guest name:** a personal link such as `?to=Meena%20%26%20Ravi` shows "Dear Meena & Ravi," above the card. Only letters, numbers, spaces and `.,'&()-` are kept, up to 48 characters, and the name is inserted as plain text. Without a name: "Dear Family & Friends,". No guest names are stored in the site.
9. **Timing:** about 10.8 s from the tap to the card (monogram fully shown at about 7 s); "Open the Invitation" reaches Welcome in about 2.2 s. With reduced motion the doors cross-fade and the card appears in about 1.4 s.
10. **Loading:** the closed-door photograph loads first, as AVIF at high priority. The other layers are requested only after it arrives.
    - The bell is resized for phones (400 px wide, 10 KB).
    - The card is not laid out until the bell is rung, so its fonts wait.
    - Only the one font on the door screen is preloaded.
    - WebP copies serve browsers without AVIF.
11. **Third-party material is not used as artwork:** the frames of the reference reel and the reference envelope photograph are other studios' designs, used for style only.
12. **Still to be supplied:** the R·D monogram artwork (D-54; gold-foil lettering is drawn in code until then) and a licensed bell recording (A-01; synthesised until then).

### Results

- `npm run perf`: mobile performance **86** (target 85), LCP 3.7 s, accessibility 100, best practices 100. Adding the photographs had dropped it to 71 before the loading work.
- `npm run qa:book`: **71/71 checks pass.** **AC-01b** covers the full sequence: bell sound, doors swinging, birds, monogram, card, focus on "Open the Invitation", seal and flap, page curl. **AC-01d** (new) checks the personal `?to=` greeting and that it cannot inject markup.
- Frame capture on the dev build: the doors, wind and walk-in hold 60 fps on this Mac.
- **Not yet verified:** a real mid-range phone, and the sound on iOS with the silent switch on.

## 26 October 2026 — The invitation card from the client's photograph

The client found the drawn envelope card cartoon-like and the white "Dear …" above it hard to read over the sky. They supplied a photograph of a maroon velvet card with gold foil and asked for: "Dear Guest" on the card, the couple's names after it, then "Open the Invitation" as the button, which opens into the book with a smooth animation.

### Decisions

1. **The supplied card is used as photographed.** Its borders, paisleys, mandap and couple, and its printed "Open the Invitation", are not redrawn. `npm run opening:assets` makes the card layer from it.
2. **The greeting sits on the card, in the card's own gold,** where the printed "Dear Guest" was. The printed words are painted out by rebuilding the velvet under each letter from the light around it plus grain from a plain patch, so no patch shows. Each guest's name is then set there in live text. This answers the request for a darker, more readable greeting: the old white line over the sky is gone, and gold on maroon matches the card's design (maroon text on the maroon card would not show).
3. **Couple's names after the greeting:** the card's printed divider moves down slightly to make room, and "Rahul & Divya" is set beneath it in the same gold (Cormorant Garamond, as on the printed button text).
4. **"Open the Invitation" is the button:** the printed words get a stamped-gold ring and a slow light sweep, a slight press when tapped, and a tap area of at least 44 px.
5. **Gold foil in live text:** a gradient taken from the colours measured in the card's printing (pale highlight, rich gold, warm brown shadow), with a faint embossed edge.
6. **Names of any length fit:** the greeting is measured once its font has loaded. A longer name is set smaller on one line; a very long name takes two lines. Without `?to=` the card reads "Dear Guest", as printed.
7. **Sequence:** the monogram comes forward and gives way to the card with "Dear Guest". The couple's names appear about 0.7 s later, then the button ring about 0.65 s after that (card ready at about 11.3 s after the tap).
8. **Opening:** tapping "Open the Invitation" swings the card's cover open on its left edge (0.95 s) while the card eases right, showing a cream inside with a gold border and the R·D monogram. The first page then turns with the book's page curl. Welcome is reached about 1.9 s after the tap. With reduced motion the book cross-fades.
9. **Loading:** the card image (138 KB AVIF) is not requested until the bell is rung, so the first screen is unaffected (Lighthouse still 86). It also appears without JavaScript.

### Results

- `npm run qa:book`: **71/71 checks pass.** AC-01b covers the new card: the cover swings open, then the curl. AC-01d checks the greeting: plain text only, a medium name on one line, a 40-character name on two lines, kept inside the card.
- `npm run perf`: mobile performance 86, accessibility 100, best practices 100.

## 27 October 2026 — The client's R·D logo and heritage bell

The client supplied their R·D logo (pink and gold letters with lotus, buds and a jhumka), a heritage brass bell with peacock handles, and a picture of bells on beaded chains, asking: replace the monogram with the logo, which should come from the temple and grow big; replace the bell with the heritage bell; and take only the chain from the third picture.

### Decisions

1. **The logo replaces the code-drawn monogram everywhere it appeared:** in the opening and inside the card when it opens. It is used as supplied, only trimmed and encoded (1044 × 1002 px, 117 KB AVIF), and requested after the door photograph. The code-drawn gold lettering, and the helper that chose between it and a supplied file, are removed.
2. **The logo comes out of the temple:** after the walk-in it appears in the lit shrine door at the foot of the gopuram and comes straight towards us. Its size grows as a real object's would (1 / distance) and its path follows the perspective, so it lingers small in the doorway, then draws near and settles large in the middle of the screen (2.8 s). It then comes closer still and gives way to the invitation card. It is fully shown about 6.2 s after the bell is rung; the card is ready at about 11.6 s.
3. **The heritage bell:** cut out from its white background, keeping the bell from its last chain link down, with the hole in its ring left clear. It is sized for phones (360 px wide, 30 KB AVIF).
4. **The chain from the third picture only:** one repeat of the beaded chain (bead and links, 210 px) is cut out and tiled from the bell up to the beam. It is drawn 1.43× so its links match the bell's own link, which also gives the beads the same proportion to the bell as in the client's picture. The join falls at a side-on link, so the two chains read as one.
5. **Cut-outs:** the background is the near-white reached from the picture's edges, plus pure-white holes inside. Highlights on the brass stay solid, and edges get a soft two-pixel alpha.

### Results

- `npm run qa:book`: **71/71 checks pass** (monogram fully shown at 6.2 s, card ready at 11.6 s, Welcome 2.0 s after tapping Open).
- `npm run perf`: mobile performance 87 (median of three runs), accessibility 100, best practices 100.

## 27 October 2026 — Desktop background in velvet and gold

The client asked for the desktop background around the phone to follow the royal theme (velvet red or maroon, with gold borders) instead of the cream backdrop with line-art pillars, garlands, lamps and gopuram.

### Decisions

1. **Made from the client's card, not drawn:** the background reuses the velvet and gold of the supplied invitation card, so the screen around the phone matches the invitation exactly. `npm run opening:assets` makes the pieces (`scripts/opening/stage.ts`, `src/assets/stage/`).
   - **Velvet:** a seamless 256 px tile with the card's colour and real grain from its plain velvet, near-lossless (33 KB). It is lit softly from the front: a warm sheen behind the phone, deepening towards the screen's edges.
   - **Gold border:** the card's beaded band and fine rule run round the screen inside a small margin, from the card's own corner and one exact repeat of its top band (CSS `border-image`). The sides use the top band turned on its side, because the photographed card's sides lean very slightly and do not repeat cleanly.
   - **Corner sprays:** the gold paisley-and-flower spray from the card's lower corner, mirrored into all four corners (desktop mockup only; beside a full-height tablet page they would be half hidden).
2. **The text beside the phone:** the couple's names are in the card's gold foil; the date and the QR caption are pale gold.
3. **Removed from the desktop:** the placeholder pillars, jasmine garlands, lamps, gopuram, mandala and the slow drift.
4. **Phones download none of it:** all of these are CSS backgrounds on elements that phones do not display.
5. **Fixes found on the way:**
   - "Open the Invitation" had a thick white focus outline that covered the names. Focus now brightens the button's own gold rings, at the same size.
   - In a small desktop mockup, "Tap the bell to enter" ran under the sound button; on narrow screens it now sits just above it.
   - Inline image addresses are quoted, so they also work when a folder name contains spaces.

### Results

- `npm run qa:book`: **71/71 checks pass**. AC-35b now checks the velvet, the gold border and four corner sprays, unchanged on every page.
- `npm run perf`: mobile performance 87, accessibility 100, best practices 100.
- Checked at 1440 × 900, 1280 × 720, 1920 × 1080 and tablet portrait (768 × 1024).

## 27 October 2026 — Welcome page from the client's courtyard and couple

The client asked for the first page to be completely redone after their reference video. They supplied a temple courtyard photograph with a young man seated in it, and a picture of the couple seated together. They asked to:
- Remove the man and seat the couple there instead, a little smaller and further forward.
- Show the couple's names, date, time, place and the welcome message above them.
- Make the flowers, bells and branches move in the wind, with a light shower of small flowers.
- Have the couple smile, look at each other and greet guests with folded hands (vanakkam).

### Decisions

1. **The courtyard without the seated figure:** the figure covered about half the photograph, so it cannot simply be painted over.
   - The right side (pillar, brass lamps, banana leaves) is replaced by the clean left side mirrored; temple courtyards are symmetrical.
   - The rest is rebuilt from the photograph itself by patch matching (`scripts/welcome/inpaint.ts`), drawing on pieces from about the same height (floor from floor, greenery from greenery) and never from the carved pillars or lamps.
   - The couple then sit over most of the rebuilt area.
2. **The couple** are seated at the foot of the page, 45% of its height (the figure was about 58%), and slightly further forward. The supplied picture's cut lower edge sits just below the screen, and its straight-cut sides fade softly into the floor.
   - The supplied picture is small (364 px wide). It is enlarged 2× with a Lanczos filter, and a larger version would be sharper on high-resolution phones.
3. **Above them, in the sky:**
   - "Rahul & Divya" written in script letter by letter (the Thank You page's handwriting, from Pinyon Script);
   - a gold divider;
   - the date, the confirmed ceremony time (10:30 AM IST) and the city;
   - the welcome message (still a draft, so marked in preview builds).

   A soft haze behind the lettering keeps it readable over the photograph. On short screens the message is set smaller, and below 620 px it is left out. The Telugu title, "Together with our families", the nameplate, the drawn arch, garlands and lamps of the old page are removed.
4. **Motion:**
   - **Arrival:** the courtyard and the couple settle as the page arrives, then the names are written in and the details follow.
   - **Breeze:** while the page shows, three garland strands on each side, the bells, a banana leaf and the palms sway on their own pivots. The opening and this page now share one breeze (`src/motion/breeze.ts`).
   - **Couple:** a very slow breath keeps them from looking frozen.
   - **Petals:** real rose petals, taken from the path in the opening's courtyard photograph, drift down two at a time, at most 12 on screen. They also replace the drawn rose-petal placeholders on the other pages that drop petals.
   - **Reduced motion:** no breeze, breath or petals.
5. **Folded hands (vanakkam) cannot be made from a still picture:** making the couple move their hands, turn or change expression needs new frames of them doing so. With a short clip or a picture of them greeting with folded hands, it can replace the still couple in the same place.
6. **Loading:** the courtyard (107 KB AVIF) and the couple (63 KB AVIF) are requested only after the door photograph, so the opening is not slowed; without JavaScript plain copies show.

### Results

- `npm run qa:book`: **71/71 checks pass** (including no overflow at every phone size).
- `npm run perf`: mobile performance 87, accessibility 100, best practices 100.
