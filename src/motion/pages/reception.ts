import { defineChoreo, gsap, timelineChoreo } from '../choreo';

/**
 * Grand Reception (PRD §6.11, THEME M-13): the ivory silk curtains part and gather to the
 * sides, the warm lights come on strand by strand (no flashing), then the reception card
 * rises into view. A few bulbs keep a slow, gentle twinkle (CSS).
 */
defineChoreo(
  'reception',
  timelineChoreo((tl, page) => {
    const all = (sel: string) => [...page.querySelectorAll<HTMLElement>(sel)];
    const strands = all('.rc__strand');
    gsap.set(all('.rc__curtain'), { scaleX: 1 });
    tl.to(all('.rc__curtain'), { scaleX: 0.34, duration: 1.3, ease: 'power2.inOut' }, 0.2)
      .from(all('.rc__backdrop, .rc__stage'), { opacity: 0, scale: 0.98, duration: 0.8 }, 0.3)
      .from(strands, { scaleY: 0, transformOrigin: '50% 0%', duration: 0.4, stagger: 0.05 }, 0.7)
      .from(all('.rc__bulb'), { opacity: 0, scale: 0.4, duration: 0.35, stagger: 0.03, ease: 'power1.out' }, 0.9)
      .from(all('.rc__urn'), { opacity: 0, y: 10, duration: 0.6, stagger: 0.1 }, 1.0)
      .from(all('.rc__card'), { opacity: 0, y: 8, duration: 0.6 }, 1.5)
      .from(all('.rc__line'), { opacity: 0, y: 6, duration: 0.4, stagger: 0.08 }, 1.6);
  }),
);
