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
