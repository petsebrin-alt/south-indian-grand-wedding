import { breeze, type Breeze } from '../breeze';
import { defineChoreo, timelineChoreo } from '../choreo';
import { dropPetals } from '../petals';

/**
 * Welcome (PRD §6.2), after the client's reference: the courtyard and the couple settle,
 * then their names are written in script letter by letter (DrawSVG, as on Thank You), and the
 * date, time, place and message follow. While the page shows, the garlands, bells, banana leaf
 * and palms stir in the breeze and red garland flowers drift down. Revisits and reduced motion
 * show the finished page; reduced motion has no breeze or flowers.
 */
const WRITE_S = 1.8;
const LETTER_S = 0.3;

let wind: Breeze | null = null;
let shower = 0;

defineChoreo(
  'welcome',
  timelineChoreo(
    (tl, page) => {
      const $ = (sel: string) => [...page.querySelectorAll<HTMLElement | SVGElement>(sel)];
      const glyphs = $('.wl__glyph');
      const gap = glyphs.length > 1 ? (WRITE_S - LETTER_S) / (glyphs.length - 1) : 0;
      const write = 0.7;
      tl.fromTo($('[data-wl-scene]'), { scale: 1.05 }, { scale: 1, duration: 2.6, ease: 'sine.out' }, 0)
        // The couple are there as the page is uncovered, and settle as it comes to rest
        .from($('.wl-couple'), { y: 14, scale: 0.985, transformOrigin: '50% 100%', duration: 1.6, ease: 'sine.out' }, 0)
        .fromTo(glyphs, { drawSVG: '0%', strokeWidth: 3 }, { drawSVG: '100%', duration: LETTER_S, ease: 'power1.inOut', stagger: gap }, write)
        .fromTo(glyphs, { fillOpacity: 0 }, { fillOpacity: 1, duration: 0.3, ease: 'power1.out', stagger: gap }, write + LETTER_S * 0.6)
        .to(glyphs, { strokeWidth: 0.6, duration: 0.6 }, write + WRITE_S)
        .from($('.wl__divider'), { opacity: 0, scaleX: 0.4, duration: 0.6 }, write + WRITE_S - 0.2)
        .from($('.wl__detail'), { opacity: 0, y: 6, duration: 0.5, stagger: 0.1 }, write + WRITE_S)
        .from($('.wl__message'), { opacity: 0, y: 6, duration: 0.6 }, write + WRITE_S + 0.4);
    },
    {
      enter(page) {
        wind ??= breeze([...page.querySelectorAll<HTMLElement>('[data-wind]')]);
        if (!shower) {
          const particles = page.querySelector<HTMLElement>('.page__particles')!;
          const fall = () => dropPetals(particles, { count: 2, kinds: ['rose'], from: [0.04, 0.96] });
          fall();
          shower = window.setInterval(fall, 1500);
        }
      },
      leave() {
        wind?.stop();
        wind = null;
        window.clearInterval(shower);
        shower = 0;
      },
    },
  ),
);
