import { BookController, type PageEnterDetail, type Via } from './controller';
import { DialogManager } from './dialogs';
import { WheelGate } from './gestures';
import { mountChoreos } from '../motion/choreo';
import '../motion/pages';
import { openInvitation, resetInvitation } from '../motion/pages/cover';
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
    if (index === 1 && !store.get('rdv:hint-seen') && mode === 'book') {
      store.set('rdv:hint-seen', '1');
      window.setTimeout(() => {
        if (controller.index !== 1) return;
        toast('Swipe or tap › to turn the page');
        void controller.peek();
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

  const el = (e.target as Element).closest<HTMLElement>('[data-open-book], [data-skip], [data-return-first], [data-share], [data-open-dialog], [data-goto], [data-copy]');
  if (!el) return;

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
  } else if (el.matches('[data-skip]')) {
    controller.goTo(controller.openTarget, 'instant', 'open');
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

/** Tap to Open: the envelope opens and its card unfolds into the first page (PRD §6.1). */
let opening = false;
async function openBook() {
  if (opening || controller.isBusy || controller.index !== 0) return;
  opening = true;
  controller.enabled = false;
  app.classList.add('is-opening');
  try {
    if (!reducedMotion()) await openInvitation(pages[0]);
    controller.goTo(controller.openTarget, reducedMotion() ? 'fade' : 'instant', 'open');
    // The cover now sits hidden under the first page; close the envelope again for a later revisit.
    requestAnimationFrame(() => resetInvitation(pages[0]));
  } finally {
    opening = false;
    app.classList.remove('is-opening');
    controller.enabled = mode === 'book' && !dialogs.isOpen;
  }
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

// Exposed for manual QA in the browser console during development only.
if (import.meta.env.DEV) (window as unknown as { __book: BookController }).__book = controller;
