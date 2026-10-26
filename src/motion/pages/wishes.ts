import { defineChoreo, gsap, isReducedMotion, timelineChoreo } from '../choreo';
import { refreshWall } from '../../forms/wishes';

/**
 * Wishing Wall (PRD §6.15): the rod settles and each blessing card drops on its thread with a
 * small, damped pendulum swing. Blessings that arrive from the server later drop in the same way.
 */
// Each card's resting tilt (CSS --tilt); GSAP owns the transform, so it must also end on the tilt.
const tilt = (_: number, el: HTMLElement) => parseFloat(getComputedStyle(el).getPropertyValue('--tilt')) || 0;

// fromTo, not from: a second drop (blessings arriving mid-entry) must not freeze a card half-faded.
const drop = (cards: HTMLElement[]) =>
  gsap.fromTo(
    cards,
    { y: -20, rotation: (i: number, el: HTMLElement) => tilt(i, el) + (i % 2 ? 3 : -3), opacity: 0 },
    { y: 0, rotation: tilt, opacity: 1, duration: 1.2, stagger: 0.12, ease: 'elastic.out(1, 0.45)', transformOrigin: '50% -20px', overwrite: 'auto' },
  );

defineChoreo('wishes', (page) =>
  timelineChoreo(
    (tl, p) => {
      const all = (sel: string) => [...p.querySelectorAll<HTMLElement>(sel)];
      tl.from(all('.ww__title'), { opacity: 0, y: 8, duration: 0.6 }, 0.1)
        .from(all('.ww__rod'), { opacity: 0, scaleX: 0.9, duration: 0.6 }, 0.2)
        .add(() => {
          const visible = all('.ww__card').filter((c) => !c.hidden);
          if (!isReducedMotion()) drop(visible);
        }, 0.4)
        .from(all('.ww__actions, .ww__diya'), { opacity: 0, y: 8, duration: 0.5 }, 0.8);
    },
    {
      enter: (p) =>
        void refreshWall(p, (cards) => {
          if (p.dataset.state === 'current' && !isReducedMotion()) drop(cards);
        }),
    },
  )(page),
);
