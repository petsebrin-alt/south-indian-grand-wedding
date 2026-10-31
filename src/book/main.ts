import { BookController, type PageEnterDetail, type Via } from './controller';
import { DialogManager } from './dialogs';
import { WheelGate } from './gestures';
import { mountChoreos } from '../motion/choreo';
import '../motion/pages';
import { coverStage, enterTemple, greetGuest, openCard, showBook, showDoors } from '../motion/pages/cover';
import { ringBell, setSound, soundOn } from '../lib/bell';
import { initForms } from '../forms';

/**
 * Wires the book engine to the page chrome, Contents, deep links, history, Scroll View,
 * keyboard, wheel and reduced motion (PRD §5.2, §8).
 */
const html = document.documentElement;
const app = document.querySelector<HTMLElement>('.app')!;
const book = app.querySelector<HTMLElement>('.book')!;
const pages = [...book.querySelectorAll<HTMLElement>(':scope > .page')];
const $ = <T extends HTMLElement = HTMLElement>(sel: string) => app.querySelector<T>(sel);
const $$ = <T extends HTMLElement = HTMLElement>(sel: string) => [...app.querySelectorAll<T>(sel)];

const store = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* private mode: preference simply not remembered */
    }
  },
};
const session = {
  get: (k: string) => {
    try {
      return sessionStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string) => {
    try {
      sessionStorage.setItem(k, v);
    } catch {
      /* ignore */
    }
  },
};

/* ------------------------------------------------------------------ preferences */

const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
const reducedMotion = () => motionQuery.matches || store.get('rdv:reduce-motion') === '1';
const syncMotionClass = () => html.classList.toggle('reduce-motion', reducedMotion());
motionQuery.addEventListener('change', syncMotionClass);
syncMotionClass();

const highQuality = matchMedia('(pointer: fine)').matches && (navigator.hardwareConcurrency ?? 4) >= 8;
const pageIndexById = (id: string) => pages.findIndex((p) => p.id === id);
const lastIndex = pages.length - 1;

/* ------------------------------------------------------------------ chrome */

const live = $('[data-live]');
const folioNumber = $('[data-folio-number]');
const prevBtn = $<HTMLButtonElement>('[data-prev]');
const nextBtn = $<HTMLButtonElement>('[data-next]');
const toastEl = $('[data-toast]');
let toastTimer = 0;

function toast(message: string, ms = 3200) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl.classList.remove('is-on'), ms);
}

function updateChrome(index: number) {
  app.classList.toggle('on-cover', index === 0);
  if (folioNumber) folioNumber.textContent = String(index);
  if (prevBtn) prevBtn.disabled = index <= 0;
  if (nextBtn) nextBtn.disabled = index >= lastIndex;
  $$('[data-goto]').forEach((b) => b.toggleAttribute('aria-current', Number(b.dataset.goto) === index));
}

function announce(index: number) {
  if (!live) return;
  const title = pages[index].dataset.title ?? '';
  live.textContent = index === 0 ? `Cover: ${title}` : `Page ${index} of ${lastIndex}: ${title}`;
}

function writeHash(index: number) {
  if (dialogs.isOpen) return;
  const url = index === 0 ? location.pathname + location.search : `#${pages[index].id}`;
  history.replaceState(history.state, '', url);
}

/* ------------------------------------------------------------------ book */

const dialogs = new DialogManager([book, ...$$('[data-chrome]')], (open) => {
  controller.enabled = !open && mode === 'book';
});

/**
 * Until the guest has turned a page themselves, a pill above the page number says "Swipe or tap to turn the page", the
 * next arrow nudges forward and the pearl pulses (the client's guests did not know what to do next on a phone).
 * It shows a moment after a page arrives and goes for good once the guest turns a page.
 */
const turnCue = $('[data-turn-cue]');
let cueTimer = 0;
function setTurnCue(on: boolean) {
  turnCue?.classList.toggle('is-on', on);
  html.classList.toggle('turn-hint', on);
}
function syncTurnCue(index: number) {
  window.clearTimeout(cueTimer);
  const wanted = mode === 'book' && index >= 1 && index < lastIndex && store.get('rdv:turned') !== '1';
  if (!wanted) return setTurnCue(false);
  cueTimer = window.setTimeout(() => setTurnCue(controller.index === index && !dialogs.isOpen && mode === 'book' && store.get('rdv:turned') !== '1'), 900);
}

const controller = new BookController({
  root: book,
  pages,
  reducedMotion,
  highQuality,
  onChange: (index: number, _prev: number, via: Via) => {
    updateChrome(index);
    announce(index);
    writeHash(index);
    if (index > 0) {
      session.set('rdv:opened', '1');
      controller.openTarget = 1;
    }
    if (via !== 'init') pages[index].querySelector<HTMLElement>('[data-page-heading]')?.focus({ preventScroll: true });
    html.classList.toggle('pearl-hint', index === 1 || index === 2);
    // The guest's own turn (swipe, arrow, key, wheel) means they know how: the cue is not shown again
    if (index !== _prev && (via === 'gesture' || via === 'button' || via === 'keyboard' || via === 'wheel')) {
      store.set('rdv:turned', '1');
    }
    syncTurnCue(index);
    if (index === 1 && !store.get('rdv:hint-seen') && mode === 'book') {
      store.set('rdv:hint-seen', '1');
      window.setTimeout(() => {
        if (controller.index === 1) void controller.peek();
      }, 1400);
    }
  },
});

// Page-entry choreography (PRD §8.2): first visits animate, revisits show the final state.
// Pages with a GSAP choreography use it; the rest use the generic [data-enter] fade.
const choreos = mountChoreos(pages);

function enterPage(page: HTMLElement, firstVisit: boolean) {
  const animate = firstVisit && !reducedMotion();
  const choreo = choreos.get(page);
  if (choreo) choreo.enter(animate);
  else page.classList.toggle('no-anim', !animate);
  page.classList.add('is-entered');
}

book.addEventListener('page:enter', (e) => {
  enterPage(e.target as HTMLElement, (e as CustomEvent<PageEnterDetail>).detail.firstVisit);
  // Back on the cover after opening the card: it is closed again, ready to open
  if (e.target === pages[0] && pages[0].dataset.stage === 'book') showBook(pages[0]);
});
book.addEventListener('page:leave', (e) => {
  const page = e.target as HTMLElement;
  choreos.get(page)?.leave?.((e as CustomEvent<{ to: number }>).detail.to - pages.indexOf(page));
});

/* ------------------------------------------------------------------ Scroll View */

let mode: 'book' | 'scroll' = 'book';
let observer: IntersectionObserver | null = null;
let scrollIndex = 0;

function scrollToPage(index: number, smooth = true) {
  pages[index].scrollIntoView({ behavior: smooth && !reducedMotion() ? 'smooth' : 'auto', block: 'start' });
}

function setMode(next: 'book' | 'scroll') {
  mode = next;
  html.classList.toggle('mode-scroll', next === 'scroll');
  html.classList.toggle('mode-book', next === 'book');
  controller.enabled = next === 'book' && !dialogs.isOpen;
  store.set('rdv:view', next);
  $$<HTMLInputElement>('[data-toggle-scroll]').forEach((t) => (t.checked = next === 'scroll'));
  syncTurnCue(controller.index);

  if (next === 'scroll') {
    pages.forEach((p) => {
      p.dataset.state = 'flow';
      p.inert = false;
    });
    scrollIndex = controller.index;
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const page = entry.target as HTMLElement;
          const index = pages.indexOf(page);
          if (!page.classList.contains('is-entered')) enterPage(page, true);
          scrollIndex = index;
          updateChrome(index);
          writeHash(index);
        }
      },
      { root: book, threshold: 0.55 },
    );
    pages.forEach((p) => observer!.observe(p));
    requestAnimationFrame(() => scrollToPage(scrollIndex, false));
  } else {
    observer?.disconnect();
    observer = null;
    book.scrollTop = 0;
    controller.show(scrollIndex, 'contents');
  }
}

/* ------------------------------------------------------------------ navigation */

function goTo(index: number, via: Via) {
  if (mode === 'scroll') return scrollToPage(index);
  controller.goTo(index, 'auto', via);
}

prevBtn?.addEventListener('click', () => controller.prev('button'));
nextBtn?.addEventListener('click', () => controller.next('button'));
$('[data-pearl]')?.addEventListener('click', () => controller.next('button'));

app.addEventListener('click', (e) => {
  const disabled = (e.target as Element).closest<HTMLElement>('[aria-disabled="true"]');
  if (disabled) {
    // Unavailable actions stay visible; a tap explains why instead of doing nothing.
    e.preventDefault();
    if (disabled.dataset.disabledMessage) toast(disabled.dataset.disabledMessage);
    return;
  }

  const el = (e.target as Element).closest<HTMLElement>('[data-open-book], [data-return-first], [data-share], [data-open-dialog], [data-goto], [data-copy], [data-ring], [data-ring-any], [data-sound]');
  if (!el) return;

  if (el.matches('[data-ring], [data-ring-any]')) {
    void enterTemple_(el.matches('.op-bell') ? el : null);
    return;
  }
  if (el.matches('[data-sound]')) {
    setSound(!soundOn());
    syncSound();
    return;
  }

  if (el.matches('[data-copy]')) {
    navigator.clipboard
      .writeText(el.dataset.copy!)
      .then(() => toast(el.dataset.copyMessage ?? 'Details copied'))
      .catch(() => toast('Copying is not available on this device'));
    return;
  }

  if (el.matches('[data-open-book]')) {
    e.preventDefault();
    if (mode === 'scroll') scrollToPage(controller.openTarget);
    else void openBook();
  } else if (el.matches('[data-return-first]')) {
    // A quick riffle back to Welcome, not the cover (PRD §6.18); reduced motion fades instead.
    if (mode === 'scroll') scrollToPage(1);
    else controller.goTo(1, 'riffle', 'button');
  } else if (el.matches('[data-share]')) {
    void share(el);
  } else if (el.matches('[data-open-dialog]')) {
    const dialog = document.getElementById(el.dataset.openDialog!);
    if (dialog) dialogs.open(dialog, el);
  } else if (el.matches('[data-goto]')) {
    const index = Number(el.dataset.goto);
    void dialogs.close().then(() => goTo(index, 'contents'));
  }
});

/**
 * The temple entrance (PRD §6.1): ringing the bell opens the doors and plays the walk into the
 * courtyard; the invitation book is then ready, and "Open the Invitation" opens it with a page
 * curl (a cross-fade with reduced motion) onto Welcome, or the deep-linked page.
 */
const cover = pages[0];
const entrance = cover.querySelector<HTMLElement>('[data-entrance]');
const soundButton = cover.querySelector<HTMLElement>('[data-sound]');
const syncSound = () => soundButton?.setAttribute('aria-pressed', String(soundOn()));
syncSound();

async function enterTemple_(bell: HTMLElement | null) {
  if (coverStage(cover) !== 'doors' || controller.index !== 0 || controller.isBusy) return;
  controller.enabled = false;
  ringBell(entrance?.dataset.bellSrc || null);
  try {
    await enterTemple(cover, bell ?? cover.querySelector<HTMLElement>('.op-bell'));
    session.set('rdv:entered', '1');
    cover.querySelector<HTMLElement>('[data-open-book]')?.focus({ preventScroll: true });
  } finally {
    controller.enabled = mode === 'book' && !dialogs.isOpen;
  }
  armAutoOpen();
}

let opening = false;
async function openBook() {
  if (opening || controller.isBusy || controller.index !== 0) return;
  if (coverStage(cover) === 'doors') return void enterTemple_(null);
  opening = true;
  autoSpent = true;
  disarmAutoOpen();
  controller.enabled = false;
  app.classList.add('is-opening');
  try {
    await openCard(cover);
    controller.goTo(controller.openTarget, 'curl', 'open');
  } finally {
    opening = false;
    app.classList.remove('is-opening');
    controller.enabled = mode === 'book' && !dialogs.isOpen;
  }
}

/**
 * The invitation opens by itself (the client's request): once the card with "Open the Invitation" is showing, a guest
 * who does nothing sees it open after AUTO_OPEN_MS. Any touch, key press or scroll before then cancels it (the guest
 * is in charge), and it happens once per page load, so going back to the card later waits for a tap. The first step
 * (ringing the bell at the closed doors) is still the guest's own tap, as the browser only lets sound start from one.
 * localStorage 'rdv:auto' = 'off' turns it off (the automated checks do).
 */
const AUTO_OPEN_MS = 1500;
let autoTimer = 0;
let autoSpent = false;
const interactions = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
function disarmAutoOpen() {
  window.clearTimeout(autoTimer);
  autoTimer = 0;
  interactions.forEach((t) => window.removeEventListener(t, cancelAutoOpen, true));
}
function cancelAutoOpen() {
  autoSpent = true; // the guest took over
  disarmAutoOpen();
}
function armAutoOpen() {
  disarmAutoOpen();
  if (autoSpent || mode !== 'book' || store.get('rdv:auto') === 'off' || coverStage(cover) !== 'book' || controller.index !== 0) return;
  interactions.forEach((t) => window.addEventListener(t, cancelAutoOpen, true));
  autoTimer = window.setTimeout(function fire() {
    autoTimer = 0;
    if (document.hidden) {
      // Wait until the guest is looking at the page
      document.addEventListener('visibilitychange', () => armAutoOpen(), { once: true });
      return;
    }
    if (autoSpent || dialogs.isOpen || controller.isBusy || controller.index !== 0 || coverStage(cover) !== 'book') return disarmAutoOpen();
    disarmAutoOpen();
    void openBook();
  }, AUTO_OPEN_MS);
}

$$<HTMLInputElement>('[data-toggle-scroll]').forEach((t) =>
  t.addEventListener('change', () => void dialogs.close().then(() => setMode(t.checked ? 'scroll' : 'book'))),
);
$('[data-book-view]')?.addEventListener('click', () => setMode('book'));
$$<HTMLInputElement>('[data-toggle-motion]').forEach((t) => {
  t.checked = store.get('rdv:reduce-motion') === '1';
  t.addEventListener('change', () => {
    store.set('rdv:reduce-motion', t.checked ? '1' : '0');
    syncMotionClass();
  });
});

/** Native share sheet where available; otherwise WhatsApp and Copy link (PRD §6.18, AC-30). */
async function share(el: HTMLElement) {
  const url = el.dataset.shareUrl || location.origin + location.pathname;
  const text = el.dataset.shareText ?? document.title;
  if (navigator.share) {
    try {
      return await navigator.share({ title: document.title, text, url });
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') return; // the guest closed the share sheet
    }
  }
  const sheet = document.getElementById('share-sheet');
  if (!sheet) return;
  sheet.querySelector<HTMLAnchorElement>('[data-share-whatsapp]')!.href = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
  sheet.querySelector<HTMLElement>('[data-share-copy]')!.dataset.copy = url;
  sheet.querySelector<HTMLElement>('[data-share-url-text]')!.textContent = url;
  dialogs.open(sheet, el);
}

document.addEventListener('keydown', (e) => {
  if (dialogs.isOpen || mode !== 'book' || e.altKey || e.ctrlKey || e.metaKey) return;
  const target = e.target instanceof Element ? e.target : document.body;
  if (target.closest('input, textarea, select, [contenteditable]')) return;
  // Carousels and tab lists own the arrow keys (and Space for turning a card) while they have focus.
  if (['ArrowLeft', 'ArrowRight', ' ', 'Home', 'End'].includes(e.key) && target.closest('[data-gesture="x"], [role="tablist"]')) return;
  const onControl = !!target.closest('button, a');
  switch (e.key) {
    case 'ArrowRight':
    case 'PageDown':
      e.preventDefault();
      controller.next('keyboard');
      break;
    case 'ArrowLeft':
    case 'PageUp':
      e.preventDefault();
      controller.prev('keyboard');
      break;
    case ' ':
      if (onControl) return; // Space activates the focused button
      e.preventDefault();
      if (e.shiftKey) controller.prev('keyboard');
      else controller.next('keyboard');
      break;
    case 'Home':
      e.preventDefault();
      controller.goTo(1, 'auto', 'keyboard');
      break;
    case 'End':
      e.preventDefault();
      controller.goTo(lastIndex, 'auto', 'keyboard');
      break;
  }
});

const wheel = new WheelGate();
book.addEventListener(
  'wheel',
  (e) => {
    if (!controller.enabled) return;
    const delta = (Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX) * (e.deltaMode === 1 ? 16 : 1);
    const dir = wheel.push(delta, e.timeStamp);
    if (dir === 1) controller.next('wheel');
    else if (dir === -1) controller.prev('wheel');
  },
  { passive: true },
);

window.addEventListener('hashchange', () => {
  const index = pageIndexById(location.hash.slice(1));
  if (index < 0 || dialogs.isOpen) return;
  if (mode === 'scroll') scrollToPage(index);
  else if (index !== controller.index) controller.goTo(index, 'auto', 'link');
});

/* ------------------------------------------------------------------ start */

initForms();

greetGuest(cover);
if (session.get('rdv:entered')) showBook(cover);
else showDoors(cover);

const linked = pageIndexById(decodeURIComponent(location.hash.slice(1)));
if (linked > 0 && session.get('rdv:opened')) {
  controller.show(linked);
} else {
  controller.openTarget = linked > 0 ? linked : 1;
  controller.show(0);
}
book.classList.add('is-ready');
html.classList.add('mode-book');
if (store.get('rdv:view') === 'scroll') setMode('scroll');
else if (controller.index === 0) armAutoOpen();

// Exposed for manual QA in the browser console during development only.
if (import.meta.env.DEV) (window as unknown as { __book: BookController }).__book = controller;
