import { defineChoreo, timelineChoreo } from '../choreo';
import { courtyardLife } from '../courtyard';

/**
 * Save the Date (PRD §6.4), as the client asked: the couple step forward holding their gold board;
 * its curtains are closed as the page arrives, then draw open, gathering to the sides; "Save the Date" is written in script letter
 * by letter, the month appears, red hearts pop onto the celebration days, and Add to Calendar
 * follows. The courtyard stirs in the breeze and rose petals drift down. Revisits and reduced
 * motion show the finished page (curtains open); reduced motion has no breeze, petals or beat.
 */
const WRITE_S = 1.4;
const LETTER_S = 0.28;

let life: ReturnType<typeof courtyardLife> | null = null;

defineChoreo(
  'save-the-date',
  timelineChoreo(
    (tl, page) => {
      const $ = (sel: string) => [...page.querySelectorAll<HTMLElement | SVGElement>(sel)];
      const glyphs = $('.sd__glyph');
      const gap = glyphs.length > 1 ? (WRITE_S - LETTER_S) / (glyphs.length - 1) : 0;
      const write = 1.7;
      tl.fromTo($('[data-courtyard]'), { scale: 1.04 }, { scale: 1, duration: 2.4, ease: 'sine.out' }, 0)
        // The couple step forward with their board as the page comes to rest
        .from($('.sd__scene'), { y: 18, scale: 0.97, transformOrigin: '50% 100%', duration: 1.2, ease: 'power2.out' }, 0)
        // Closed as the page arrives, then drawn back to the sides
        .from($('[data-curtain]'), { scaleX: 1, duration: 1.8, ease: 'power2.inOut', stagger: 0.05 }, 0.45)
        .fromTo(glyphs, { drawSVG: '0%', strokeWidth: 3 }, { drawSVG: '100%', duration: LETTER_S, ease: 'power1.inOut', stagger: gap }, write)
        .fromTo(glyphs, { fillOpacity: 0 }, { fillOpacity: 1, duration: 0.3, ease: 'power1.out', stagger: gap }, write + LETTER_S * 0.6)
        .to(glyphs, { strokeWidth: 0.6, duration: 0.6 }, write + WRITE_S)
        .from($('.sd__month'), { opacity: 0, y: 6, duration: 0.5 }, write + WRITE_S - 0.3)
        .from($('.sd__grid > *'), { opacity: 0, duration: 0.3, stagger: 0.012 }, write + WRITE_S - 0.1)
        // Hearts pop onto the celebration days, one after the other
        .from($('.sd__heart'), { scale: 0, opacity: 0, duration: 0.6, ease: 'back.out(3)', stagger: 0.32 }, write + WRITE_S + 0.55)
        .from($('.sd__days, .sd__cal'), { opacity: 0, y: 6, duration: 0.5, stagger: 0.12 }, write + WRITE_S + 1.1);
    },
    {
      enter: (page) => (life ??= courtyardLife(page)).start(false),
      leave: () => life?.stop(),
    },
  ),
);
