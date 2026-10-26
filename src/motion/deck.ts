import { gsap, isReducedMotion } from './choreo';

/**
 * Dress-code card deck (PRD §6.12): a fanned stack where the front card slides away and tucks
 * to the back on a swipe, the previous card returns on a swipe the other way, and a tap turns
 * the front card over. Horizontal swipes belong to the deck (data-gesture="x"); vertical
 * swipes still turn the book's page.
 */
export function initDeck(page: HTMLElement) {
  const deck = page.querySelector<HTMLElement>('[data-deck]')!;
  const cards = [...deck.querySelectorAll<HTMLElement>('[data-card]')];
  const dots = [...page.querySelectorAll<HTMLElement>('[data-deck-dot]')];
  const live = page.querySelector<HTMLElement>('[data-deck-live]')!;
  let order = cards.map((_, i) => i);
  let busy = false;

  const slot = (k: number) => ({
    x: k === 0 ? 0 : `${k * 4}%`,
    y: `${k * 1.6}%`,
    rotation: k === 0 ? 0 : k % 2 ? 5 : -5,
    scale: 1 - k * 0.04,
    opacity: k > 2 ? 0 : 1,
    zIndex: 10 - k,
  });

  function layout(animate: boolean) {
    order.forEach((cardIndex, k) => {
      const card = cards[cardIndex];
      card.setAttribute('aria-hidden', k === 0 ? 'false' : 'true');
      if (animate && !isReducedMotion()) gsap.to(card, { ...slot(k), duration: 0.45, ease: 'power3.out' });
      else gsap.set(card, slot(k));
    });
    const front = order[0];
    dots.forEach((d, i) => d.classList.toggle('is-active', i === front));
    live.textContent = cards[front].getAttribute('aria-label') ?? '';
  }

  const unflip = () => cards.forEach((c) => c.classList.remove('is-flipped'));

  function next() {
    if (busy) return;
    unflip();
    const front = cards[order[0]];
    const done = () => {
      order = [...order.slice(1), order[0]];
      layout(true);
      busy = false;
    };
    if (isReducedMotion()) return done();
    busy = true;
    gsap.to(front, { x: '-125%', rotation: -12, duration: 0.3, ease: 'power2.in', onComplete: done });
  }

  function prev() {
    if (busy) return;
    unflip();
    order = [order[order.length - 1], ...order.slice(0, -1)];
    const back = cards[order[0]];
    if (isReducedMotion()) return layout(false);
    gsap.set(back, { x: '125%', rotation: 12, zIndex: 11, opacity: 1 });
    layout(true);
  }

  function show(index: number) {
    let guard = cards.length;
    while (order[0] !== index && guard--) order = [...order.slice(1), order[0]];
    unflip();
    layout(true);
  }

  /* ---- pointer: drag the front card sideways; a tap turns it over */
  let start: { x: number; y: number; t: number } | null = null;
  let axis: 'x' | 'y' | null = null;
  let lastX = 0;
  let lastT = 0;

  deck.addEventListener('pointerdown', (e) => {
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
    if (!start) return;
    const dx = e.clientX - start.x;
    const moved = axis === 'x';
    const velocity = moved ? (lastX - start.x) / Math.max(1, lastT - start.t) : 0;
    start = null;
    if (!moved) {
      if (axis === null && Math.abs(dx) < 10) cards[order[0]].classList.toggle('is-flipped');
      return;
    }
    const width = deck.offsetWidth;
    if (dx < -width * 0.3 || velocity < -0.45) next();
    else if (dx > width * 0.3 || velocity > 0.45) {
      gsap.to(cards[order[0]], { x: 0, rotation: 0, duration: 0.25 });
      prev();
    } else gsap.to(cards[order[0]], { x: 0, rotation: 0, duration: 0.3, ease: 'power3.out' });
  };
  deck.addEventListener('pointerup', release);
  deck.addEventListener('pointercancel', release);

  page.querySelector('[data-deck-next]')?.addEventListener('click', next);
  page.querySelector('[data-deck-prev]')?.addEventListener('click', prev);
  dots.forEach((dot, i) => dot.addEventListener('click', () => show(i)));
  deck.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'ArrowRight') next();
      else prev();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      cards[order[0]].classList.toggle('is-flipped');
    }
  });

  layout(false);
  return { cards: () => order.map((i) => cards[i]) };
}
