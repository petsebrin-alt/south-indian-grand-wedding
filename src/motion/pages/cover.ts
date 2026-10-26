import { defineChoreo, gsap, timelineChoreo } from '../choreo';
import { dropPetals } from '../petals';

/**
 * Cover (PRD §6.1, THEME M-01).
 * Entry: the temple entrance settles in. Opening (~2.4 s): the envelope lifts, the seal splits,
 * the flap opens on its hinge, jasmine petals fall, the card slides out and unfolds to fill the
 * page — main.ts then shows the first page underneath.
 */
const q = (page: HTMLElement, sel: string) => page.querySelector<HTMLElement>(sel)!;
const qa = (page: HTMLElement, sel: string) => [...page.querySelectorAll<HTMLElement>(sel)];

defineChoreo(
  'cover',
  timelineChoreo((tl, page) => {
    tl.from(qa(page, '.cover__pillar'), { opacity: 0, y: 24, duration: 0.9, stagger: 0.08 }, 0)
      .from(q(page, '.cover__drape'), { opacity: 0, y: -12, duration: 0.8 }, 0.1)
      .from(q(page, '.cover__swag'), { opacity: 0, y: -16, duration: 0.8 }, 0.15)
      .from(qa(page, '.cover__bell'), { opacity: 0, y: -10, duration: 0.6, stagger: 0.06 }, 0.3)
      .from(q(page, '[data-envelope]'), { opacity: 0, y: 10, duration: 0.8 }, 0.35)
      .from(qa(page, '.cover__lamp'), { opacity: 0, y: 12, duration: 0.7, stagger: 0.1 }, 0.5)
      .from(q(page, '.cover__open'), { opacity: 0, y: 8, duration: 0.6 }, 0.7);
  }),
);

const opened = new WeakMap<HTMLElement, gsap.core.Timeline>();

function buildOpening(page: HTMLElement) {
  const env = q(page, '[data-envelope]');
  const flap = q(page, '[data-flap]');
  const card = q(page, '[data-card]');
  const unfold = q(page, '[data-unfold]');
  const scenery = [...qa(page, '.cover__pillar, .cover__drape, .cover__swag, .cover__bell, .cover__lamp'), q(page, '.cover__open'), q(page, '.page__frame')];

  const tl = gsap.timeline({ paused: true });
  tl.to(env, { scale: 1.06, y: -6, duration: 0.4, ease: 'power2.out' }, 0)
    .add(() => qa(page, '.cover__bell').forEach((b) => b.animate([{ rotate: '0deg' }, { rotate: '7deg' }, { rotate: '-4deg' }, { rotate: '0deg' }], { duration: 1100, easing: 'ease-in-out', composite: 'add' })), 0)
    .to(q(page, '.seal__mono'), { opacity: 0, duration: 0.2 }, 0.32)
    .to(q(page, '.seal__half--l'), { xPercent: -55, rotation: -24, opacity: 0, duration: 0.5, ease: 'power2.in' }, 0.4)
    .to(q(page, '.seal__half--r'), { xPercent: 55, rotation: 24, opacity: 0, duration: 0.5, ease: 'power2.in' }, 0.4)
    .to(flap, { rotationX: -172, duration: 0.7, ease: 'power2.inOut' }, 0.45)
    .set(flap, { zIndex: 0 }, 0.8)
    .add(() => dropPetals(q(page, '.page__particles'), { count: 10, kinds: ['jasmine'], from: [0.15, 0.85] }), 0.7)
    .to(card, { yPercent: -56, duration: 0.6, ease: 'power2.out' }, 1.05)
    .to(scenery, { opacity: 0, duration: 0.5, ease: 'power1.out' }, 1.45)
    .add(() => {
      // The card unfolds into a full page (FLIP from the card's current box).
      const p = page.getBoundingClientRect();
      const c = card.getBoundingClientRect();
      gsap.fromTo(
        unfold,
        { opacity: 1, x: c.left - p.left, y: c.top - p.top, scaleX: c.width / p.width, scaleY: c.height / p.height },
        { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.7, ease: 'power3.inOut' },
      );
    }, 1.6)
    .to(env, { opacity: 0, duration: 0.25 }, 1.62)
    .to({}, { duration: 0.8 }, 1.6);
  return tl;
}

export function openInvitation(page: HTMLElement): Promise<void> {
  let tl = opened.get(page);
  if (!tl) {
    tl = buildOpening(page);
    opened.set(page, tl);
  }
  const timeline = tl;
  return new Promise((resolve) => {
    timeline.eventCallback('onComplete', () => resolve());
    timeline.restart();
    // Animation frames pause while the page is hidden; never leave the guest on a half-open cover.
    window.setTimeout(() => {
      if (timeline.progress() < 1) {
        timeline.progress(1);
        resolve();
      }
    }, (timeline.duration() + 0.5) * 1000);
  });
}

export function resetInvitation(page: HTMLElement) {
  opened.get(page)?.pause(0);
  gsap.set(q(page, '[data-unfold]'), { clearProps: 'all' });
}
