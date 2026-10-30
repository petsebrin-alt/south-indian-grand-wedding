import { defineChoreo, gsap, isReducedMotion } from '../choreo';
import { initDeck } from '../deck';

/**
 * Dress Code (PRD §6.12): over the garden of jasmine and bells the heading appears, the cards are dealt from below into
 * their stack, and then they turn by themselves, one after another (src/motion/deck.ts). They stop when the page is left
 * and begin again from the first card on each visit.
 */
defineChoreo('dress-code', (page) => {
  const deck = initDeck(page);
  const q = (sel: string) => [...page.querySelectorAll<HTMLElement>(sel)];
  const head = q('.dc__head');
  const nav = q('.dc__nav');
  const stack = q('.dc__deck');
  const hidden = () => {
    gsap.set(head, { opacity: isReducedMotion() ? 1 : 0, y: isReducedMotion() ? 0 : 10 });
    gsap.set(nav, { opacity: isReducedMotion() ? 1 : 0, y: isReducedMotion() ? 0 : 8 });
    gsap.set(stack, { opacity: isReducedMotion() ? 1 : 0, y: isReducedMotion() ? 0 : 40 });
  };
  hidden();
  let tl: gsap.core.Timeline | null = null;
  return {
    enter() {
      tl?.kill();
      hidden();
      deck.stop();
      if (isReducedMotion()) {
        deck.start();
        return;
      }
      tl = gsap
        .timeline()
        .to(head, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 0.1)
        .to(stack, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 0.3)
        .to(nav, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0.9)
        .add(() => deck.start(), 1.4);
    },
    leave() {
      deck.stop();
    },
  };
});
