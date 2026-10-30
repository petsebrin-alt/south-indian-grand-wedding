import { defineChoreo, gsap } from '../choreo';
import { courtyardLife } from '../courtyard';

/**
 * Save the Date (PRD §6.4), as the client asked: the couple step forward holding their gold board,
 * whose curtains are closed. A fraction of a second after the page arrives (AUTO_OPEN_MS) the curtains draw
 * gently open by themselves, with no tap needed; "Save the Date" is written
 * in script letter by letter, the month appears, red hearts pop onto the celebration days and Add
 * to Calendar follows. The courtyard stirs in the breeze and rose petals drift down. Revisits and
 * reduced motion show the finished page (curtains open); reduced motion has no breeze, petals,
 * glow or beat.
 */
const AUTO_OPEN_MS = 600;
const WRITE_S = 1.4;
const LETTER_S = 0.28;

let life: ReturnType<typeof courtyardLife> | null = null;

defineChoreo('save-the-date', (page) => {
  const $ = (sel: string) => [...page.querySelectorAll<HTMLElement | SVGElement>(sel)];
  const tie = page.querySelector<HTMLButtonElement>('[data-tie]')!;
  const glyphs = $('.sd__glyph');
  const gap = glyphs.length > 1 ? (WRITE_S - LETTER_S) / (glyphs.length - 1) : 0;

  // Built paused at start-up, so the closed curtains and hidden card are already in place while
  // the page is being uncovered by the turn
  const arrive = gsap
    .timeline({ paused: true })
    .fromTo($('[data-courtyard]'), { scale: 1.04 }, { scale: 1, duration: 2.4, ease: 'sine.out' }, 0)
    .from($('.sd__scene'), { y: 18, scale: 0.97, transformOrigin: '50% 100%', duration: 1.2, ease: 'power2.out' }, 0);
  // The curtains open by themselves, so the blinking tap hand is not shown
  gsap.set(tie, { autoAlpha: 0 });

  const write = 1.3;
  const reveal = gsap
    .timeline({ paused: true })
    // The hand fades away as the curtains begin to part
    .to(tie, { autoAlpha: 0, scale: 0.8, duration: 0.4, ease: 'power1.in' }, 0)
    // …and the curtains draw back, slowly and gently
    .from($('[data-curtain]'), { scaleX: 1, duration: 2.6, ease: 'sine.inOut', stagger: 0.06 }, 0.1)
    .fromTo(glyphs, { drawSVG: '0%', strokeWidth: 3 }, { drawSVG: '100%', duration: LETTER_S, ease: 'power1.inOut', stagger: gap }, write)
    .fromTo(glyphs, { fillOpacity: 0 }, { fillOpacity: 1, duration: 0.3, ease: 'power1.out', stagger: gap }, write + LETTER_S * 0.6)
    .to(glyphs, { strokeWidth: 0.6, duration: 0.6 }, write + WRITE_S)
    .from($('.sd__month'), { opacity: 0, y: 6, duration: 0.5 }, write + WRITE_S - 0.3)
    .from($('.sd__grid > *'), { opacity: 0, duration: 0.3, stagger: 0.012 }, write + WRITE_S - 0.1)
    // Hearts pop onto the celebration days, one after the other
    .from($('.sd__heart'), { scale: 0, opacity: 0, duration: 0.6, ease: 'back.out(3)', stagger: 0.32 }, write + WRITE_S + 0.55)
    .from($('.sd__days, .sd__cal'), { autoAlpha: 0, y: 6, duration: 0.5, stagger: 0.12 }, write + WRITE_S + 1.1);

  let opened = true;
  let timer = 0;
  const open = () => {
    if (opened) return;
    opened = true;
    window.clearTimeout(timer);
    reveal.play();
  };
  tie.addEventListener('click', open);

  return {
    enter(animate) {
      window.clearTimeout(timer);
      if (animate) {
        opened = false;
        reveal.pause(0);
        arrive.restart();
        timer = window.setTimeout(open, AUTO_OPEN_MS);
      } else {
        opened = true;
        arrive.progress(1).pause();
        reveal.progress(1).pause();
      }
      (life ??= courtyardLife(page)).start(false);
    },
    leave() {
      window.clearTimeout(timer);
      life?.stop();
    },
  };
});
