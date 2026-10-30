import { gsap, isReducedMotion } from './choreo';

/**
 * Dress-code card stack (PRD §6.12): the cards lie in a fanned stack and turn by themselves, one after another: the
 * front card slides away and tucks to the back, the next comes forward, every few seconds, with no tap needed. A
 * swipe sideways, the arrows, the dots and the arrow keys move it by hand; the cards then wait a while before going
 * on by themselves again. Horizontal swipes belong to the stack (data-gesture="x"); vertical swipes still turn the
 * book's page. Under reduced motion the cards stay until moved by hand.
 */
const SHOW_MS = 5200; // how long a card stays in front before the next comes
const RESUME_MS = 9000; // how long after a hand movement before it goes on by itself

export function initDeck(page: HTMLElement) {
  const deck = page.querySelector<HTMLElement>('[data-deck]')!;
  const cards = [...deck.querySelectorAll<HTMLElement>('[data-card]')];
  const dots = [...page.querySelectorAll<HTMLElement>('[data-deck-dot]')];
  const live = page.querySelector<HTMLElement>('[data-deck-live]')!;
  let order = cards.map((_, i) => i);
  let busy = false;
  let playing = false;
  let timer: gsap.core.Tween | null = null;

  const slot = (k: number) => ({
    x: k === 0 ? 0 : `${k * 3.4}%`,
    y: `${k * 2.2}%`,
    rotation: k === 0 ? 0 : k % 2 ? 3.2 : -3.2,
    scale: 1 - k * 0.035,
    opacity: k > 2 ? 0 : 1,
    zIndex: 10 - k,
  });

  function layout(animate: boolean) {
    order.forEach((cardIndex, k) => {
      const card = cards[cardIndex];
      card.setAttribute('aria-hidden', k === 0 ? 'false' : 'true');
      if (animate && !isReducedMotion()) gsap.to(card, { ...slot(k), duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
      else gsap.set(card, slot(k));
    });
    const front = order[0];
    dots.forEach((d, i) => d.classList.toggle('is-active', i === front));
    // The reader is told of a card only when it was moved by hand (it turns by itself every few seconds)
    live.textContent = timer ? '' : (cards[front].getAttribute('aria-label') ?? '');
  }

  function next() {
    if (busy) return;
    const front = cards[order[0]];
    const done = () => {
      order = [...order.slice(1), order[0]];
      layout(true);
      busy = false;
    };
    if (isReducedMotion()) return done();
    busy = true;
    gsap.to(front, { x: '-118%', y: '-4%', rotation: -9, opacity: 0, duration: 0.7, ease: 'power2.in', onComplete: done });
  }

  function prev() {
    if (busy) return;
    order = [order[order.length - 1], ...order.slice(0, -1)];
    const back = cards[order[0]];
    if (isReducedMotion()) return layout(false);
    gsap.set(back, { x: '118%', rotation: 9, zIndex: 11, opacity: 1 });
    layout(true);
  }

  function show(index: number) {
    let guard = cards.length;
    while (order[0] !== index && guard--) order = [...order.slice(1), order[0]];
    layout(true);
  }

  /* ---- by itself, and the pause after a hand movement */
  function schedule(ms: number) {
    timer?.kill();
    timer = null;
    if (!playing || isReducedMotion()) return;
    timer = gsap.delayedCall(ms / 1000, () => {
      next();
      schedule(SHOW_MS);
    });
  }
  const byHand = () => schedule(RESUME_MS);

  /* ---- pointer: drag the front card sideways */
  let start: { x: number; y: number; t: number } | null = null;
  let axis: 'x' | 'y' | null = null;
  let lastX = 0;
  let lastT = 0;

  deck.addEventListener('pointerdown', (e) => {
    timer?.pause();
    if (busy) return;
    start = { x: e.clientX, y: e.clientY, t: e.timeStamp };
    axis = null;
  });
  deck.addEventListener('pointermove', (e) => {
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (!axis) {
      if (Math.hypot(dx, dy) < 10) return;
      axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
      if (axis === 'y') {
        start = null; // the book turns the page
        return;
      }
      try {
        deck.setPointerCapture(e.pointerId);
      } catch {
        /* dragging still works without capture */
      }
    }
    lastX = e.clientX;
    lastT = e.timeStamp;
    gsap.set(cards[order[0]], { x: dx, rotation: dx * 0.04 });
  });
  const release = (e: PointerEvent) => {
    if (!start) {
      timer?.resume();
      return;
    }
    const dx = e.clientX - start.x;
    const moved = axis === 'x';
    const velocity = moved ? (lastX - start.x) / Math.max(1, lastT - start.t) : 0;
    start = null;
    if (!moved) {
      timer?.resume();
      return;
    }
    const width = deck.offsetWidth;
    if (dx < -width * 0.3 || velocity < -0.45) next();
    else if (dx > width * 0.3 || velocity > 0.45) {
      gsap.to(cards[order[0]], { x: 0, rotation: 0, duration: 0.25 });
      prev();
    } else gsap.to(cards[order[0]], { x: 0, rotation: 0, duration: 0.3, ease: 'power3.out' });
    byHand();
  };
  deck.addEventListener('pointerup', release);
  deck.addEventListener('pointercancel', release);

  page.querySelector('[data-deck-next]')?.addEventListener('click', () => {
    next();
    byHand();
  });
  page.querySelector('[data-deck-prev]')?.addEventListener('click', () => {
    prev();
    byHand();
  });
  dots.forEach((dot, i) =>
    dot.addEventListener('click', () => {
      show(i);
      byHand();
    }),
  );
  deck.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'ArrowRight') next();
      else prev();
      byHand();
    }
  });

  layout(false);
  return {
    cards: () => order.map((i) => cards[i]),
    /** From the first card, turning by itself */
    start() {
      busy = false;
      order = cards.map((_, i) => i);
      gsap.killTweensOf(cards);
      layout(false);
      playing = true;
      schedule(SHOW_MS);
    },
    stop() {
      playing = false;
      timer?.kill();
      timer = null;
    },
  };
}
