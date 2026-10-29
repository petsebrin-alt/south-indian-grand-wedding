import { defineChoreo, timelineChoreo } from '../choreo';
import { startCelebration } from '../celebrate';

/**
 * Wedding Ceremony (PRD §6.10), on the client's real mandapam picture: over a soft glow of the hall,
 * the beam, then the pillars, drop in from above, one after another; the mango toran lowers; the
 * jasmine garlands unroll one by one; the little lamps, banana plants, standing lamps and floor arrive;
 * the board lowers on its garlands, the hall comes into focus, the two cone crackers appear on the
 * floor and the board's lines follow, ending on the blinking Accept button and its tapping hand.
 * Accepting sets off the celebration (src/motion/celebrate.ts) and is remembered on this device.
 */
const KEY = 'rdv:accepted';
const remembered = () => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};
const remember = () => {
  try {
    localStorage.setItem(KEY, '1');
  } catch {
    /* private mode: it lasts for this visit */
  }
};

defineChoreo('ceremony', (page) => {
  const q = (sel: string) => [...page.querySelectorAll<HTMLElement>(sel)];
  const piece = (name: string) => q(`.cm__piece--${name}`);
  let celebration: ReturnType<typeof startCelebration> | null = null;

  const choreo = timelineChoreo((tl) => {
    tl.from(q('.cm__base'), { opacity: 0, duration: 0.5 }, 0)
      .from(piece('beam'), { yPercent: -34, opacity: 0, duration: 0.7, ease: 'power3.out' }, 0.15)
      .from(piece('pillar'), { yPercent: -14, opacity: 0, duration: 0.85, ease: 'power3.out', stagger: 0.16 }, 0.35)
      .from(piece('toran'), { yPercent: -30, opacity: 0, duration: 0.6, ease: 'power2.out' }, 0.85)
      .from(piece('strand'), { clipPath: 'inset(0 0 100% 0)', yPercent: -6, duration: 0.7, ease: 'power2.out', stagger: 0.12 }, 1.0)
      .from(piece('hang'), { yPercent: -22, opacity: 0, duration: 0.55, stagger: 0.08 }, 1.8)
      .from(piece('banana'), { opacity: 0, scale: 0.86, yPercent: 5, transformOrigin: '50% 100%', duration: 0.6, stagger: 0.1, ease: 'back.out(1.4)' }, 1.95)
      .from(piece('lamp'), { opacity: 0, yPercent: 5, duration: 0.5, stagger: 0.08 }, 2.15)
      .from(piece('floor'), { opacity: 0, yPercent: 3, duration: 0.6 }, 2.2)
      .from(piece('board'), { scaleY: 0.12, opacity: 0, transformOrigin: '50% 0%', duration: 0.75, ease: 'power3.out' }, 2.45)
      .from(q('.cm__rest'), { opacity: 0, duration: 0.8 }, 2.85)
      .from(q('.cm__cracker'), { opacity: 0, scale: 0.6, transformOrigin: '50% 100%', duration: 0.45, stagger: 0.12, ease: 'back.out(2)' }, 3.1)
      .from(q('.cm__line'), { opacity: 0, y: 6, duration: 0.45, stagger: 0.09 }, 2.9)
      .from(q('.cm__lotus'), { opacity: 0, scale: 0.7, duration: 0.5 }, 2.9);
  })(page);

  const button = page.querySelector<HTMLButtonElement>('[data-accept]')!;
  const label = page.querySelector<HTMLElement>('[data-accept-text]')!;
  const thanks = page.querySelector<HTMLElement>('[data-accept-thanks]')!;
  const complete = page.querySelector<HTMLElement>('[data-accept-complete]')!;
  const showAccepted = () => {
    page.classList.add('is-accepted');
    label.textContent = 'Accepted';
    button.setAttribute('aria-label', 'Accepted: thank you. Tap to celebrate again.');
    thanks.hidden = false;
    complete.hidden = false;
  };
  button.addEventListener('click', () => {
    celebration?.stop();
    remember();
    showAccepted();
    celebration = startCelebration(page);
  });
  if (remembered()) showAccepted();

  return {
    enter(animate) {
      choreo.enter(animate);
    },
    leave() {
      celebration?.stop();
      celebration = null;
    },
  };
});
