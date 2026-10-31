import { defineChoreo, gsap, isReducedMotion } from '../choreo';

/**
 * Need Help (PRD §6.17), after the client's reference video of a profile bar that opens a card. Three glass bars (Rahul's
 * father, Divya's father, the event coordinator) each hold a card folded down inside them. Touch a bar (or, with a mouse,
 * rest the pointer on it) and the card opens: its accent strip slides up out of the bar, the card grows upward from it with
 * what it holds anchored at its foot (so the strip shows first, then the Call, WhatsApp and Email rows, then the photograph)
 * and its tab slides in. Touching the bar again, touching elsewhere, Escape, or moving the pointer away folds it back down.
 * Only one card is open at a time. Under reduced motion a card opens and closes without moving.
 */
const OPEN_S = 0.75;
const CLOSE_S = 0.5;
const HOVER_IN_MS = 50;
const HOVER_OUT_MS = 260;

defineChoreo('help', (page) => {
  const q = <T extends HTMLElement>(sel: string) => [...page.querySelectorAll<T>(sel)];
  const items = q('[data-contact]');
  const head = q('.nh__head');
  const hint = q('[data-hint]');
  const bars = q('[data-bar]');
  let current: HTMLElement | null = null;
  let pinned = false; // opened by a mouse click: it stays until the bar is touched again
  const timers = new WeakMap<HTMLElement, number>();
  let tl: gsap.core.Timeline | null = null;

  const parts = (item: HTMLElement) => ({
    bar: item.querySelector<HTMLElement>('[data-bar]')!,
    card: item.querySelector<HTMLElement>('[data-card]')!,
    tab: item.querySelector<HTMLElement>('.nh__tab')!,
    rows: [...item.querySelectorAll<HTMLElement>('.nh__rows li')],
  });
  const clearTimer = (item: HTMLElement) => window.clearTimeout(timers.get(item));

  const fadeHead = (away: boolean) => head.forEach((h) => gsap.to(h, { opacity: away ? 0 : 1, duration: 0.35, overwrite: 'auto' }));
  const hideHint = (hidden: boolean) => hint.forEach((h) => gsap.to(h, { opacity: hidden ? 0 : 1, duration: 0.3, overwrite: 'auto' }));

  function open(item: HTMLElement) {
    if (current === item) return;
    if (current) close(current);
    clearTimer(item);
    current = item;
    const { bar, card, tab, rows } = parts(item);
    // the room above the bar, below the Contents button: the card never grows past it
    const room = bar.getBoundingClientRect().top - page.getBoundingClientRect().top - 60 + 8;
    card.style.setProperty('--room', `${Math.max(150, Math.floor(room))}px`);
    // on a short phone the card reaches the heading: the heading steps aside while it is open
    card.style.height = 'auto';
    const natural = Math.min(card.offsetHeight, Math.max(150, Math.floor(room)));
    card.style.height = '';
    const headBottom = head.length ? head[0].getBoundingClientRect().bottom : 0;
    fadeHead(bar.getBoundingClientRect().top + 5 - natural < headBottom + 4);
    item.classList.add('is-open');
    bar.setAttribute('aria-expanded', 'true');
    card.inert = false;
    hideHint(true);
    gsap.killTweensOf([card, tab, ...rows]);
    if (isReducedMotion()) {
      gsap.set(card, { height: 'auto' });
      gsap.set([tab, ...rows], { clearProps: 'all' });
      return;
    }
    gsap.set(tab, { xPercent: 100 });
    gsap.set(rows, { opacity: 0, y: 10 });
    gsap
      .timeline()
      .to(card, { height: 'auto', duration: OPEN_S, ease: 'power3.out' }, 0)
      .to(rows, { opacity: 1, y: 0, duration: 0.45, stagger: 0.07, ease: 'power2.out' }, 0.18)
      .to(tab, { xPercent: 0, duration: 0.5, ease: 'power3.out' }, 0.35);
  }

  function close(item: HTMLElement, instant = false) {
    clearTimer(item);
    const { bar, card, tab, rows } = parts(item);
    if (current === item) {
      current = null;
      pinned = false;
    }
    bar.setAttribute('aria-expanded', 'false');
    card.inert = true;
    if (!current) {
      hideHint(false);
      if (!instant) fadeHead(false);
    }
    gsap.killTweensOf([card, tab, ...rows]);
    const done = () => {
      item.classList.remove('is-open');
      gsap.set([tab, ...rows], { clearProps: 'all' });
    };
    if (instant || isReducedMotion()) {
      gsap.set(card, { height: 0 });
      return done();
    }
    gsap.to(rows, { opacity: 0, duration: 0.2, overwrite: true });
    gsap.to(card, { height: 0, duration: CLOSE_S, ease: 'power3.inOut', onComplete: done });
  }

  items.forEach((item) => {
    const { bar } = parts(item);
    // a mouse: resting on the bar (or its card) opens it, leaving closes it unless the bar was clicked
    item.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      clearTimer(item);
      timers.set(item, window.setTimeout(() => open(item), HOVER_IN_MS));
    });
    item.addEventListener('pointerleave', (e) => {
      if (e.pointerType !== 'mouse') return;
      clearTimer(item);
      if (current === item && !pinned) timers.set(item, window.setTimeout(() => close(item), HOVER_OUT_MS));
      else if (current !== item) clearTimer(item);
    });
    bar.addEventListener('click', (e) => {
      const byMouse = (e as PointerEvent).pointerType === 'mouse';
      if (byMouse) {
        // the pointer is already resting on it (so it is open or opening): a click holds it open; another click lets it go
        if (current === item && pinned) close(item);
        else {
          open(item);
          pinned = true;
        }
        return;
      }
      if (current === item) close(item);
      else open(item);
    });
  });

  // touching anywhere else, or Escape, folds the open card back down
  const outside = (e: PointerEvent) => {
    if (current && !current.contains(e.target as Node)) close(current);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && current) {
      e.stopPropagation();
      const bar = parts(current).bar;
      close(current);
      bar.focus();
    }
  };
  document.addEventListener('pointerdown', outside, true);
  page.addEventListener('keydown', onKey);

  const hidden = () => {
    const calm = isReducedMotion();
    gsap.set(head, { opacity: calm ? 1 : 0, y: calm ? 0 : 10 });
    gsap.set(bars, { opacity: calm ? 1 : 0, y: calm ? 0 : 26 });
    gsap.set(hint, { opacity: calm ? 1 : 0 });
  };
  hidden();

  return {
    enter() {
      tl?.kill();
      items.forEach((item) => close(item, true));
      hidden();
      if (isReducedMotion()) return;
      tl = gsap
        .timeline()
        .to(head, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 0.1)
        .to(bars, { opacity: 1, y: 0, duration: 0.8, stagger: 0.14, ease: 'power3.out' }, 0.35)
        .to(hint, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 1.0);
    },
    leave() {
      tl?.kill();
      items.forEach((item) => close(item, true));
    },
  };
});
