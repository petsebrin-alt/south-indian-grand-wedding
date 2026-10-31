import { defineChoreo, gsap, isReducedMotion } from '../choreo';
import { breeze, type Breeze } from '../breeze';

/**
 * Venue and Travel (PRD §6.13, §6.14): each time the page turns in, the temple courtyard (the two halves of the photograph,
 * with its pillars, jasmine-and-rose malas, bells and the swag across the top) comes in from the sides and meets; then the
 * title, the map card (frosted glass) and Travel & Stay rise; then the malas and swag begin to stir in a light breeze (never
 * under reduced motion). Google's map is put in its place once, as the guest reaches the Dress Code page before this one (or,
 * on a link straight here, as this page arrives), so that it has painted by the time its card appears; it fades in when it has.
 */
defineChoreo('venues', (page) => {
  const q = <T extends HTMLElement>(sel: string) => [...page.querySelectorAll<T>(sel)];
  const halves = q('[data-half]');
  const winds = q('[data-winds]');
  const title = q('.vt__title');
  const cards = q('[data-card]');
  const slot = page.querySelector<HTMLElement>('[data-map-slot]');
  let tl: gsap.core.Timeline | null = null;
  let wind: Breeze | null = null;

  /** Before the page is in view: pillars outside, the content hidden */
  const hidden = () => {
    const calm = isReducedMotion();
    halves.forEach((h) => gsap.set(h, { x: calm ? 0 : h.dataset.half === 'l' ? -46 : 46, opacity: calm ? 1 : 0 }));
    gsap.set(winds, { opacity: calm ? 1 : 0 });
    gsap.set(title, { opacity: calm ? 1 : 0, y: calm ? 0 : -8 });
    gsap.set(cards, { opacity: calm ? 1 : 0, y: calm ? 0 : 18 });
  };
  hidden();

  /** Put Google's map in its place (once), unless the guest is offline (then the card keeps its pin and name) */
  const loadMap = () => {
    if (!slot || slot.querySelector('iframe') || !slot.dataset.src) return;
    if (navigator.onLine === false) return void slot.closest('.vt__map')?.classList.add('is-offline');
    const frame = document.createElement('iframe');
    frame.className = 'vt__map-frame';
    frame.dataset.map = '';
    frame.title = slot.dataset.title ?? 'Map of the venue';
    frame.referrerPolicy = 'no-referrer-when-downgrade';
    frame.tabIndex = -1;
    frame.addEventListener('load', () => frame.classList.add('is-in'), { once: true });
    frame.src = slot.dataset.src;
    slot.append(frame);
  };
  // The page before this one: from the moment the guest is on it, the map starts loading
  const before = document.getElementById('dress-code');
  if (before) new MutationObserver(() => before.dataset.state === 'current' && loadMap()).observe(before, { attributes: true, attributeFilter: ['data-state'] });

  return {
    enter() {
      tl?.kill();
      wind?.stop();
      wind = null;
      hidden();
      loadMap();
      if (isReducedMotion()) return;
      tl = gsap
        .timeline()
        .to(halves, { x: 0, opacity: 1, duration: 1.05, ease: 'power3.out' }, 0.05)
        .to(title, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0.9)
        .to(cards[0], { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 1.15)
        .to(cards[1], { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 1.75)
        // the pieces of the photograph that stir lie exactly over it, so they join in without a change to see
        .set(winds, { opacity: 1 }, 1.1)
        .add(() => {
          wind = breeze(q('.vt__wind'), { active: () => page.dataset.state === 'current' });
        }, 1.2);
    },
    leave() {
      tl?.kill();
      wind?.stop();
      wind = null;
    },
  };
});
