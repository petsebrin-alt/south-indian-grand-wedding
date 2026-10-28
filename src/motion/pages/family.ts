import { defineChoreo, gsap, isReducedMotion, timelineChoreo } from '../choreo';

/**
 * Parents and Family (PRD §6.7), after the client's reference video: a focus gallery. The card in
 * focus sits in the middle with its name and relation on one side and what they do on the other;
 * the cards before and after wait above and below as small tilted frames, the rest out of sight. Every few
 * seconds the next person slides up into focus. A tap on a waiting frame, a horizontal swipe, the
 * arrow keys or the dots move it by hand (and pause the slideshow for a while). Under reduced motion
 * the cards change without sliding and nothing moves by itself.
 */
const AUTO_MS = 3600;
const RESUME_MS = 9000;
const SLIDE_S = 0.8;

function initFamily(page: HTMLElement) {
  const gallery = page.querySelector<HTMLElement>('[data-family]');
  if (!gallery) return { start() {}, stop() {}, reset() {} };
  const cards = [...gallery.querySelectorAll<HTMLElement>('[data-member]')];
  const dots = [...gallery.querySelectorAll<HTMLElement>('[data-family-dot]')];
  const live = gallery.querySelector<HTMLElement>('[data-family-live]')!;
  const n = cards.length;
  let active = 0;
  let timer = 0;
  let pausedUntil = 0;

  const offset = (i: number) => {
    let k = i - active;
    if (k > n / 2) k -= n;
    if (k < -n / 2) k += n;
    return k;
  };
  function layout(animate: boolean) {
    const h = cards[0]?.querySelector<HTMLElement>('.fm__frame')?.offsetHeight ?? 160;
    cards.forEach((card, i) => {
      const k = offset(i);
      const near = Math.abs(k) === 1;
      const state =
        k === 0
          ? { y: 0, scale: 1, autoAlpha: 1, rotation: 0 }
          : near
            ? { y: k * h * 0.86, scale: 0.42, autoAlpha: 0.8, rotation: k * 5 }
            : { y: Math.sign(k) * h * 1.2, scale: 0.3, autoAlpha: 0, rotation: Math.sign(k) * 9 };
      const sides = card.querySelectorAll('.fm__side');
      const vars = { ...state, zIndex: k === 0 ? 3 : near ? 2 : 1 };
      if (animate && !isReducedMotion()) {
        gsap.to(card, { ...vars, duration: SLIDE_S, ease: 'power3.inOut', overwrite: true });
        gsap.to(sides, { autoAlpha: k === 0 ? 1 : 0, duration: k === 0 ? 0.5 : 0.25, delay: k === 0 ? SLIDE_S * 0.55 : 0, overwrite: true });
      } else {
        gsap.set(card, vars);
        gsap.set(sides, { autoAlpha: k === 0 ? 1 : 0 });
      }
      card.style.pointerEvents = near ? 'auto' : k === 0 ? 'none' : 'none';
      card.style.cursor = near ? 'pointer' : '';
    });
    dots.forEach((d, i) => d.classList.toggle('is-active', i === active));
    live.textContent = cards[active]?.getAttribute('aria-label') ?? '';
  }
  const go = (to: number, byHand: boolean) => {
    active = ((to % n) + n) % n;
    if (byHand) pausedUntil = Date.now() + RESUME_MS;
    layout(true);
  };

  cards.forEach((card, i) => card.addEventListener('click', () => offset(i) !== 0 && go(i, true)));
  dots.forEach((d, i) => d.addEventListener('click', () => go(i, true)));
  gallery.addEventListener('keydown', (e) => {
    if (['ArrowDown', 'ArrowRight'].includes(e.key)) (e.preventDefault(), e.stopPropagation(), go(active + 1, true));
    if (['ArrowUp', 'ArrowLeft'].includes(e.key)) (e.preventDefault(), e.stopPropagation(), go(active - 1, true));
  });
  // A horizontal swipe moves the gallery (vertical swipes still turn the book's page)
  let sx = 0, sy = 0, tracking = false;
  gallery.addEventListener('pointerdown', (e) => ((sx = e.clientX), (sy = e.clientY), (tracking = true)));
  gallery.addEventListener('pointerup', (e) => {
    if (!tracking) return;
    tracking = false;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(active + (dx < 0 ? 1 : -1), true);
  });

  const tick = () => {
    if (page.dataset.state === 'current' && Date.now() > pausedUntil && !document.hidden) go(active + 1, false);
  };
  layout(false);
  return {
    start() {
      window.clearInterval(timer);
      if (!isReducedMotion() && n > 1) timer = window.setInterval(tick, AUTO_MS);
    },
    stop() {
      window.clearInterval(timer);
    },
    reset() {
      active = 0;
      layout(false);
    },
  };
}

let gallery: ReturnType<typeof initFamily> | null = null;

defineChoreo(
  'family',
  timelineChoreo(
    (tl, page) => {
      gallery = initFamily(page);
      const all = (sel: string) => [...page.querySelectorAll<HTMLElement>(sel)];
      tl.from(all('.fm__bg'), { scale: 1.05, duration: 2.2, ease: 'sine.out' }, 0)
        .from(all('.fm__head > *'), { opacity: 0, y: 8, duration: 0.7, stagger: 0.12 }, 0.2)
        .from(all('.fm__list'), { opacity: 0, y: 24, duration: 0.9, ease: 'power2.out' }, 0.5)
        .from(all('.fm__dots'), { opacity: 0, duration: 0.5 }, 1.1);
    },
    {
      enter: (page, animate) => {
        if (animate) gallery?.reset();
        gallery?.start();
      },
      leave: () => gallery?.stop(),
    },
  ),
);
