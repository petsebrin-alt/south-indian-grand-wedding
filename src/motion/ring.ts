import { gsap, isReducedMotion } from './choreo';

/**
 * 3D circular photo gallery (PRD §6.8, THEME M-10). Cards sit on a ring that recedes into the
 * page; the front card is large and sharp, side cards turn away and dim slightly (no heavy blur).
 * One card per swipe, two at most on a hard flick; never spins continuously. Horizontal swipes
 * belong to the ring (data-gesture="x"); vertical swipes still turn the book's page. Left alone it
 * moves to the next photo every few seconds; a touch, key or button pauses that for a while, then it
 * carries on. Under reduced motion nothing moves by itself.
 */
const STEP_MS = 700;
const AUTO_MS = 4200;
const RESUME_MS = 9000;

export function initRing(page: HTMLElement) {
  const ring = page.querySelector<HTMLElement>('[data-ring]')!;
  const cards = [...ring.querySelectorAll<HTMLElement>('[data-card]')];
  const entries = [...page.querySelectorAll<HTMLElement>('[data-entry]')];
  const dots = [...page.querySelectorAll<HTMLElement>('[data-ring-dot]')];
  const live = page.querySelector<HTMLElement>('[data-ring-live]')!;
  const n = cards.length;
  const step = 360 / n;
  const state = { angle: 0 };
  let active = 0;
  let pausedUntil = 0;
  let autoTimer = 0;

  const wrap = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;
  const indexFor = (angle: number) => ((Math.round(-angle / step) % n) + n) % n;

  function layout() {
    const flat = isReducedMotion();
    const w = cards[0].offsetWidth || 1;
    const radius = w * 0.75;
    cards.forEach((card, i) => {
      const phi = wrap(i * step + state.angle);
      const a = Math.abs(phi);
      if (flat) {
        card.style.transform = 'translate(-50%, -50%)';
        card.style.opacity = i === active ? '1' : '0';
        card.style.zIndex = i === active ? '2' : '1';
        return;
      }
      const rad = (phi * Math.PI) / 180;
      const x = radius * Math.sin(rad);
      const z = radius * (Math.cos(rad) - 1) * 1.6; // deeper ring so side photos recede
      const rotY = Math.max(-48, Math.min(48, phi * 0.6));
      card.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, 0, ${z.toFixed(1)}px) rotateY(${rotY.toFixed(2)}deg)`;
      // Photos behind the ring fade out completely; side photos stay visible but softer
      card.style.opacity = a > 100 ? String(Math.max(0, (130 - a) / 30)) : (1 - a / 360).toFixed(3);
      card.style.visibility = a > 130 ? 'hidden' : 'visible';
      card.style.filter = `brightness(${(1 - Math.min(a, 90) / 900).toFixed(3)})`;
      card.style.zIndex = String(Math.round(200 + z));
    });
  }

  function setActive(i: number) {
    if (i === active) return;
    active = i;
    entries.forEach((e, k) => e.classList.toggle('is-active', k === i));
    dots.forEach((d, k) => d.classList.toggle('is-active', k === i));
    live.textContent = `Photo ${i + 1} of ${n}: ${cards[i].getAttribute('aria-label')?.split(': ')[1] ?? ''}`;
  }

  function goTo(targetAngle: number) {
    heading = targetAngle;
    gsap.killTweensOf(state);
    setActive(indexFor(targetAngle));
    if (isReducedMotion()) {
      state.angle = targetAngle;
      layout();
      return;
    }
    gsap.to(state, { angle: targetAngle, duration: STEP_MS / 1000, ease: 'power3.out', onUpdate: layout });
  }

  // A step starts from where the ring is heading (while it is still settling after a swipe), not from
  // wherever it is mid-way
  let heading = 0;
  const move = (delta: number) => goTo((gsap.isTweening(state) ? Math.round(heading / step) : Math.round(state.angle / step)) * step - delta * step);
  const stopAuto = () => {
    pausedUntil = Date.now() + RESUME_MS;
  };

  /* ---- pointer: horizontal drag rotates, vertical is left to the book */
  let start: { x: number; y: number; angle: number; t: number } | null = null;
  let axis: 'x' | 'y' | null = null;
  let samples: { t: number; x: number }[] = [];

  ring.addEventListener('pointerdown', (e) => {
    gsap.killTweensOf(state);
    start = { x: e.clientX, y: e.clientY, angle: state.angle, t: e.timeStamp };
    axis = null;
    samples = [{ t: e.timeStamp, x: e.clientX }];
  });
  ring.addEventListener('pointermove', (e) => {
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
      stopAuto();
      try {
        ring.setPointerCapture(e.pointerId);
      } catch {
        /* rotation still works without capture */
      }
    }
    samples.push({ t: e.timeStamp, x: e.clientX });
    while (samples.length > 2 && e.timeStamp - samples[0].t > 100) samples.shift();
    const perPx = step / (cards[0].offsetWidth * 0.9);
    state.angle = start.angle + dx * perPx;
    setActive(indexFor(state.angle));
    layout();
  });
  const release = () => {
    if (!start) return;
    const from = Math.round(start.angle / step);
    const moved = state.angle / step;
    const first = samples[0];
    const last = samples[samples.length - 1];
    const velocity = (last.x - first.x) / Math.max(1, last.t - first.t);
    start = null;
    if (axis !== 'x') return;
    // One card per gesture; a hard flick may carry it to two.
    const limit = Math.abs(velocity) > 0.9 ? 2 : 1;
    let target = Math.abs(velocity) > 0.35 ? from + Math.sign(velocity) * limit : Math.round(moved);
    target = Math.max(from - limit, Math.min(from + limit, target));
    goTo(target * step);
  };
  ring.addEventListener('pointerup', release);
  ring.addEventListener('pointercancel', release);

  /* ---- buttons, dots, keyboard */
  page.querySelector('[data-ring-prev]')?.addEventListener('click', () => {
    stopAuto();
    move(-1);
  });
  page.querySelector('[data-ring-next]')?.addEventListener('click', () => {
    stopAuto();
    move(1);
  });
  dots.forEach((dot, i) =>
    dot.addEventListener('click', () => {
      stopAuto();
      const current = Math.round(-state.angle / step);
      const diff = wrap((i - (((current % n) + n) % n)) * step) / step;
      goTo(-(current + diff) * step);
    }),
  );
  ring.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    e.stopPropagation();
    stopAuto();
    move(e.key === 'ArrowRight' ? 1 : -1);
  });

  /* ---- auto-advance, paused for a while after a touch (never under reduced motion) */
  const scheduleAuto = () => {
    clearTimeout(autoTimer);
    if (isReducedMotion()) return;
    autoTimer = window.setTimeout(() => {
      if (page.dataset.state === 'current' && !document.hidden && Date.now() >= pausedUntil) move(1);
      scheduleAuto();
    }, AUTO_MS);
  };

  new ResizeObserver(layout).observe(ring);
  layout();
  return { start: scheduleAuto, stop: () => clearTimeout(autoTimer) };
}
