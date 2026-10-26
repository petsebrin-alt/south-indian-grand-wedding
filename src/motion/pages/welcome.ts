import { defineChoreo, timelineChoreo } from '../choreo';

/**
 * Welcome (PRD §6.2): lead lines fade up, the monogram's lotus ring unfurls, the names reveal
 * letter by letter from soft focus, a gold line draws outward, lamps glow up, details follow.
 * Garlands and strands sway via CSS (.sway).
 */
defineChoreo(
  'welcome',
  timelineChoreo((tl, page) => {
    const $ = (sel: string) => [...page.querySelectorAll<HTMLElement | SVGElement>(sel)];
    tl.from($('.wl__lead'), { opacity: 0, y: 8, duration: 0.6, stagger: 0.08 }, 0.15)
      .from($('.wl__ring path'), { scale: 0, rotation: -40, opacity: 0, transformOrigin: '50% 100%', duration: 0.5, stagger: 0.025, ease: 'back.out(1.4)' }, 0.45)
      .from($('.wl__monogram .monogram__letters'), { opacity: 0, duration: 0.5 }, 0.85)
      .from($('.wl__nameplate'), { opacity: 0, scale: 0.97, duration: 0.7 }, 0.55)
      .from($('.wl__ch'), { opacity: 0, y: 6, filter: 'blur(4px)', duration: 0.55, stagger: 0.05, clearProps: 'filter' }, 0.7)
      .from($('.wl__divider .draw'), { drawSVG: '0%', duration: 0.8, ease: 'power2.inOut' }, 1.45)
      .from($('.wl__divider .dot'), { opacity: 0, duration: 0.3, stagger: 0.05 }, 2.0)
      .from($('.wl__lamp'), { opacity: 0, y: 10, duration: 0.8, stagger: 0.1 }, 1.6)
      .from($('.wl__detail'), { opacity: 0, y: 8, duration: 0.5, stagger: 0.08 }, 1.8)
      .from($('.wl__message'), { opacity: 0, y: 8, duration: 0.6 }, 2.05);
  }),
);
