import { breeze, type Breeze } from '../breeze';
import { defineChoreo, timelineChoreo } from '../choreo';
import { dropPetals } from '../petals';

/**
 * Welcome (PRD §6.2), after the client's reference: the courtyard settles and the couple walk
 * forward from deeper in it to the front, into warm light, and are showered with rose petals as
 * they arrive; their names are written in script letter by letter (DrawSVG, as on Thank You), and
 * the date, time, place and message follow. While the page shows, the garlands, bells, banana
 * leaf and palms stir in the breeze and rose petals drift down. Revisits and reduced motion show
 * the finished page; reduced motion has no breeze or petals.
 */
const WRITE_S = 1.8;
const LETTER_S = 0.3;

let wind: Breeze | null = null;
let shower = 0;
let arrival = 0;

defineChoreo(
  'welcome',
  timelineChoreo(
    (tl, page) => {
      const $ = (sel: string) => [...page.querySelectorAll<HTMLElement | SVGElement>(sel)];
      const glyphs = $('.wl__glyph');
      const gap = glyphs.length > 1 ? (WRITE_S - LETTER_S) / (glyphs.length - 1) : 0;
      const write = 0.7;
      tl.fromTo($('[data-wl-scene]'), { scale: 1.05 }, { scale: 1, duration: 2.6, ease: 'sine.out' }, 0)
        // The couple walk forward from deeper in the courtyard: smaller and higher at first (farther
        // away), coming to the front as the page comes to rest
        .from($('.wl-couple__body'), { scale: 0.84, yPercent: -7, transformOrigin: '50% 100%', duration: 2, ease: 'power2.out' }, 0.2)
        .from($('.wl-couple__body'), { opacity: 0, duration: 0.35, ease: 'none' }, 0.2)
        .from($('.wl-couple__glow'), { opacity: 0, duration: 1.6, ease: 'sine.out' }, 0.9)
        .fromTo(glyphs, { drawSVG: '0%', strokeWidth: 3 }, { drawSVG: '100%', duration: LETTER_S, ease: 'power1.inOut', stagger: gap }, write)
        .fromTo(glyphs, { fillOpacity: 0 }, { fillOpacity: 1, duration: 0.3, ease: 'power1.out', stagger: gap }, write + LETTER_S * 0.6)
        .to(glyphs, { strokeWidth: 0.6, duration: 0.6 }, write + WRITE_S)
        .from($('.wl__divider'), { opacity: 0, scaleX: 0.4, duration: 0.6 }, write + WRITE_S - 0.2)
        .from($('.wl__detail'), { opacity: 0, y: 6, duration: 0.5, stagger: 0.1 }, write + WRITE_S)
        .from($('.wl__message'), { opacity: 0, y: 6, duration: 0.6 }, write + WRITE_S + 0.4);
    },
    {
      enter(page, animate) {
        wind ??= breeze([...page.querySelectorAll<HTMLElement>('[data-wind]')]);
        if (!shower) {
          const particles = page.querySelector<HTMLElement>('.page__particles')!;
          const fall = () => dropPetals(particles, { count: 2, kinds: ['rose'], from: [0.04, 0.96] });
          // A shower of petals over the couple as they arrive, then a gentle steady fall
          if (animate) arrival = window.setTimeout(() => dropPetals(particles, { count: 8, kinds: ['rose'], from: [0.22, 0.78] }), 1500);
          else fall();
          shower = window.setInterval(fall, 1500);
        }
      },
      leave() {
        wind?.stop();
        wind = null;
        window.clearInterval(shower);
        window.clearTimeout(arrival);
        shower = 0;
      },
    },
  ),
);
