# PRD — Rahul & Divya · Royal South Indian Hindu Wedding Invitation

| Field | Value |
|---|---|
| Product | Rahul & Divya — Royal South Indian Hindu Wedding Invitation (interactive digital invitation) |
| Document | Product Requirements Document (PRD) |
| Version | 1.0 — Draft for client review |
| Date | 23 October 2026 |
| Status | **Awaiting approval. No code will be written until this PRD and THEME.md are approved.** |
| Companion document | [THEME.md](THEME.md): visual direction, palette, typography, assets, motion and page-by-page layouts |
| Reference material | Client reference video `WhatsApp Video 2026-10-23 at 14.58.48.mp4` (1 min 56 s, portrait). Analysed in §2 |

---

## Deliverables index

The brief asked for 16 deliverables. This table shows where each one is covered.

| # | Deliverable requested | Where |
|---|---|---|
| 1 | Project overview and objectives | §1 |
| 2 | Confirmed wedding information | §3 |
| 3 | Proposed arrangements and missing information | §4 |
| 4 | Final 18-section website structure | §5 |
| 5 | Detailed visual design requirements for every section | §6 (and THEME.md §13 for exact layer and position specs) |
| 6 | Mobile layout specifications for every section | §6, the "Mobile" row of each section |
| 7 | Desktop layout specifications for every section | §6, the "Desktop" row of each section, plus §7 |
| 8 | Animation and interaction behaviour | §6 per section, §8 globally |
| 9 | Colour palette and typography | §9 (summary), THEME.md §3–§4 (authoritative) |
| 10 | Realistic asset checklist and file formats | §10 (summary), THEME.md §15 (full checklist) |
| 11 | Responsive website requirements | §11 |
| 12 | Accessibility and performance requirements | §12 |
| 13 | RSVP and Wishing Wall storage requirements | §13 |
| 14 | Functional acceptance criteria | §15 |
| 15 | Phased website development plan | §16 |
| 16 | Questions requiring confirmation before development | §17 |
| + | Reference video analysis (the book page-turn experience) | §2 |
| + | Technical architecture and the central wedding data file | §14 |

---

## Key decisions in this PRD (summary for review)

1. **The invitation is a "Living Invitation Book".** Following the reference video, the 18 sections are presented as **19 full-screen pages plus an opening cover**. Guests turn pages with a realistic page-curl, exactly like the reference, instead of scrolling one long page. Two sections (Meet the Couple and the Events Timeline) take two pages each. See §2 and §5.
2. **The continuous-scroll requirement is kept as a fallback, not dropped.** Every page is built so that, without the book engine (no JavaScript, an accessibility preference, or the "Scroll View" option in the Contents menu), the same pages stack into one continuous vertical website. See §2.4.
3. **Desktop recommendation: Option B (premium mobile mockup).** Option A is redefined as an "Open Book" two-page spread. Both are fully specified in §7. Neither is built until you choose.
4. **Nothing personal is invented.** Every unknown (family names, addresses, phone numbers, venue, photos, biographies) lives in one data file as an empty value. It shows as a highlighted placeholder in preview mode and as a graceful "details coming soon" line on the live site. See §4.3.
5. **Proposed timings always say "Proposed"** until you mark them confirmed. Only the wedding date and the 10:30 AM IST Muhurtham are treated as confirmed.
6. **Original artwork only.** The reference video's illustrations, names ("Disha"), venue (Mumbai) and palette are **not** copied. We reproduce its interaction pattern with new, realistic, culturally appropriate assets in your approved ivory, antique-gold and temple-maroon palette.

---

## 1. Project overview and objectives

### 1.1 Vision

A premium digital wedding invitation for **Rahul and Divya** that feels like a hand-crafted South Indian *Subhalekha* (శుభలేఖ, the traditional Telugu wedding invitation) coming to life in the guest's hands. It is bound like a royal invitation book. Its pages are ivory handmade paper edged in antique gold, framed by carved temple pillars, jasmine garlands and brass lamps, and each one turns with a soft, physical page-curl. Every page is a distinct composition with its own realistic decorations and its own small moment of motion, inspired by Lord Venkateswara, Tirupati temple architecture and the rituals of a South Indian Hindu wedding.

This is **not** an informational website. No page may consist only of a heading, a paragraph and a plain background.

### 1.2 Objectives

| ID | Objective | Measure of success |
|---|---|---|
| O1 | Create an unforgettable first impression | The opening reveal finishes within 3 s of the tap. In family preview testing, at least 8 of 10 testers describe it as "premium" or "like a real invitation" |
| O2 | Make essential information effortless to find | Date, time, venue, RSVP and contact are each reachable within **2 taps** from any page (Contents menu or a direct button) |
| O3 | Collect reliable RSVPs | RSVP works on all supported devices, and success is shown **only** after the data is stored (§13) |
| O4 | Feel fast on Indian mobile networks | First page is interactive in ≤ 3 s on a mid-range Android phone over 4G (§12.2) |
| O5 | Be usable by every guest, including elders | Large tap targets, readable type, visible Next and Previous buttons alongside gestures, reduced-motion support, screen-reader support (§12.1) |
| O6 | Be easy to update | All wedding details live in **one** editable data file. Changing a venue or a time requires no layout edits (§14.2) |
| O7 | Be culturally authentic and respectful | Every symbol, ritual name and blessing is reviewed and approved by the families before launch |

### 1.3 Audience and context of use

| Guest group | Context | Implications |
|---|---|---|
| Family elders (60–85) | Receive the link on WhatsApp and open it on a phone, often with large system font sizes | Big targets, high contrast, Telugu text option, obvious Next and Previous buttons, no reliance on hidden gestures |
| Friends and younger relatives | Mobile, often inside WhatsApp or Instagram in-app browsers | Must work in in-app webviews; quick RSVP; share button |
| Guests abroad (NRI) | Different time zones | Countdown is calculated from IST. Times show "IST", plus the guest's local time where it differs (§6.5) |
| Desktop viewers | Office laptops, family computers | Premium desktop presentation (§7) |

### 1.4 In scope

18 sections (§5), the book page-turn engine, RSVP and Wishing Wall with persistent storage and moderation, Add to Calendar, Google Maps directions, Call and WhatsApp actions, family-tree overlays, the love-story carousel, Contents navigation, sharing, a desktop presentation, a central data file, a family admin page for wishes and RSVPs, and a WhatsApp-ready share preview image.

### 1.5 Out of scope unless requested (see §17)

Gift registry or payments, live-streaming, guest photo uploads, a full Telugu-only version of the site, personalised per-guest links, and SMS or WhatsApp bulk messaging.

---

## 2. Reference video analysis: the "Living Invitation Book"

### 2.1 What the reference shows

The reference is a portrait, phone-first invitation made of full-screen illustrated pages. Guests turn the pages by dragging from the bottom-right corner. It was viewed inside Instagram's in-app browser.

| Time | What happens | Observed technique |
|---|---|---|
| 0:00–0:04 | Closed, carved maroon-lacquer temple doors with brass knockers and elephant reliefs, framed by jasmine-and-rose garlands, banana plants and a temple arch. A "Tap to Open" button sits at the bottom and a "SKIP" pill at top right | Static hero with a persistent call to action |
| 0:04–0:08 | The two doors swing **inward in 3D perspective**, revealing a gopuram at the end of a petal-strewn path | 3D door rotation (each leaf hinged on its outer edge) |
| 0:08–0:12 | The "camera" glides forward towards the gopuram while the door frames slide out past the screen edges | Slow scale/dolly with parallax layers |
| 0:12–0:17 | A gold floral monogram appears over the temple with petal-ring sparkles | Fade and scale in, with particle rings |
| 0:18–0:27 | Couple hero page with script names ("Rahul *weds* Disha") | Cross-fade into the first book page |
| 0:28–0:31 | **Page turn.** The page peels from the bottom-right corner along a diagonal fold. The back of the page is plain cream parchment, and the next page is revealed underneath | Drag-driven page-curl with a parchment back face and fold shadows |
| 0:32–0:41 | "The Bride" page: script title, portrait seated on temple steps, then **polaroid memory cards pop in** around her, slightly tilted, with handwritten labels | Staggered pop-in with rotation |
| 0:42–0:53 | Page turn, then "The Groom" page: portrait on temple steps, with polaroids sliding in down the left and right edges | Staggered slide-in from both sides |
| 0:54–1:11 | The couple lean over a **gold arched nameplate**, inside which the parents' names **write in line by line**, with petals drifting | Sequential text reveal inside a frame |
| 1:12–1:25 | "Wedding Events" signboard. **Circular jasmine-wreath medallions** zigzag down the page, each with a small prop (ring box, throne chair) and the event's name, date and time, joined by garlands | Progressive medallion reveal |
| 1:25–1:28 | The page fades to **blank parchment**, then the next page "blooms" in from the paper | Parchment-bloom transition |
| 1:28–1:40 | "Save the Date": **scratch-to-reveal gold foil** panels for date, month and year, then maroon countdown tiles labelled "Countdown to the Muhurtham" | Canvas scratch card and live countdown |
| 1:42–1:51 | "Venue": arched title, venue photo in a gold frame, illustrated map with a pin | Framed photo plus map card |
| 1:52–1:56 | "Until We See You There" over a golden-hour temple scene | Closing page |
| Persistent | Maroon round **music toggle** at bottom right; a translucent **pearl orb** at the right edge (a turn hint and handle); "SKIP" on the intro | Fixed UI chrome above the book |

### 2.2 What we adopt

1. **Book paradigm.** Every section is a full-screen page of one invitation book. Pages turn with a drag-following page-curl with a parchment back (§8.1).
2. **Page-entry choreography.** Decorations are present the moment a page is uncovered. The title, hero object and text then animate in a short, elegant sequence (§8.2).
3. **Opening reveal.** A tap-to-open cover with a SKIP option (§6.1). The reference's **temple-door reveal and forward glide** become the **Divine Blessings** page, which the brief already asks to open with temple doors (§6.3).
4. **Polaroid memory cards** around the bride's and groom's portraits (§6.6), using your photos and your captions.
5. **Arched gold nameplate** in which the parents' names write in line by line (§6.7).
6. **Jasmine-wreath medallions on a garland or thread** for the events timeline (§6.9).
7. **Scratch-to-reveal gold foil** for the date on Save the Date (§6.4), with a "Reveal" button alternative.
8. **Framed venue photo plus illustrated map card** (§6.13).
9. **Golden-hour temple closing page** (§6.18).
10. **Persistent chrome:** music toggle (if music is approved), a pearl page-turn handle, page numbers and SKIP on the cover.

### 2.3 What we deliberately change

| Reference | Our invitation | Why |
|---|---|---|
| Saturated orange, red and pink scenes | Ivory and jasmine-white pages, antique-gold ornament, selective temple-maroon accents, sandalwood warmth | Your approved palette. Avoid all-dark or all-gold pages |
| Painted, illustrated couple characters | Real photographs of Rahul and Divya in silk-inspired frames | Your brief requires realistic photographs and no cartoon illustration. **Confirm in Q-A1 (§17)** whether you would also like commissioned hand-painted portraits in the reference style |
| Petal "firework" rings | One restrained petal unfurl behind the monogram, at most 12 drifting petals per page | Brief: no explosions or excessive particles |
| Names "Rahul & Disha", venue in Mumbai | Rahul & Divya, Tirupati, venue to be confirmed | Your details only |
| Engagement event | Mehndi, Haldi, Sangeet, Wedding, Reception | Your event list |
| Any reference artwork | All-new, licensed or commissioned assets | Copyright. **No frame or asset from the reference video will be reused** |

### 2.4 Reconciling "book" with the brief's continuous-scroll requirement

The brief describes "one continuous vertical website" and scroll-triggered animation. The video asks for book page turns throughout. Both are delivered through **progressive enhancement**:

- **Base layer (always present).** The 19 pages exist in the HTML in order, each one screen tall. With no JavaScript they form a continuous vertical website, readable by search previews, screen readers and old browsers.
- **Book Mode (default).** The book engine turns those same pages into a page-curl book on every device.
- **Scroll View (optional).** A "Read as scrolling page" toggle in the Contents menu disables the book engine. Pages then stack vertically, and each page's entry choreography plays when it scrolls into view. Scroll View is also offered automatically if the page-curl engine fails to start (§8.1.9).
- **Brief language translated to Book Mode.** "On scroll down" becomes "on turning forward to the page". "On scroll up, respond naturally" becomes "turning back shows the page in its completed state, and the timeline thread retracts when pages are turned backwards". "Respond subtly to scrolling" becomes "respond to the page-curl drag and to touch".

> **Approval needed (Q-A2):** Book Mode as the default on all devices, with Scroll View as a fallback and option.

---

## 3. Confirmed wedding information

Only the items below are treated as confirmed. Everything else in this PRD is proposed or to be provided.

| Item | Confirmed value |
|---|---|
| Wedding type | Traditional South Indian Hindu wedding |
| Groom | Rahul |
| Bride | Divya |
| Wedding date | **Wednesday, 7 April 2027** (weekday verified) |
| Wedding Muhurtham | **10:30 AM IST** (India Standard Time, UTC+05:30). Machine value `2027-04-07T10:30:00+05:30` |
| Wedding location | **Tirupati, Andhra Pradesh, India** (city level only) |
| Ceremony venue | **To be confirmed.** A permitted wedding venue or marriage hall in the Tirupati/Tirumala area. **It must not be presented as Sri Venkateswara Temple** |
| Cultural inspiration | Lord Venkateswara, traditional Tirupati temple architecture, South Indian Hindu wedding rituals, jasmine, silk, brass lamps, sacred wedding mandapam decorations |
| Visual style | Royal South Indian Heritage: Ivory, Antique Gold, Temple Maroon, Jasmine White, Sandalwood |
| Time zone | All times are IST (`Asia/Kolkata`) |

---

## 4. Proposed arrangements and missing information

### 4.1 Proposed event schedule (not confirmed)

| Order | Event | Proposed date | Proposed time (IST) | Venue | Address | Status |
|---|---|---|---|---|---|---|
| 1 | Mehndi | Monday, 5 April 2027 | 4:00 PM | Bride's family home | To be provided | **Proposed** |
| 2 | Haldi | Tuesday, 6 April 2027 | 9:00 AM | Groom's family home | To be provided | **Proposed** |
| 3 | Sangeet Night | Tuesday, 6 April 2027 | 6:30 PM | Shared function hall | To be provided | **Proposed** |
| 4 | Hindu Wedding Ceremony | Wednesday, 7 April 2027 | 10:30 AM (Muhurtham) | Venue in Tirupati, to be confirmed | To be provided | **Date and time confirmed, venue to be confirmed** |
| 5 | Grand Wedding Reception | Wednesday, 7 April 2027 | 6:30 PM | Same function hall as Sangeet | To be provided | **Proposed** |

**Display rule.** Each event carries `timeStatus: "proposed" | "confirmed"`. While proposed, the site shows a small "Proposed" badge beside the date and time, and the Add to Calendar behaviour follows §6.9.6. No event end times are shown anywhere until you provide them.

### 4.2 Missing-information register

"Blocks launch" means the item must be provided, or deliberately hidden, before guests receive the link.

| ID | Missing item | Used on | Blocks launch? |
|---|---|---|---|
| M-01 | Groom's father's name | Parents & Family, family tree | Yes (or hide the line) |
| M-02 | Groom's mother's name | Parents & Family, family tree | Yes (or hide the line) |
| M-03 | Bride's father's name | Parents & Family, family tree | Yes (or hide the line) |
| M-04 | Bride's mother's name | Parents & Family, family tree | Yes (or hide the line) |
| M-05 | Grandparents (both sides) | Family trees | No (nodes hidden until supplied) |
| M-06 | Siblings and other relatives | Family trees | No |
| M-07 | Full names and preferred honorifics (for example Telugu *Chi.* / *Chi. La. Sow.*) | Welcome, Family | No |
| M-08 | Rahul's portrait and biography | Meet the Couple | Yes for the portrait |
| M-09 | Divya's portrait and biography | Meet the Couple | Yes for the portrait |
| M-10 | Memory photos and captions for the polaroids (up to 6 each) | Meet the Couple | No (polaroids hidden if not supplied) |
| M-11 | Love-story photos (5) and confirmed milestone titles and text | Our Love Story | Yes (at least 3 photos) |
| M-12 | Family photos (groom's side, bride's side) | Parents & Family | No (elegant monogram placeholder) |
| M-13 | Wedding ceremony venue: name, address, map link, photo | Events, Ceremony, Venues | Yes |
| M-14 | Function hall (Sangeet and Reception): name, address, map link, photo | Events, Reception, Venues | Yes |
| M-15 | Bride's family home address and map link (Mehndi) | Events, Venues | Yes, or "shared personally" |
| M-16 | Groom's family home address and map link (Haldi) | Events, Venues | Yes, or "shared personally" |
| M-17 | Confirmation of each proposed event time | Events, Calendar | Yes |
| M-18 | Event end times, or approval of a provisional calendar duration | Calendar files | No (see §6.4.5) |
| M-19 | Contact: groom's family representative's name, phone, WhatsApp | Need Help | Yes |
| M-20 | Contact: bride's family representative's name, phone, WhatsApp | Need Help | Yes |
| M-21 | Contact: wedding event coordinator's name, phone, WhatsApp | Need Help | Yes |
| M-22 | Guest-assistance contact for travel | Travel | No |
| M-23 | Parking, shuttle and pickup arrangements | Travel | No (shown as "to be announced") |
| M-24 | Accommodation suggestions or blocks | Travel | No |
| M-25 | RSVP deadline, maximum attendees per response, notification email addresses | RSVP, backend | Yes |
| M-26 | Approved blessing and invocation text (§4.4) | Welcome, Blessings | Yes |
| M-27 | Music track (licensed), if music is wanted | Global | No |
| M-28 | Domain name | Launch | Yes |
| M-29 | Family admin emails (for moderation and RSVP access) | Admin | Yes |

### 4.3 Placeholder display rules

Every missing value is `null` in the data file (§14.2). The site renders it differently by mode:

| Mode | How `null` appears | Who sees it |
|---|---|---|
| **Preview mode** (`?preview=1`, or any non-production build) | Dashed gold outline with the label "To be provided: Groom's father's name". Placeholder photos show an ivory silk card with the R·D monogram and "Photo to be provided" | You and the families, during review |
| **Production** | Never shows "To be provided". Each field has a graceful fallback: names are hidden (the line collapses), venues read "Venue details will be shared soon", map and calendar buttons are disabled with a tooltip, photos fall back to a decorative monogram card | Guests |
| **Launch check** | `npm run content:check` lists every `null` and fails the production build if any field marked "Blocks launch" in §4.2 is still empty, unless that field is explicitly set to `hidden` | Developer |

### 4.4 Draft copy requiring approval

The brief forbids invented scripture quotations, so all sacred and blessing text is offered as **draft copy for family approval**, never as a quotation.

| ID | Location | Draft text (editable) |
|---|---|---|
| C-01 | Welcome, invitation message | "Two families, one sacred promise. Your presence and blessings will make our celebration complete." |
| C-02 | Divine Blessings, invocation (Telugu and English) | "ఓం నమో వేంకటేశాయ" / "Om Namo Venkatesaya" (a widely used devotional invocation, not a scripture quotation) |
| C-03 | Divine Blessings, blessing message | "With the divine grace of Lord Sri Venkateswara and Goddess Padmavathi, and the loving blessings of our elders, we begin our journey together." |
| C-04 | Welcome, optional Telugu title | "శుభలేఖ" (Subhalekha) |
| C-05 | Thank You, closing line | "Until we see you in Tirupati." (adapted from the reference's closing page) |
| C-06 | Love-story milestone titles | "Our First Meeting", "Becoming Friends", "Falling in Love", "A Beautiful Proposal", "Forever Begins" (proposed headings, not confirmed events) |

---

## 5. Final website structure

### 5.1 Section-to-page map (Book Mode)

| Book page | Section # | Section | Signature composition | Key interaction | Overlays |
|---|---|---|---|---|---|
| Cover | 1 | Splash: Royal Temple Invitation Opening | Silk envelope within a carved temple entrance | Tap to open; envelope opens and the card unfolds into page 1 | — |
| 1 | 2 | Welcome Invitation | Gold nameplate under a jasmine arch, brass lamps | Names reveal, gold line draws | — |
| 2 | 3 | Divine Blessings | Carved temple doors opening onto a sacred composition | Doors swing open, forward glide | — |
| 3 | 4 | Save the Date | Handmade-paper calendar card | Scratch-to-reveal date, Add to Calendar | Calendar menu (sheet) |
| 4 | 5 | Wedding Countdown | Four carved ivory-and-gold niche panels | Live countdown | — |
| 5 | 6a | Meet the Couple: Rahul | Silk-framed portrait with temple ornaments and memory polaroids | Portrait enters from the left | Bio sheet (if long) |
| 6 | 6b | Meet the Couple: Divya | Silk-framed portrait with jasmine and memory polaroids | Portrait enters from the right | Bio sheet (if long) |
| 7 | 7 | Parents and Family | Gold arch nameplate with two family frames | Names write in; tree buttons | **Family tree** ×2 (full screen) |
| 8 | 8 | Our Love Story | 3D circular photo gallery | Swipe to rotate | Photo viewer (optional) |
| 9 | 9a | Events Timeline I: Mehndi, Haldi, Sangeet | Wreath medallions on a golden thread | Thread draws, medallions bloom | Calendar menu, event sheet |
| 10 | 9b | Events Timeline II: Wedding, Reception | Thread continues and ends in a sacred knot | As above | As above |
| 11 | 10 | Wedding Ceremony | Realistic mandapam | Mandapam assembles, garlands sway | — |
| 12 | 11 | Grand Reception | Ivory silk curtains on a gold stage | Curtains part, lights glow | — |
| 13 | 12 | Dress Code | Fanned deck of silk-textured cards | Swipe through cards | — |
| 14 | 13 | Venues and Directions | Arched venue card, framed photo, illustrated map | Venue tabs, Get Directions | — |
| 15 | 14 | Transportation and Accommodation | Ivory travel board with floral corners | Tap tiles for details | Detail sheets |
| 16 | 15 | Wishing Wall | Hanging ivory blessing cards | Write a blessing; view all | **Composer**, **All Wishes** (full screen) |
| 17 | 16 | RSVP | Handmade-paper RSVP card | Two-step form, Confirm RSVP | Card focus mode (full screen) |
| 18 | 17 | Need Help / Contact | Three ivory visiting cards | Call, WhatsApp, details | Contact popup (sheet) |
| 19 (back cover) | 18 | Thank You | Golden-hour temple backdrop | Handwriting reveal, return to first page, share | — |

**Why two sections take two pages.** *Meet the Couple* follows the reference's separate Groom and Bride pages, giving each portrait room for a biography and memory polaroids; on the desktop spread (§7, Option A) the two pages sit side by side as the balanced pair the brief describes. The *Events Timeline* needs five events with full details and buttons, which cannot fit legibly on one phone screen.

### 5.2 Book anatomy and persistent chrome

| Element | Position (mobile) | Behaviour |
|---|---|---|
| **Contents button** | Top-left, inside the safe area, 44×44 px | Small antique-gold lotus icon on a translucent ivory disc. Opens the Contents overlay (§8.5) |
| **Music toggle** (if music is approved) | Bottom-right, 44×44 px | Temple-maroon disc with an ivory speaker glyph, as in the reference. `aria-pressed` reflects state |
| **Pearl page-turn handle** | Right edge, about 42% of the height | Translucent pearl (as in the reference). Pulses gently on pages 1–2 only; tapping it turns to the next page. Hidden on the cover and back cover |
| **Folio group** (page number with Previous / Next) | Bottom centre | "‹  — 7 —  ›": the page number in Cinzel 11 px, gold text colour, like a printed book folio, flanked by small gold chevrons with 44×44 px tap areas. Always visible (accessibility, §12.1). Hidden on the cover |
| **SKIP** | Top-right on the cover only | Skips the opening animation straight to page 1 |
| **Swipe hint** | Page 1, first visit only | The bottom-right corner lifts 24 px twice (a "page peek") with the caption "Swipe or tap › to turn the page", then never shows again (stored in `localStorage`) |

---

## 6. Section-by-section requirements

Each section is specified as **Purpose · Content · Visual design · Mobile · Desktop · Animation and interaction · Reduced motion · Data**. Exact layer stacks, positions, sizes and asset IDs (S-xx = SVG, D-xx = decorative PNG/WebP, P-xx = photograph) are in THEME.md §13. Mobile specs use a reference page of **390 × 844** CSS px, with a **compact variant** for pages shorter than 700 px (THEME.md §9.3). Desktop rows describe both options from §7. Under **Option B, every page is identical to mobile** inside the mockup, so the Desktop row mainly specifies Option A (Open Book spread).

### 6.1 Splash Screen: Royal Temple Invitation Opening (Cover)

| Aspect | Requirement |
|---|---|
| Purpose | A breathtaking, real-feeling invitation that the guest opens with a tap |
| Content | "Rahul & Divya" · "Tap to Open Our Invitation" · SKIP |
| Visual design | Elegant **ivory** background (`#FFF9EF`) with a faint handmade-paper texture and a watermark kolam (muggu) at 6% opacity. At the centre, a **royal silk-covered envelope** (ivory Venkatagiri-style silk with an antique-gold zari border, D-19), sealed with a gold R·D monogram seal (S-13 on D-19c). "Rahul & Divya" is set on the envelope front in Cormorant Garamond. Surrounding it: a delicate **jasmine flower arch** (D-01) across the top, slender **carved temple pillars** (D-09) standing fully visible at both edges, **antique brass kuthuvilakku lamps** (D-06) standing at the lower left and right with softly flickering flames, **small hanging temple bells** (D-08) beneath the arch, a fine **gold ornamental border** (S-03) inset 12 px from the page edge, and a soft ivory **silk drape** (D-15) falling behind the envelope. The "Tap to Open" button is a temple-maroon pill with an antique-gold hairline border |
| Mobile | Envelope width is 78% of the page, centred at 48% height. The envelope, pillars, arch, bells, lamps and button all sit **fully inside** the page: **nothing is cropped**. Button at 86% height, at least 48 px tall. On the compact variant (< 700 px) the envelope scales to 70% and the bells shorten |
| Desktop | **B:** identical inside the mockup. **A:** the closed book lies on a silk-draped table (THEME.md §14). The cover shows the same envelope composition at book-cover size, and "Tap / click to open" sits beneath the book |
| Animation | On tap, about 2.6 s total: **(1)** 0–400 ms: the envelope lifts towards the viewer (scale 1 → 1.06, shadow deepens), the bells sway once, lamp flames brighten 10%. **(2)** 400–1100 ms: the seal splits and the flap opens on a 3D hinge (rotateX 0 → −170°). **(3)** 700–2000 ms: 8–12 jasmine petals (D-31) drift down at varied speeds. **(4)** 1100–2200 ms: the card slides up out of the envelope and **unfolds** (two panels rotate open) to fill the page; the envelope and surrounding decorations fade and scale away. **(5)** 2200–2600 ms: the unfolded card *is* page 1 (Welcome), and its entry choreography begins. Music, if approved and enabled, starts softly on this tap. SKIP jumps directly to step 5 |
| Reduced motion | The tap triggers a 300 ms cross-fade from cover to page 1. No petals, no 3D |
| Data | `couple.groom.name`, `couple.bride.name`, `site.openLabel` |
| Notes | Preload page 1 and 2 assets while the cover is displayed. The cover must be interactive within 2.5 s on 4G (§12.2) |

### 6.2 Welcome Invitation (Page 1)

| Aspect | Requirement |
|---|---|
| Purpose | Formally invite the guest and present names, date, time and city at a glance |
| Content | "Together with our families" · "We joyfully invite you to celebrate the wedding of" · **Rahul & Divya** · "Wednesday, 7 April 2027" · "10:30 AM IST" · "Tirupati, Andhra Pradesh" · invitation message C-01 · optional Telugu title C-04 |
| Visual design | Jasmine-white page (`#FFFDF8`) with a temple-inspired backdrop: a soft, low-contrast carved stone arch (D-10) printed into the paper at 14% opacity. A **realistic jasmine garland swag** (D-01) drapes across the top with three jasmine strands (D-02) hanging at uneven lengths. In the centre, a **decorative antique-gold nameplate** (cartouche D-18 plus crisp vector edge S-08) holds the names. **Brass kuthuvilakku lamps** (D-06) stand at the lower corners, about 26% of page height. A small R·D monogram sits above the nameplate inside a single jasmine ring |
| Mobile | Monogram at 14% height. Small-caps lead lines at 22–28% (Cinzel 12–13 px, letter-spaced). Nameplate at 34–52% height, 84% wide. Gold divider line under the nameplate. Date, time and city at 58–68%. Message at 72–80%, 15–16 px Manrope. Lamps overlap the bottom corners but **never cover text** (text column max 72% width, centred). Compact variant hides the jasmine strands and moves the message into a single line |
| Desktop | **A:** left page of the first spread, facing Divine Blessings; the opening animation reveals this spread. **B:** identical to mobile |
| Animation | (0 ms) Garland and strands start a slow sway (±1.5°, 6 s loop, phase-offset). (150 ms) Lead lines fade up 8 px. (500 ms) The monogram's jasmine ring unfurls once (petals rotate open, 900 ms). (700 ms) Names reveal letter by letter with a soft opacity and blur-to-sharp mask (900 ms total). (1500 ms) A **gold ornamental line draws** outward from the centre beneath the names (S-04, 800 ms). (1700 ms) Lamps fade in from 0 to 100% with the flame flicker starting. (1900 ms) Date, time and city fade in, staggered 80 ms. Text stays crisp and readable throughout (no lingering blur) |
| Reduced motion | All elements appear at once with a 200 ms fade. No sway, no flicker |
| Data | `couple.*`, `wedding.dateDisplay`, `wedding.timeDisplay`, `wedding.city`, `copy.welcomeMessage`, `copy.teluguTitle` |

### 6.3 Divine Blessings (Page 2)

| Aspect | Requirement |
|---|---|
| Purpose | Offer a respectful sacred blessing before the details, inspired by Lord Venkateswara |
| Content | Invocation C-02 in Telugu and English · blessing message C-03 |
| Visual design | **Carved temple arch** (D-10) in warm sandstone, Dravidian style with a kalasam-topped crest, framing a pair of **carved temple doors** (D-11, maroon lacquer with brass studs and lion-face knockers, as in the reference). Jasmine and rose garlands hang on both door posts; brass lamps (D-06) flank the threshold; a mango-leaf toran (D-13) runs along the lintel. Behind the doors is a calm sacred composition: a softly misted **gopuram or vimana** silhouette (D-12) in ivory and sandalwood; in front of it, a refined gold emblem of the **Shankha (conch), Chakra (discus) and Srivari Namam** (S-12), the symbols associated with Lord Venkateswara. **No deity face or idol is depicted by default** (see Q-C1). The blessing text sits on an ivory scroll (D-20) at the bottom third |
| Mobile | Arch fills the full width, top 0–62% of the page. The doors occupy the arch opening. The emblem is centred at 36% height, 34% wide. The scroll is at 66–88% height, 86% wide, with invocation (Noto Serif Telugu 20 px), English line (Cinzel 12 px) and message (Cormorant 18 px italic) |
| Desktop | **A:** right page of the first spread, facing Welcome. The doors open once the spread is revealed. **B:** identical to mobile |
| Animation | (0 ms) Doors closed, garlands swaying. (200 ms) Doors swing **inward** (rotateY 0 → ±82°, hinged at the outer edges, perspective 900 px, 1400 ms, `--ease-temple`), revealing the composition. (600 ms) Soft natural light: a warm radial highlight (no beams) fades up behind the emblem to 35% over 1200 ms. (900–2400 ms) Gentle forward glide (scale 1 → 1.06 on the backdrop and 1 → 1.12 on the door layer; the door frames drift outward), echoing the reference's dolly. (1800 ms) Scroll unrolls (height mask 0 → 100%, 700 ms), then the text fades in line by line. Flowers sway ±1° throughout. **No supernatural light beams, sparkles or cartoon divinity** |
| Reduced motion | Doors shown already open, text visible. A 200 ms fade only |
| Data | `copy.invocationTe`, `copy.invocationEn`, `copy.blessing`, `site.showDeityImage` (default `false`) |

### 6.4 Save the Date (Page 3)

| Aspect | Requirement |
|---|---|
| Purpose | Make **7 April 2027** the unmistakable visual focus |
| Content | "Save the Date" · **07 \| APRIL \| 2027** · "Wednesday" · "Rahul & Divya" · "Muhurtham 10:30 AM IST" · Add to Calendar |
| Visual design | A **realistic premium calendar card** on ivory handmade paper (D-33) with deckled edges, a soft drop shadow and a double antique-gold foil border. **Jasmine clusters** (D-03) and **kolam corner motifs** (S-01) decorate all four corners. "Save the Date" is set in a script accent (Pinyon Script) with "the" in Cormorant italic. The date sits in **three gold-foil panels** (date, month, year, separated by fine gold rules) which begin covered in scratchable gold foil, adopting the reference's scratch card. Below them, a **mini April 2027 month grid** (Sunday–Saturday, starting Thursday 1 April) with **7** encircled by a tiny jasmine wreath. Then "Wednesday", the names, and the Add to Calendar button. The page behind the card is sandalwood (`#EAD8B7`) with a silk-texture wash, so the ivory card lifts off it |
| Mobile | Card is 88% wide and 78% tall, centred. Script title at 10–20% of the card. Scratch panels at 24–40% (three panels, each 26% of the card width, 1:1.1 ratio). Month grid at 46–70% (hidden on compact pages, replaced by a single line "Wednesday · 10:30 AM IST"). Names at 74%. Button at 84–92%, full card width minus 32 px |
| Desktop | **A:** spread with the Countdown page (left: Save the Date, right: Countdown). **B:** identical |
| Animation | (0 ms) Card settles from 6 px lower with a 400 ms ease. (300 ms) The script title draws as handwriting (S-14 stroke, 1100 ms). (900 ms) Scratch panels shimmer once (foil highlight sweep, 700 ms) with the caption "Scratch to reveal". **Scratch interaction:** the guest scratches with a finger or mouse; foil clears beneath the pointer (canvas `destination-out`, brush 28 px). Once 55% of a panel is clear, it auto-clears with a soft fade and a single jasmine petal falls. When all three are revealed, the jasmine wreath on the grid draws around "7" (600 ms). A **"Reveal date"** text button under the panels reveals all three at once (single-pointer alternative, §12.1). The date text is always present in the DOM for screen readers. On revisit, the panels stay revealed |
| Reduced motion | Panels appear already revealed. No shimmer, no handwriting animation |
| Data | `wedding.startISO`, `wedding.dateParts`, `calendar.*` |

#### 6.4.5 Add to Calendar (used here and on every event)

- Tapping **Add to Calendar** opens a bottom sheet with: **Google Calendar**, **Apple Calendar / iPhone (.ics)**, **Outlook (.ics)**, and **Copy details**.
- Start: `2027-04-07T10:30:00+05:30` (IST). Title: "Rahul & Divya — Wedding Ceremony (Muhurtham 10:30 AM IST)". Location: "Tirupati, Andhra Pradesh" until the venue is confirmed, then the venue name and address. Description includes the site link.
- **End time is never invented.** Default behaviour: the calendar entry is a **start-time-only (zero-duration) event**, which `.ics` and Google Calendar both accept, and the description reads "End time to be confirmed". If you approve a provisional duration (Q-B3), the data file holds `provisionalDurationMinutes` and the description reads "Provisional duration — final timing to be confirmed".
- `.ics` files use `TZID=Asia/Kolkata` with a VTIMEZONE block; Google links use UTC (`20270407T050000Z`) with `ctz=Asia/Kolkata`.

### 6.5 Wedding Countdown (Page 4)

| Aspect | Requirement |
|---|---|
| Purpose | Build anticipation with a live, beautiful countdown |
| Content | Heading "Counting Down to the Muhurtham" · Days · Hours · Minutes · Seconds · target "Wednesday, 7 April 2027 · 10:30 AM IST" · local-time line for guests outside IST (for example "That's 6:00 AM in your time zone, London") |
| Visual design | Four **carved ivory niche panels** shaped like temple mandapa niches (S-07 cusped arch), each with an antique-gold rim, a faint silk texture inside, and a tiny brass bell (D-08) hanging from the arch apex. Numbers in Cormorant Garamond lining figures, deep brown; labels in Cinzel small caps. **Not** digital-clock boxes. Small jasmine strands (D-02) hang between the panels; a kolam rosette (S-02) is printed into the ivory page beneath at 8% opacity; a gold divider runs above and below the panel row. A single brass kuthuvilakku (D-06) stands at the bottom centre, glowing |
| Mobile | Panels in **one row of four** (each about 21% of the page width, 1:1.45 ratio) centred at 44% height; on pages narrower than 340 px, a **2×2 grid**. Heading at 18%. Target line at 62%. Local-time line at 67% (only when the guest's offset differs from IST). Lamp at 74–92% |
| Desktop | **A:** right page of the Save the Date spread. **B:** identical |
| Animation | Numbers update each second with a **roll** (old digit slides up and fades, new digit rises from below, 350 ms), only for digits that change. Jasmine strands sway (±1.5°, 5–7 s, offset). The bells give a 1-swing nod when the minutes change. "Respond to scrolling" in Book Mode: while the page is being curled, the strands swing with the drag velocity (clamped to ±6°). Tapping a bell rings it (soft chime only if sound is on) |
| After target | From `2027-04-07T10:30:00+05:30`, the panels are replaced (cross-fade, 800 ms) by **"Our Auspicious Wedding Day Has Arrived!"** in Cormorant 34 px inside the gold frame, with a gentle single fall of 12 jasmine petals. From 8 April 2027 00:00 IST, an optional post-wedding message (Q-B6) |
| Reduced motion | Digits swap without rolling; no sway, no petals |
| Data | `wedding.startISO`, `copy.countdownArrived`, `copy.postWedding` |
| Technical | Computed from the absolute instant every second using the device clock against the fixed IST target (`Date.parse` of the ISO string), never from the guest's local midnight. The timer pauses when the page is hidden (Page Visibility API) and recomputes on return |

### 6.6 Meet the Couple (Pages 5 and 6)

| Aspect | Rahul (page 5) | Divya (page 6) |
|---|---|---|
| Content | Title "The Groom" + "Rahul" · portrait (P-01, to be provided) · biography (to be provided) · up to 6 memory polaroids (P-10) with captions (to be provided) | Title "The Bride" + "Divya" · portrait (P-02) · biography · up to 6 polaroids (P-11) |
| Visual design | Portrait in a **silk-inspired frame**: a maroon-and-gold Venkatagiri silk border (D-16) wrapped around a tall temple-arch opening (S-06), with **restrained temple-style ornaments** (gold filigree corners D-17, a small kalasam crest). Backdrop: ivory page with a carved stone pillar (D-09) on the left edge and a soft temple-courtyard wash. Memory polaroids (D-32 paper with washi tape) are tucked around the frame at ±4–8° | Portrait in a frame of ivory silk with gold zari (D-15/D-16), **decorated with jasmine** (D-03 clusters at the top corners and a jasmine strand down the right side). Pillar on the right edge. Polaroids tucked around the frame |
| Mobile | Title at 8–18% (Cinzel "THE GROOM" 12 px, then "Rahul" in Cormorant 44 px). Portrait frame 70% wide, 4:5, centred at 22–62%. Biography at 66–84% (max 4 lines, 15 px; if longer, a "Read more" link opens a bio sheet). Polaroids: three on each side in the margins, partly overlapping the frame edge by up to 12%, **never covering the face**. Compact variant: two polaroids per side | Mirror of page 5 |
| Desktop | **A:** pages 5 and 6 form one spread, Rahul on the left and Divya on the right: the balanced couple composition from the brief. **B:** identical to mobile | Same spread |
| Animation | Portrait **enters from the left**: translateX −14% → 0, rotate −2° → 0, opacity 0 → 1, 900 ms `--ease-silk`. **The frame never leaves the viewport** (max offset 14% of page width). Then polaroids pop in one by one from behind the frame (scale 0.85 → 1, rotation settles to its resting tilt, 90 ms stagger), echoing the reference. Bio fades up | Portrait **enters from the right**: translateX +14% → 0, rotate +2° → 0. Then as for Rahul |
| Reduced motion | Static, final positions | Same |
| Data | `couple.groom.{name, portrait, bio, memories[]}` | `couple.bride.{…}` |

### 6.7 Parents and Family (Page 7)

| Aspect | Requirement |
|---|---|
| Purpose | Honour both families in the traditional manner and open detailed family trees |
| Content | "With the blessings of our beloved parents" · "Rahul, son of [Father] & [Mother]" · "&" · "Divya, daughter of [Father] & [Mother]" (all names to be provided) · buttons **View Groom's Family Tree** and **View Bride's Family Tree** |
| Visual design | Adopted from the reference: a central **antique-gold arched nameplate** (S-06 arch with raster foil D-18) on ivory, garlanded with jasmine and roses along its curve, with a small brass lamp at each foot. Inside, the names are set as in a Telugu Subhalekha (honorifics such as *Sri* / *Smt.* and *Chi.* / *Chi. La. Sow.* only if approved, M-07). Below the arch, **two family portrait frames** (oval, carved antique-gold borders S-09 with jasmine sprigs) labelled "Groom's Family" and "Bride's Family", photo placeholders until P-08 and P-09 arrive, over a subtle ivory silk background (D-15) |
| Mobile | Arch at 6–60% height, 86% wide. Text inside: lead line Cormorant italic 17 px; names Cormorant 26 px; "son of / daughter of" Manrope 13 px; parents Cormorant 18 px. Family frames side by side at 62–84% (each 40% wide, 4:5 oval). Tree buttons under each frame (outline gold pill, 44 px tall) |
| Desktop | **A:** spread with Our Love Story (left: Family, right: Love Story). **B:** identical |
| Animation | Arch fades and rises (600 ms). Text **writes in line by line** (each line revealed by a left-to-right soft mask, 500 ms per line, 150 ms gap), as in the reference. Frames fade in with a gentle scale from 0.96. Two jasmine petals drift |
| **Family tree overlay** | Full-screen dialog **above the entire site** (mounted at the app root, never inside the page), ivory background with a silk texture, independent vertical scroll, **visible close button** (44×44 px, top-right, maroon on ivory, plus Esc, browser Back and a swipe-down gesture). Layout: a vertical flowering branch (S-path) from bottom to top with medallion nodes: **Parents** (couple-pair medallion), **Grandparents** (paternal and maternal pairs), **Siblings** (with spouses if supplied), **Other relatives** (grouped). Each node has a circular photo (optional) or monogram, name and relation label. Missing nodes: preview mode shows a placeholder node; production hides the node entirely |
| Overlay animation | **Flowering-branch reveal:** the branch stroke draws upward (DrawSVG, 1200 ms); each node "blossoms" as the branch reaches it (jasmine bud scales 0 → 1 and opens into the medallion, 400 ms, 120 ms stagger); leaves unfurl along the branch |
| Reduced motion | Arch text and tree appear fully drawn. The overlay opens with a 200 ms fade |
| Data | `family.groom.{father, mother, grandparents[], siblings[], others[], photo}`, `family.bride.{…}` |

### 6.8 Our Love Story (Page 8)

| Aspect | Requirement |
|---|---|
| Purpose | Tell the couple's story through photographs in a romantic, interactive gallery |
| Content | Title "Our Love Story" · five milestones (proposed headings C-06, text to be provided) · photos P-03 to P-07 |
| Visual design | A **3D circular photo gallery**: five photo cards arranged on an invisible ring that recedes into the page. Each card is a realistic photo print with a thin ivory border and gold corner mounts. The front card is largest and fully sharp; side cards are smaller, rotated away and slightly dimmed (never heavily blurred). Beneath the ring, a jasmine garland arc (D-01) and a caption plate (ivory card with a gold rule) shows the milestone title (Cinzel 13 px) and a 1–2 line story (Cormorant italic 17 px). The page background is ivory with a faint silk sheen and a kolam watermark |
| Mobile | Title at 8%. Ring centred at 40% height; front card 62% of page width, 4:5. Two cards visible on each side, partially. Caption plate at 70–84%. Pagination dots (five tiny jasmine buds) at 88%. The ring area is a **dedicated horizontal-swipe zone** (§8.4) |
| Desktop | **A:** right page of the Family spread. Mouse drag, arrow buttons and keyboard arrows rotate the ring. **B:** identical |
| Animation | Swipe or drag rotates the ring: the current card moves back and to the side while the next one comes forward (rotateY around the ring centre, translateZ, 700 ms `--ease-silk`). Velocity-aware snapping to the nearest card. Optional slow auto-advance every 6 s, paused permanently after the first interaction and whenever the page is not visible. The caption cross-fades (300 ms). **No continuous spinning, no fast rotation** (max one card per gesture unless flicked hard, capped at two) |
| Reduced motion | Flat horizontal slider with a 200 ms cross-fade between cards; no auto-advance |
| Data | `loveStory[] = {title, text, photo, alt, date?}`; the title is labelled "proposed" in preview until confirmed |

### 6.9 Wedding Events Timeline (Pages 9 and 10)

| Aspect | Requirement |
|---|---|
| Purpose | Present all five celebrations in order, each with full details and actions |
| Layout concept | Adapted from the reference's jasmine-wreath medallions: each event is a **circular wreath medallion** (fresh jasmine and rose wreath, D-04, about 132 px) containing the event emblem (S-11), with a **realistic still-life** tucked at the medallion's edge. Beside it, a **detail plate** (ivory card with gold border) with name, date, time, "Proposed" badge where applicable, venue, and two icon buttons: **Location** (map-pin icon) and **Calendar** (calendar icon). Medallions alternate left and right down the page (zigzag), connected by an **ornamental golden thread** (S-05) with small brass bells at the joins. Page 9 has a "Wedding Celebrations" signboard header (carved wooden board with gold lettering and marigold swags, as in the reference). Page 10 ends with the thread tied in a sacred knot (a *mangalyam* knot motif) |
| Page 9 | Mehndi, Haldi, Sangeet |
| Page 10 | Wedding Ceremony, Grand Reception, plus a small summary line: "All times IST · Proposed timings will be confirmed" |
| Event 1: Mehndi | Proposed **Monday, 5 April 2027 · 4:00 PM** · Bride's family home · address to be provided. Still-life: **mehndi bowl and henna cones** (D-23), **delicate henna pattern** inside the medallion background (S-18), **jasmine**, a fold of **silk** (D-16), **small antique brass** bowl |
| Event 2: Haldi | Proposed **Tuesday, 6 April 2027 · 9:00 AM** · Groom's family home · address to be provided. Still-life: **realistic turmeric bowls** with raw turmeric (D-24), a **brass vessel** (D-25), **yellow marigolds** (D-05), on a **banana leaf** (D-14) |
| Event 3: Sangeet Night | Proposed **Tuesday, 6 April 2027 · 6:30 PM** · Shared function hall · address to be provided. Still-life: **veena and mridangam** (D-26); an **elegant dancing-couple line illustration** in Srikalahasti-Kalamkari-inspired pen work (S-19, refined, not cartoon); **maroon-and-gold stage drape** accent; **decorative hanging lamps** (D-29) above the medallion |
| Event 4: Wedding Ceremony | **Wednesday, 7 April 2027 · 10:30 AM (Muhurtham) · confirmed** · venue in Tirupati to be confirmed. Still-life: miniature **mandapam** (D-21 crop), **jasmine canopy** strands, **brass lamps**, the **sacred thali** on a brass plate (D-22), traditional ornaments. This medallion is 15% larger than the others and has a maroon inner ring |
| Event 5: Grand Reception | Proposed **Wednesday, 7 April 2027 · 6:30 PM** · same function hall as Sangeet. Still-life: **royal reception stage** vignette (D-27 crop), **white jasmine arrangements**, **antique-gold** accents, **ivory backdrop** |
| Mobile | Page 9: signboard at 4–16%, three event rows at 20–44%, 46–70%, 72–94%. Each row is 100% wide: medallion 34% wide on one side, detail plate 60% on the other, alternating. Page 10: two rows plus the knot and summary. **Compact variant (< 700 px):** medallions shrink to 96 px, the still-life becomes a smaller crop, and the venue line truncates with the full text in the event sheet. Tapping a detail plate opens an **event sheet** (bottom sheet) with all details, dress code, map and calendar |
| Desktop | **A:** pages 9 and 10 form one spread, so the thread runs continuously across the spine. **B:** identical |
| Animation | When the page is uncovered, the **golden thread draws** down the page (DrawSVG, synchronised so that it reaches each medallion as that event appears). Each event appears progressively: medallion wreath blooms (scale 0.9 → 1, petals open, 500 ms), still-life slides in from its edge 12 px (400 ms), detail plate fades in (300 ms), bells at the join nod once. Stagger about 450 ms per event. **Turning backwards** from page 10 to page 9 shows page 9 completed; turning back from page 9 into page 8 retracts the thread with a 400 ms reverse before the curl completes. Ambient: marigold swags sway subtly |
| Location button | **Disabled** (muted gold, with the tooltip or sheet text "Location will be shared soon") until `venue.mapsUrl` or coordinates exist. When enabled: opens Google Maps directions in a new tab (`https://www.google.com/maps/dir/?api=1&destination=…`) |
| Calendar button | See §6.9.6 |
| Reduced motion | Thread and all events shown in their final state |
| Data | `events[] = {id, name, startISO, timeStatus, venueId, dressCodeId, emblem, stillLife}`; venue fields come from `venues[]` |

#### 6.9.6 Calendar rule for proposed events

**Default (recommended, Q-B2):** while an event's `timeStatus` is `"proposed"`, its calendar button is disabled and reads "Calendar opens once timing is confirmed". **Alternative, if you prefer:** the button opens the sheet with the message "Timing is proposed and may change. Add anyway?" and adds the event with "(Proposed)" in the title. The wedding ceremony (confirmed) is always available.

### 6.10 Wedding Ceremony (Page 11)

| Aspect | Requirement |
|---|---|
| Purpose | A dedicated, reverent highlight of the sacred ceremony |
| Content | "The Sacred Wedding Ceremony" · **Rahul & Divya** · "Wednesday, 7 April 2027" · "Muhurtham: 10:30 AM IST" · "Tirupati, Andhra Pradesh" · venue line (when confirmed) · optional "Moments of the Muhurtham" strip (Q-C3) |
| Visual design | A **realistic South Indian wedding mandapam** (D-21) built from layers: a carved stone base platform with a kolam drawn in rice flour in front (S-02 rendered with a chalk texture); **four temple-inspired carved pillars**, the front two wrapped with **banana plants** (D-14) and jasmine garlands; a **jasmine flower canopy** of hanging strands (D-02) with a central marigold and jasmine chandelier; a **mango-leaf toran** (D-13) across the front beam; ivory and maroon **silk** drapes (D-15) gathered at the pillars; **brass kuthuvilakku lamps** at both front corners; a kalasam (D-25) at centre front. The **text plaque** sits inside the mandapam on an ivory card with a gold border, so the mandapam frames the words. The sacred thali on a brass plate (D-22) rests on the platform below the plaque |
| Mobile | Mandapam spans 100% of the width, top 6% to bottom 88%. Text plaque centred at 34–60% (78% wide). Thali plate at 66–74%. Kolam at 80–92%. Lamps at the corners, never overlapping the plaque |
| Desktop | **A:** spread with Grand Reception (left: Ceremony, right: Reception), a day-and-night pairing. **B:** identical |
| Animation | The mandapam **appears gracefully**: base and kolam fade (0–400 ms); pillars rise 24 px with a fade, staggered from the back pair to the front pair (300–1100 ms); the canopy strands lower from the top like a curtain of jasmine (800–1600 ms, each strand with a slightly different delay); toran and drapes settle (1200–1700 ms); plaque text fades in (1600–2200 ms); then garlands **gently sway** (±1.2°, 7 s). Lamp flames flicker subtly. **No sparkles or glow bursts** |
| Reduced motion | Final composition shown, no sway |
| Data | `events.wedding`, `venues.ceremony`, `ceremonyMoments[]` (optional) |

### 6.11 Grand Reception (Page 12)

| Aspect | Requirement |
|---|---|
| Purpose | A visually rich, celebratory reception invitation |
| Content | "Grand Wedding Reception" · **Rahul & Divya** · "Proposed date: Wednesday, 7 April 2027" · "Proposed time: 6:30 PM IST" · "Venue: Same function hall as Sangeet" (name when supplied) |
| Visual design | A **premium ivory and antique-gold reception stage** (D-27): a carved gold-framed ivory backdrop panel with white jasmine and white rose arrangements cascading from the top corners, a low stage step with an ivory carpet, two tall floral urns. **Realistic hanging lights** (D-29), warm-white strands and small crystal pendants, hang from the top at varied lengths. **Ivory silk curtains** with gold tassels (D-28) frame both sides (ivory, not dark maroon, keeping the page light). The reception card (ivory with a double gold border, maroon names) stands centre-stage. This is the "evening" page: the paper tone is slightly warmer (sandalwood gradient at the top) and the light is warm |
| Mobile | Curtains cover the outer 18% on each side when open (100% when closed). Lights at 0–26%. Card centred at 32–68%, 74% wide. Floral urns at the bottom corners 70–94% |
| Desktop | **A:** right page of the Ceremony spread. **B:** identical |
| Animation | (0 ms) Curtains closed over the stage. (200 ms) **Curtains gently part** (each side translates and gathers, scaleX 1 → 0.36 with the fold texture compressing, 1300 ms `--ease-silk`) and the tassels swing. (900 ms) **Soft lights appear** strand by strand (opacity 0 → 1 with a subtle warm bloom on each bulb, 60 ms stagger; no flashing). (1500 ms) The card **fades in** and rises 8 px; text lines stagger. Ambient: slow, faint twinkle on 20% of the bulbs (opacity 0.85 ↔ 1, 3–5 s random) |
| Reduced motion | Curtains open, lights on, card visible |
| Data | `events.reception`, `venues.functionHall` |

### 6.12 Dress Code (Page 13)

| Aspect | Requirement |
|---|---|
| Purpose | Suggest attire for each event in an elegant, swipeable format |
| Content | Title "Dress Code" · subtitle "Suggestions to celebrate in colour" · five cards. **Mehndi:** colourful festive ethnic wear. **Haldi:** yellow or ivory traditional clothing. **Sangeet:** elegant festive attire. **Wedding:** traditional South Indian silk sarees, veshti (pancha), kurta or ethnic formal wear. **Reception:** elegant traditional or formal clothing. Each card is labelled **"Suggested"** |
| Visual design | A **fanned deck of five cards**, like a hand of invitation cards. Each card is ivory with a **silk texture band** at the top in the event's suggested colour story (Mehndi: green and pink; Haldi: turmeric and ivory; Sangeet: jewel tones; Wedding: maroon and gold Kanchipuram/Venkatagiri silk; Reception: ivory and gold), an **elegant attire illustration** (S-20, fine fashion-sketch line with a light watercolour wash, one women's and one men's figure, not cartoon), three **colour swatches** shaped like small silk folds, the event name (Cinzel), the suggestion (Cormorant 18 px), and a tiny emblem (S-11) |
| Mobile | Title at 8–16%. Deck centred at 22–84%; the front card is 76% wide, 3:4.4; the next two cards peek behind, rotated ±6°. The deck is a **horizontal-swipe zone**. Dots at 88% |
| Desktop | **A:** spread with Venues (left: Dress Code, right: Venues). Arrow buttons beside the deck. **B:** identical |
| Animation | Entry: cards deal in from a stack (each slides out 30 px and rotates into the fan, 120 ms stagger). Swipe: the front card slides off to the side with a slight rotation and tucks to the back of the deck; the next card rises (450 ms). Tapping a card flips it (rotateY 180°, 600 ms) to show "Colours to avoid", if provided, or a fabric note |
| Reduced motion | Simple slider with cross-fade; no flip (the back content is shown below) |
| Data | `dressCode[] = {eventId, suggestion, palette[], illustration, note?}` |

### 6.13 Venues and Directions (Page 14)

| Aspect | Requirement |
|---|---|
| Purpose | Show every location with photo, address, events and directions |
| Content | Four venues: **Wedding ceremony venue** (to be confirmed) · **Sangeet & Reception function hall** · **Bride's family home** (Mehndi) · **Groom's family home** (Haldi). Each shows venue name, address, venue photograph, Google Maps directions and related events |
| Visual design | Adopted from the reference: an **arched venue card** with jasmine and marigold garlands at the top and carved pillars at the sides; "Venues" title in the arch; **venue tabs** (four chips: "Wedding", "Sangeet & Reception", "Mehndi", "Haldi") beneath the title; the **venue photograph in a gold frame** (P-12 to P-15; a private home may use an illustrated doorway card instead, see Q-D3); below it, an **illustrated map card** (a commissioned stylised map of the area with a maroon pin, created after the venue is confirmed; until then a tasteful kolam-pattern placeholder with a map-pin emblem); then the address, event chips ("Mehndi · Mon 5 Apr"), and a **Get Directions** button |
| Mobile | Title at 6–12%; tabs at 14–19% (horizontally scrollable if they overflow, which is a dedicated swipe zone); photo at 22–48% (16:10, 84% wide); map card at 50–70%; address and events at 72–82%; button at 85–92% |
| Desktop | **A:** right page of the Dress Code spread. **B:** identical |
| Animation | Entry: the arch garlands sway in; the photo frame settles (scale 0.97 → 1); the map pin drops with a small, soft bounce (one bounce only, 500 ms). Switching tabs cross-fades the photo and map (350 ms) and re-drops the pin |
| Placeholders | **No venue names, addresses or map links are invented.** Until supplied: preview shows placeholders; production shows "Venue details will be shared soon" and a disabled directions button |
| Data | `venues[] = {id, label, name, address, mapsUrl, lat, lng, photo, mapIllustration, events[], privacy: "public" | "onRequest"}` |

### 6.14 Transportation and Accommodation (Page 15)

| Aspect | Requirement |
|---|---|
| Purpose | Help guests plan their travel to Tirupati with clear, verified information |
| Content | Six tiles plus a help ribbon. **Airport:** Tirupati International Airport (TIR), at Renigunta, about 15 km from Tirupati city; Chennai International Airport is roughly 140 km away by road (general information, to be verified before launch). **Railway:** Tirupati Main (TPTY) and Renigunta Junction (RU) (to be verified). **Travel guidance:** April in Tirupati is typically hot, so suggest light cotton clothing and staying hydrated; add Tirumala hill-road and visitor guidance only if the venue is in Tirumala, after verification. **Parking:** to be announced. **Accommodation:** suggestions to be provided (none invented). **Pickup & shuttle:** to be announced. **Guest assistance:** contact to be provided |
| Visual design | A **traditional ivory travel information board** (D-36): a carved, gold-edged ivory board with **floral corners** (jasmine and marigold clusters, D-03/D-05) and a small mango-leaf toran across the top. Six **tiles** in a 2×3 grid, each with a gold line icon (S-10: plane, train, compass, parking, hotel, shuttle), a label and a one-line summary. A maroon ribbon across the bottom reads "Need travel help?" with a WhatsApp/Call action (enabled once M-22 is provided) |
| Mobile | Board 92% wide, 6–90% height. Tiles each about 44% wide, 18% tall. Tapping a tile opens a **detail sheet** (bottom sheet, max 85% height, independent scroll, close button) with full text. Information stays easy to read: Manrope 15 px, line-height 1.55 |
| Desktop | **A:** spread with the Wishing Wall (left: Travel, right: Wishing Wall). **B:** identical |
| Animation | Board fades in; tiles appear in reading order (60 ms stagger, 8 px rise); the corner florals sway gently. No other motion, for readability |
| Data | `travel.{airport, railway, guidance, parking, accommodation[], shuttle, assistanceContactId}` with `status` per item ("verified", "toBeConfirmed") |

### 6.15 Wishing Wall (Page 16)

| Aspect | Requirement |
|---|---|
| Purpose | Let guests leave blessings and read approved blessings |
| Content | Heading **"Blessings for Rahul & Divya"** · up to five recent approved wishes on hanging cards · **Write a Blessing** button · **View All Wishes** button |
| Visual design | **Hanging ivory blessing cards** (D-35), each with an antique-gold border and hung by a gold thread from a horizontal brass rod garlanded with **jasmine** (D-01), with tiny brass bells (D-08) between cards. Cards hang at different heights and tilt slightly, like prayer cards. Each shows the wish (Cormorant italic 16 px, max 4 lines, ellipsis) and the guest's name (Cinzel 11 px). Traditional ornaments: kolam corners (S-01) on the page and a small brass lamp at the bottom centre. **Empty state:** a single card reading "Be the first to bless the couple" |
| Mobile | Heading at 6–14%. Rod at 18%. Five cards in a staggered two-column arrangement at 20–74%. Buttons at 80–92%: Write a Blessing (primary, maroon) and View All Wishes (outline gold) |
| Desktop | **A:** right page of the Travel spread. **B:** identical |
| Animation | Cards drop on their threads one by one (translateY −20 px → 0 with a small pendulum settle, ±3° damped over 1.2 s). Ambient: the cards sway very gently (±1°). A newly approved wish (on next load) appears first |
| **Write a Blessing (composer)** | Full-screen overlay styled as a single large blessing card: Name (required, 2–60 characters), Blessing (required, 5–500 characters, live counter), hidden honeypot field, invisible bot check (§13.5). **Submit → loading state** ("Sending your blessing…" with a petal spinner) → **success only after the server confirms storage**: "Thank you! Your blessing has been received and will appear on the wall once the family has seen it." (accurate because wishes are moderated). **Error state:** "We couldn't save your blessing. Please check your connection and try again." with **Retry**; the text the guest typed is preserved (also in `localStorage` as a draft) |
| **View All Wishes overlay** | **Appears above the entire page** (root-mounted dialog), ivory background, **scrolls independently** (body scroll locked, book gestures disabled), **visible close button** (top-right, 44×44 px) plus Esc, Back and swipe-down. Approved wishes in a masonry of cards, newest first, loaded 20 at a time with "Load more". Count shown ("128 blessings") |
| Reduced motion | No drop or sway; overlays fade in 200 ms |
| Data | API: `GET /wishes?status=approved`, `POST /wishes` (§13) |

### 6.16 RSVP (Page 17)

| Aspect | Requirement |
|---|---|
| Purpose | Collect accurate attendance with a delightful, trustworthy form |
| Content | Title "Kindly Respond" · "by [RSVP deadline]" (when provided) · fields below · **Confirm RSVP** |
| Visual design | A **realistic traditional South Indian invitation card** (D-33 handmade ivory paper, deckled edges), with an **antique-gold border** (double rule with corner filigree S-01), **jasmine decorations** (D-03) at the top corners, and **small traditional ornamental details** (a gold kalasam emblem at the top centre, a paisley/mango zari motif S-15 along the bottom edge). Inputs look like fine ruled lines on the card (underline style), with Cinzel labels. The card rests on a sandalwood silk background |
| Fields | **Guest name** (required, 2–80 characters) · **Attendance response** (required: "Joyfully accept" / "Regretfully decline", shown as two large selectable cards) · **Number of attendees** (required if accepting, stepper 1 to `rsvp.maxAttendees`, default 1) · **Events attending** (required if accepting, at least one; five checkbox chips with dates; the wedding is preselected) · **Dietary preferences** (optional: Vegetarian, Jain, No onion & garlic, Allergies with a text field; see Q-E4) · **Personal message** (optional, max 500) · consent line "Your response is shared only with the families" with a link to the privacy note |
| Mobile | The page shows the card at 88% width with Step 1 visible (name, attendance, attendees). **Focus mode:** tapping any field (or "Respond now") lifts the card into a **full-screen focus mode** (card scales up to fill the screen, 400 ms) where the form scrolls normally, the keyboard never hides the active field (`scrollIntoView` with the visual viewport), and **book gestures are disabled** until the guest closes focus mode or submits. Step 2 (events, dietary, message) follows within focus mode. The Confirm RSVP button is full width, 52 px tall, temple maroon with an antique-gold border |
| Desktop | **A:** spread with Need Help (left: RSVP, right: Contact). Focus mode becomes a centred card modal 520 px wide. **B:** identical to mobile, inside the mockup |
| States | **Idle** → **Validating** (inline errors under fields, in maroon, with an icon; the first error receives focus) → **Submitting** (button shows "Sending…" with a petal spinner, form disabled, duplicate submits prevented) → **Success**, shown **only on a 2xx response containing a stored record ID**: the card flips (600 ms) to a thank-you face: "Thank you, [Name]! Your RSVP is confirmed" with the summary of their choices, a gentle fall of 8 jasmine petals, and "Edit my response" (uses the edit token, §13.4) → **Error**: "We couldn't save your RSVP. Your details are still here. Please try again." with Retry; inputs preserved. **Offline:** detected before submit, with the message "You appear to be offline" |
| Animation | Entry: the card slides up 10 px and settles; the jasmine at the corners sways. Attendance cards gently press on selection. Success flip as above |
| Reduced motion | No flip (instant swap to the success face), no petals |
| Data | `rsvp.{deadline, maxAttendees, dietaryOptions[]}` · API `POST /rsvp`, `PATCH /rsvp/:id` (§13) |

### 6.17 Need Help / Contact (Page 18)

| Aspect | Requirement |
|---|---|
| Purpose | Let guests reach the right person instantly |
| Content | Three cards: **Groom's family representative**, **Bride's family representative**, **Wedding event coordinator**. Names and numbers: **to be provided** (M-19 to M-21). **No numbers are invented** |
| Visual design | Three **ivory visiting cards** with gilt edges, stacked with slight offsets on a sandalwood silk background, each with a small emblem (lotus for the groom's side, jasmine for the bride's side, a bell for the coordinator), role in Cinzel, name in Cormorant, and three compact actions: **Call** (`tel:`), **WhatsApp** (`https://wa.me/<number>?text=…` with a pre-filled "Namaste! I have a question about Rahul & Divya's wedding."), **Details** |
| Mobile | Title at 8%; cards at 18–40%, 42–64%, 66–88% (each 88% wide, compact 120 px tall). Actions are 44 px icon-and-label buttons. **Contact popup** (Details) is a bottom sheet that **fits within the screen** (max 80% height), shows name, role, phone, WhatsApp, languages spoken (if supplied) and a "Copy number" action, with a **visible close button** |
| Desktop | **A:** right page of the RSVP spread. **B:** identical. On desktop `tel:` still works (it opens a calling app if present); the number is also shown in the sheet |
| Animation | Cards fan in from a stack (100 ms stagger). Buttons give a subtle press response |
| Disabled state | Without a number, Call and WhatsApp are disabled with the label "Number coming soon" |
| Data | `contacts[] = {id, role, name, phone, whatsapp, languages[]}` |

### 6.18 Thank You (Page 19, back cover)

| Aspect | Requirement |
|---|---|
| Purpose | A peaceful, grateful closing and an easy way back |
| Content | **"Thank You for Blessing Our Journey"** · **Rahul & Divya** · **"With Love and Blessings"** · closing line C-05 · **Return to First Page** · **Share Invitation** |
| Visual design | A **peaceful temple-inspired backdrop** in the golden-hour mood of the reference's last page, rendered in our palette: a soft ivory-and-sandalwood sky, a distant gopuram silhouette (D-12) in warm haze, a calm temple tank or courtyard foreground with lamps reflected. Decorated with **jasmine** garlands at the top corners, **brass lamps** (D-06) at the bottom corners with steady glow, **antique-gold ornaments** (S-03 border, S-04 divider) and **soft ivory silk** (D-15) drape at the top. Text sits on a translucent ivory veil (85% opacity) for legibility |
| Mobile | Veil card centred at 24–66%. Handwriting message 2 lines, about 40 px Pinyon Script. Names in Cormorant 30 px. Sign-off in Cinzel 12 px. Buttons at 76–90%: Return to First Page (outline gold) and Share Invitation (maroon) |
| Desktop | **A:** left page of the final spread, facing a silk endpaper with the R·D monogram; "Return" riffles back to the first spread. **B:** identical |
| Animation | The message is **handwritten** by stroke-drawing the script paths (S-14, DrawSVG, 2400 ms). The real text is in the DOM with `aria-label`, and if the SVG fails the static text shows (fallback). The names fade in, then the sign-off. Lamps glow steadily with a slow breathing glow (8 s). **Return to First Page** performs a quick **riffle** (pages flick back in about 900 ms in total) to page 1, not to the cover. **Share** uses the Web Share API, falling back to a sheet with WhatsApp share and Copy link |
| Reduced motion | Static text; Return jumps to page 1 with a fade |
| Data | `copy.thankYou*`, `site.shareText`, `site.url` |

---

## 7. Desktop presentation options

Both options are fully specified. **Neither will be built until you choose (Q-A3).**

### 7.1 Option A: Open Book spread (the responsive full-width website, redefined for the book)

- At ≥ 1024 px wide **and** landscape, the invitation becomes a **real open book lying on a silk-draped table** in a softly lit temple-inspired room (THEME.md §14.2). The book scales to `min(92vh, 0.5 × 92vw × 16/9)` page height, so each page keeps the same portrait proportion as the mobile page.
- **Two facing pages** are visible. Pages turn along the central **spine** with the same curl engine (dragging either outer corner, clicking the page edges, arrow keys, the mouse wheel with one turn per gesture).
- Spreads: Cover alone → (1 | 2) → (3 | 4) → … → (17 | 18) → (19 | silk endpaper) → back cover. The opening animation reveals the first spread directly. The page order in §5 was chosen so that related pages face each other: Welcome with Blessings, Save the Date with Countdown, Rahul with Divya, Family with Love Story, Events I with Events II, Ceremony with Reception, Dress Code with Venues, Travel with Wishing Wall, RSVP with Contact.
- Generous space around the book: names and date appear subtly embossed on the table runner below the book, and the Contents button and music toggle sit at the screen corners.
- Overlays (family tree, wishes, RSVP focus) open as **centred dialogs** over the whole browser window, never clipped by a page.
- **Pros:** the most literal and luxurious "book"; spectacular on large screens. **Cons:** more engineering (spread pagination, two pages animating at once, odd/even balancing), more QA, and wider assets for the room backdrop.

### 7.2 Option B: Premium mobile mockup presentation

- At ≥ 1024 px, the **entire mobile invitation runs inside one centred iPhone-style mockup** (D-40, a refined frame, not a brand replica), scaled to 88% of the viewport height (max 932 px tall at 1×).
- **All 19 pages and the cover turn inside this same mockup.** There are never separate mockups per section.
- Outside the mockup, a **consistent, still, temple-inspired desktop background** (D-41): ivory and sandalwood carved pillars at both edges, a soft-focus gopuram in the distance, jasmine garlands at the top corners, brass lamps at the bottom corners, a kolam watermark, and an optional extremely slow 40 s parallax drift (disabled under reduced motion). The background never changes between pages.
- Left of the mockup: "Rahul & Divya · Wednesday, 7 April 2027 · Tirupati" in elegant type. Right of the mockup: a QR code with "Open on your phone" (encodes the site URL).
- Overlays cover the **entire mockup screen** (which is the website's viewport), exactly as on a phone.
- Keyboard, mouse-wheel and click-to-turn work inside the mockup.
- **Pros:** pixel-identical to the art-directed mobile pages; lowest risk; one set of compositions; matches the phone-first reference. **Cons:** less use of large screens.

### 7.3 Recommendation: Option B

Most guests will open the invitation from WhatsApp on a phone, and every page composition (like the reference) is art-directed for a portrait screen. Option B shows desktop guests exactly that crafted experience, inside a beautiful, consistent temple setting, with a fraction of the risk and QA effort. **Option A (Open Book)** is recommended as an optional enhancement in Phase 6 if time and budget allow, because the pages are built with container-relative units (§14.1) and can later sit in a spread without redesign.

**Tablets (768–1023 px):** portrait shows a single page at full height, centred on the desktop background without a mockup. Landscape follows the chosen desktop option.

---

## 8. Global animation and interaction behaviour

### 8.1 Page-turn engine

| # | Spec |
|---|---|
| 8.1.1 | **Visual:** a flat-paper **diagonal page-curl**, as in the reference. The page folds along a line perpendicular to the drag direction; the curling flap shows the **parchment back** (`--paper-back #F3E7CF` with handmade-paper texture and a faint mirrored kolam watermark at 5%); the page underneath receives a soft gradient shadow along the fold (0 → 22% deep brown); the flap edge gets a 1 px highlight and a soft fold shading (THEME.md §11) |
| 8.1.2 | **Triggers, forward:** swipe up or swipe left anywhere outside interactive zones; drag from the bottom-right corner (the curl follows the finger); tap the pearl handle or the Next chevron; keyboard → / PageDown / Space; one mouse-wheel or trackpad gesture (debounced, 1 turn per 700 ms) |
| 8.1.3 | **Triggers, backward:** swipe down or swipe right; drag from the bottom-left corner; Previous chevron; keyboard ← / PageUp / Shift+Space; wheel up |
| 8.1.4 | **Physics:** the drag follows the pointer 1:1. On release, the turn completes if it has travelled more than 30% of the page width **or** the release velocity is above 0.45 px/ms; otherwise the page springs back (350 ms, `--ease-silk`). An auto turn (tap or keyboard) takes **850 ms** (`--ease-page`) |
| 8.1.5 | **Timing:** the next page's ambient decorations are already present while it is being uncovered (as in the reference). Its entry choreography starts when the turn reaches 85% |
| 8.1.6 | **Lock:** no new turn starts until the current turn completes (input queued at most 1 deep) |
| 8.1.7 | **Sound and haptics (optional):** a soft paper-turn sound (A-02, −18 dB) only when sound is on; `navigator.vibrate(8)` on turn completion on Android only, when supported |
| 8.1.8 | **Alternate transition:** a **parchment bloom** (the page fades to blank parchment for 300 ms, then the next page's art blooms from the paper over 700 ms), as seen in the reference at 1:25. Used when jumping between distant pages from the Contents menu (instead of riffling more than 3 pages) and for the reduced-motion "fade" variant |
| 8.1.9 | **Fallback:** if the curl engine fails to initialise or the device fails a quick capability check (no `transform-style: preserve-3d`, or very low memory), the book uses the parchment-bloom transition; if JavaScript fails entirely, the HTML remains a continuous scroll (§2.4) |
| 8.1.10 | **Performance:** transforms and opacity only; each page is a compositor layer only while turning; pages more than 2 away from the current page are `content-visibility: hidden` and their media paused |

### 8.2 Page-entry choreography standard

Every page follows the same rhythm so the book feels coherent:

1. **0 ms**, decorations (frames, pillars, garlands, lamps) are already in place as the page is uncovered.
2. **~150 ms**, heading enters: handwriting draw for script headings, a soft fade-up (8 px, 600 ms) for Cinzel or Cormorant headings.
3. **~400 ms**, hero object makes its signature move (doors, mandapam, curtains, card, carousel).
4. **+80 ms stagger**, supporting text and buttons fade up.
5. **After settle**, ambient loops start (sway, flicker, twinkle).

Total entry ≤ 2.4 s per page (the splash ≤ 2.8 s). Buttons are **tappable from 0 ms** even while animating. **Revisits** show the completed state immediately (ambient loops only), except the countdown, which is always live.

### 8.3 Ambient motion rules

- At most **two ambient loops per page** (for example garland sway plus lamp flicker).
- At most **12 particles** (petals) on screen, and only on the cover, Welcome, Save the Date reveal, countdown arrival, RSVP success and Thank You.
- All loops pause when the page is not current, when the tab is hidden, and under reduced motion.
- Banned: bouncing loops, spinning, heavy blur (> 4 px), flashing, bright glows, lens flares, light beams, confetti bursts.

### 8.4 Gesture map and conflict resolution

| Zone | Horizontal swipe | Vertical swipe | Tap |
|---|---|---|---|
| General page area | Turn page | Turn page | — |
| Love-story ring, dress-code deck, venue tabs (`data-gesture="x"`) | **Owned by the component** | Turn page | Component action |
| Scratch panels (`data-gesture="scratch"`) | Scratch | Scratch | Scratch |
| Overlays, sheets, RSVP focus mode | Book disabled | Native scroll | Native |
| Bottom-corner hot zones (64×64 px) | Manual curl drag | Manual curl drag | Turn page |

Swipes are recognised after 12 px of movement with a 30° angle tolerance. `touch-action` is set per zone (`none` on the book surface, `pan-x` / `pan-y` in owned zones) so the browser never pans or pull-to-refreshes the page (`overscroll-behavior: none`).

### 8.5 Navigation, deep links and history

- **Contents overlay:** a full-screen "Contents" page styled like a book's index, listing the 18 sections with gold page numbers (dotted leaders), plus "Read as scrolling page" (Scroll View), "Share", and "Sound on/off". Tapping an entry jumps there (riffle for ≤ 3 pages, parchment bloom beyond).
- **Deep links:** each page has a hash (`#welcome`, `#save-the-date`, `#rsvp`, …). Opening `site.com/#rsvp` shows the cover (with SKIP) and then lands on RSVP after opening, so "click here to RSVP" links work.
- **History:** page turns use `history.replaceState` (the Back button does not walk through 19 pages); overlays use `pushState`, so **Back closes the overlay**.
- **Return to Top** is "Return to First Page" on the Thank You page (§6.18).

### 8.6 Reduced motion

Respect `prefers-reduced-motion: reduce` **and** an in-site "Reduce motion" toggle in Contents. Under reduced motion: page turns become a 250 ms cross-fade; no petals, sway, flicker, auto-advance, dolly or handwriting; scratch panels start revealed; carousels become simple sliders; every page shows its final state. **No information or function is lost.**

### 8.7 Audio (only if approved, Q-B5)

- A licensed, soft instrumental (for example veena or nadaswaram) at low volume, starting on the "Tap to Open" gesture, with a fade-in over 3 s.
- The music toggle is always visible; the choice is remembered (`localStorage`). Audio pauses when the tab is hidden and resumes on return.
- The paper-turn and bell sounds follow the same toggle.

---

## 9. Colour palette and typography (summary)

THEME.md §3–§4 are authoritative. Summary:

| Token | Hex | Role |
|---|---|---|
| Ivory White | `#FFF9EF` | Primary page background |
| Jasmine White | `#FFFDF8` | Cards, light pages, overlay backgrounds |
| Sandalwood Beige | `#EAD8B7` | Secondary backgrounds behind cards, silk washes |
| Antique Gold | `#C49A45` | Borders, ornaments, foil, dividers. **Decorative only:** 2.49:1 on ivory, too low for text |
| Gold Text (support) | `#8A6420` | Any gold-coloured text (5.11:1 on ivory, passes AA) |
| Temple Maroon | `#7A2635` | Primary buttons, selected accents, key words (9.30:1 on ivory) |
| Deep Brown | `#4B3026` | Body text and numerals (11.46:1 on ivory) |
| Parchment (support) | `#F3E7CF` | Page back during the curl, placeholder fills |

Approximate usage: **60%** ivory and jasmine white, **22%** sandalwood, **10%** antique gold, **5%** temple maroon, **3%** deep brown (text). No page is predominantly dark maroon or solid gold.

| Role | Typeface | Notes |
|---|---|---|
| Couple names, elegant display | **Cormorant Garamond** (500–600, italic) | Names 40–56 px on mobile; never oversized |
| Royal section headings, labels | **Cinzel** (500–600) | Small caps, letter-spaced 0.12–0.18 em, 12–22 px; restrained |
| Body and UI | **Manrope** (400–600) | 15–16 px body, line-height 1.55 |
| Script accents (selective) | **Pinyon Script** | Only for "weds", "Save the Date", "Thank You" handwriting and similar short accents |
| Telugu text | **Noto Serif Telugu** | Invocation, Subhalekha title, optional bilingual lines. **Noto Serif Tamil** if Tamil is requested (Q-C2) |

---

## 10. Realistic asset checklist and file formats (summary)

THEME.md §15 contains the full asset checklist with IDs, dimensions, file-size budgets and section usage.

| Type | Use for | Format | Rules |
|---|---|---|---|
| **SVG** | Kolam (muggu) patterns, ornamental borders, decorative lines, traditional icons, event timeline ornaments (golden thread, nodes), arch and frame outlines, sacred symbols, monogram, handwriting stroke paths | Optimised SVG (SVGO), `currentColor` where useful | Crisp at all sizes; animatable stroke paths kept as single paths |
| **Transparent PNG / WebP** | Realistic jasmine, marigold garlands, brass lamps, temple pillars, mandapam, silk fabrics, invitation envelope, wedding ornaments, bells, toran, banana leaves, thali, still-lifes, petals, curtains, lights | **WebP with alpha** (primary), **AVIF with alpha** (preferred where supported), PNG fallback only if required | Exported at 2× of the displayed size; budgets per asset in THEME.md §15; layered parts (door leaves, envelope flap, lamp flame) exported separately |
| **Photographs** | Rahul and Divya portraits, couple photos, family photos, venue photos, memory polaroids | AVIF + WebP + JPEG fallback, responsive `srcset` | Warm, natural grading; face-safe crop zones defined per frame |
| **Optional video** | Opening animation (pre-rendered alternative), desktop background motion, floral transition | MP4 (H.264) + WebM, muted, `playsinline` | ≤ 2.5 MB each, poster frame required, never blocking content |

**Client-supplied assets rule.** When you provide Figma exports (PNG or SVG), photographs or reference videos, they are used **as supplied**: their intended design, placement, proportions and layering are preserved, and they are **never replaced** with unrelated generated graphics. Any technical optimisation (compression, format conversion, resizing) must be visually lossless and is listed for your sign-off.

---

## 11. Responsive website requirements

| Requirement | Specification |
|---|---|
| Mobile-first | Designed on a 390 × 844 reference page, then verified at 360 × 640 (compact), 375 × 667 (iPhone SE), 393 × 852, 412 × 915 (Android) and 430 × 932 |
| Container-relative layout | Pages are laid out with **container query units** (`cqw` / `cqh`) relative to the book's page box, not the window. This lets the same page render on phones, inside the desktop mockup, and (later) in an open-book spread |
| Viewport height | Page box uses `100dvh` (fallback `100vh`) minus safe-area insets; it resizes smoothly as iOS Safari and Android Chrome toolbars collapse or expand |
| Safe areas | `env(safe-area-inset-*)` for notches and home indicators; chrome never sits under the notch or home bar |
| Compact variant | Pages shorter than 700 px switch to a compact layout (smaller decoration, optional elements hidden) defined per page in THEME.md §13 |
| No horizontal overflow | Decorative layers are clipped by the page box (`overflow: clip`); no element may cause page-level horizontal scroll |
| No overlapping decoration | Text sits in a defined safe column; decorations may overlap only page edges and the outer 12% margins (THEME.md §9) |
| Touch targets | ≥ 44 × 44 px (48 px for primary actions), ≥ 8 px apart |
| Images | Responsive `srcset` / `sizes`; lazy-loaded except the cover and page 1; the next two pages are prefetched |
| Phone landscape | The page is shown centred at full height with the desktop background either side (no mockup), with a gentle note "Best viewed in portrait" |
| Tablet | §7.3 |
| Large text | Supports browser text zoom up to 200%; at large system font sizes, text containers grow and decoration shrinks (no clipped text) |
| In-app browsers | Must work in WhatsApp, Instagram and Facebook in-app browsers on iOS and Android (no reliance on features those webviews block; audio only after a tap) |
| Supported browsers | iOS Safari 16+, Chrome Android (last 2 versions), Samsung Internet (last 2), desktop Chrome, Safari, Edge and Firefox (last 2) |

---

## 12. Accessibility and performance requirements

### 12.1 Accessibility (target: WCAG 2.2 AA)

| Area | Requirement |
|---|---|
| Book semantics | Book region with `aria-roledescription="book"`; each page `role="group"`, `aria-roledescription="page"`, labelled "Page 7 of 19: Parents and Family". Non-current pages are `inert` |
| Announcements | A polite live region announces the page title on each turn |
| Focus | After a turn, focus moves to the page heading (`tabindex="-1"`). Logical tab order. Visible focus ring (2 px Temple Maroon plus a 2 px ivory outline) |
| Gesture alternatives | Every swipe, drag or scratch has a single-tap alternative (Next/Previous chevrons, pearl handle, "Reveal date" button, carousel arrows) — WCAG 2.5.1 and 2.5.7 |
| Overlays | `role="dialog"`, `aria-modal="true"`, labelled; focus trapped; Esc closes; focus returns to the trigger; background `inert`; body scroll locked |
| Contrast | Text ≥ 4.5:1 (≥ 3:1 for text ≥ 24 px). Antique Gold `#C49A45` is **never** used for text on light backgrounds; use Gold Text `#8A6420`. Text over imagery always sits on a veil or card |
| Text alternatives | Meaningful images have descriptive `alt` text; decorations use `alt=""` and `aria-hidden`; handwriting SVGs carry the real text via `aria-label`; scratch-panel date is present as text |
| Motion | §8.6 (OS preference plus in-site toggle) |
| Forms | Visible labels; errors in text and colour, with an icon; `aria-describedby` for errors; `autocomplete="name"`; correct input types |
| Language | `lang="en"`; Telugu passages wrapped in `lang="te"` |
| Audio | Never autoplays before a user gesture; always pausable |
| Zoom | Pinch-zoom is never disabled (`user-scalable` remains allowed) |

### 12.2 Performance budgets (mid-range Android, 4G "Fast" profile)

| Metric | Budget |
|---|---|
| Cover interactive (tap works) | ≤ 2.5 s |
| Largest Contentful Paint (cover) | ≤ 2.5 s |
| Cumulative Layout Shift | ≤ 0.05 |
| Interaction to Next Paint | ≤ 200 ms |
| Initial transfer (HTML, CSS, JS, fonts, cover and page 1 assets) | ≤ 1.6 MB |
| JavaScript (compressed) | ≤ 140 KB initial |
| Fonts | Subset Latin (+ Telugu glyphs used), WOFF2, ≤ 180 KB total initial, `font-display: swap`, two preloads maximum |
| Per page asset budget | ≤ 600 KB on average (≤ 900 KB for photo-heavy pages), loaded progressively |
| Animation | 60 fps target, ≥ 50 fps minimum during turns on a mid-range device; no long tasks > 50 ms during a turn |
| Data saver | With `Save-Data` or `prefers-reduced-data`, serve smaller images, skip optional video and audio |
| Caching | Hashed, immutable assets; a service worker caches visited pages for instant revisits (optional, Phase 5) |

---

## 13. RSVP and Wishing Wall storage requirements

### 13.1 Architecture

- **Static site** (CDN-hosted) plus **serverless endpoints** plus a **managed Postgres database**. Recommended: **Supabase** (Postgres with Row-Level Security and Edge Functions), with email notifications via a transactional email service (for example Resend).
- The browser **never writes to tables directly** and never holds a service key. All writes go through Edge Functions, which validate, check the bot challenge, rate-limit and then insert.

### 13.2 Data model

**`rsvps`**

| Column | Type | Rules |
|---|---|---|
| `id` | uuid (PK) | Generated |
| `created_at`, `updated_at` | timestamptz | Server-set |
| `guest_name` | text | Required, trimmed, 2–80 characters |
| `attendance` | enum `accept` / `decline` | Required |
| `attendee_count` | int | 1 to `maxAttendees` if accepting; 0 if declining |
| `events` | text[] | Subset of `mehndi`, `haldi`, `sangeet`, `wedding`, `reception`; at least 1 if accepting |
| `dietary` | text[] + `dietary_note` text | Optional; note ≤ 200 characters |
| `message` | text | Optional, ≤ 500 characters |
| `edit_token_hash` | text | SHA-256 of a random token returned once to the guest |
| `consent` | boolean | Required true |
| `source` | text | Optional (for example a share channel); no tracking IDs |
| `ip_hash` | text | Salted hash for rate limiting only; not shown in admin |

**`wishes`**

| Column | Type | Rules |
|---|---|---|
| `id` | uuid (PK) | Generated |
| `created_at` | timestamptz | Server-set |
| `name` | text | Required, 2–60 characters |
| `message` | text | Required, 5–500 characters |
| `status` | enum `pending` / `approved` / `rejected` | Default `pending` |
| `moderated_at`, `moderated_by` | timestamptz, text | Set on approval or rejection |
| `ip_hash` | text | Rate limiting only |

### 13.3 Endpoints

| Method and path | Purpose | Response |
|---|---|---|
| `POST /api/rsvp` | Create an RSVP | `201 {id, editToken}` only after a committed insert; `400` with field errors; `429` rate limited; `500` |
| `PATCH /api/rsvp/:id` | Update with `editToken` | `200 {id}`; `403` on a bad token |
| `POST /api/wishes` | Submit a wish (pending) | `201 {id, status: "pending"}` |
| `GET /api/wishes?cursor=` | Approved wishes, newest first, 20 per page | `200 {items, nextCursor, total}` |

### 13.4 Behaviour rules

- **Success is shown only after a `201` containing an `id`.** Timeouts (15 s) and network errors show the error state with Retry; inputs are preserved.
- **Idempotency:** each submission carries a client-generated `Idempotency-Key`; retries do not create duplicates.
- **Editing an RSVP:** the `editToken` is stored in the guest's `localStorage` and offered as "Edit my response" on return; guests on another device can ask a contact. The admin can merge duplicates.
- **Output safety:** all guest text is rendered as text (never HTML); length limits are enforced server-side.

### 13.5 Anti-spam and abuse

- Hidden honeypot field; minimum time-to-submit (3 s).
- Invisible bot challenge (Cloudflare Turnstile) verified server-side.
- Rate limit: 5 wishes and 5 RSVPs per hour per IP hash.
- Wishes: a basic profanity and link filter (links rejected); everything else waits for human moderation.

### 13.6 Moderation (Wishing Wall)

- **Default: manual approval.** New wishes are `pending` and invisible publicly until a family admin approves them (Q-E2 offers auto-approval with filtering instead).
- **Family admin page** (`/admin`): sign-in by email magic link restricted to allow-listed family emails (M-29); lists pending wishes with Approve and Reject; shows RSVP totals (accepted, declined, headcount per event, dietary counts); CSV export of RSVPs and wishes; search by name.

### 13.7 Notifications

- **Per RSVP:** an email to the configured family addresses with the guest's name, response, count, events, dietary needs and message.
- **Daily digest** (08:00 IST): new RSVPs and pending wishes awaiting approval, with headcount totals per event.
- WhatsApp notifications are possible through the WhatsApp Business API but involve setup and messaging costs; they are **not included** unless requested (Q-E5).

### 13.8 Privacy

- Collect only what is listed; no phone or email is collected from guests unless you request it (Q-E3).
- A short privacy note (linked from the forms) explains what is collected, who can see it (the families) and how long it is kept, in line with India's Digital Personal Data Protection Act, 2023.
- Retention: RSVP and wish data are deleted or anonymised **6 months after the wedding** unless you choose otherwise (Q-E6).
- `noindex` by default so the invitation does not appear in search engines (Q-F2).
- No advertising trackers. Analytics, if wanted, must be cookieless (Q-F3).

---

## 14. Technical architecture and the central data source

### 14.1 Recommended stack (confirmed in the Phase 1 spike)

| Layer | Choice | Rationale |
|---|---|---|
| Site framework | **Astro** (static output) with TypeScript | Pre-renders all 19 pages as HTML (the continuous-scroll base layer), ships minimal JavaScript, supports interactive islands |
| Interactive islands | **Preact** components | Small footprint for forms, overlays, carousel and the countdown |
| Animation | **GSAP** with ScrollTrigger, DrawSVG, SplitText (all free since 2025) | Precise timelines, stroke drawing, reliable on mobile |
| Page-curl engine | `BookController` wrapping **StPageFlip** (`page-flip`, MIT, HTML mode); custom CSS-transform curl as the fallback if the spike fails its acceptance tests on mid-range Android | Matches the reference's flat diagonal curl with parchment back |
| Carousels | Custom pointer-driven 3D ring (Love Story); **Swiper** (MIT) cards effect for the dress-code deck | Good touch handling and accessibility |
| Scratch card | Canvas 2D (`destination-out`) | Lightweight |
| Layout | CSS container queries and `cqw`/`cqh` units; CSS custom-property design tokens from THEME.md | Same pages work in mobile, mockup and spread |
| Fonts | Self-hosted via Fontsource, subset | Performance and privacy |
| Backend | **Supabase** (Postgres, Row-Level Security, Edge Functions, Auth for admin) | §13 |
| Email | Resend (or equivalent) | Notifications |
| Hosting | Netlify or Vercel (CDN, HTTPS, preview deploys per change) | The reference itself was hosted on Netlify |
| Images | Build-time optimisation (Astro assets / Sharp) to AVIF and WebP with `srcset` | Budgets in §12.2 |

### 14.2 Central editable data source

All wedding information lives in **one file**, `src/data/wedding.ts`, validated at build time by a schema (zod). No component hard-codes names, dates, venues or phone numbers. `null` means "to be provided" (§4.3). Excerpt:

```ts
export const wedding = {
  site: { url: null, showDeityImage: false, musicTrack: null, previewBadges: true },
  couple: {
    groom: { name: "Rahul", fullName: null, portrait: null, bio: null, memories: [] },
    bride: { name: "Divya", fullName: null, portrait: null, bio: null, memories: [] },
  },
  ceremony: {
    startISO: "2027-04-07T10:30:00+05:30", timeZone: "Asia/Kolkata",
    city: "Tirupati, Andhra Pradesh", venueId: "ceremony", status: "confirmed",
    endISO: null, provisionalDurationMinutes: null,
  },
  events: [
    { id: "mehndi",    name: "Mehndi",                 startISO: "2027-04-05T16:00:00+05:30", timeStatus: "proposed",  venueId: "bride-home" },
    { id: "haldi",     name: "Haldi",                  startISO: "2027-04-06T09:00:00+05:30", timeStatus: "proposed",  venueId: "groom-home" },
    { id: "sangeet",   name: "Sangeet Night",          startISO: "2027-04-06T18:30:00+05:30", timeStatus: "proposed",  venueId: "function-hall" },
    { id: "wedding",   name: "Hindu Wedding Ceremony", startISO: "2027-04-07T10:30:00+05:30", timeStatus: "confirmed", venueId: "ceremony" },
    { id: "reception", name: "Grand Wedding Reception",startISO: "2027-04-07T18:30:00+05:30", timeStatus: "proposed",  venueId: "function-hall" },
  ],
  venues: [
    { id: "ceremony",      label: "Wedding Ceremony Venue",        name: null, address: null, mapsUrl: null, lat: null, lng: null, photo: null, privacy: "public" },
    { id: "function-hall", label: "Sangeet & Reception Hall",      name: null, address: null, mapsUrl: null, lat: null, lng: null, photo: null, privacy: "public" },
    { id: "bride-home",    label: "Bride's Family Home",           name: null, address: null, mapsUrl: null, lat: null, lng: null, photo: null, privacy: "onRequest" },
    { id: "groom-home",    label: "Groom's Family Home",           name: null, address: null, mapsUrl: null, lat: null, lng: null, photo: null, privacy: "onRequest" },
  ],
  family: {
    groom: { father: null, mother: null, grandparents: [], siblings: [], others: [], photo: null },
    bride: { father: null, mother: null, grandparents: [], siblings: [], others: [], photo: null },
  },
  contacts: [
    { id: "groom-rep",   role: "Groom's Family Representative", name: null, phone: null, whatsapp: null },
    { id: "bride-rep",   role: "Bride's Family Representative", name: null, phone: null, whatsapp: null },
    { id: "coordinator", role: "Wedding Event Coordinator",     name: null, phone: null, whatsapp: null },
  ],
  rsvp: { deadline: null, maxAttendees: null, notifyEmails: [] },
  // loveStory, dressCode, travel, copy (C-01…C-06) follow the same pattern
} as const;
```

### 14.3 Sharing and link preview

- Open Graph and Twitter meta tags with a **1200 × 630 share image** (ivory card, gold border, "Rahul & Divya · 7 April 2027 · Tirupati"), so the WhatsApp preview looks premium.
- Title: "Rahul & Divya — Wedding Invitation · 7 April 2027 · Tirupati".
- Favicon and app icon: the R·D monogram.
- "Share Invitation" uses the Web Share API, falling back to WhatsApp share and Copy link.

### 14.4 Environments

`preview` (placeholders visible, password optional) and `production` (placeholders hidden, launch check enforced). Each change gets a preview URL for family review.

---

## 15. Functional acceptance criteria

Each criterion must pass on iPhone (Safari and the WhatsApp in-app browser), a mid-range Android phone (Chrome and the WhatsApp in-app browser), and desktop Chrome and Safari.

### Book and navigation
- **AC-01** Tapping "Tap to Open Our Invitation" plays the opening in 2–3 s and lands on Welcome; SKIP lands on Welcome immediately.
- **AC-02** Pages turn forward and backward via swipe, corner drag, the pearl handle, the chevrons, the keyboard and the mouse wheel; an incomplete drag springs back.
- **AC-03** Horizontal swipes inside the love-story ring, dress-code deck and venue tabs never turn the page; vertical swipes there do.
- **AC-04** The Contents overlay lists all 18 sections and jumps correctly; the page number is correct on every page.
- **AC-05** `/#rsvp` (and every other hash) opens the correct page after the cover.
- **AC-06** The browser Back button closes an open overlay rather than leaving the site.
- **AC-07** With JavaScript disabled, all pages are readable as a continuous vertical scroll. Scroll View in Contents produces the same.
- **AC-08** No horizontal scrolling at any supported width; no decoration covers text at 360 × 640.

### Content integrity
- **AC-09** No invented names, phone numbers, addresses, venues or map links appear anywhere; every `null` renders per §4.3.
- **AC-10** Every proposed time carries a "Proposed" badge; only the wedding date and time display as confirmed.
- **AC-11** Changing any value in `wedding.ts` (for example a venue name) updates every page where it appears, without layout edits.
- **AC-12** `content:check` lists missing fields and blocks a production build while launch-blocking fields are empty.

### Date features
- **AC-13** The countdown shows the correct days, hours, minutes and seconds to `2027-04-07T10:30:00+05:30` from any device time zone; guests outside IST also see their local time.
- **AC-14** At or after the target, "Our Auspicious Wedding Day Has Arrived!" is displayed.
- **AC-15** Add to Calendar produces a correct Google Calendar entry and a valid `.ics` (Apple and Outlook) at 10:30 AM IST, with no invented end time (zero duration or the approved provisional duration, labelled).
- **AC-16** The scratch panels reveal by scratching **and** by the "Reveal date" button; the date is readable by screen readers before reveal.

### People and story
- **AC-17** Groom and bride portraits enter from left and right respectively and never leave the viewport during animation.
- **AC-18** Both family-tree overlays open full screen above everything, scroll independently, and close via the button, Esc, Back and swipe-down; missing relatives are hidden in production.
- **AC-19** The love-story ring rotates one card per swipe (two maximum on a hard flick), works by touch, mouse, arrows and keyboard, and never spins continuously.

### Events and places
- **AC-20** All five events show name, date, time, venue, Location and Calendar buttons; Location stays disabled until a valid venue location exists.
- **AC-21** Venue tabs switch all four locations; Get Directions opens Google Maps directions to the stored coordinates or place link only.
- **AC-22** Travel tiles open readable detail sheets that fit the screen and close properly.

### Guest interaction
- **AC-23** A wish submission shows success only after the server returns `201`; it is not publicly visible until approved; the error state preserves the text and offers Retry.
- **AC-24** View All Wishes shows only approved wishes, paginates, scrolls independently and has a visible close button.
- **AC-25** RSVP validates required fields with clear messages; success appears only after a stored record ID is returned; offline and server errors show retry states without losing input.
- **AC-26** Each RSVP triggers a notification email to the configured addresses within 2 minutes; the admin page shows it and exports it to CSV.
- **AC-27** Double-tapping Confirm RSVP or retrying after a timeout never creates duplicate records.
- **AC-28** Call opens the dialler with the stored number; WhatsApp opens a chat with the pre-filled message; both stay disabled until numbers are provided; contact popups fit the screen with a visible close button.

### Closing, sharing and quality
- **AC-29** The Thank You handwriting animates, falls back to static readable text, and "Return to First Page" lands on Welcome.
- **AC-30** Share opens the native share sheet where available, otherwise WhatsApp share and Copy link.
- **AC-31** The WhatsApp link preview shows the share image, title and description.
- **AC-32** With reduced motion (OS setting or in-site toggle), all content and functions remain available with no petals, sway, 3D turns or auto-advance.
- **AC-33** The performance budgets in §12.2 are met (Lighthouse mobile performance ≥ 85 on the cover; field-like test on a mid-range Android).
- **AC-34** An automated accessibility scan (axe) shows no serious or critical issues; manual VoiceOver and TalkBack passes can complete RSVP and a wish.
- **AC-35** Desktop (chosen option) shows all pages within one presentation (one mockup for B, one book for A) and a consistent background.
- **AC-36** Supplied client assets appear unaltered in design and placement.

---

## 16. Phased development plan

| Phase | Goal | Key work | Exit criteria |
|---|---|---|---|
| **0. Approval and content** | Lock decisions and content | Review and approve PRD and THEME; answer §17; gather photos, family details, venues and contacts; commission or license the realistic asset set (THEME.md §15); approve draft copy (§4.4) | Signed-off PRD and THEME; asset sourcing plan agreed |
| **1. Foundation and page-curl spike** | Prove the book on real phones | Project setup; design tokens; fonts; `wedding.ts` with schema and `content:check`; `BookController` with page-curl, gestures, chevrons, Contents, deep links and history; the chosen desktop frame; test on iPhone SE, a recent iPhone, a mid-range Android, and WhatsApp/Instagram webviews | 60 fps turns (≥ 50 minimum) on a mid-range Android; gesture map passes AC-02, AC-03; library choice confirmed |
| **2. Opening and story pages** | Cover through Love Story (pages 1–8) | Splash, Welcome, Blessings, Save the Date (scratch and calendar), Countdown, Meet the Couple ×2, Parents and Family with tree overlays, Love Story ring | AC-01, AC-13 to AC-19 pass with placeholder assets |
| **3. Celebration and logistics pages** | Pages 9–15 | Timeline ×2, Ceremony, Reception, Dress Code, Venues, Travel | AC-20 to AC-22 pass |
| **4. Guest interaction and backend** | Pages 16–18 plus backend | Supabase schema and RLS, Edge Functions, Turnstile, Wishing Wall and composer, RSVP with focus mode, notifications, admin page, contact cards | AC-23 to AC-28 pass end to end on the preview environment |
| **5. Finishing and desktop** | Thank You, polish, quality | Thank You and riffle; desktop presentation; motion tuning; audio (if approved); OG image; reduced motion; performance and accessibility work; final assets integrated | AC-29 to AC-36 pass |
| **6. QA, family preview and launch** | Ship with confidence | Device matrix QA; family proofreading of every name and time; placeholder sweep (`content:check` clean); soft launch to close family; fix round; guest launch; monitor RSVPs. Optional: Option A Open Book, Telugu toggle, personalised guest links | Families sign off; production launch |
| **Post-launch** | Care | Respond to content changes (times, venues); moderation; RSVP exports; switch to the post-wedding message; data deletion per retention | — |

---

## 17. Questions requiring confirmation before development

### A. Experience and presentation
- **Q-A1** The reference uses **painted, illustrated couple characters**. Your brief requires **real photographs**. Proceed with real photos in silk frames (recommended per your brief), or also commission hand-painted portraits of Rahul and Divya in the reference style for some pages?
- **Q-A2** Approve **Book Mode** (page-curl on every page) as the default, with Scroll View as a fallback and option?
- **Q-A3** Desktop: **Option B (mobile mockup, recommended)** or **Option A (Open Book spread)**?
- **Q-A4** Splash: keep the brief's **silk envelope opening** (recommended, with the reference's temple doors used on Divine Blessings), or open the site with the **temple doors** exactly as in the reference?
- **Q-A5** Are you happy with Meet the Couple as **two pages** (Rahul, then Divya, as in the reference), or do you prefer both portraits on **one page** stacked vertically?

### B. Dates, times and calendar
- **Q-B1** Please confirm or adjust each proposed event time (Mehndi, Haldi, Sangeet, Reception).
- **Q-B2** For proposed events, should Add to Calendar be **disabled until confirmed** (recommended) or allowed with "(Proposed)" in the title?
- **Q-B3** Calendar end time: keep **start-only entries** (recommended until known), or approve a labelled provisional duration (for example 2 hours for the ceremony)?
- **Q-B4** Is there an **RSVP deadline**? What is the **maximum number of attendees** per response?
- **Q-B5** Would you like **background music**? If so, please provide or approve a licensed track. Should page-turn and bell sounds be included?
- **Q-B6** After the wedding (from 8 April 2027), should the site show a "Happily married" message and later a photo gallery?

### C. Cultural and language
- **Q-C1** On Divine Blessings, do the families prefer **symbolic representation** (Shankha, Chakra and Srivari Namam, the default) or a **family-approved image of Lord Venkateswara**?
- **Q-C2** Are the families Telugu-speaking, Tamil-speaking, or both? Should we include Telugu (or Tamil) text, a bilingual line on key pages, or a full language toggle?
- **Q-C3** Should the Wedding Ceremony page include short descriptions of rituals (for example Kanyadaanam, Jeelakarra-Bellam at the Muhurtham, Mangalya Dharanam, Talambralu, Saptapadi)? Which rituals apply to your families' tradition?
- **Q-C4** Do you want traditional Telugu honorifics (*Sri*, *Smt.*, *Chi.*, *Chi. La. Sow.*) in the family section?
- **Q-C5** Please approve or edit the draft copy C-01 to C-06 (§4.4).
- **Q-C6** Is the Haldi only at the groom's home, or will the bride also have a Haldi or *Pellikuthuru* ceremony that should be listed?

### D. Venues and travel
- **Q-D1** When will the ceremony venue and function hall be confirmed? Is the venue in Tirupati town or on Tirumala hill (this changes travel guidance)?
- **Q-D2** Will you arrange any accommodation blocks, airport or railway pickups, or shuttles?
- **Q-D3** Should the **family home addresses** be shown publicly to everyone with the link, or marked "Address shared personally" with a contact button?
- **Q-D4** Would you like a commissioned **illustrated map** for each venue (as in the reference), or a simple elegant map card with a directions button?

### E. RSVP, wishes and data
- **Q-E1** Who should receive RSVP notification emails? Who should have admin access (email addresses)?
- **Q-E2** Wishes: **manual approval** (recommended) or automatic publishing with a filter?
- **Q-E3** Should the RSVP collect a phone number or email for follow-up? (Not collected by default.)
- **Q-E4** Will all meals be vegetarian? Which dietary options should the RSVP offer?
- **Q-E5** Do you want WhatsApp notifications for new RSVPs (extra setup and cost), or is email plus a daily digest enough?
- **Q-E6** How long should RSVP and wish data be kept after the wedding (default 6 months)?
- **Q-E7** Would you like **personalised invite links** (for example a greeting with the guest family's name and a pre-set attendee limit)?

### F. Launch
- **Q-F1** Preferred **domain name**, and who will own the domain, hosting and database accounts?
- **Q-F2** Keep the site hidden from search engines (`noindex`, recommended)? Password-protect it?
- **Q-F3** Would you like simple cookieless visit analytics (for example how many guests opened the invitation)?
- **Q-F4** Target dates: when should the invitation go out to guests? (This sets the deadline for Phases 0–6.)
- **Q-F5** Will you supply Figma designs or custom artwork, or should we source and commission the realistic asset set per THEME.md §15?

---

## Appendix: Glossary

| Term | Meaning |
|---|---|
| Muhurtham | The auspicious moment fixed for the wedding (10:30 AM IST) |
| Mandapam | The decorated canopy and platform where the wedding rituals take place |
| Subhalekha (శుభలేఖ) | Traditional Telugu wedding invitation |
| Kolam / Muggu (ముగ్గు) | Auspicious geometric floor patterns drawn with rice flour |
| Kuthuvilakku | Tall traditional brass oil lamp with multiple wicks |
| Thali / Mangalsutram | The sacred wedding necklace tied by the groom |
| Jeelakarra-Bellam | Telugu ritual of placing cumin-jaggery paste on each other's heads at the Muhurtham |
| Talambralu | Showering of turmeric-coloured rice (or pearls) over the couple |
| Toran / Thoranam | Mango-leaf garland hung across doorways |
| Shankha, Chakra, Srivari Namam | Conch, discus and the sacred forehead mark associated with Lord Venkateswara |
| Veshti / Pancha | Traditional South Indian men's draped garment |
| Venkatagiri, Dharmavaram | Andhra Pradesh silk and cotton weaving traditions that inspire our silk textures |
| Srikalahasti Kalamkari | Hand-drawn, natural-dye textile art from Srikalahasti, near Tirupati; inspiration for our fine line illustrations |
