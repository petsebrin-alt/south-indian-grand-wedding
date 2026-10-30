import { defineChoreo, gsap, isReducedMotion, timelineChoreo } from '../choreo';
import { startSway } from '../sway';

/**
 * Parents and Family (PRD §6.7), after the client's reference video of a 3D cube carousel: each family's cube rolls a
 * quarter turn about its horizontal axis (the front face rolls up and away, the next comes up from below) every few
 * seconds by itself, the second cube a beat after the first, showing the parents and then the siblings. A tap on the
 * cube, a horizontal swipe, the arrow keys or the dots roll it by hand (the cubes then wait a while before going on by
 * themselves); the face turning away darkens as it goes, and the cube draws back a little at the middle of the roll so it
 * never runs into the board above it. Under reduced motion a cube changes face without rolling and does not roll by itself.
 */
const FIRST_MS = [3200, 4800]; // when each cube first rolls (a beat apart)
const EVERY_MS = 4800;
const RESUME_MS = 9000;
const ROLL_S = 1.1;

function initCube(el: HTMLElement) {
  const box = el.querySelector<HTMLElement>('[data-cube-box]')!;
  const faces = [...box.querySelectorAll<HTMLElement>('[data-face]')];
  const family = el.closest<HTMLElement>('[data-family]')!;
  const dots = [...family.querySelectorAll<HTMLElement>('[data-cube-dot]')];
  const live = family.querySelector<HTMLElement>('[data-cube-live]')!;
  const sides = faces.length;
  const content = faces.map((f) => Number(f.dataset.content));
  let step = 0; // quarter turns made
  let running = false;
  let spinning = false;
  let timer = 0;
  let pausedUntil = 0;

  const front = () => ((step % sides) + sides) % sides;
  const shade = (rx: number) =>
    faces.forEach((f, i) => f.querySelector<HTMLElement>('.fm__paper')!.style.setProperty('--shade', (0.5 * Math.abs(Math.sin(((rx - 90 * i) * Math.PI) / 180))).toFixed(3)));
  const settle = (announce: boolean) => {
    const f = front();
    faces.forEach((face, i) => face.setAttribute('aria-hidden', String(i !== f)));
    dots.forEach((d, j) => d.classList.toggle('is-active', j === content[f]));
    el.dataset.front = String(content[f]);
    if (announce) live.textContent = faces[f].getAttribute('aria-label') ?? '';
  };

  function roll(to: number, byHand: boolean) {
    if (sides < 2) return;
    if (byHand) pausedUntil = Date.now() + RESUME_MS;
    step = to;
    settle(byHand);
    const done = () => {
      step = front();
      gsap.set(box, { rotationX: 90 * step });
      shade(90 * step);
      spinning = false;
    };
    if (isReducedMotion()) {
      gsap.set(box, { rotationX: 90 * to });
      return done();
    }
    spinning = true;
    gsap.to(box, {
      rotationX: 90 * to,
      duration: ROLL_S,
      ease: 'power3.inOut',
      overwrite: true,
      onUpdate: () => shade(gsap.getProperty(box, 'rotationX') as number),
      onComplete: done,
    });
    gsap.fromTo(el, { scale: 1 }, { scale: 0.9, duration: ROLL_S / 2, ease: 'sine.inOut', yoyo: true, repeat: 1, overwrite: 'auto' });
  }

  /** Roll on to the next side that shows face `j` (the parents or the siblings) */
  const showContent = (j: number) => {
    for (let d = 0; d < sides; d++) if (content[(front() + d) % sides] === j) return d ? roll(step + d, true) : undefined;
  };

  const tick = (ms: number) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (!running) return;
      if (Date.now() >= pausedUntil && !document.hidden && !spinning) roll(step + 1, false);
      tick(EVERY_MS);
    }, ms);
  };

  /* by hand */
  dots.forEach((d, j) => d.addEventListener('click', () => showContent(j)));
  el.addEventListener('keydown', (e) => {
    if (['ArrowDown', 'ArrowRight'].includes(e.key)) (e.preventDefault(), e.stopPropagation(), !spinning && roll(step + 1, true));
    if (['ArrowUp', 'ArrowLeft'].includes(e.key)) (e.preventDefault(), e.stopPropagation(), !spinning && roll(step - 1, true));
  });
  // a tap rolls it on; a horizontal swipe rolls it either way (vertical swipes still turn the book's page)
  let sx = 0;
  let sy = 0;
  let down = false;
  el.addEventListener('pointerdown', (e) => ((sx = e.clientX), (sy = e.clientY), (down = true)));
  el.addEventListener('pointerup', (e) => {
    if (!down) return;
    down = false;
    if (spinning) return;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) roll(step + (dx < 0 ? 1 : -1), true);
    else if (Math.hypot(dx, dy) < 10) roll(step + 1, true);
  });
  el.addEventListener('pointercancel', () => (down = false));

  settle(false);
  shade(0);
  return {
    /** From the parents face, rolling by itself (the first roll after `first` ms) */
    start(first: number) {
      running = true;
      spinning = false;
      pausedUntil = 0;
      gsap.killTweensOf([box, el]);
      step = 0;
      gsap.set(box, { rotationX: 0 });
      gsap.set(el, { scale: 1 });
      shade(0);
      settle(false);
      if (sides > 1 && !isReducedMotion()) tick(first);
    },
    stop() {
      running = false;
      window.clearTimeout(timer);
    },
  };
}

defineChoreo('family', (page) => {
  const cubes = [...page.querySelectorAll<HTMLElement>('[data-cube]')].map(initCube);
  let sway: ReturnType<typeof startSway> | null = null;
  const choreo = timelineChoreo((tl, p) => {
    const all = (sel: string) => [...p.querySelectorAll<HTMLElement>(sel)];
    tl.from(all('.fm__scene .sway'), { opacity: 0, duration: 1, stagger: 0.12 }, 0)
      .from(all('.fm__board'), { opacity: 0, y: -12, duration: 0.7, stagger: 0.18, ease: 'power2.out' }, 0.15)
      .from(all('.fm__cube'), { opacity: 0, y: 24, scale: 0.94, duration: 0.8, stagger: 0.18, ease: 'power3.out' }, 0.3)
      .from(all('.fm__dots'), { opacity: 0, duration: 0.5, stagger: 0.18 }, 0.9);
  })(page);
  return {
    enter(animate) {
      choreo.enter(animate);
      cubes.forEach((c, i) => c.start(FIRST_MS[i] ?? FIRST_MS[0]));
      sway ??= startSway([...page.querySelectorAll<HTMLElement>('.fm__scene [data-sway]')], { active: () => page.dataset.state === 'current' });
      sway.start();
    },
    leave() {
      cubes.forEach((c) => c.stop());
      sway?.stop();
    },
  };
});
