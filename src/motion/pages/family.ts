import { defineChoreo, gsap, isReducedMotion, timelineChoreo } from '../choreo';
import { startSway } from '../sway';

/**
 * Parents and Family (PRD §6.7), after the client's reference video of a 3D cube carousel: each family's card is two blocks
 * side by side, a photograph and the words about it, that read as one card at rest. Every few seconds the two blocks turn a
 * quarter turn about their horizontal axes in OPPOSITE directions (the photograph block rolls its next face up from below, the
 * description block from above, as in the video), the second family's card a beat after the first, showing the parents and
 * then the siblings. A tap on the card, a horizontal swipe, the arrow keys or the dots turn it by hand (the cards then wait a
 * while before going on by themselves); the face turning away darkens as it goes, and the card draws back a little in the
 * middle of the turn so it never runs into the board above it. Under reduced motion a card changes face without turning and
 * does not turn by itself.
 */
const FIRST_MS = [3200, 4800]; // when each cube first rolls (a beat apart)
const EVERY_MS = 4800;
const RESUME_MS = 9000;
const ROLL_S = 1.1;

function initCube(el: HTMLElement) {
  // two blocks: the photograph (dir 1: the next face comes up from below) and the words (dir -1: from above)
  const blocks = [...el.querySelectorAll<HTMLElement>('[data-block]')].map((b) => ({
    box: b.querySelector<HTMLElement>('[data-cube-box]')!,
    faces: [...b.querySelectorAll<HTMLElement>('[data-face]')],
    dir: Number(b.dataset.dir),
  }));
  const family = el.closest<HTMLElement>('[data-family]')!;
  const dots = [...family.querySelectorAll<HTMLElement>('[data-cube-dot]')];
  const live = family.querySelector<HTMLElement>('[data-cube-live]')!;
  const sides = blocks[0].faces.length;
  const content = blocks[0].faces.map((f) => Number(f.dataset.content));
  let step = 0; // quarter turns made
  let running = false;
  let spinning = false;
  let timer = 0;
  let pausedUntil = 0;

  const front = () => ((step % sides) + sides) % sides;
  const shade = () =>
    blocks.forEach(({ box, faces, dir }) => {
      const rx = gsap.getProperty(box, 'rotationX') as number;
      faces.forEach((f, i) => f.querySelector<HTMLElement>('.fm__paper')!.style.setProperty('--shade', (0.5 * Math.abs(Math.sin(((rx - dir * 90 * i) * Math.PI) / 180))).toFixed(3)));
    });
  const settle = (announce: boolean) => {
    const f = front();
    blocks.forEach(({ faces }) => faces.forEach((face, i) => face.setAttribute('aria-hidden', String(i !== f))));
    dots.forEach((d, j) => d.classList.toggle('is-active', j === content[f]));
    el.dataset.front = String(content[f]);
    if (announce) live.textContent = blocks[1].faces[f].getAttribute('aria-label') ?? '';
  };

  function roll(to: number, byHand: boolean) {
    if (sides < 2) return;
    if (byHand) pausedUntil = Date.now() + RESUME_MS;
    step = to;
    settle(byHand);
    const done = () => {
      step = front();
      blocks.forEach(({ box, dir }) => gsap.set(box, { rotationX: dir * 90 * step }));
      shade();
      spinning = false;
    };
    if (isReducedMotion()) {
      blocks.forEach(({ box, dir }) => gsap.set(box, { rotationX: dir * 90 * to }));
      return done();
    }
    spinning = true;
    blocks.forEach(({ box, dir }, i) =>
      gsap.to(box, {
        rotationX: dir * 90 * to,
        duration: ROLL_S,
        ease: 'power3.inOut',
        overwrite: true,
        onUpdate: i === 0 ? shade : undefined,
        // the last block's tween renders last, so the reset to the resting angles comes after both have reached their ends
        onComplete: i === blocks.length - 1 ? done : undefined,
      }),
    );
    gsap.fromTo(el, { scale: 1 }, { scale: 0.92, duration: ROLL_S / 2, ease: 'sine.inOut', yoyo: true, repeat: 1, overwrite: 'auto' });
  }

  /** Turn on to the next side that shows face `j` (the parents or a sibling) */
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
  // a tap turns it on; a horizontal swipe turns it either way (vertical swipes still turn the book's page)
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
  shade();
  return {
    /** From the parents face, turning by itself (the first turn after `first` ms) */
    start(first: number) {
      running = true;
      spinning = false;
      pausedUntil = 0;
      gsap.killTweensOf([...blocks.map((b) => b.box), el]);
      step = 0;
      blocks.forEach(({ box }) => gsap.set(box, { rotationX: 0 }));
      gsap.set(el, { scale: 1 });
      shade();
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
