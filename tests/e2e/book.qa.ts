/**
 * QA for the invitation (PRD §15: AC-01–AC-36, except AC-33, which is `npm run perf`) using the installed Google Chrome.
 * Phase 4 checks use the dev server's API and reset its local store (.data/dev-db.json).
 *
 *   npm run dev            # in one terminal
 *   npm run qa:book        # in another; optional: QA_URL=http://localhost:4321 QA_SHOTS=./qa-shots
 *
 * Gestures are sent as real touch input through the Chrome DevTools Protocol.
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type BrowserContext, type CDPSession, type Page } from 'playwright-core';

const BASE = process.env.QA_URL ?? 'http://localhost:4321/';
const SHOTS = process.env.QA_SHOTS ?? null;
const results: { id: string; name: string; pass: boolean; detail?: string }[] = [];
// Waits poll on a timer: Chrome pauses animation frames when the machine is throttled (e.g. on battery),
// and frame-based polling then never re-checks a condition that is already true.
const POLL = 100;
const metrics: Record<string, unknown> = {};

const started = Date.now();

function check(id: string, name: string, pass: boolean, detail?: string) {
  results.push({ id, name, pass, detail });
  // Progress as it happens (the full report prints at the end).
  console.error(`  ${((Date.now() - started) / 1000).toFixed(0).padStart(4)}s ${pass ? '✓' : '✗'} ${id}${pass || !detail ? '' : `  ${detail}`}`);
}

const current = (page: Page) => page.evaluate(() => document.querySelector<HTMLElement>('.page[data-state=current]')?.id ?? null);
const pageErrors: string[] = [];
const settle = (page: Page) =>
  page
    .waitForFunction(() => {
      const b = (window as unknown as { __book?: { isBusy: boolean } }).__book;
      return !!b && !b.isBusy && !document.querySelector('.app.is-opening') && !!document.querySelector('.page[data-state=current]');
    }, null, { polling: POLL })
    .catch(async (err) => {
      // Say why the book never settled: script error, still busy, or no page shown.
      const state = await page
        .evaluate(() => ({
          url: location.href,
          book: !!(window as unknown as { __book?: unknown }).__book,
          busy: (window as unknown as { __book?: { isBusy: boolean } }).__book?.isBusy,
          opening: !!document.querySelector('.app.is-opening'),
          current: document.querySelector<HTMLElement>('.page[data-state=current]')?.id ?? null,
          ready: document.readyState,
        }))
        .catch((e) => String(e));
      throw new Error(`Book did not settle: ${JSON.stringify(state)}; page errors: ${JSON.stringify(pageErrors.slice(-5))}`, { cause: err });
    });

/** The opening (PRD §6.1): ring the temple bell, wait for the invitation book, then open it. */
// The bell sways in the breeze, so it is never "stable" for Playwright: tap it regardless.
const ringTheBell = (page: Page) => page.getByRole('button', { name: 'Ring the temple bell to open the doors' }).tap({ force: true });
const bookReady = (page: Page, timeout = 20000) =>
  page.waitForFunction(() => document.getElementById('cover')?.dataset.stage === 'book', null, { timeout, polling: POLL });
const openTheInvitation = (page: Page) => page.getByRole('link', { name: 'Open the Invitation' }).tap();
async function enterAndOpen(page: Page) {
  await ringTheBell(page);
  await bookReady(page);
  await openTheInvitation(page);
}

async function touchDrag(cdp: CDPSession, page: Page, from: [number, number], to: [number, number], steps = 10, stepMs = 16) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from[0], y: from[1] }] });
  for (let i = 1; i <= steps; i++) {
    const x = from[0] + ((to[0] - from[0]) * i) / steps;
    const y = from[1] + ((to[1] - from[1]) * i) / steps;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
    await page.waitForTimeout(stepMs);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(80);
  await settle(page);
}

type Browser = Awaited<ReturnType<typeof chromium.launch>>;

async function newContext(browser: Browser, options: Parameters<Browser['newContext']>[0]): Promise<BrowserContext> {
  const ctx = await browser.newContext(options);
  // tsx wraps named functions in a `__name` helper that does not exist inside the page.
  await ctx.addInitScript({ content: 'globalThis.__name = (f) => f;' });
  // The invitation opens by itself and a cue says how to turn the page; the checks switch both off (the dedicated
  // checks AC-43 and AC-44 switch them on) so a page stays where the check left it.
  // (top frame only: the map's iframe starts as an empty page of its own, and its copy of this script must not undo a check's change)
  await ctx.addInitScript({ content: "try { if (window.top === window) { localStorage.setItem('rdv:auto', 'off'); localStorage.setItem('rdv:turned', '1'); } } catch (e) {}" });
  ctx.on('page', (p) => p.on('pageerror', (e) => pageErrors.push(`${p.url()}: ${e.message}`)));
  return ctx;
}

function mobileContext(browser: Browser, width = 390, height = 844, extra = {}): Promise<BrowserContext> {
  return newContext(browser, { viewport: { width, height }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, ...extra });
}

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  if (SHOTS) mkdirSync(SHOTS, { recursive: true });

  // A dev server compiles pages the first time they are asked for (and again after every edit), which
  // makes the first checks slow; visit once so that cost is paid before anything is timed.
  {
    const ctx = await mobileContext(browser);
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'networkidle' }).catch(() => undefined);
    await page.waitForTimeout(1500);
    await ctx.close();
  }

  /* ------------------------------------------------ AC-05 deep link + AC-01 opening */
  {
    const ctx = await mobileContext(browser);
    const page = await ctx.newPage();
    await page.goto(`${BASE}#dress-code`);
    await settle(page);
    check('AC-05a', 'Fresh deep link shows the cover first', (await current(page)) === 'cover');
    await enterAndOpen(page);
    await page.waitForTimeout(200);
    await settle(page);
    check('AC-05b', 'Opening the cover lands on the deep-linked page', (await current(page)) === 'dress-code', String(await current(page)));
    await page.reload();
    await settle(page);
    check('AC-05c', 'Reload in the same session keeps the guest on their page', (await current(page)) === 'dress-code', String(await current(page)));
    await ctx.close();
  }

  {
    const ctx = await mobileContext(browser);
    const page = await ctx.newPage();
    await page.goto(BASE);
    await settle(page);
    const splash = await page.evaluate(() => ({ skip: document.querySelectorAll('[data-skip], .chrome-skip').length, skipText: [...document.querySelectorAll('button')].filter((b) => /^skip$/i.test(b.textContent?.trim() ?? '') && getComputedStyle(b).display !== 'none').length }));
    check('AC-01', 'The first splash screen (the temple door) has no Skip button', splash.skip === 0 && splash.skipText === 0 && (await current(page)) === 'cover', JSON.stringify(splash));
    await ctx.close();
  }

  /* ------------------------------------------------ AC-02 / AC-03 gestures */
  {
    const ctx = await mobileContext(browser);
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await page.goto(`${BASE}`);
    await settle(page);
    await page.evaluate(() => sessionStorage.setItem('rdv:opened', '1'));
    await page.goto(`${BASE}#save-the-date`);
    await settle(page);
    await page.evaluate(() => localStorage.setItem('rdv:hint-seen', '1'));

    await touchDrag(cdp, page, [300, 420], [262, 420], 10, 40);
    check('AC-02a', 'Short slow drag springs back', (await current(page)) === 'save-the-date');
    await touchDrag(cdp, page, [200, 640], [200, 320]);
    check('AC-02b', 'Swipe up turns forward', (await current(page)) === 'countdown');
    await touchDrag(cdp, page, [330, 420], [70, 440]);
    check('AC-02c', 'Swipe left turns forward', (await current(page)) === 'family');
    // (the Parents gallery owns horizontal swipes, so from there the way back is a swipe down)
    await touchDrag(cdp, page, [200, 260], [200, 620]);
    check('AC-02e', 'Swipe down turns back', (await current(page)) === 'countdown');
    await touchDrag(cdp, page, [60, 420], [330, 420]);
    check('AC-02d', 'Swipe right turns back', (await current(page)) === 'save-the-date');
    await touchDrag(cdp, page, [372, 826], [150, 600], 14, 16);
    check('AC-02f', 'Bottom-right corner drag turns forward', (await current(page)) === 'countdown');
    await touchDrag(cdp, page, [20, 826], [300, 780], 14, 16);
    check('AC-02g', 'Bottom-left corner drag turns back', (await current(page)) === 'save-the-date');

    // The love-story gallery owns horizontal swipes; vertical swipes on it still turn the page.
    await page.evaluate(() => (location.hash = 'love-story'));
    await page.waitForTimeout(100);
    await settle(page);
    const ringBox = (await page.locator('#love-story .ls__ring').boundingBox())!;
    const ringY = ringBox.y + ringBox.height / 2;
    await touchDrag(cdp, page, [300, ringY], [110, ringY], 12, 20);
    check('AC-03a', 'Horizontal swipe on the gallery rotates it and does not turn the page', (await current(page)) === 'love-story');
    await touchDrag(cdp, page, [195, ringY + 60], [195, ringY - 260], 10, 14);
    check('AC-03b', 'Vertical swipe on the gallery still turns the page', (await current(page)) === 'events');
    await page.evaluate(() => (location.hash = 'save-the-date'));
    await page.waitForTimeout(100);
    await settle(page);

    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(50);
    await settle(page);
    check('AC-02h', 'Arrow key turns forward', (await current(page)) === 'countdown');
    await page.getByRole('button', { name: 'Previous page' }).tap();
    await page.waitForTimeout(50);
    await settle(page);
    check('AC-02i', 'Previous chevron turns back', (await current(page)) === 'save-the-date');
    await page.getByRole('button', { name: 'Next page' }).first().tap();
    await page.waitForTimeout(50);
    await settle(page);
    check('AC-02j', 'Pearl handle / Next turns forward', (await current(page)) === 'countdown');
    for (let i = 0; i < 25; i++) {
      await page.mouse.wheel(0, 30);
      await page.waitForTimeout(16);
    }
    await settle(page);
    check('AC-02k', 'One trackpad gesture turns exactly one page', (await current(page)) === 'family', String(await current(page)));

    /* AC-04 / AC-06 Contents + Back */
    await page.getByRole('button', { name: 'Contents' }).tap();
    await page.waitForTimeout(450);
    await page.getByRole('button', { name: /Venue and Travel/ }).tap();
    await page.waitForTimeout(150);
    await settle(page);
    check('AC-04', 'Contents jumps to the chosen section', (await current(page)) === 'venues' && page.url().endsWith('#venues'), page.url());
    await page.getByRole('button', { name: 'Contents' }).tap();
    await page.waitForTimeout(450);
    await page.goBack();
    await page.waitForTimeout(300);
    const dialogHidden = await page.evaluate(() => document.getElementById('contents')!.hidden);
    check('AC-06', 'Browser Back closes the overlay and stays on the page', dialogHidden && (await current(page)) === 'venues');

    /* AC-07 Scroll View */
    await page.getByRole('button', { name: 'Contents' }).tap();
    await page.waitForTimeout(450);
    await page.getByRole('switch', { name: 'Read as scrolling page' }).tap();
    await page.waitForTimeout(600);
    await page.evaluate(() => {
      const book = document.querySelector('.book')!;
      book.scrollTop = document.getElementById('ceremony')!.offsetTop;
    });
    await page.waitForTimeout(700);
    check('AC-07a', 'Scroll View stacks pages and the address follows scrolling', page.url().endsWith('#ceremony'), page.url());
    await page.getByRole('button', { name: 'Book view' }).tap();
    await settle(page);
    check('AC-07b', 'Book view returns to the page being read', (await current(page)) === 'ceremony');
    await ctx.close();
  }

  /* ------------------------------------------------ AC-32 reduced motion */
  {
    const ctx = await mobileContext(browser, 390, 844, { reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(BASE);
    await settle(page);
    const e0 = Date.now();
    await ringTheBell(page);
    await bookReady(page);
    const entering = (Date.now() - e0) / 1000;
    await openTheInvitation(page);
    await page.waitForTimeout(40);
    const curlUsed = await page.evaluate(() => document.querySelector('.book__flap-wrap')!.classList.contains('is-on'));
    await settle(page);
    check(
      'AC-32',
      'Reduced motion: the doors simply fade open (no walk, no 3D) and the book opens with a cross-fade, not a curl',
      entering < 2.5 && !curlUsed && (await current(page)) === 'welcome',
      JSON.stringify({ entering, curlUsed }),
    );
    await ctx.close();
  }

  /* ------------------------------------------------ AC-07 no JavaScript */
  {
    const ctx = await mobileContext(browser, 390, 844, { javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(BASE);
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    const sections = await page.locator('section.page').count();
    check('AC-07c', 'Without JavaScript the pages read as one continuous scroll', sections === 14 && height > 844 * 13, `${sections} pages, ${height}px tall`);
    await ctx.close();
  }

  /* ================================================ Phase 2 pages ================================================ */

  /* AC-01 the temple entrance: bell, doors, walk-in, monogram from the sky, then the invitation book */
  {
    const ctx = await mobileContext(browser);
    await ctx.addInitScript({
      content: `window.__bells = 0; const A = window.AudioContext; window.AudioContext = class extends A { constructor(...a) { super(...a); window.__bells++; } };`,
    });
    const page = await ctx.newPage();
    await page.goto(BASE);
    await settle(page);
    await page.waitForTimeout(1200);
    const doorsFirst = await page.evaluate(() => ({
      stage: document.getElementById('cover')!.dataset.stage,
      bookHidden: getComputedStyle(document.querySelector('#cover [data-book]')!).visibility === 'hidden',
      prompt: !!document.querySelector('#cover .cv-enter')?.textContent?.includes('Tap the bell'),
    }));
    const started = Date.now();
    await ringTheBell(page);
    await page.waitForTimeout(1900);
    const doors = await page.evaluate(() => {
      const t = getComputedStyle(document.querySelector('#cover [data-door="l"]')!).transform;
      return { swinging: t !== 'none' && t !== 'matrix(1, 0, 0, 1, 0, 0)', sound: (window as unknown as { __bells: number }).__bells };
    });
    await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('#cover [data-mono]')!).opacity) > 0.9, null, { timeout: 12000, polling: POLL });
    const monoAt = (Date.now() - started) / 1000;
    const birds = await page.evaluate(() => document.querySelectorAll('.op-bird').length);
    await bookReady(page);
    const bookAt = (Date.now() - started) / 1000;
    const book = await page.evaluate(() => ({
      focus: document.activeElement?.textContent?.trim(),
      entered: sessionStorage.getItem('rdv:entered'),
    }));
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/opening-book.png` });
    const o0 = Date.now();
    await openTheInvitation(page);
    // The card's cover swings open on its hinge, then the page turns with a curl
    await page.waitForTimeout(500);
    const flap = await page.evaluate(() => getComputedStyle(document.querySelector('#cover [data-cover]')!).transform !== 'none');
    await page.waitForFunction(() => document.querySelector('.book__flap-wrap')!.classList.contains('is-on'), null, { timeout: 3000, polling: 20 });
    const curl = true;
    await page.waitForFunction(() => document.querySelector('.page[data-state=current]')?.id === 'welcome', null, { timeout: 6000, polling: POLL });
    const openSeconds = (Date.now() - o0) / 1000;
    metrics.opening = { monogramSeconds: +monoAt.toFixed(2), bookSeconds: +bookAt.toFixed(2), openSeconds: +openSeconds.toFixed(2) };
    check(
      'AC-01b',
      'Opening: tap the bell → it rings, the doors swing open, birds fly, the monogram descends and becomes the invitation (~10–11 s); Open swings the card cover open and turns to Welcome',
      doorsFirst.stage === 'doors' &&
        doorsFirst.bookHidden &&
        doorsFirst.prompt &&
        doors.swinging &&
        doors.sound > 0 &&
        birds > 0 &&
        monoAt > 5.5 &&
        monoAt < 9.5 &&
        bookAt > 9 &&
        bookAt < 13 &&
        book.focus === 'Open the Invitation' &&
        book.entered === '1' &&
        flap &&
        curl &&
        openSeconds < 3,
      JSON.stringify({ doorsFirst, doors, birds, monoAt, bookAt, book, flap, openSeconds }),
    );
    // Back to the cover later in the visit: the book is waiting, not the closed doors.
    await page.evaluate(() => (window as unknown as { __book: { show(i: number): void } }).__book.show(0));
    await page.waitForTimeout(200);
    const revisit = await page.evaluate(() => document.getElementById('cover')!.dataset.stage);
    check('AC-01c', 'Returning to the cover in the same visit shows the invitation book, ready to open', revisit === 'book', String(revisit));
    await ctx.close();
  }

  /* AC-01d personal link: ?to= names the guest on the card, as plain text, fitted to its place */
  {
    const ctx = await mobileContext(browser, 375, 667);
    await ctx.addInitScript({ content: 'sessionStorage.setItem("rdv:entered", "1");' });
    const page = await ctx.newPage();
    const greet = async (to: string) => {
      await page.goto(`${BASE}?to=${encodeURIComponent(to)}`);
      await bookReady(page);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);
      return page.evaluate(() => {
        const el = document.querySelector('[data-guest]')!;
        const text = el.getBoundingClientRect();
        const card = document.querySelector('#cover [data-book]')!.getBoundingClientRect();
        const lines = Math.round(text.height / (parseFloat(getComputedStyle(el).fontSize) * 1.2));
        const rule = document.querySelector('#cover .cv-open')!.getBoundingClientRect();
        const size = parseFloat(getComputedStyle(el).fontSize);
        return { text: el.textContent, elements: el.children.length, lines, size: Math.round(size), room: text.bottom < rule.top - 4 && size >= 11, inside: text.left >= card.left + card.width * 0.15 && text.right <= card.right - card.width * 0.15 };
      });
    };
    const markup = await greet('Meena & Ravi <img src=x>');
    const short = await greet('Meena & Ravi');
    const long = await greet('Dr. Lakshmi Narayanan & Family (Chennai)');
    const longer = await greet('Mr. and Mrs. Venkata Subramanian Iyer with Our Lovely Family');
    check(
      'AC-01d',
      'A personal link (?to=Name) greets the guest by name on the card, as plain text; long names wrap over several lines at a readable size, inside the card and clear of the divider',
      markup.text === 'Meena & Ravi img srcx' && markup.elements === 0 && short.lines === 1 && short.inside && long.lines <= 4 && long.inside && long.room && longer.lines <= 5 && longer.inside && longer.room,
      JSON.stringify({ markup, short, long, longer }),
    );
    await ctx.close();
  }

  /* AC-13 / AC-14 countdown from other time zones, with a fixed clock */
  {
    const target = Date.parse('2027-04-07T10:30:00+05:30');
    const now = Date.parse('2026-10-23T12:00:00Z');
    const s = Math.floor((target - now) / 1000);
    const expected = { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60) };
    for (const tz of ['Europe/London', 'America/New_York', 'Asia/Kolkata']) {
      const ctx = await mobileContext(browser, 390, 844, { timezoneId: tz });
      const page = await ctx.newPage();
      await page.clock.setFixedTime(new Date(now));
      await page.goto(BASE);
      await page.evaluate(() => sessionStorage.setItem('rdv:opened', '1'));
      await page.goto(`${BASE}#countdown`);
      await settle(page);
      await page.waitForTimeout(300);
      const shown = await page.evaluate(() => {
        const v = (k: string) => Number(document.querySelector(`[data-unit=${k}]`)!.textContent!.trim());
        const local = document.querySelector<HTMLElement>('[data-localtime]')!;
        return { days: v('days'), hours: v('hours'), minutes: v('minutes'), local: local.hidden ? '' : local.textContent };
      });
      const sameCount = shown.days === expected.days && shown.hours === expected.hours && shown.minutes === expected.minutes;
      const localOk = tz === 'Asia/Kolkata' ? shown.local === '' : tz === 'Europe/London' ? /6:00/.test(shown.local ?? '') : /1:00/.test(shown.local ?? '');
      check('AC-13', `Countdown is correct from ${tz} (local-time line ${tz === 'Asia/Kolkata' ? 'hidden' : 'shown'})`, sameCount && localOk, JSON.stringify({ shown, expected }));
      await ctx.close();
    }
    const ctx = await mobileContext(browser);
    const page = await ctx.newPage();
    await page.clock.setFixedTime(new Date(target + 1000));
    await page.goto(BASE);
    await page.evaluate(() => sessionStorage.setItem('rdv:opened', '1'));
    await page.goto(`${BASE}#countdown`);
    await settle(page);
    const arrived = await page.evaluate(
      () => document.querySelector<HTMLElement>('[data-arrived]')!.hidden === false && document.querySelector<HTMLElement>('[data-countdown]')!.hidden === true,
    );
    check('AC-14', 'At the Muhurtham the arrival message replaces the countdown', arrived);
    await ctx.close();
  }

  /* AC-15 Add to Calendar, AC-16 Save the Date: the curtains open by themselves on the month, hearts on the celebration days */
  {
    const ctx = await mobileContext(browser);
    const page = await ctx.newPage();
    await page.goto(BASE);
    await page.evaluate(() => sessionStorage.setItem('rdv:opened', '1'));
    await page.goto(`${BASE}#welcome`);
    await settle(page);
    await page.evaluate(() => localStorage.setItem('rdv:hint-seen', '1'));
    const curtainScale = () =>
      page.evaluate(() => {
        const m = new DOMMatrix(getComputedStyle(document.querySelector('#save-the-date [data-curtain]')!).transform);
        return +m.a.toFixed(2);
      });
    // Turn from Welcome: the curtains arrive closed, then draw back by themselves a fraction of a second later, with no tap
    await page.getByRole('button', { name: 'Next page' }).first().tap();
    await page.waitForFunction(() => document.querySelector('.page[data-state=current]')?.id === 'save-the-date', null, { timeout: 4000, polling: POLL });
    const closedAt = await curtainScale();
    await page.waitForTimeout(1700);
    const movingAt = await curtainScale();
    await page.waitForTimeout(3700);
    const openAt = await curtainScale();
    const sd = await page.evaluate(() => {
      const root = document.querySelector('#save-the-date')!;
      const hearts = [...root.querySelectorAll<HTMLElement>('[data-heart-day]')];
      const visible = (el: Element) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && Number(getComputedStyle(el).opacity) > 0.9;
      };
      return {
        sr: root.querySelector('.sr-only')?.textContent ?? '',
        month: root.querySelector('.sd__month')?.textContent?.trim(),
        hearts: hearts.map((h) => Number(h.dataset.heartDay)),
        heartsShown: hearts.every((h) => visible(h.querySelector('.sd__heart')!)),
        button: visible(root.querySelector('.sd__cal')!),
        tieGone: getComputedStyle(root.querySelector('[data-tie]')!).visibility === 'hidden',
      };
    });
    check(
      'AC-16',
      'Save the Date: the curtains arrive closed and draw back by themselves (no tap) on April 2027, with red hearts on 6 and 7 April and Add to Calendar; the date is readable by screen readers',
      closedAt > 0.7 && movingAt < closedAt - 0.1 && openAt < 0.35 && sd.tieGone && sd.sr.includes('Wednesday, 7 April 2027') && sd.month === 'April 2027' && JSON.stringify(sd.hearts) === '[6,7]' && sd.heartsShown && sd.button,
      JSON.stringify({ closedAt, movingAt, openAt, ...sd }),
    );

    await page.getByRole('button', { name: 'Add to Calendar' }).tap();
    await page.waitForTimeout(500);
    const google = await page.locator('#calendar-wedding a[target="_blank"]').getAttribute('href');
    const params = new URL(google!).searchParams;
    const ics = await page.evaluate(async () => (await fetch('/calendar/wedding.ics')).text());
    const googleOk = params.get('dates') === '20270407T050000Z/20270407T050000Z' && params.get('ctz') === 'Asia/Kolkata';
    const icsOk = ics.includes('DTSTART;TZID=Asia/Kolkata:20270407T103000') && !ics.includes('DTEND') && ics.includes('BEGIN:VTIMEZONE');
    check('AC-15', 'Calendar entries start 10:30 AM IST with no invented end time (Google + .ics)', googleOk && icsOk, `${params.get('dates')} ${params.get('ctz')}`);
    await page.keyboard.press('Escape');
    await ctx.close();
  }

  /* AC-19 love-story gallery */
  {
    const ctx = await mobileContext(browser);
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await page.goto(BASE);
    await page.evaluate(() => sessionStorage.setItem('rdv:opened', '1'));
    await page.goto(`${BASE}#love-story`);
    await settle(page);
    await page.waitForTimeout(1500);
    const active = () => page.evaluate(() => [...document.querySelectorAll('[data-entry]')].findIndex((e) => e.classList.contains('is-active')));
    const box = (await page.locator('.ls__ring').boundingBox())!;
    const y = box.y + box.height / 2;
    await touchDrag(cdp, page, [300, y], [120, y], 12, 20);
    const one = await active();
    await touchDrag(cdp, page, [330, y], [30, y], 4, 8);
    const flick = await active();
    await page.locator('.ls__ring').focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(800);
    const key = await active();
    await page.getByRole('button', { name: 'Previous photo' }).tap();
    await page.waitForTimeout(800);
    const button = await active();
    await page.waitForTimeout(7000);
    const still = await active();
    check(
      'AC-19',
      'Gallery: one photo per swipe, two on a hard flick, keyboard and arrows work, it pauses after interaction (and carries on by itself later)',
      one === 1 && flick === 3 && key === 4 && button === 3 && still === 3 && (await current(page)) === 'love-story',
      JSON.stringify({ one, flick, key, button, still }),
    );
    await ctx.close();
  }

  /* AC-19b the Love Story page: the client's photographs ride the carousel inside the peacock frame's ring,
     the board names each milestone, the background's garlands sway, and no placeholder boxes remain */
  {
    const ctx = await mobileContext(browser);
    const page = await ctx.newPage();
    await page.goto(BASE);
    await page.evaluate(() => sessionStorage.setItem('rdv:opened', '1'));
    await page.goto(`${BASE}#love-story`);
    await settle(page);
    await page.waitForTimeout(1800);
    const s = await page.evaluate(() => {
      const cards = [...document.querySelectorAll<HTMLImageElement>('#love-story .ls__card img')];
      const active = document.querySelector<HTMLElement>('#love-story .ls__entry.is-active')!;
      const art = document.querySelector<HTMLImageElement>('#love-story .ls__art')!;
      const ring = document.querySelector<HTMLElement>('#love-story .ls__ring')!;
      const board = document.querySelector<HTMLElement>('#love-story .ls__board')!.getBoundingClientRect();
      const frame = document.querySelector<HTMLElement>('#love-story .ls__frame')!.getBoundingClientRect();
      return {
        photos: cards.length,
        loaded: cards.every((c) => c.complete && c.naturalWidth > 100),
        frameLoaded: art.complete && art.naturalWidth > 500,
        masked: /url/.test(getComputedStyle(ring).maskImage || getComputedStyle(ring).webkitMaskImage || ''),
        title: active.querySelector('.ls__milestone')!.textContent,
        line: (active.querySelector('.ls__story')!.textContent ?? '').length > 10,
        placeholder: /to be provided|Placeholder|Proposed|Photo to be/i.test(document.getElementById('love-story')!.textContent ?? ''),
        boardInside: board.left >= frame.left && board.right <= frame.right && board.top >= frame.top && board.bottom <= frame.bottom,
        canvases: document.querySelectorAll('#love-story .sbd__top canvas').length,
        onScreen: frame.left <= 0 && frame.right >= innerWidth,
      };
    });
    const c1 = await page.evaluate(() => document.querySelector<HTMLCanvasElement>('#love-story .sbd__top canvas')!.toDataURL().slice(-300));
    await page.waitForTimeout(1500);
    const c2 = await page.evaluate(() => document.querySelector<HTMLCanvasElement>('#love-story .sbd__top canvas')!.toDataURL().slice(-300));
    const first = await page.evaluate(() => document.querySelector('#love-story .ls__entry.is-active .ls__milestone')!.textContent);
    await page.waitForTimeout(4600);
    const later = await page.evaluate(() => document.querySelector('#love-story .ls__entry.is-active .ls__milestone')!.textContent);
    check(
      'AC-19b',
      'Love Story: five photographs in the peacock ring (masked to its opening), a board with each title and a line, garlands swaying, no placeholder boxes, and it moves on by itself',
      s.photos === 5 && s.loaded && s.frameLoaded && s.masked && s.title === 'Our First Meeting' && s.line && !s.placeholder && s.boardInside && s.canvases === 2 && c1 !== c2 && first !== later,
      JSON.stringify({ s, moved: c1 !== c2, first, later }),
    );
    await ctx.close();
  }

  /* AC-19c the Love Story board is tall and wide enough for large lettering: every milestone's title and story
     fit inside it (nothing clipped, nothing running into the gold curls at its ends), the title is at least 28px
     and the story at least 16.5px on a phone, and the frame still clears the dots and arrows on a small phone */
  {
    const rows: Record<string, unknown>[] = [];
    let ok = true;
    for (const [w, h] of [[390, 844], [360, 640]] as const) {
      const ctx = await mobileContext(browser, w, h);
      const page = await ctx.newPage();
      await page.goto(BASE);
      await page.evaluate(() => sessionStorage.setItem('rdv:opened', '1'));
      await page.goto(`${BASE}#love-story`);
      await settle(page);
      await page.waitForTimeout(1500);
      const r = await page.evaluate(() => {
        const board = document.querySelector<HTMLElement>('#love-story .ls__board')!;
        const b = board.getBoundingClientRect();
        const cs = getComputedStyle(board);
        const entries = [...board.querySelectorAll<HTMLElement>('.ls__entry')];
        // Show each entry in turn, without waiting for the fade, and measure its lettering against the cream's inner box
        const saved = entries.map((e) => e.className);
        const fits = entries.map((e) => {
          entries.forEach((o) => o.classList.toggle('is-active', o === e));
          const t = e.querySelector<HTMLElement>('.ls__milestone')!.getBoundingClientRect();
          const st = e.querySelector<HTMLElement>('.ls__story')!.getBoundingClientRect();
          const side = parseFloat(cs.paddingLeft);
          return t.top >= b.top && st.bottom <= b.bottom && t.left >= b.left + side - 1 && t.right <= b.right - side + 1 && st.left >= b.left + side - 1 && st.right <= b.right - side + 1;
        });
        entries.forEach((e, i) => (e.className = saved[i]));
        const f = document.querySelector<HTMLElement>('#love-story .ls__frame')!.getBoundingClientRect();
        const c = document.querySelector<HTMLElement>('#love-story .ls__controls')!.getBoundingClientRect();
        return {
          boardH: Math.round(b.height),
          title: parseFloat(getComputedStyle(entries[0].querySelector('.ls__milestone')!).fontSize),
          story: parseFloat(getComputedStyle(entries[0].querySelector('.ls__story')!).fontSize),
          fits,
          clears: f.bottom <= c.top + 1,
        };
      });
      rows.push({ w, h, ...r });
      if (!(r.fits.every(Boolean) && r.title >= (w === 390 ? 30 : 28) && r.story >= 16.5 && r.clears)) ok = false;
      await ctx.close();
    }
    check('AC-19c', 'Love Story board: all five titles and stories fit inside it in large lettering, and the frame clears the controls on a small phone', ok, JSON.stringify(rows));
  }

  /* AC-18c the temple behind the Countdown is shown at 97% strength (the client found a third too white) */
  {
    const ctx = await mobileContext(browser);
    const page = await ctx.newPage();
    await page.goto(BASE);
    await page.evaluate(() => sessionStorage.setItem('rdv:opened', '1'));
    await page.goto(`${BASE}#countdown`);
    await settle(page);
    await page.waitForTimeout(1200);
    const op = await page.evaluate(() => Number(getComputedStyle(document.querySelector('#countdown .cd__bg')!).opacity));
    check('AC-18c', 'Countdown: the temple background at 97% strength', op >= 0.96, String(op));
    await ctx.close();
  }

  const openedPage = async (hash: string, w = 390, h = 844) => {
    const ctx = await mobileContext(browser, w, h);
    const page = await ctx.newPage();
    await page.goto(BASE);
    await page.evaluate(() => {
      sessionStorage.setItem('rdv:opened', '1');
      localStorage.setItem('rdv:hint-seen', '1');
    });
    await page.goto(`${BASE}#${hash}`);
    await settle(page);
    await page.waitForTimeout(2600);
    return { ctx, page, cdp: await ctx.newCDPSession(page) };
  };
  const sheetFits = (id: string) =>
    (async (page: Page) =>
      page.evaluate((sheetId) => {
        const panel = document.querySelector<HTMLElement>(`#${sheetId} .sheet__panel`)!.getBoundingClientRect();
        const app = document.querySelector('.app')!.getBoundingClientRect();
        return panel.top >= app.top - 1 && panel.bottom <= app.bottom + 1 && panel.height <= app.height * 0.86 && !document.getElementById(sheetId)!.hidden;
      }, id)) as (page: Page) => Promise<boolean>;

  /* AC-18 Parents and Family, after the client's reference video: on the cream temple background (garlands and lamps swaying)
     with the courtyard temple faded behind it, two maroon-and-gold boards ("The Groom's Family", "The Bride's Family"), each
     over a card made of TWO BLOCKS side by side (the parents' photograph and the words about them) that read as one card at
     rest and, every few seconds and by tap, swipe, arrow key and dot, turn in OPPOSITE directions to the siblings */
  {
    // Opened by hand so the first faces can be read before the cards turn by themselves (3.2 s and 4.8 s in)
    const ctx = await mobileContext(browser);
    const page = await ctx.newPage();
    await page.goto(BASE);
    await page.evaluate(() => sessionStorage.setItem('rdv:opened', '1'));
    await page.goto(`${BASE}#welcome`);
    await settle(page);
    await page.evaluate(() => (location.hash = 'family'));
    await page.waitForFunction(() => document.querySelector('.page[data-state=current]')?.id === 'family', null, { timeout: 4000, polling: POLL });
    await page.waitForTimeout(1300);
    const front = (key: string) => page.evaluate((k) => document.querySelector<HTMLElement>(`#family [data-family=${k}] [data-cube]`)!.dataset.front, key);
    // a block's turn about its horizontal axis, in degrees (from its computed matrix): the photograph block's is + while it
    // brings the next face up from below, the words block's is − (the next face comes down from above)
    const angles = (key: string) =>
      page.evaluate((k) => {
        const turn = (sel: string) => {
          const m = new DOMMatrix(getComputedStyle(document.querySelector<HTMLElement>(`#family [data-family=${k}] ${sel} [data-cube-box]`)!).transform);
          return Math.round((Math.atan2(m.m23, m.m22) * 180) / Math.PI);
        };
        return { photo: turn('.fm__block--photo'), text: turn('.fm__block--text') };
      }, key);
    const read = () =>
      page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('#family [data-family]')].map((fam) => {
          const photoBlock = fam.querySelector<HTMLElement>('.fm__block--photo')!;
          const textBlock = fam.querySelector<HTMLElement>('.fm__block--text')!;
          const textFace = (c: number) => textBlock.querySelector<HTMLElement>(`[data-face][data-content="${c}"]`)!;
          const people = (face: HTMLElement) => [...face.querySelectorAll('.fm__person')].map((p) => `${p.querySelector('.fm__rel')?.textContent?.trim()}|${p.querySelector('.fm__name')?.textContent?.trim()}|${p.querySelector('.fm__work')?.textContent?.trim() ?? ''}`);
          const shots = [...photoBlock.querySelectorAll<HTMLImageElement>('img.fm__shot')];
          return {
            board: fam.querySelector('.fm__title')?.textContent?.trim(),
            partner: fam.querySelector('.fm__eyebrow')?.textContent?.trim(),
            parents: people(textFace(0)),
            siblings: people(textFace(1)),
            blocks: fam.querySelectorAll('[data-block]').length,
            dirs: [...fam.querySelectorAll<HTMLElement>('[data-block]')].map((b) => b.dataset.dir).join(),
            photoFaces: photoBlock.querySelectorAll('[data-face]').length,
            textFaces: textBlock.querySelectorAll('[data-face]').length,
            shots: shots.length,
            photosLoaded: shots.every((i) => i.complete && i.naturalWidth > 50),
            lotus: !!textFace(1).querySelector('.fm__orn svg'),
            dots: fam.querySelectorAll('[data-cube-dot]').length,
          };
        }),
      );
    const content = await read();
    const startFront = [await front('groom'), await front('bride')];
    await page.waitForFunction(() => document.querySelector<HTMLElement>('#family [data-family=groom] [data-cube]')!.dataset.front === '1', null, { timeout: 8000, polling: POLL });
    const groomBySelf = await front('groom');
    await page.waitForFunction(() => document.querySelector<HTMLElement>('#family [data-family=bride] [data-cube]')!.dataset.front === '1', null, { timeout: 8000, polling: POLL });
    const brideBySelf = await front('bride');
    await page.waitForTimeout(1400); // the turns finish
    // by hand: the arrow key, a tap, a dot
    await page.locator('#family [data-family=groom] [data-cube]').focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(1300);
    const afterKey = await front('groom'); // siblings → parents
    const box = (await page.locator('#family [data-family=groom] [data-cube]').boundingBox())!;
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(1300);
    const afterTap = await front('groom'); // parents → siblings
    await page.locator('#family [data-family=groom] [data-cube-dot]').nth(0).dispatchEvent('click');
    await page.waitForTimeout(1500);
    const afterDot = await front('groom'); // → parents
    const rest = await angles('groom');
    // the two blocks turn in opposite directions: mid-turn the photograph block's angle is + and the words block's is −
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(450);
    const mid = await angles('groom');
    await page.waitForTimeout(1200);
    const after = await angles('groom');
    check(
      'AC-18a',
      'Parents and Family: two boards ("The Groom\'s Family", "The Bride\'s Family"), each over a card of two blocks (the parents\' photograph, and the father\'s and mother\'s names and work) with a siblings face; the blocks turn in OPPOSITE directions; the card turns by itself, and by arrow key, tap and dot',
      content.length === 2 &&
        content[0].board === "The Groom's Family" &&
        content[1].board === "The Bride's Family" &&
        content[0].partner === 'Rahul' &&
        content[1].partner === 'Divya' &&
        JSON.stringify(content[0].parents) === JSON.stringify(['Father|Ravichandran|College Principal', 'Mother|Sopna|College Lecturer']) &&
        JSON.stringify(content[1].parents) === JSON.stringify(['Father|Ravichandran|Businessman', 'Mother|Kanimalar|Teacher']) &&
        content.every((c) => c.blocks === 2 && c.dirs === '1,-1' && c.photoFaces === 4 && c.textFaces === 4 && c.shots === 4 && c.photosLoaded && c.dots === 2 && c.lotus && c.siblings.length === 1 && /^Sibling of the (Groom|Bride)\|Name to be provided/.test(c.siblings[0])) &&
        startFront.join() === '0,0' &&
        groomBySelf === '1' &&
        brideBySelf === '1' &&
        afterKey === '0' &&
        afterTap === '1' &&
        afterDot === '0' &&
        rest.photo === 0 &&
        rest.text === 0 &&
        mid.photo > 15 &&
        mid.text < -15 &&
        after.photo === 90 &&
        after.text === -90,
      JSON.stringify({ content, startFront, groomBySelf, brideBySelf, afterKey, afterTap, afterDot, rest, mid, after }),
    );

    // The backdrop and the fit: the cream stage with its garlands swaying and the faded temple; at rest the two blocks make one card with one gold divider; every face's writing inside its paper
    const look = await page.evaluate(() => {
      const temple = document.querySelector<HTMLElement>('#family .fm__temple')!;
      const canvases = document.querySelectorAll('#family .sbd__top canvas').length;
      const faces = [...document.querySelectorAll<HTMLElement>('#family [data-face]')];
      const fits = faces.map((f) => {
        const paper = f.querySelector<HTMLElement>('.fm__paper')!;
        const pr = { w: paper.clientWidth, h: paper.clientHeight };
        const inside = [...f.querySelectorAll<HTMLElement>('.fm__tag, .fm__person, .fm__orn')].every((e) => {
          const top = e.offsetTop, left = e.offsetLeft;
          return left >= -1 && left + e.offsetWidth <= pr.w + 1 && top >= -1 && top + e.offsetHeight <= pr.h + 1;
        });
        return inside && paper.scrollHeight <= paper.clientHeight + 1;
      });
      const gold = faces.every((f) => /linear-gradient/.test(getComputedStyle(f).backgroundImage) && parseFloat(getComputedStyle(f).paddingTop) >= 4);
      const boards = [...document.querySelectorAll<HTMLElement>('#family .fm__board')].map((b) => b.getBoundingClientRect());
      const cubes = [...document.querySelectorAll<HTMLElement>('#family .fm__cube')].map((c) => c.getBoundingClientRect());
      const joined = [...document.querySelectorAll<HTMLElement>('#family .fm__cube')].map((c) => {
        const a = c.querySelector<HTMLElement>('.fm__block--photo')!.getBoundingClientRect();
        const b = c.querySelector<HTMLElement>('.fm__block--text')!.getBoundingClientRect();
        return Math.abs(a.right - b.left) <= 1.5 && Math.abs(a.top - b.top) <= 1 && Math.abs(a.height - b.height) <= 1 && a.width > 0.35 * (a.width + b.width);
      });
      const lotus = document.querySelector<HTMLElement>('.chrome-btn')!.getBoundingClientRect();
      const folio = document.querySelector<HTMLElement>('.folio')!.getBoundingClientRect();
      return {
        temple: Number(getComputedStyle(temple).opacity),
        canvases,
        fits,
        gold,
        joined,
        order: boards[0].bottom <= cubes[0].top + 14 && cubes[0].bottom <= boards[1].top + 14 && boards[1].bottom <= cubes[1].top + 14,
        clear: boards[0].top >= lotus.bottom - 2 && cubes[1].bottom <= folio.top + 2,
        inside: boards.every((b) => b.left >= 0 && b.right <= innerWidth) && cubes.every((c) => c.left >= 0 && c.right <= innerWidth),
        cubeH: cubes.map((c) => Math.round(c.height)),
      };
    });
    check(
      'AC-18b',
      'Parents and Family: the temple is held back (faded to 40–75%) on the cream wall with its garlands swaying; the two blocks of each card meet as one card; each face has a gold border and all its writing inside; the boards and cards stack clear of the Contents button and the page number',
      look.temple >= 0.4 && look.temple <= 0.75 && look.canvases >= 2 && look.fits.every(Boolean) && look.gold && look.joined.every(Boolean) && look.order && look.clear && look.inside,
      JSON.stringify(look),
    );
    await ctx.close();
  }

  /* AC-18d the Parents cards on the smallest and the largest phones: all writing inside every face, the cards inside the
     screen and clear of the Contents button and the page number, the names and work large enough to read */
  for (const [w, h] of [
    [360, 640],
    [375, 667],
    [430, 932],
  ]) {
    const { ctx, page } = await openedPage('family', w, h);
    const fit = await page.evaluate(() => {
      const faces = [...document.querySelectorAll<HTMLElement>('#family [data-face]')];
      const writing = faces.every((f) => {
        const paper = f.querySelector<HTMLElement>('.fm__paper')!;
        return paper.scrollHeight <= paper.clientHeight + 1 && paper.scrollWidth <= paper.clientWidth + 1 && [...f.querySelectorAll<HTMLElement>('.fm__tag, .fm__person, .fm__orn')].every((e) => e.offsetLeft >= -1 && e.offsetLeft + e.offsetWidth <= paper.clientWidth + 1 && e.offsetTop >= -1 && e.offsetTop + e.offsetHeight <= paper.clientHeight + 1);
      });
      const name = Math.min(...[...document.querySelectorAll<HTMLElement>('#family .fm__name')].map((e) => parseFloat(getComputedStyle(e).fontSize)));
      const work = Math.min(...[...document.querySelectorAll<HTMLElement>('#family .fm__work')].map((e) => parseFloat(getComputedStyle(e).fontSize)));
      const cubes = [...document.querySelectorAll<HTMLElement>('#family .fm__cube')].map((c) => c.getBoundingClientRect());
      const boards = [...document.querySelectorAll<HTMLElement>('#family .fm__board')].map((b) => b.getBoundingClientRect());
      const lotus = document.querySelector<HTMLElement>('.chrome-btn')!.getBoundingClientRect();
      const folio = document.querySelector<HTMLElement>('.folio')!.getBoundingClientRect();
      return {
        writing,
        name,
        work,
        clear: boards[0].top >= lotus.bottom - 2 && cubes[1].bottom <= folio.top + 2 && cubes[0].bottom <= boards[1].top + 14,
        inside: cubes.every((c) => c.left >= 0 && c.right <= innerWidth) && boards.every((b) => b.left >= 0 && b.right <= innerWidth),
        cubeH: cubes.map((c) => Math.round(c.height)),
      };
    });
    check(`AC-18d@${w}x${h}`, `Parents and Family at ${w}×${h}: every face's writing inside it (names at least 13px, work at least 11px), the cards inside the screen and clear of the Contents button and the page number`, fit.writing && fit.name >= 13 && fit.work >= 11 && fit.clear && fit.inside, JSON.stringify(fit));
    await ctx.close();
  }

  /* AC-20 every event shows its details; Details opens the venue and calendar actions: Location waits for a
     venue, Calendar waits for confirmation */
  {
    const { ctx, page } = await openedPage('events');
    const read = (pageId: string) =>
      page.evaluate((pid) => {
        return [...document.querySelectorAll<HTMLElement>(`#${pid} .ev__item`)].map((item) => ({
          id: item.dataset.event,
          // The Engagement has no event yet: its name and "Details to be provided"
          text:
            item.dataset.event === 'engagement'
              ? /Engagement/.test(item.querySelector('.ev__name')?.textContent ?? '') && /Details to be provided/.test(item.querySelector('.ev__date')?.textContent ?? '') && !!item.querySelector('.ev__loc')
              : !!item.querySelector('.ev__name')?.textContent && !!item.querySelector('.ev__date')?.textContent && /IST/.test(item.querySelector('.ev__time')?.textContent ?? '') && !!item.querySelector('.ev__loc'),
          visible: Number(getComputedStyle(item.querySelector('.ev__name')!).opacity) > 0.95,
          onScreen: (() => {
            const r = item.querySelector('.ev__disc')!.getBoundingClientRect();
            return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight;
          })(),
        }));
      }, pageId);
    await page.waitForTimeout(4200);
    const part1 = await read('events');
    await page.evaluate(() => (location.hash = 'events-wedding'));
    await page.waitForTimeout(150);
    await settle(page);
    await page.waitForTimeout(5600);
    const part2 = await read('events-wedding');
    const rows = [...part1, ...part2];
    check('AC-20a', 'All six medallions of the picture appear (Engagement, Haldi, Mehndi; Sangeet, Wedding, Reception) with name, date, IST time and venue (the Engagement: its name and "Details to be provided"), fully on screen', rows.length === 6 && rows.every((r) => r.text && r.visible && r.onScreen), JSON.stringify(rows));

    const sheet = (id: string) =>
      page.evaluate((eid) => {
        const sh = document.getElementById(`event-${eid}`)!;
        const action = (label: string) => [...sh.querySelectorAll<HTMLElement>('.ev-action')].find((a) => a.textContent?.includes(label))!;
        return { location: action('Location').getAttribute('aria-disabled') === 'true', calendar: action('Calendar').getAttribute('aria-disabled') !== 'true' };
      }, id);
    const all = await Promise.all(['mehndi', 'haldi', 'sangeet', 'wedding', 'reception'].map(async (id) => [id, await sheet(id)] as const));
    // Only the wedding venue is known (the Tirupati temple): its Location is a live link; the others wait for a venue
    const okSheets = all.filter(([, a]) => a.location).map(([id]) => id).join() === 'mehndi,haldi,sangeet,reception' && all.filter(([, a]) => a.calendar).map(([id]) => id).join() === 'wedding';
    await page.locator('#events-wedding .ev__item[data-event="wedding"] .ev__open').tap();
    await page.waitForTimeout(500);
    const detailsFit = await sheetFits('event-wedding')(page);
    const weddingLocation = await page.evaluate(() => {
      const a = [...document.querySelectorAll<HTMLAnchorElement>('#event-wedding a.ev-action')].find((x) => x.textContent?.includes('Location'));
      return a ? { href: a.href, target: a.target } : null;
    });
    await page.locator('#event-wedding .ev-action', { hasText: 'Calendar' }).tap();
    await page.waitForTimeout(500);
    const calendarOpen = await page.evaluate(() => !document.getElementById('calendar-wedding')!.hidden);
    check('AC-20b', 'Each event opens its details: the wedding\'s Location opens Google Maps on the Tirupati main temple, the other events\' wait for a venue, Calendar only for the confirmed wedding; the sheet fits', okSheets && detailsFit && /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=Sri\+Venkateswara\+Swamy\+Temple/.test(weddingLocation?.href ?? '') && weddingLocation?.target === '_blank' && calendarOpen, JSON.stringify({ all, detailsFit, weddingLocation, calendarOpen }));
    // close the calendar sheet and then the event's details (each Escape closes the top one)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(450);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(450);
    // Each medallion has its own blinking Location button; with no confirmed venue it says why (a toast)
    const locs = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('#events-wedding .ev__item, #events .ev__item')].map((item) => {
        const b = item.querySelector<HTMLElement>('.ev__loc');
        const r = b?.getBoundingClientRect();
        return { id: item.dataset.event, there: !!b, blinking: !!b && getComputedStyle(b).animationName === 'ev-blink', message: b?.dataset.disabledMessage ?? null, wide: item.closest('#events-wedding') ? !!r && r.width >= 60 && r.height >= 13 : true };
      }),
    );
    await page.locator('#events-wedding .ev__item[data-event="sangeet"] .ev__loc').tap({ force: true });
    await page.waitForTimeout(300);
    const locToast = await page.locator('[data-toast]').textContent();
    const nameSizes = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('#events .ev__name, #events-wedding .ev__name')].map((n) => parseFloat(getComputedStyle(n).fontSize) / (n.closest<HTMLElement>('.ev__item')!.getBoundingClientRect().width / 100)));
    check(
      'AC-20c',
      'Every medallion has a large, bold name and a blinking Location button; one with no confirmed venue says why when tapped (the wedding\'s is live)',
      locs.length === 6 && locs.every((l) => l.there && l.blinking && l.wide && (l.message || l.id === 'wedding')) && /venue is confirmed/.test(locToast ?? '') && nameSizes.length === 6 && nameSizes.every((n) => n >= 14),
      JSON.stringify({ locs, locToast, nameSizes }),
    );
    const rings = await page.evaluate(() => {
      const circles = [...document.querySelectorAll<SVGCircleElement>('#events-wedding .ev__ring-line')];
      return { n: circles.length, len: Math.min(...circles.map((c) => c.getTotalLength())) };
    });
    check('PH3-thread', 'A bright gold ring draws round each medallion in turn (3 rings on the second page)', rings.n === 3 && rings.len > 100, JSON.stringify(rings));
    await ctx.close();
  }

  /* AC-47 Venue and Travel, one page on the temple courtyard (sky, gopuram and steps between pillars and jasmine-and-rose malas, with
     bells; no carved arch): the picture comes in first, then the title and the map card (frosted glass: Google's map of the Tirupati
     main temple, its name and a glowing Get Directions), then Travel & Stay in three lines, each with an arrow that opens the route
     to the temple (the stay waits for its details); no photo placeholder and no tabs; the malas and swag then stir */
  {
    const ctx = await mobileContext(browser);
    const page = await ctx.newPage();
    await page.goto(BASE);
    await page.evaluate(() => sessionStorage.setItem('rdv:opened', '1'));
    await page.goto(`${BASE}#dress-code`);
    await settle(page);
    await page.waitForTimeout(800);
    // the map starts loading as the guest reaches the page before this one
    const earlyMap = await page.evaluate(() => !!document.querySelector('#venues [data-map]'));
    // note when each part first shows (a frame-by-frame sampler), then turn to the page
    await page.evaluate(() => {
      const w = window as unknown as { __seq: Record<string, number> };
      w.__seq = {};
      const halves = [...document.querySelectorAll<HTMLElement>('#venues .vt__half')];
      const cards = [...document.querySelectorAll<HTMLElement>('#venues [data-card]')];
      const op = (e: HTMLElement) => Number(getComputedStyle(e).opacity);
      const t0 = performance.now();
      const mark = (k: string, ok: boolean) => ok && w.__seq[k] === undefined && (w.__seq[k] = Math.round(performance.now() - t0));
      const tick = () => {
        mark('pillars', halves.every((h) => op(h) > 0.9));
        mark('venue', op(cards[0]) > 0.5);
        mark('travel', op(cards[1]) > 0.5);
        if (performance.now() - t0 < 9000) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      location.hash = 'venues';
    });
    await page.waitForFunction(() => document.querySelector('.page[data-state=current]')?.id === 'venues', null, { timeout: 5000, polling: POLL });
    await page.waitForTimeout(5200);
    const seq = await page.evaluate(() => (window as unknown as { __seq: Record<string, number> }).__seq);
    const v = await page.evaluate(() => {
      const root = document.getElementById('venues')!;
      const map = root.querySelector<HTMLIFrameElement>('[data-map]');
      const go = root.querySelector<HTMLAnchorElement>('.vt__go');
      const rects = (sel: string) => root.querySelector<HTMLElement>(sel)!.getBoundingClientRect();
      const door = rects('[data-door]');
      const venue = rects('[data-card=venue]');
      const travel = rects('[data-card=travel]');
      const folio = document.querySelector<HTMLElement>('.folio')!.getBoundingClientRect();
      const lotus = document.querySelector<HTMLElement>('.chrome-btn')!.getBoundingClientRect();
      const title = rects('.vt__title');
      const stills = [...root.querySelectorAll<HTMLImageElement>('.vt__still')];
      const glass = (e: Element) => {
        const cs = getComputedStyle(e);
        return /blur\(/.test(cs.backdropFilter || (cs as unknown as { webkitBackdropFilter: string }).webkitBackdropFilter || '') && /rgba\(/.test(cs.backgroundImage + cs.backgroundColor) && !/^rgb\(/.test(cs.backgroundColor);
      };
      const rowEls = [...root.querySelectorAll<HTMLElement>('.vt__row')];
      const arrow = (r: HTMLElement) => r.querySelector<HTMLElement>('.vt__arrow')!.getBoundingClientRect();
      const goStyle = go ? getComputedStyle(go) : null;
      return {
        heading: root.querySelector('.vt__title')?.textContent?.replace(/\s+/g, ' ').trim(),
        mapSrc: map?.src ?? null,
        mapTitle: map?.title ?? null,
        mapStill: map ? getComputedStyle(map).pointerEvents === 'none' : false,
        goHref: go?.href ?? null,
        goTarget: go?.target ?? null,
        goText: go?.textContent?.replace(/\s+/g, ' ').trim(),
        goAnimated: !!goStyle && /vt-glow/.test(goStyle.animationName) && /vt-sheen/.test(getComputedStyle(go!, '::after').animationName),
        name: root.querySelector('.vt__name')?.textContent?.trim(),
        rows: rowEls.map((r) => `${r.querySelector('.vt__row-title')?.textContent?.trim()}|${r.querySelector('.vt__row-summary')?.textContent?.trim()}`),
        rowTags: rowEls.map((r) => r.tagName),
        rowHrefs: rowEls.map((r) => (r as HTMLAnchorElement).href || null),
        rowTargets: rowEls.map((r) => (r as HTMLAnchorElement).target || null),
        rowsTall: rowEls.every((r) => r.getBoundingClientRect().height >= 44),
        arrows: rowEls.every((r) => arrow(r).width >= 30 && arrow(r).height >= 30 && arrow(r).right <= r.getBoundingClientRect().right + 1),
        stayDisabled: rowEls[2]?.getAttribute('aria-disabled') === 'true' && rowEls[2]?.dataset.disabledMessage === 'Stay details will be shared soon',
        glass: glass(root.querySelector('.vt__card--venue')!) && glass(root.querySelector('.vt__card--travel')!) && glass(root.querySelector('.vt__title')!),
        leftovers: /R·D|To be provided|Venue photograph|Illustrated map/i.test(root.textContent ?? '') || root.querySelectorAll('[role=tab], .vn__tab').length > 0,
        // the courtyard picture (sky, temple, steps) and not the carved-arch entrance picture
        courtyard: stills.length === 2 && stills.every((i) => i.complete && i.naturalWidth >= 900 && /courtyard/.test(i.currentSrc) && !/frame/.test(i.currentSrc)),
        arch: !!root.querySelector('img[src*="frame"], img[srcset*="frame"], source[srcset*="frame"]'),
        winds: [...root.querySelectorAll<HTMLElement>('.vt__wind')].filter((w) => w.style.rotate !== '').length,
        layout:
          door.left >= 0 && door.right <= innerWidth && venue.bottom <= travel.top + 1 && travel.bottom <= door.bottom + 1 && travel.bottom <= folio.top + 2 && title.top >= lotus.bottom - 6 && venue.height > 120,
      };
    });
    // the Get Directions button glows: its shadow changes as it pulses
    const glow1 = await page.evaluate(() => getComputedStyle(document.querySelector('#venues .vt__go')!).boxShadow);
    await page.waitForTimeout(950);
    const glow2 = await page.evaluate(() => getComputedStyle(document.querySelector('#venues .vt__go')!).boxShadow);
    // the stay's arrow says its details are coming
    await page.locator('#venues .vt__row').nth(2).tap({ force: true });
    await page.waitForTimeout(400);
    const toast = await page.evaluate(() => document.querySelector('[data-toast]')?.textContent?.trim());
    check(
      'AC-47',
      'Venue and Travel: the courtyard (sky, temple, steps; no carved arch) comes first, then the glass map card, then Travel & Stay; Google\'s map of the Tirupati main temple loaded early, a glowing Get Directions; Airport and Railway each with an arrow that opens the route to the temple, Stay waiting; no photo placeholder or tabs; the malas stir',
      earlyMap &&
        seq.pillars !== undefined &&
        seq.venue !== undefined &&
        seq.travel !== undefined &&
        seq.pillars < seq.venue &&
        seq.venue < seq.travel &&
        v.heading === 'Venue & Travel' &&
        /^https:\/\/maps\.google\.com\/maps\?q=Sri%20Venkateswara%20Swamy%20Temple%2C%20Tirumala/.test(v.mapSrc ?? '') &&
        /output=embed/.test(v.mapSrc ?? '') &&
        /Tirupati Temple/.test(v.mapTitle ?? '') &&
        v.mapStill &&
        /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=Sri\+Venkateswara\+Swamy\+Temple/.test(v.goHref ?? '') &&
        v.goTarget === '_blank' &&
        v.goText === 'Get Directions' &&
        v.goAnimated &&
        glow1 !== glow2 &&
        v.name === 'Tirupati Temple' &&
        JSON.stringify(v.rows) === JSON.stringify(['Airport|Tirupati International Airport (TIR), Renigunta', 'Railway|Tirupati Main (TPTY) · Renigunta Junction (RU)', 'Stay|To be announced']) &&
        JSON.stringify(v.rowTags) === JSON.stringify(['A', 'A', 'BUTTON']) &&
        /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&origin=Tirupati%20International%20Airport.*&destination=Sri%20Venkateswara%20Swamy%20Temple/.test(v.rowHrefs[0] ?? '') &&
        /origin=Tirupati%20Railway%20Station.*destination=Sri%20Venkateswara%20Swamy%20Temple/.test(v.rowHrefs[1] ?? '') &&
        v.rowTargets[0] === '_blank' &&
        v.rowTargets[1] === '_blank' &&
        v.rowsTall &&
        v.arrows &&
        v.stayDisabled &&
        toast === 'Stay details will be shared soon' &&
        v.glass &&
        !v.leftovers &&
        v.courtyard &&
        !v.arch &&
        v.winds >= 5 &&
        v.layout,
      JSON.stringify({ earlyMap, seq, v, glow1: glow1.slice(0, 60), glow2: glow2.slice(0, 60), toast }),
    );
    await ctx.close();
  }

  /* AC-47b the page fits every phone: the map card and Travel & Stay stack inside the doorway and clear of the page number */
  {
    const rows: Record<string, unknown>[] = [];
    let ok = true;
    for (const [w, h] of [[360, 640], [375, 667], [390, 844], [430, 932]] as const) {
      const { ctx, page } = await openedPage('venues', w, h);
      await page.waitForTimeout(2600);
      const r = await page.evaluate(() => {
        const root = document.getElementById('venues')!;
        const q = (s: string) => root.querySelector<HTMLElement>(s)!.getBoundingClientRect();
        const door = q('[data-door]');
        const venue = q('[data-card=venue]');
        const travel = q('[data-card=travel]');
        const map = q('.vt__map');
        const go = q('.vt__go');
        const folio = document.querySelector<HTMLElement>('.folio')!.getBoundingClientRect();
        const texts = [...root.querySelectorAll<HTMLElement>('.vt__name, .vt__row-summary, .vt__row-title')];
        return {
          doorW: Math.round(door.width),
          mapH: Math.round(map.height),
          stacked: venue.bottom <= travel.top + 1 && travel.bottom <= door.bottom + 1 && travel.bottom <= folio.top + 2,
          mapOk: map.height >= 80 && map.width >= door.width * 0.8,
          goOk: go.height >= 38 && go.height < 60 && go.left >= door.left && go.right <= door.right + 1,
          textOk: texts.every((e) => e.scrollWidth <= e.clientWidth + 1),
        };
      });
      rows.push({ w, h, ...r });
      if (!(r.stacked && r.mapOk && r.goOk && r.textOk && r.doorW >= 235)) ok = false;
      await ctx.close();
    }
    check('AC-47b', 'Venue and Travel fits 360 × 640 to 430 × 932: the cards at least 235 px wide, a map at least 80 px high, Get Directions on one line inside them, nothing cut, clear of the page number', ok, JSON.stringify(rows));
  }

  /* AC-48 the page number and arrows are a pane of frosted glass on every page (the page shows through, blurred, while the number
     and arrows stay deep maroon on a pale pane), with the touch targets unchanged */
  {
    const rows: Record<string, unknown>[] = [];
    let ok = true;
    for (const id of ['welcome', 'events', 'venues', 'thank-you']) {
      const { ctx, page } = await openedPage(id, 390, 844);
      const f = await page.evaluate(() => {
        const folio = document.querySelector<HTMLElement>('.folio')!;
        const cs = getComputedStyle(folio);
        const blur = cs.backdropFilter || (cs as unknown as { webkitBackdropFilter: string }).webkitBackdropFilter || '';
        const alphas = [...cs.backgroundImage.matchAll(/rgba\(\d+, \d+, \d+, ([\d.]+)\)/g)].map((m) => Number(m[1]));
        const btn = folio.querySelector<HTMLElement>('[data-next]')!.getBoundingClientRect();
        const num = getComputedStyle(folio.querySelector('.folio__number')!);
        return { blur, maxAlpha: Math.max(...alphas, 0), translucent: alphas.length > 0 && Math.max(...alphas) < 0.8, bg: cs.backgroundColor, tap: Math.min(btn.width, btn.height), numColor: num.color, arrow: getComputedStyle(folio.querySelector('[data-next]')!).color };
      });
      rows.push({ id, ...f });
      if (!(/blur\(/.test(f.blur) && f.translucent && f.tap >= 44 && f.numColor === 'rgb(94, 14, 28)')) ok = false;
      await ctx.close();
    }
    check('AC-48', 'The page number and arrows are frosted glass on every page (blurred, translucent, at least 44 px to touch, the number in deep maroon)', ok, JSON.stringify(rows));
  }

  /* AC-20d the date and time on each event's disc are larger (13.4% of the disc's content width, 29% more than before), each date
     on one line, and stay inside the disc, clear of the Location button */
  {
    const rows: Record<string, unknown>[] = [];
    let ok = true;
    for (const [id, w, h] of [['events', 360, 640], ['events-wedding', 360, 640], ['events', 375, 667], ['events-wedding', 375, 667], ['events', 390, 844], ['events-wedding', 390, 844], ['events-wedding', 430, 932]] as const) {
      const { ctx, page } = await openedPage(id, w, h);
      const r = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('.page[data-state=current] .ev__item')].map((item) => {
          const d = item.querySelector<HTMLElement>('.ev__disc')!.getBoundingClientRect();
          const date = item.querySelector<HTMLElement>('.ev__date')!;
          const time = item.querySelector<HTMLElement>('.ev__time');
          const locEl = item.querySelector<HTMLElement>('.ev__loc')!;
          const inside = (e: Element) => {
            const b = e.getBoundingClientRect();
            const cx = d.left + d.width / 2;
            const cy = d.top + d.height / 2;
            const rad = d.width / 2;
            return [[b.left, b.top], [b.right, b.top], [b.left, b.bottom], [b.right, b.bottom]].every(([x, y]) => Math.hypot(x - cx, y - cy) <= rad * 0.98);
          };
          // a rounded pill: its two ends and its bottom middle are what must lie inside the disc
          const pillInside = (e: Element) => {
            const b = e.getBoundingClientRect();
            const cx = d.left + d.width / 2;
            const cy = d.top + d.height / 2;
            const rad = d.width / 2;
            return [[b.left, b.top + b.height / 2], [b.right, b.top + b.height / 2], [b.left + b.width / 2, b.bottom]].every(([x, y]) => Math.hypot(x - cx, y - cy) <= rad * 0.98);
          };
          return {
            id: item.dataset.event,
            datePx: Math.round(parseFloat(getComputedStyle(date).fontSize) * 10) / 10,
            timePx: time ? Math.round(parseFloat(getComputedStyle(time).fontSize) * 10) / 10 : null,
            ratio: Math.round((parseFloat(getComputedStyle(date).fontSize) / d.width) * 1000) / 1000,
            oneLine: !item.querySelector('.ev__time') || date.getBoundingClientRect().height < parseFloat(getComputedStyle(date).lineHeight) * 1.5,
            dateOk: inside(date),
            timeOk: !time || inside(time),
            locOk: pillInside(locEl),
            clear: !time || time.getBoundingClientRect().bottom <= locEl.getBoundingClientRect().top + 1,
          };
        }),
      );
      rows.push({ id, w, h, r });
      for (const e of r) if (!(e.datePx >= 8.8 && (e.timePx === null || e.timePx >= 8.8) && e.ratio >= 0.088 && e.oneLine && e.dateOk && e.timeOk && e.locOk && e.clear)) ok = false;
      await ctx.close();
    }
    check('AC-20d', "Events: the date and time on each disc are 29% larger than before (at least 8.8 px on the smallest phone, 13 to 16 px on a large one) and 8.8% of the disc's width (they were 7.8%), each date on one line, inside the disc and clear of the Location button, from 360 × 640 to 430 × 932", ok, JSON.stringify(rows));
  }

  /* ================================================ Phase 4: guest forms and backend ================================================ */
  // Uses the dev server's API (/api) and its test hooks (/api/__dev/*); the local store is reset first.

  const dev = async (page: Page, action: string, body?: unknown) =>
    (await page.request.post(`${BASE}api/__dev/${action}`, { data: body ?? {} })).json() as Promise<Record<string, unknown> & unknown[]>;
  const admin = async (page: Page, path: string) =>
    (await page.request.get(`${BASE}api/admin/${path}`, { headers: { Authorization: 'Bearer dev-admin' } })).json() as Promise<{
      totals: { responses: number; headcount: number };
      rsvps: { guest_name: string; attendance: string }[];
      pendingWishes: { id: string; name: string }[];
      approvedCount: number;
    }>;
  const publicWishes = async (page: Page) => ((await (await page.request.get(`${BASE}api/wishes?limit=50`)).json()) as { total: number }).total;
  const toastText = (page: Page) => page.evaluate(() => document.querySelector('[data-toast]')?.textContent ?? '');

  /* AC-23 a blessing confirms only after it is stored, stays private until approved, survives an error, and hangs on the wall with the temple bell */
  {
    const { ctx, page } = await openedPage('wishes');
    await dev(page, 'reset');
    await page.evaluate(() => {
      const w = window as unknown as { __dings: number };
      w.__dings = 0;
      const start = AudioBufferSourceNode.prototype.start;
      AudioBufferSourceNode.prototype.start = function (...args: Parameters<typeof start>) {
        w.__dings++;
        return start.apply(this, args);
      };
    });
    await page.waitForFunction(() => document.querySelector('#wishes .ww__doors')?.classList.contains('is-open'), null, { timeout: 8000, polling: POLL });
    await page.locator('#wishes .ww__field--name input').fill('Meera Iyer');
    await page.locator('#wishes .ww__field--wish textarea').fill('May your life together be as bright as a thousand diyas.');
    await dev(page, 'fail', { count: 1, status: 500 });
    await page.locator('#wishes [data-submit]').tap();
    await page.waitForFunction(() => !!document.querySelector('#wishes [data-form-status]')?.textContent, null, { timeout: 15000, polling: POLL });
    const failed = await page.evaluate(() => ({
      status: document.querySelector('#wishes [data-form-status]')!.textContent,
      kept: (document.querySelector('#wishes textarea') as HTMLTextAreaElement).value.length > 0,
      done: !!document.querySelector('#wishes [data-form-ok]')!.textContent,
      label: document.querySelector('#wishes [data-submit] .btn-label')!.textContent,
      hung: document.querySelectorAll('#wishes .ww__board.is-mine').length,
    }));
    const storedAfterFailure = (await admin(page, 'summary')).pendingWishes.length;
    // Double tap on Retry: only one blessing may be stored (AC-27).
    await page.evaluate(() => {
      const form = document.querySelector<HTMLFormElement>('[data-wish-form]')!;
      form.requestSubmit();
      form.requestSubmit();
    });
    await page.waitForFunction(() => !!document.querySelector('#wishes [data-form-ok]')?.textContent, null, { timeout: 15000, polling: POLL });
    const pending = (await admin(page, 'summary')).pendingWishes;
    check(
      'AC-23',
      'Blessing: error keeps the text and offers Try again; success only after storage; hidden from others until approved',
      /couldn't save/.test(failed.status ?? '') && failed.kept && !failed.done && failed.label === 'Try again' && failed.hung === 0 && storedAfterFailure === 0 && pending.length === 1 && (await publicWishes(page)) === 0,
      JSON.stringify({ failed, storedAfterFailure, pending: pending.length }),
    );

    /* AC-39 the new blessing is lowered on its own chain into the first place with the temple bell's ding, and the form is emptied */
    await page.waitForTimeout(2300);
    const hung = await page.evaluate(() => {
      const boards = [...document.querySelectorAll<HTMLElement>('#wishes .ww__board')];
      const first = boards.find((b) => b.classList.contains('is-mine'))!;
      const r = first.getBoundingClientRect();
      return {
        boards: boards.length,
        place: first.style.getPropertyValue('--x'),
        text: first.querySelector('.ww__msg')!.textContent,
        by: first.querySelector('.ww__by')!.textContent,
        onScreen: r.left >= 0 && r.right <= innerWidth && r.top >= 0,
        dings: (window as unknown as { __dings: number }).__dings,
        emptied: (document.querySelector('#wishes textarea') as HTMLTextAreaElement).value === '' && (document.querySelector('#wishes .ww__field--name input') as HTMLInputElement).value === '',
        placeholder: document.querySelectorAll('#wishes .ww__board [data-open-dialog]').length,
      };
    });
    check(
      'AC-39',
      'A sent blessing hangs on the wall as a new board in the first place with its name, the bell dings once, and the form empties',
      hung.boards >= 1 && hung.boards <= 4 && hung.place === '20' && hung.text === 'May your life together be as bright as a thousand diyas.' && hung.by === '— Meera Iyer' && hung.onScreen && hung.dings === 1 && hung.emptied,
      JSON.stringify(hung),
    );

    /* AC-24 View All shows approved blessings only (with names and dates), 20 at a time, in an independent scroller with a close button */
    await page.request.post(`${BASE}api/admin/wishes/${pending[0].id}`, { headers: { Authorization: 'Bearer dev-admin' }, data: { status: 'approved' } });
    for (let i = 0; i < 24; i++)
      await page.request.post(`${BASE}api/wishes`, {
        headers: { 'Idempotency-Key': `qa-seed-wish-${String(i).padStart(4, '0')}`, 'CF-Connecting-IP': `198.51.100.${i}` }, // one address each, below the rate limit
        data: { name: `Guest ${i + 1}`, message: `Warm blessings to the couple, number ${i + 1}.`, website: '', elapsedMs: 5000 },
      });
    await page.request.post(`${BASE}api/wishes`, {
      headers: { 'Idempotency-Key': 'qa-seed-wish-pending', 'CF-Connecting-IP': '198.51.100.200' },
      data: { name: 'Still Pending', message: 'This one has not been approved yet.', website: '', elapsedMs: 5000 },
    });
    const toApprove = (await admin(page, 'summary')).pendingWishes.filter((w) => w.name !== 'Still Pending');
    for (const w of toApprove) await page.request.post(`${BASE}api/admin/wishes/${w.id}`, { headers: { Authorization: 'Bearer dev-admin' }, data: { status: 'approved' } });
    await page.getByRole('button', { name: 'View all wishes' }).tap();
    await page.waitForFunction(() => document.querySelectorAll('[data-wishes-list] li').length > 0, null, { polling: POLL });
    const firstPage = await page.evaluate(() => document.querySelectorAll('[data-wishes-list] li').length);
    await page.locator('[data-wishes-more]').tap();
    await page.waitForFunction(() => document.querySelectorAll('[data-wishes-list] li').length > 20, null, { polling: POLL });
    const all = await page.evaluate(() => {
      const body = document.querySelector<HTMLElement>('#wishes-all .overlay__body')!;
      const close = document.querySelector<HTMLElement>('#wishes-all .overlay__close')!.getBoundingClientRect();
      const cards = [...document.querySelectorAll<HTMLElement>('[data-wishes-list] li')];
      return {
        count: cards.length,
        label: document.querySelector('[data-wishes-count]')!.textContent,
        hasPending: document.querySelector('[data-wishes-list]')!.textContent!.includes('Still Pending'),
        moreHidden: document.querySelector<HTMLElement>('[data-wishes-more]')!.hidden,
        scrolls: getComputedStyle(body).overflowY === 'auto' && body.scrollHeight > body.clientHeight,
        closeOk: close.width >= 44 && close.height >= 44 && close.top >= 0,
        named: cards.every((c) => /^— .+/.test(c.querySelector('.wishes-all__name')?.textContent ?? '')),
        dated: cards.every((c) => /\d{1,2} \w{3} \d{4} · \d{1,2}:\d{2} [ap]m/.test(c.querySelector('time')?.textContent ?? '')),
        distinct: new Set(cards.map((c) => c.dataset.wishId)).size === cards.length,
      };
    });
    check(
      'AC-24',
      'View All: approved ones then the four past guests\' blessings, each with a name and date and time, 20 then "Load more", count shown, scrolls independently, 44 px close',
      firstPage === 20 && all.count === 29 && all.label === '29 blessings' && !all.hasPending && all.moreHidden && all.scrolls && all.closeOk && all.named && all.dated && all.distinct,
      JSON.stringify({ firstPage, ...all }),
    );
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    // A fresh load (the wall asks the server for the latest blessings at most once a minute), then a visit from another page
    await page.evaluate(() => (location.hash = 'dress-code'));
    await page.reload();
    await settle(page);
    await page.evaluate(() => (location.hash = 'wishes'));
    await settle(page);

    /* AC-40 each visit begins with the golden doors shut and sliding open; then the heading, four boards, the card and the button are in view */
    const shut = await page.evaluate(() => {
      const doors = document.querySelector<HTMLElement>('#wishes .ww__doors')!;
      const l = document.querySelector<HTMLElement>('#wishes .ww__door--l')!.getBoundingClientRect();
      return { open: doors.classList.contains('is-open'), leftEdge: Math.round(l.right), vw: innerWidth };
    });
    await page.waitForFunction(() => document.querySelector('#wishes .ww__doors')?.classList.contains('is-open'), null, { timeout: 9000, polling: POLL });
    await page.waitForTimeout(2600);
    const view = await page.evaluate(() => {
      const vis = (sel: string) => {
        const el = document.querySelector<HTMLElement>(sel)!;
        const r = el.getBoundingClientRect();
        return Number(getComputedStyle(el).opacity) > 0.95 && r.width > 0 && r.left >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1;
      };
      const boards = [...document.querySelectorAll<HTMLElement>('#wishes .ww__board')];
      return {
        heading: vis('#wishes .ww__heading'),
        card: vis('#wishes .ww__card'),
        all: vis('#wishes .ww__all'),
        boards: boards.length,
        boardsIn: boards.every((b) => {
          const r = b.getBoundingClientRect();
          return r.left >= -1 && r.right <= innerWidth + 1;
        }),
        names: boards.map((b) => b.querySelector('.ww__by')!.textContent),
        clear: (() => {
          // the card never covers the heading or the lettering of a board
          const card = document.querySelector<HTMLElement>('#wishes .ww__card')!.getBoundingClientRect();
          const heading = document.querySelector<HTMLElement>('#wishes .ww__heading')!.getBoundingClientRect();
          return heading.bottom <= card.top + 1 && boards.every((b) => b.querySelector('.ww__lines')!.getBoundingClientRect().bottom <= card.top + 1);
        })(),
      };
    });
    check(
      'AC-40',
      'Wishing Wall: the doors start shut and slide open; the heading, four hanging boards, the card and the View all button are then fully in view and clear of each other',
      !shut.open && shut.leftEdge > shut.vw / 2 - 40 && view.heading && view.card && view.all && view.boards === 4 && view.boardsIn && view.clear,
      JSON.stringify({ shut, view }),
    );
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/phase4-wishing-wall.png` });
    await ctx.close();
  }

  /* AC-41 with no blessings yet, one board invites the first; the wall holds up on a small phone too */
  {
    const ctx = await mobileContext(browser, 360, 640);
    const page = await ctx.newPage();
    await page.route('**/api/wishes?*', (route) => route.fulfill({ json: { items: [], nextCursor: null, total: 0 } }));
    await page.goto(BASE);
    await page.evaluate(() => {
      sessionStorage.setItem('rdv:opened', '1');
      localStorage.setItem('rdv:hint-seen', '1');
    });
    await page.goto(`${BASE}#wishes`);
    await settle(page);
    await page.waitForFunction(() => document.querySelector('#wishes .ww__doors')?.classList.contains('is-open'), null, { timeout: 9000, polling: POLL });
    await page.waitForTimeout(2800);
    const empty = await page.evaluate(() => {
      const boards = [...document.querySelectorAll<HTMLElement>('#wishes .ww__board')];
      const input = document.querySelector<HTMLElement>('#wishes .ww__field--name input')!.getBoundingClientRect();
      const send = document.querySelector<HTMLElement>('#wishes [data-submit]')!.getBoundingClientRect();
      const all = document.querySelector<HTMLElement>('#wishes .ww__all')!.getBoundingClientRect();
      return {
        boards: boards.length,
        text: boards[0]?.querySelector('.ww__msg')?.textContent ?? '',
        names: boards.map((b) => b.querySelector('.ww__by')?.textContent ?? ''),
        fieldsInView: input.top > 0 && send.bottom < innerHeight && all.bottom <= innerHeight,
        sendBelowFields: send.top > input.bottom,
        allBelowCard: all.top >= send.bottom,
      };
    });
    check('AC-41', 'No blessings from the server yet: four past guests\' blessings hang on the wall (never fewer); the fields, Send and View all fit a 360 × 640 phone', empty.boards === 4 && empty.names.every((n) => n.length > 2) && empty.text.length > 10 && empty.fieldsInView && empty.sendBelowFields && empty.allBelowCard, JSON.stringify(empty));
    await ctx.close();
  }

  /* AC-26 the backend still emails the families for an RSVP, and the admin page lists and exports it. The RSVP form page is no
     longer in the book (the client's request), so the response is posted straight to the API; the form's own rules are covered
     by the unit tests of the handlers (tests/backend.test.ts). */
  {
    const ctx = await mobileContext(browser);
    const page = await ctx.newPage();
    await page.goto(BASE);
    await dev(page, 'reset');
    const body = { guestName: 'Lakshmi Narayanan', attendance: 'decline', attendeeCount: 1, events: ['wedding'], dietary: [], consent: true, editToken: 'qa-edit-token-0123456789abcdef', website: '', elapsedMs: 8000 };
    const key = 'qa-rsvp-key-0000000000000001';
    const first = await page.request.post(`${BASE}api/rsvp`, { headers: { 'Idempotency-Key': key }, data: body });
    const again = await page.request.post(`${BASE}api/rsvp`, { headers: { 'Idempotency-Key': key }, data: body }); // a retry stores nothing new
    const outbox = (await dev(page, 'outbox')) as unknown as { to: string[]; subject: string; text: string }[];
    const mails = outbox.map((m) => m.subject);
    await page.goto(`${BASE}admin`);
    await page.getByRole('button', { name: 'Sign in (local development)' }).tap();
    await page.waitForFunction(() => document.querySelectorAll('[data-rsvps] tr').length > 0, null, { polling: POLL });
    const row = await page.evaluate(() => document.querySelector('[data-rsvps] tr')!.textContent);
    const csv = await (await page.request.get(`${BASE}api/admin/export?type=rsvps`, { headers: { Authorization: 'Bearer dev-admin' } })).text();
    const unauthorised = (await page.request.get(`${BASE}api/admin/summary`)).status();
    const stored = (await admin(page, 'summary')).totals.responses;
    check(
      'AC-26',
      'An RSVP emails the families once (a retry stores nothing new); the admin page lists it and exports CSV; signed-out requests are refused',
      first.status() === 201 && again.status() === 200 && stored === 1 && mails.length === 1 && /New RSVP: Lakshmi Narayanan/.test(mails[0]) && !!row?.includes('Lakshmi Narayanan') && csv.includes('Lakshmi Narayanan,Declines') && unauthorised === 401,
      JSON.stringify({ first: first.status(), again: again.status(), stored, mails, row, unauthorised }),
    );
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/phase4-admin.png`, fullPage: true });
    await ctx.close();
  }

  /* AC-28 contact cards: no invented numbers, disabled actions explain themselves, details sheets fit */
  {
    const { ctx, page } = await openedPage('help', 375, 667);
    const cards = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('.nh__card')].map((c) => ({
        tel: c.querySelectorAll('a[href^="tel:"]').length,
        wa: c.querySelectorAll('a[href^="https://wa.me/"]').length,
        disabled: c.querySelectorAll('[aria-disabled="true"]').length,
      })),
    );
    await page.locator('.nh__card').first().getByRole('button', { name: /Call/ }).tap({ force: true });
    await page.waitForTimeout(200);
    const toast = await toastText(page);
    const sheets: string[] = [];
    for (const id of ['groom-rep', 'bride-rep', 'coordinator']) {
      await page.locator(`[data-open-dialog="contact-${id}"]`).tap();
      await page.waitForTimeout(450);
      const fits = await page.evaluate((sid) => {
        const panel = document.querySelector<HTMLElement>(`#${sid} .sheet__panel`)!.getBoundingClientRect();
        const app = document.querySelector('.app')!.getBoundingClientRect();
        const close = document.querySelector<HTMLElement>(`#${sid} .overlay__close`)!.getBoundingClientRect();
        return panel.height <= app.height * 0.81 && panel.bottom <= app.bottom + 1 && close.width >= 44 && close.top >= panel.top;
      }, `contact-${id}`);
      await page.locator(`#contact-${id} .overlay__close`).tap();
      await page.waitForTimeout(450);
      if (!fits) sheets.push(id);
    }
    check(
      'AC-28',
      'Call and WhatsApp stay disabled ("Number coming soon") until numbers exist; details sheets fit with a close button',
      cards.length === 3 && cards.every((c) => c.tel === 0 && c.wa === 0 && c.disabled === 2) && toast === 'Number coming soon' && sheets.length === 0,
      JSON.stringify({ cards, toast, sheets }),
    );
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/phase4-need-help.png` });
    await ctx.close();
  }

  /* ================================================ Phase 5: closing, sharing, polish ================================================ */

  /* AC-29 the thank-you message is handwritten, readable without animation, and Return riffles back to Welcome */
  {
    const ctx = await mobileContext(browser);
    const page = await ctx.newPage();
    await page.goto(BASE);
    await page.evaluate(() => {
      sessionStorage.setItem('rdv:opened', '1');
      localStorage.setItem('rdv:hint-seen', '1');
    });
    await page.goto(`${BASE}#thank-you`);
    await settle(page);
    const t0 = Date.now();
    const glyphState = () =>
      page.evaluate(() => {
        const g = [...document.querySelectorAll<SVGPathElement>('#thank-you .ty__glyph')];
        const filled = g.filter((p) => Number(getComputedStyle(p).fillOpacity) > 0.99).length;
        return { total: g.length, filled };
      });
    let sawPartial = false;
    let state = await glyphState();
    while (state.filled < state.total && Date.now() - t0 < 8000) {
      if (state.filled > 0 && state.filled < state.total) sawPartial = true;
      await page.waitForTimeout(120);
      state = await glyphState();
    }
    const writeSeconds = (Date.now() - t0) / 1000;
    await page.waitForTimeout(1800);
    const finished = await page.evaluate(() => ({
      label: document.querySelector('#thank-you [data-page-heading]')!.textContent!.trim(),
      names: getComputedStyle(document.querySelector('#thank-you .ty__names')!).opacity,
    }));

    // Return to First Page: a quick riffle through a few pages that lands on Welcome, not the cover.
    const visited = new Set<string>();
    await page.exposeFunction('__visit', (id: string) => visited.add(id));
    await page.evaluate(() => {
      new MutationObserver(() => {
        const cur = document.querySelector<HTMLElement>('.page[data-state=current]');
        if (cur) (window as unknown as { __visit: (id: string) => void }).__visit(cur.id);
      }).observe(document.querySelector('.book')!, { subtree: true, attributes: true, attributeFilter: ['data-state'] });
    });
    const r0 = Date.now();
    await page.getByRole('button', { name: 'Return to First Page' }).tap();
    await page.waitForFunction(() => document.querySelector('.page[data-state=current]')?.id === 'welcome', null, { timeout: 6000, polling: POLL });
    const riffleSeconds = (Date.now() - r0) / 1000;
    await settle(page);
    check(
      'AC-29',
      'Thank You: the message is written letter by letter (~2.4 s), the names follow, and Return riffles to Welcome in about a second',
      state.total > 20 &&
        state.filled === state.total &&
        sawPartial &&
        writeSeconds > 1.8 &&
        writeSeconds < 4.5 &&
        finished.label === 'Thank You for Blessing Our Journey' &&
        finished.names === '1' &&
        riffleSeconds < 2 &&
        visited.size >= 4 &&
        !visited.has('cover'),
      JSON.stringify({ state, sawPartial, writeSeconds, finished, riffleSeconds, visited: [...visited] }),
    );
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/phase5-welcome-after-riffle.png` });
    await ctx.close();

    // Without JavaScript the lettering is already solid and readable; screen readers get the words.
    const noJs = await mobileContext(browser, 390, 844, { javaScriptEnabled: false });
    const plain = await noJs.newPage();
    await plain.goto(BASE);
    const fallback = await plain.evaluate(() => {
      const svg = document.querySelector<SVGSVGElement>('#thank-you .ty__script')!;
      const glyph = svg.querySelector<SVGPathElement>('.ty__glyph')!;
      return {
        visible: svg.getBoundingClientRect().height > 30,
        fillOpacity: getComputedStyle(glyph).fillOpacity,
        hiddenFromAt: svg.getAttribute('aria-hidden'),
        text: document.querySelector('#thank-you .sr-only')!.textContent,
      };
    });
    check(
      'AC-29b',
      'Thank You without JavaScript: solid script lettering, with the words available to screen readers',
      fallback.visible && fallback.fillOpacity === '1' && fallback.hiddenFromAt === 'true' && fallback.text === 'Thank You for Blessing Our Journey',
      JSON.stringify(fallback),
    );
    await noJs.close();
  }

  /* AC-30 Share: the native share sheet where available, otherwise WhatsApp and Copy link */
  {
    const native = await mobileContext(browser);
    await native.addInitScript({
      content: `Object.defineProperty(navigator, 'share', { configurable: true, value: async (d) => { window.__shared = d; } });`,
    });
    const page = await native.newPage();
    await page.goto(BASE);
    await page.evaluate(() => {
      sessionStorage.setItem('rdv:opened', '1');
      localStorage.setItem('rdv:hint-seen', '1');
      localStorage.setItem('rdv:reduce-motion', '1');
    });
    await page.goto(`${BASE}#thank-you`);
    await settle(page);
    await page.getByRole('button', { name: 'Share Invitation' }).tap();
    await page.waitForTimeout(300);
    const shared = await page.evaluate(() => ({
      data: (window as unknown as { __shared?: { text: string; url: string } }).__shared ?? null,
      sheetOpen: !document.getElementById('share-sheet')!.hidden,
    }));
    await native.close();

    const fallback = await mobileContext(browser);
    await fallback.addInitScript({ content: `Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });` });
    await fallback.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(BASE).origin });
    const page2 = await fallback.newPage();
    await page2.goto(BASE);
    await page2.evaluate(() => {
      sessionStorage.setItem('rdv:opened', '1');
      localStorage.setItem('rdv:hint-seen', '1');
      localStorage.setItem('rdv:reduce-motion', '1');
    });
    await page2.goto(`${BASE}#thank-you`);
    await settle(page2);
    await page2.getByRole('button', { name: 'Share Invitation' }).tap();
    await page2.waitForTimeout(450);
    const sheet = await page2.evaluate(() => {
      const s = document.getElementById('share-sheet')!;
      const wa = s.querySelector<HTMLAnchorElement>('[data-share-whatsapp]')!;
      return {
        open: !s.hidden,
        whatsapp: wa.href,
        text: decodeURIComponent(new URL(wa.href).searchParams.get('text') ?? ''),
        copy: s.querySelector<HTMLElement>('[data-share-copy]')!.dataset.copy,
        url: location.origin + location.pathname,
      };
    });
    await page2.locator('#share-sheet [data-share-copy]').tap();
    await page2.waitForTimeout(300);
    const toast = await toastText(page2);
    check(
      'AC-30',
      'Share uses the native share sheet when available; otherwise a sheet with WhatsApp and Copy link',
      !!shared.data?.text.includes('Rahul & Divya') &&
        !!shared.data?.url &&
        !shared.sheetOpen &&
        sheet.open &&
        sheet.whatsapp.startsWith('https://wa.me/?text=') &&
        sheet.text.includes('You are invited to the wedding of Rahul & Divya') &&
        sheet.text.includes(sheet.url) &&
        sheet.copy === sheet.url &&
        toast === 'Invitation link copied',
      JSON.stringify({ shared, sheet, toast }),
    );
    if (SHOTS) await page2.screenshot({ path: `${SHOTS}/phase5-share-sheet.png` });
    await fallback.close();
  }

  /* AC-31 link preview tags and image */
  {
    const ctx = await mobileContext(browser);
    const page = await ctx.newPage();
    await page.goto(BASE);
    const meta = await page.evaluate(() => {
      const m = (p: string) => document.querySelector<HTMLMetaElement>(`meta[property="${p}"], meta[name="${p}"]`)?.content ?? null;
      return { title: m('og:title'), description: m('og:description'), image: m('og:image'), width: m('og:image:width'), height: m('og:image:height'), alt: m('og:image:alt'), card: m('twitter:card') };
    });
    const imageUrl = new URL(meta.image ?? '/missing', BASE).href;
    const res = await page.request.get(imageUrl);
    const bytes = (await res.body()).length;
    const size = await page.evaluate(
      (src) =>
        new Promise<[number, number]>((resolve) => {
          const img = new Image();
          img.onload = () => resolve([img.naturalWidth, img.naturalHeight]);
          img.onerror = () => resolve([0, 0]);
          img.src = src;
        }),
      imageUrl,
    );
    check(
      'AC-31',
      'Link preview: title, description and a 1200 × 630 JPEG image under 300 KB (absolute URL once the domain is set)',
      !!meta.title?.includes('Rahul & Divya') &&
        !!meta.description &&
        meta.width === '1200' &&
        meta.height === '630' &&
        !!meta.alt &&
        meta.card === 'summary_large_image' &&
        res.status() === 200 &&
        res.headers()['content-type']?.includes('image/jpeg') &&
        bytes < 300 * 1024 &&
        size[0] === 1200 &&
        size[1] === 630,
      JSON.stringify({ meta, status: res.status(), bytes, size }),
    );
    await ctx.close();
  }

  /* AC-32 (full) with reduced motion every page stays complete and still: no petals, sway, 3D turns or auto-advance */
  {
    const ctx = await mobileContext(browser, 390, 844, { reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(BASE);
    await settle(page);
    await enterAndOpen(page);
    await settle(page);
    await page.waitForTimeout(1200);
    const petals = await page.evaluate(() => document.querySelectorAll('.petal').length);
    const moving = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('.sway, .flame, .glow-breathe')].filter((e) => getComputedStyle(e).animationName !== 'none').length,
    );
    // Love story ring: no automatic turning, and the cards lie flat.
    await page.evaluate(() => (window as unknown as { __book: { show(i: number): void } }).__book.show([...document.querySelectorAll('.book > .page')].findIndex((p) => p.id === 'love-story')));
    await page.waitForTimeout(300);
    const dotBefore = await page.evaluate(() => [...document.querySelectorAll('[data-ring-dot]')].findIndex((d) => d.classList.contains('is-active')));
    await page.waitForTimeout(6800);
    const dotAfter = await page.evaluate(() => [...document.querySelectorAll('[data-ring-dot]')].findIndex((d) => d.classList.contains('is-active')));
    // Thank You: the lettering is complete at once, and Return fades straight to Welcome.
    await page.evaluate(() => (window as unknown as { __book: { show(i: number): void } }).__book.show([...document.querySelectorAll('.book > .page')].findIndex((p) => p.id === 'thank-you')));
    await page.waitForTimeout(200);
    const lettering = await page.evaluate(() => [...document.querySelectorAll<SVGPathElement>('#thank-you .ty__glyph')].every((p) => Number(getComputedStyle(p).fillOpacity) > 0.99));
    await page.getByRole('button', { name: 'Return to First Page' }).tap();
    await page.waitForTimeout(40);
    const curl = await page.evaluate(() => document.querySelector('.book__flap-wrap')!.classList.contains('is-on'));
    await settle(page);
    const landed = await current(page);
    check(
      'AC-32b',
      'Reduced motion: no petals, sway, flicker or ring auto-advance; the lettering is complete at once; Return fades to Welcome',
      petals === 0 && moving === 0 && dotBefore === dotAfter && lettering && !curl && landed === 'welcome',
      JSON.stringify({ petals, moving, dotBefore, dotAfter, lettering, curl, landed }),
    );
    await ctx.close();
  }

  /* AC-34 automated accessibility scan (axe) on every page, the chrome and the overlays */
  {
    const ctx = await mobileContext(browser);
    const page = await ctx.newPage();
    await page.goto(BASE);
    await page.evaluate(() => {
      sessionStorage.setItem('rdv:opened', '1');
      localStorage.setItem('rdv:hint-seen', '1');
      localStorage.setItem('rdv:reduce-motion', '1');
    });
    await page.goto(BASE);
    await settle(page);
    await page.addScriptTag({ content: readFileSync(join(process.cwd(), 'node_modules/axe-core/axe.min.js'), 'utf8') });
    const scan = (scope: string) =>
      page.evaluate(async (scope) => {
        const axe = (window as unknown as { axe: { run(ctx: unknown, opts: unknown): Promise<{ violations: { id: string; impact: string; nodes: { target: string[] }[] }[] }> } }).axe;
        const r = await axe.run({ include: [scope] }, { resultTypes: ['violations'] });
        return r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${scope}: ${v.id} (${v.impact}) ${v.nodes[0]?.target.join(' ')}`);
      }, scope);
    const problems: string[] = [];
    const ids = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.book > .page')].map((p) => p.id));
    for (const [i, id] of ids.entries()) {
      await page.evaluate((i) => (window as unknown as { __book: { show(i: number): void } }).__book.show(i), i);
      await page.waitForTimeout(150);
      problems.push(...(await scan(`#${id}`)));
    }
    problems.push(...(await scan('[data-chrome]')));
    const overlays = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.app > [role="dialog"]')].map((d) => d.id));
    for (const id of overlays) {
      await page.evaluate((id) => {
        const d = document.getElementById(id)!;
        d.hidden = false;
        d.classList.add('is-open');
      }, id);
      await page.waitForTimeout(80);
      problems.push(...(await scan(`#${id}`)));
      await page.evaluate((id) => {
        const d = document.getElementById(id)!;
        d.hidden = true;
        d.classList.remove('is-open');
      }, id);
    }
    // The family dashboard, signed out and signed in.
    await page.goto(`${BASE}admin`);
    await page.addScriptTag({ content: readFileSync(join(process.cwd(), 'node_modules/axe-core/axe.min.js'), 'utf8') });
    problems.push(...(await scan('body')).map((p) => `admin sign-in ${p}`));
    await page.getByRole('button', { name: 'Sign in (local development)' }).tap();
    await page.waitForFunction(() => !document.querySelector<HTMLElement>('[data-view="dashboard"]')!.hidden, null, { polling: POLL });
    problems.push(...(await scan('body')).map((p) => `admin dashboard ${p}`));
    check('AC-34', `No serious or critical axe issues on ${ids.length} pages, the chrome, ${overlays.length} overlays and the dashboard`, problems.length === 0, problems.slice(0, 8).join(' | '));
    await ctx.close();
  }

  /* AC-36 supplied artwork is shown as supplied: no tints or filters, no distortion (checked for every real asset present) */
  {
    const ctx = await mobileContext(browser);
    const page = await ctx.newPage();
    await page.goto(BASE);
    await settle(page);
    const assets = await page.evaluate(async () => {
      const book = (window as unknown as { __book: { show(i: number): void } }).__book;
      const pages = [...document.querySelectorAll<HTMLElement>('.book > .page')];
      const issues: string[] = [];
      let real = 0;
      let slots = 0;
      for (let i = 0; i < pages.length; i++) {
        book.show(i);
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        for (const img of pages[i].querySelectorAll<HTMLImageElement>('img.decor')) {
          slots++;
          if (!img.dataset.asset) issues.push(`${pages[i].id}: decoration without an asset ID`);
          if ('placeholder' in img.dataset) continue;
          real++;
          const style = getComputedStyle(img);
          const box = img.getBoundingClientRect();
          if (style.filter !== 'none') issues.push(`${img.dataset.asset}: filter ${style.filter}`);
          if (img.naturalWidth && box.width && Math.abs(box.width / box.height - img.naturalWidth / img.naturalHeight) > 0.02 * (img.naturalWidth / img.naturalHeight))
            issues.push(`${img.dataset.asset}: stretched`);
        }
      }
      // The client's opening photographs, as shown before the doors move: unfiltered and in proportion
      book.show(0);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      for (const img of document.querySelectorAll<HTMLImageElement>('#cover .op-frame--whole, #cover .op-court__img')) {
        real++;
        const style = getComputedStyle(img);
        const box = img.getBoundingClientRect();
        if (style.filter !== 'none') issues.push(`${img.className}: filter ${style.filter}`);
        if (img.classList.contains('op-frame') && Math.abs(box.width / box.height - img.naturalWidth / img.naturalHeight) > 0.01) issues.push(`${img.className}: stretched`);
      }
      return { real, slots, issues };
    });
    check(
      'AC-36',
      `Supplied artwork appears unaltered (${assets.real} supplied assets present; ${assets.slots} decoration slots carry asset IDs)`,
      assets.issues.length === 0,
      assets.issues.slice(0, 8).join(' | '),
    );
    await ctx.close();
  }

  /* AC-42 the Dress Code page: five finished cards over the garden turn by themselves with no tap, and by arrow, dot or
     swipe; each card's title, mood, "Suggested Colours", four shades and line of guidance are real text and real colours
     from the data, and fit their card; a vertical swipe still turns the page */
  {
    const { ctx, page, cdp } = await openedPage('dress-code');
    const front = () => page.evaluate(() => [...document.querySelectorAll('[data-deck-dot]')].findIndex((d) => d.classList.contains('is-active')));
    await page.waitForTimeout(1200);
    const first = await front();
    // by itself (a card stays about five seconds)
    await page.waitForFunction((was) => [...document.querySelectorAll('[data-deck-dot]')].findIndex((d) => d.classList.contains('is-active')) !== was, first, { timeout: 12000, polling: POLL });
    const bySelf = await front();
    const content = await page.evaluate(() => {
      const slots = [...document.querySelectorAll<HTMLElement>('#dress-code .dc__slot')];
      const half = (el: HTMLElement) => ({ l: el.offsetLeft - el.offsetWidth / 2, r: el.offsetLeft + el.offsetWidth / 2, t: el.offsetTop - el.offsetHeight / 2, b: el.offsetTop + el.offsetHeight / 2 });
      return slots.map((s) => {
        const card = s.querySelector<HTMLElement>('.dc__card')!;
        const inside = ['.dc__t', '.dc__tag', '.dc__label', '.dc__desc'].every((sel) => {
          const e = half(card.querySelector<HTMLElement>(sel)!);
          return e.l >= -1 && e.r <= card.offsetWidth + 1 && e.t >= -1 && e.b <= card.offsetHeight + 1;
        });
        const discs = [...card.querySelectorAll<HTMLElement>('.dc__disc')];
        const lowestDisc = Math.max(...discs.map((d) => d.offsetTop + d.offsetWidth / 2));
        const desc = half(card.querySelector<HTMLElement>('.dc__desc')!);
        return {
          title: card.querySelector('.dc__t')!.textContent,
          tagline: (card.querySelector('.dc__tag')!.textContent ?? '').length > 10,
          desc: (card.querySelector('.dc__desc')!.textContent ?? '').length > 10,
          colours: discs.map((d) => getComputedStyle(d).backgroundColor),
          inside,
          belowDiscs: desc.t >= lowestDisc,
          art: (card.querySelector('.dc__art') as HTMLImageElement).complete,
        };
      });
    });
    const titles = content.map((c) => c.title);
    const sangeet = content.find((c) => c.title === 'Sangeet Night');
    // by hand: a swipe each way, the arrow, the dot (the cards then wait before going on by themselves again)
    const box = (await page.locator('.dc__deck').boundingBox())!;
    const y = box.y + box.height / 2;
    const n = content.length;
    const base = await front();
    await touchDrag(cdp, page, [box.x + box.width * 0.8, y], [box.x - 40, y], 12, 18);
    await page.waitForTimeout(900);
    const afterLeft = await front();
    await touchDrag(cdp, page, [box.x + box.width * 0.2, y], [box.x + box.width + 40, y], 12, 18);
    await page.waitForTimeout(900);
    const afterRight = await front();
    await page.locator('#dress-code [data-deck-next]').tap();
    await page.waitForTimeout(1000);
    const afterArrow = await front();
    await page.locator('#dress-code [data-deck-dot]').nth(0).tap();
    await page.waitForTimeout(800);
    const afterDot = await front();
    const samePage = (await current(page)) === 'dress-code';
    await touchDrag(cdp, page, [box.x + box.width / 2, box.y + box.height - 20], [box.x + box.width / 2, box.y - 200], 10, 14);
    const turned = await current(page);
    check(
      'AC-42',
      'Dress Code: five cards (Mehendi, Haldi, Sangeet Night, Wedding, Reception) turn by themselves, and by swipe, arrow and dot; their lettering and four shades each are real and fit; a vertical swipe turns the page',
      bySelf !== first &&
        titles.join('|') === 'Mehendi|Haldi|Sangeet Night|Wedding|Reception' &&
        content.every((c) => c.tagline && c.desc && c.colours.length === 4 && c.inside && c.belowDiscs && c.art) &&
        sangeet?.colours.join('|') === 'rgb(114, 12, 32)|rgb(37, 62, 114)|rgb(9, 69, 60)|rgb(175, 134, 139)' &&
        afterLeft === (base + 1) % n &&
        afterRight === base &&
        afterArrow === (base + 1) % n &&
        afterDot === 0 &&
        samePage &&
        turned === 'venues',
      JSON.stringify({ first, bySelf, base, afterLeft, afterRight, afterArrow, afterDot, turned, titles, bad: content.filter((c) => !(c.inside && c.belowDiscs && c.art && c.colours.length === 4)) }),
    );
    await ctx.close();
  }

  /* AC-43 the invitation opens by itself: 1.5 s after the card with "Open the Invitation" shows, a guest who does nothing
     is taken into the book (the bell at the doors is still their own tap); a touch before then keeps it closed */
  {
    const run = async (touch: boolean) => {
      const ctx = await mobileContext(browser);
      await ctx.addInitScript({ content: "try { if (window.top === window) localStorage.removeItem('rdv:auto'); } catch (e) {}" });
      const page = await ctx.newPage();
      await page.goto(BASE);
      await settle(page);
      await ringTheBell(page);
      await bookReady(page);
      const t0 = Date.now();
      await page.waitForTimeout(700);
      const early = await current(page);
      if (touch) await page.keyboard.press('Shift'); // any touch, key or scroll counts as the guest taking over
      let opened: string | null = null;
      try {
        await page.waitForFunction(() => document.querySelector('.page[data-state=current]')?.id === 'welcome', null, { timeout: touch ? 4500 : 9000, polling: POLL });
        opened = 'welcome';
      } catch {
        opened = await current(page);
      }
      const took = (Date.now() - t0) / 1000;
      await ctx.close();
      return { early, opened, took };
    };
    const alone = await run(false);
    const touched = await run(true);
    check(
      'AC-43',
      'The invitation opens by itself about 1.5 s after the card shows (not before), onto Welcome with no tap; a touch or key before then keeps it closed',
      alone.early === 'cover' && alone.opened === 'welcome' && alone.took >= 1.4 && alone.took < 8 && touched.opened === 'cover',
      JSON.stringify({ alone, touched }),
    );
  }

  /* AC-44 how to turn the page: a guest who has not turned a page yet sees a pill saying so above a clear page-number pill
     (arrows large enough to tap), the next arrow nudging; after turning a page it is gone, and stays gone on a later visit */
  {
    const ctx = await mobileContext(browser);
    // a fresh guest on the first load only (a reload later in the check keeps what the guest did)
    await ctx.addInitScript({ content: "try { if (window.top === window && !sessionStorage.getItem('qa-fresh')) { localStorage.removeItem('rdv:turned'); sessionStorage.setItem('qa-fresh', '1'); } } catch (e) {}" });
    const page = await ctx.newPage();
    await page.goto(BASE);
    await page.evaluate(() => {
      sessionStorage.setItem('rdv:opened', '1');
      localStorage.setItem('rdv:hint-seen', '1');
    });
    await page.goto(`${BASE}#welcome`);
    await settle(page);
    await page.waitForFunction(() => document.querySelector('.turn-cue')?.classList.contains('is-on'), null, { timeout: 4000, polling: POLL });
    await page.waitForTimeout(700); // the pill has faded in
    const seen = await page.evaluate(() => {
      const cue = document.querySelector<HTMLElement>('.turn-cue')!;
      const folio = document.querySelector<HTMLElement>('.folio')!;
      const next = document.querySelector<HTMLElement>('.folio [data-next]')!;
      const prev = document.querySelector<HTMLElement>('.folio [data-prev]')!;
      const c = cue.getBoundingClientRect();
      const f = folio.getBoundingClientRect();
      const n = next.getBoundingClientRect();
      const fs = getComputedStyle(folio);
      return {
        text: cue.textContent?.replace(/\s+/g, ' ').trim(),
        cueVisible: Number(getComputedStyle(cue).opacity) > 0.95 && c.left >= 0 && c.right <= innerWidth,
        above: c.bottom <= f.top + 1 && c.bottom > f.top - 40,
        centred: Math.abs(c.left + c.width / 2 - innerWidth / 2) < 3,
        rim: parseFloat(fs.borderTopWidth) >= 1.4 && /138, 20, 38/.test(fs.borderTopColor) && (fs.backgroundColor !== 'rgba(0, 0, 0, 0)' || /gradient/.test(fs.backgroundImage)),
        tap: n.width >= 44 && n.height >= 44 && prev.getBoundingClientRect().height >= 44,
        nudging: getComputedStyle(next.querySelector('svg')!).animationName !== 'none',
        pearlCue: getComputedStyle(document.querySelector('.pearl')!, '::after').content !== 'none',
        noOverlap: f.bottom <= innerHeight && f.top >= 0,
      };
    });
    await page.getByRole('button', { name: 'Next page' }).first().tap();
    await settle(page);
    await page.waitForTimeout(700);
    const afterTurn = await page.evaluate(() => ({ on: document.querySelector('.turn-cue')!.classList.contains('is-on'), stored: localStorage.getItem('rdv:turned') }));
    await page.reload();
    await settle(page);
    await page.waitForTimeout(2200);
    const later = await page.evaluate(() => document.querySelector('.turn-cue')!.classList.contains('is-on'));
    check(
      'AC-44',
      'Turning the page is explained: a "Swipe or tap to turn the page" pill above a glass page-number pill with a maroon rim with large arrows and a nudging next arrow, gone after the guest turns a page',
      /Swipe or tap to turn the page/.test(seen.text ?? '') && seen.cueVisible && seen.above && seen.centred && seen.rim && seen.tap && seen.nudging && seen.pearlCue && seen.noOverlap && !afterTurn.on && afterTurn.stored === '1' && !later,
      JSON.stringify({ seen, afterTurn, later }),
    );
    await ctx.close();
  }

  /* AC-45 the Welcome lines are a clear serif in a maroon gradient (not script), the same size as the date above them, no more
     than three lines, with close word spacing, and fit between the date and the couple */
  for (const [w, h] of [
    [360, 640],
    [390, 844],
    [430, 932],
  ]) {
    const { ctx, page } = await openedPage('welcome', w, h);
    const m = await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>('#welcome .wl__message')!;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const dateSize = parseFloat(getComputedStyle(document.querySelector<HTMLElement>('#welcome .wl__date')!).fontSize);
      const couple = document.querySelector<HTMLElement>('#welcome .wl-couple__img')!.getBoundingClientRect();
      const detail = document.querySelector<HTMLElement>('#welcome .wl__place')!.getBoundingClientRect();
      const size = parseFloat(cs.fontSize);
      return {
        family: cs.fontFamily,
        size,
        dateSize,
        weight: Number(cs.fontWeight),
        lines: Math.round(r.height / parseFloat(cs.lineHeight)),
        wordSpacingEm: parseFloat(cs.wordSpacing) / size,
        gradient: /linear-gradient/.test(cs.backgroundImage) && cs.backgroundClip === 'text',
        fill: cs.webkitTextFillColor,
        inside: r.left >= 0 && r.right <= innerWidth,
        below: r.top >= detail.bottom - 1,
        clearOfCouple: r.bottom <= couple.top + couple.height * 0.12,
        text: (el.textContent ?? '').length > 30,
      };
    });
    check(
      `AC-45@${w}x${h}`,
      `Welcome lines at ${w}×${h}: a serif (not script) the same size as the date, in two or three lines with close word spacing, filled with a maroon gradient, below the place line and clear of the couple`,
      !/Pinyon|script/i.test(m.family) && /Cormorant|serif/i.test(m.family) && Math.abs(m.size - m.dateSize) < 0.6 && m.size >= 19 && m.weight >= 600 && m.lines >= 2 && m.lines <= 3 && m.wordSpacingEm < 0 && m.gradient && m.fill === 'rgba(0, 0, 0, 0)' && m.inside && m.below && m.clearOfCouple && m.text,
      JSON.stringify(m),
    );
    await ctx.close();
  }

  /* AC-46 accepting the invitation plays one soft violin-and-flute phrase of about a second and a half (a sound file, once) */
  {
    const { ctx, page } = await openedPage('ceremony', 390, 844);
    await page.evaluate(() => {
      const w = window as unknown as { __clips: number[] };
      w.__clips = [];
      const start = AudioBufferSourceNode.prototype.start;
      AudioBufferSourceNode.prototype.start = function (...args: Parameters<typeof start>) {
        w.__clips.push(this.buffer?.duration ?? -1);
        return start.apply(this, args);
      };
    });
    const file = await page.request.get(`${BASE}audio/accept-melody.wav`);
    const bytes = (await file.body()).length;
    await page.locator('#ceremony [data-accept]').tap();
    await page.waitForTimeout(1200);
    const clips = await page.evaluate(() => (window as unknown as { __clips: number[] }).__clips);
    check(
      'AC-46',
      'Accepting plays one soft violin-and-flute phrase (a sound file of about two seconds with its echo, once)',
      file.status() === 200 && bytes > 60_000 && bytes < 400_000 && clips.length === 1 && clips[0] >= 1.4 && clips[0] <= 2.6,
      JSON.stringify({ status: file.status(), bytes, clips }),
    );
    await ctx.close();
  }

  /* The ceremony finishes its entrance */
  {
    const { ctx, page } = await openedPage('ceremony');
    await page.waitForTimeout(5200);
    const plaque = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('#ceremony .cm__line')].every((l) => Number(getComputedStyle(l).opacity) > 0.95));
    check('PH3-scenes', 'The mandapam board and its details appear', plaque, JSON.stringify({ plaque }));
    await ctx.close();
  }

  /* AC-37 the Wedding Ceremony page: the real mandapam's pieces arrive one by one, the board shows the details
     and a blinking Accept button with a tapping hand; accepting starts the celebration (petals, sparks from the
     two crackers) and is remembered */
  {
    const ctx = await mobileContext(browser);
    const page = await ctx.newPage();
    await page.goto(BASE);
    await page.evaluate(() => {
      sessionStorage.setItem('rdv:opened', '1');
      localStorage.removeItem('rdv:accepted');
    });
    await page.goto(`${BASE}#countdown`);
    await settle(page);
    await page.evaluate(() => (location.hash = 'ceremony'));
    await page.waitForTimeout(150);
    const early = await page.evaluate(() => {
      const op = (sel: string) => Number(getComputedStyle(document.querySelector(sel)!).opacity);
      return { beam: op('#ceremony [data-piece="beam"]'), board: op('#ceremony [data-piece="board"]') };
    });
    await settle(page);
    await page.waitForTimeout(4800);
    const s = await page.evaluate(() => {
      const pieces = [...document.querySelectorAll<HTMLImageElement>('#ceremony [data-piece]')];
      const btn = document.querySelector<HTMLElement>('#ceremony [data-accept]')!;
      const r = btn.getBoundingClientRect();
      const board = document.querySelector<HTMLElement>('#ceremony .cm__board')!.getBoundingClientRect();
      return {
        pieces: pieces.length,
        loaded: pieces.every((p) => p.complete && p.naturalWidth > 20),
        shown: pieces.every((p) => Number(getComputedStyle(p).opacity) > 0.95),
        // only the essentials: the ceremony's name, Rahul & Divya and the date; no place, venue or time
        names: /Rahul/.test(document.querySelector('#ceremony .cm__names')!.textContent ?? '') && /Wednesday, 7 April 2027/.test(document.querySelector('#ceremony .cm__date')!.textContent ?? ''),
        lean: !/Tirupati|To be provided|Venue|Muhurtham|IST/i.test(document.querySelector<HTMLElement>('#ceremony .cm__invite')!.innerText),
        fills: (() => {
          // the mandapam covers the whole page: its first piece reaches the top and the picture's foot the bottom
          const page = document.getElementById('ceremony')!.getBoundingClientRect();
          const img = document.querySelector<HTMLElement>('#ceremony .cm__rest')!.getBoundingClientRect();
          return img.top <= page.top + 2 && img.bottom >= page.bottom - 2 && img.left <= page.left + 2 && img.right >= page.right - 2;
        })(),
        blinking: getComputedStyle(btn).animationName === 'cm-blink',
        hand: getComputedStyle(document.querySelector('#ceremony .cm__hand')!).animationName === 'cm-tap',
        label: btn.textContent?.trim(),
        tappable: r.width >= 100 && r.height >= 14 && r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight,
        inBoard: r.left >= board.left && r.right <= board.right && r.top >= board.top && r.bottom <= board.bottom,
        crackers: document.querySelectorAll('#ceremony [data-cracker]').length,
        crackersOnFloor: [...document.querySelectorAll<HTMLElement>('#ceremony [data-cracker]')].every((c) => c.getBoundingClientRect().bottom > innerHeight * 0.8),
      };
    });
    await page.locator('#ceremony [data-accept]').tap();
    await page.waitForTimeout(1500);
    const a = await page.evaluate(() => {
      const canvas = document.querySelector<HTMLCanvasElement>('#ceremony [data-sparks]')!;
      const px = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
      let lit = 0;
      for (let i = 3; i < px.length; i += 4 * 7) if (px[i] > 30) lit++;
      return {
        accepted: document.getElementById('ceremony')!.classList.contains('is-accepted'),
        label: document.querySelector('#ceremony [data-accept-text]')!.textContent,
        goingUp: Number(getComputedStyle(document.querySelector('#ceremony .cm__names')!).opacity) < 0.95 || document.getElementById('ceremony')!.classList.contains('is-thanks'),
        hand: getComputedStyle(document.querySelector('#ceremony [data-accept-hand]')!).display === 'none',
        petals: document.querySelectorAll('#ceremony .petal').length,
        sparks: lit,
        glow: getComputedStyle(document.querySelector('#ceremony .cm__cracker-glow')!).animationName === 'cm-glow',
        stored: localStorage.getItem('rdv:accepted') === '1',
      };
    });
    await page.waitForTimeout(2600);
    const t = await page.evaluate(() => {
      const q = (sel: string) => document.querySelector<HTMLElement>(sel)!;
      const board = q('#ceremony .cm__board').getBoundingClientRect();
      const inBoard = (el: HTMLElement) => { const r = el.getBoundingClientRect(); return r.left >= board.left - 1 && r.right <= board.right + 1 && r.top >= board.top - 1 && r.bottom <= board.bottom + 1; };
      const cameo = q('#ceremony .cm__cameo-img') as HTMLImageElement;
      return {
        thanksShown: document.getElementById('ceremony')!.classList.contains('is-thanks'),
        inviteGone: getComputedStyle(q('#ceremony .cm__invite')).display === 'none',
        couple: cameo.complete && cameo.naturalWidth > 100 && Number(getComputedStyle(q('#ceremony .cm__cameo')).opacity) > 0.95,
        words: /Thank you for accepting our invitation/.test(q('#ceremony .cm__thanks-script').textContent ?? '') && /“.+”/.test(q('#ceremony .cm__thanks-quote').textContent ?? ''),
        returnBtn: getComputedStyle(q('#ceremony [data-return]')).display !== 'none' && /Return to RSVP/.test(q('#ceremony [data-return]').textContent ?? '') && !q('#ceremony [data-return]').hasAttribute('data-goto'),
        fits: ['.cm__cameo', '.cm__thanks-script', '.cm__thanks-quote', '.cm__thanks-sign', '[data-accept]', '[data-return]'].every((sel) => inBoard(q(`#ceremony ${sel}`))),
        accepted: q('#ceremony [data-accept-text]').textContent,
      };
    });
    // Return to RSVP does not turn the page: it brings the invitation and its Accept button back
    await page.locator('#ceremony [data-return]').tap();
    await page.waitForTimeout(1800);
    const back = await page.evaluate(() => {
      const q = (sel: string) => document.querySelector<HTMLElement>(sel)!;
      return {
        page: document.querySelector<HTMLElement>('.page[data-state=current]')?.id,
        inviteBack: getComputedStyle(q('#ceremony .cm__invite')).display !== 'none' && Number(getComputedStyle(q('#ceremony .cm__names')).opacity) > 0.95,
        thanksGone: getComputedStyle(q('#ceremony .cm__thanks')).display === 'none',
        label: q('#ceremony [data-accept-text]').textContent,
        ready: !document.getElementById('ceremony')!.classList.contains('is-accepted') && getComputedStyle(q('#ceremony [data-accept-hand]')).display !== 'none' && getComputedStyle(q('#ceremony [data-accept]')).animationName === 'cm-blink',
        forgotten: localStorage.getItem('rdv:accepted') === null,
      };
    });
    // ...and it can be accepted again
    await page.locator('#ceremony [data-accept]').tap();
    await page.waitForTimeout(3600);
    const again = await page.evaluate(() => document.getElementById('ceremony')!.classList.contains('is-thanks') && document.querySelector('#ceremony [data-accept-text]')!.textContent === 'Accepted');
    await page.waitForTimeout(6500);
    const done = await page.evaluate(() => ({ burning: document.getElementById('ceremony')!.classList.contains('is-burning'), petals: document.querySelectorAll('#ceremony .petal').length }));
    check(
      'AC-37',
      'Ceremony: the mandapam fills the page and its pieces arrive one by one; the board shows only the ceremony name, Rahul & Divya and the date with a blinking Accept button and tapping hand; accepting starts petals and sparks from the two crackers while the lines float up and the couple and their thanks appear with a Return to RSVP button that brings the invitation and Accept back (it stays on the page) so it can be accepted again',
      early.beam < 0.9 && early.board < 0.9 && s.pieces === 19 && s.loaded && s.shown && s.names && s.lean && s.fills && s.blinking && s.hand && /Accept/.test(s.label ?? '') && s.tappable && s.inBoard && s.crackers === 2 && s.crackersOnFloor && a.accepted && a.label === 'Accepted' && a.goingUp && a.hand && a.petals > 4 && a.sparks > 25 && a.glow && a.stored && t.thanksShown && t.inviteGone && t.couple && t.words && t.returnBtn && t.fits && t.accepted === 'Accepted' && back.page === 'ceremony' && back.inviteBack && back.thanksGone && back.label === 'Accept the Invitation' && back.ready && back.forgotten && again && !done.burning,
      JSON.stringify({ early, s, a, t, back, again, done }),
    );
    await ctx.close();
  }

  /* The celebration is silent and still under reduced motion: no petals, no sparks, but the button still accepts */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
    await ctx.addInitScript({ content: 'globalThis.__name = (f) => f;' });
    const page = await ctx.newPage();
    await page.goto(BASE);
    await page.evaluate(() => {
      sessionStorage.setItem('rdv:opened', '1');
      localStorage.removeItem('rdv:accepted');
    });
    await page.goto(`${BASE}#ceremony`);
    await settle(page);
    await page.waitForTimeout(800);
    await page.locator('#ceremony [data-accept]').tap();
    await page.waitForTimeout(900);
    const r = await page.evaluate(() => ({ accepted: document.getElementById('ceremony')!.classList.contains('is-accepted'), petals: document.querySelectorAll('#ceremony .petal').length, burning: document.getElementById('ceremony')!.classList.contains('is-burning') }));
    check('AC-37b', 'Under reduced motion accepting still works, with no petals or sparks', r.accepted && r.petals === 0 && !r.burning, JSON.stringify(r));
    await ctx.close();
  }

  /* AC-09 production view shows no "To be provided" text */
  {
    const ctx = await mobileContext(browser);
    const page = await ctx.newPage();
    await page.goto(BASE);
    await settle(page);
    const leaks = await page.evaluate(async () => {
      const html = document.documentElement;
      html.classList.remove('preview');
      html.classList.add('is-production');
      html.classList.add('reduce-motion');
      const book = (window as unknown as { __book: { show(i: number): void } }).__book;
      const pages = [...document.querySelectorAll<HTMLElement>('.book > .page')];
      const found: string[] = [];
      for (let i = 0; i < pages.length; i++) {
        book.show(i);
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const walker = document.createTreeWalker(pages[i], NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const node = walker.currentNode as Text;
          const el = node.parentElement!;
          if (/To be provided|Phase \d|Placeholder art/.test(node.data) && el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) found.push(`${pages[i].id}: ${node.data.trim().slice(0, 40)}`);
        }
      }
      return found;
    });
    check('AC-09', 'Production view hides every "To be provided" label and preview note', leaks.length === 0, leaks.slice(0, 6).join(' | '));
    await ctx.close();
  }

  /* ------------------------------------------------ AC-08 layout at phone sizes */
  for (const [w, h] of [
    [360, 640],
    [375, 667],
    [390, 844],
    [430, 932],
  ] as const) {
    const ctx = await mobileContext(browser, w, h);
    const page = await ctx.newPage();
    await page.goto(BASE);
    await settle(page);
    const problems = await page.evaluate(async () => {
      document.documentElement.classList.add('reduce-motion');
      const book = (window as unknown as { __book: { show(i: number): void } }).__book;
      const pages = [...document.querySelectorAll<HTMLElement>('.book > .page')];
      const out: string[] = [];
      for (let i = 0; i < pages.length; i++) {
        book.show(i);
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const content = pages[i].querySelector<HTMLElement>('.page__content')!;
        const c = content.getBoundingClientRect();
        let top = Infinity;
        let bottom = -Infinity;
        let right = -Infinity;
        let left = Infinity;
        for (const child of content.children) {
          const r = child.getBoundingClientRect();
          if (!r.height) continue;
          top = Math.min(top, r.top);
          bottom = Math.max(bottom, r.bottom);
          left = Math.min(left, r.left);
          right = Math.max(right, r.right);
        }
        const issues = [];
        if (top < c.top - 1 || bottom > c.bottom + 1) issues.push(`vertical overflow ${Math.round(Math.max(c.top - top, bottom - c.bottom))}px`);
        if (left < 0 || right > window.innerWidth) issues.push('beyond screen edge');
        if (document.documentElement.scrollWidth > window.innerWidth) issues.push('horizontal page scroll');
        if (issues.length) out.push(`${pages[i].id}: ${issues.join(', ')}`);
      }
      return out;
    });
    check('AC-08', `No overflow at ${w}×${h} (preview build, phase notes included)`, problems.length === 0, problems.join(' | '));
    if (SHOTS && w === 375) {
      for (const id of ['cover', 'welcome', 'save-the-date', 'events']) {
        await page.evaluate((pid) => {
          const pages = [...document.querySelectorAll('.book > .page')];
          (window as unknown as { __book: { show(i: number): void } }).__book.show(pages.findIndex((p) => p.id === pid));
        }, id);
        await page.waitForTimeout(150);
        await page.screenshot({ path: `${SHOTS}/mobile-${w}x${h}-${id}.png` });
      }
    }
    await ctx.close();
  }

  /* ------------------------------------------------ performance with CPU slowed 4× */
  {
    const ctx = await mobileContext(browser);
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await page.goto(BASE);
    await settle(page);
    await page.evaluate(() => localStorage.setItem('rdv:hint-seen', '1'));
    await page.waitForTimeout(1500);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    // The temple entrance under the same 4× CPU slowdown
    await page.evaluate(() => {
      const w = window as unknown as { __og: number[]; __orun: boolean };
      w.__og = [];
      w.__orun = true;
      let last = 0;
      const loop = (t: number) => {
        if (last) w.__og.push(t - last);
        last = t;
        if (w.__orun) requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    });
    await ringTheBell(page);
    await bookReady(page, 25000);
    const openGaps = await page.evaluate(() => {
      const w = window as unknown as { __og: number[]; __orun: boolean };
      w.__orun = false;
      return w.__og;
    });
    await openTheInvitation(page);
    await page.waitForFunction(() => document.querySelector('.page[data-state=current]')?.id === 'welcome', null, { timeout: 8000, polling: POLL });
    const openAvg = openGaps.reduce((a, b) => a + b, 0) / openGaps.length;
    metrics.openingFrames = { averageFps: +(1000 / openAvg).toFixed(1), framesOver20ms: openGaps.filter((g) => g > 20).length, frames: openGaps.length };
    await settle(page);
    await page.waitForTimeout(2500); // let Welcome's entry choreography finish before measuring turns
    await page.evaluate(() => {
      const w = window as unknown as { __gaps: number[]; __run: boolean };
      w.__gaps = [];
      w.__run = true;
      let last = 0;
      const loop = (t: number) => {
        if (last) w.__gaps.push(t - last);
        last = t;
        if (w.__run) requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    });
    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: 'Next page' }).last().tap();
      await page.waitForTimeout(40);
      await settle(page);
    }
    for (let i = 0; i < 3; i++) await touchDrag(cdp, page, [330, 600], [60, 380], 18, 16);
    const gaps = await page.evaluate(() => {
      const w = window as unknown as { __gaps: number[]; __run: boolean };
      w.__run = false;
      return w.__gaps;
    });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    const sorted = [...gaps].sort((a, b) => a - b);
    const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    metrics.turnFrames = {
      cpuSlowdown: '4x',
      frames: gaps.length,
      averageFps: +(1000 / avg).toFixed(1),
      medianFrameMs: +sorted[sorted.length >> 1].toFixed(1),
      p95FrameMs: +sorted[Math.floor(sorted.length * 0.95)].toFixed(1),
      framesOver20ms: gaps.filter((g) => g > 20).length,
    };
    check('PERF', 'Turns hold ≥50 fps average with CPU slowed 4×', 1000 / avg >= 50, JSON.stringify(metrics.turnFrames));
    await ctx.close();
  }

  /* ------------------------------------------------ desktop Option B */
  {
    const ctx = await newContext(browser, { viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE);
    await settle(page);
    const box = await page.locator('.app').boundingBox();
    const ratio = box ? box.width / box.height : 0;
    check('AC-35', 'Desktop shows the book inside one centred phone mockup', !!box && Math.abs(ratio - 390 / 844) < 0.01 && Math.abs(box.x + box.width / 2 - 720) < 4, JSON.stringify(box));
    // One mockup and one unchanging background, whichever page is showing (PRD §7.2): the client's cream
    // temple picture (two sides and a plain middle), with its garlands, lamps and bells swaying on canvases.
    const scene = () =>
      page.evaluate(() => {
        const panels = [...document.querySelectorAll<HTMLElement>('.stage__panel')];
        return {
          devices: document.querySelectorAll('.device').length,
          strip: getComputedStyle(document.querySelector('.stage__bg')!).backgroundImage.includes('strip'),
          panels: panels.map((p) => getComputedStyle(p).backgroundImage.includes('panel')).join(),
          hanging: document.querySelectorAll('.stage__bg canvas').length,
          velvet: document.querySelectorAll('.stage__frame, .stage__spray').length,
        };
      });
    const before = await scene();
    // The garlands move: the same canvas looks different a moment later
    const sample = () => page.evaluate(() => document.querySelector<HTMLCanvasElement>('.stage__panel--l canvas')!.toDataURL().length + ':' + document.querySelector<HTMLCanvasElement>('.stage__panel--l canvas')!.toDataURL().slice(-200));
    const drawn1 = await sample();
    await page.waitForTimeout(1500);
    const drawn2 = await sample();
    await page.evaluate(() => (window as unknown as { __book: { show(i: number): void } }).__book.show([...document.querySelectorAll('.book > .page')].findIndex((p) => p.id === 'dress-code')));
    await page.waitForTimeout(200);
    const after = await scene();
    check(
      'AC-35b',
      'Desktop background (the cream temple picture, no velvet or border) stays the same on every page, and its garlands, lamp and bells sway',
      before.devices === 1 && JSON.stringify(before) === JSON.stringify(after) && before.strip && before.panels === 'true,true' && before.hanging === 10 && before.velvet === 0 && drawn1 !== drawn2,
      JSON.stringify({ before, after, moved: drawn1 !== drawn2 }),
    );
    if (SHOTS) {
      await page.evaluate(() => (window as unknown as { __book: { show(i: number): void } }).__book.show(0));
      await settle(page);
      await page.screenshot({ path: `${SHOTS}/desktop-1440x900-cover.png` });
      await page.evaluate(() => (location.hash = 'welcome'));
      await settle(page);
      await page.waitForTimeout(1400); // entry choreography
      await page.screenshot({ path: `${SHOTS}/desktop-1440x900-welcome.png` });
    }
    await ctx.close();
  }

  /* Tablet portrait: one page at full height on the desktop background, no mockup (PRD §7.3) */
  {
    const ctx = await newContext(browser, { viewport: { width: 768, height: 1024 }, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(BASE);
    await settle(page);
    const t = await page.evaluate(() => {
      const app = document.querySelector('.app')!.getBoundingClientRect();
      return {
        mockup: getComputedStyle(document.querySelector('.device')!).display !== 'contents',
        height: Math.round(app.height),
        centred: Math.abs(app.left + app.width / 2 - 384) < 2,
        background: getComputedStyle(document.querySelector('.stage__bg')!).display !== 'none',
      };
    });
    check('AC-35c', 'Tablet portrait shows one page at full height on the background, without a mockup', !t.mockup && t.height === 1024 && t.centred && t.background, JSON.stringify(t));
    await ctx.close();
  }

  await browser.close();

  const failed = results.filter((r) => !r.pass);
  for (const r of results) console.log(`${r.pass ? '✓' : '✗'} ${r.id.padEnd(7)} ${r.name}${r.detail && !r.pass ? `\n          ${r.detail}` : ''}`);
  if (pageErrors.length) console.log(`\nPage errors (${pageErrors.length}):\n  ${[...new Set(pageErrors)].slice(0, 10).join('\n  ')}`);
  console.log('\nMetrics:', JSON.stringify(metrics, null, 2));
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
