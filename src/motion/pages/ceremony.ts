import { defineChoreo, timelineChoreo } from '../choreo';

/**
 * Wedding Ceremony (PRD §6.10, THEME M-12): the platform and kolam appear, the back then front
 * pillars rise, the beam settles, the jasmine canopy lowers like a curtain of flowers, the
 * thoranam and silk settle, lamps and kalasams arrive, and the plaque text follows.
 * Garlands sway afterwards (CSS); no sparkles or glows.
 */
defineChoreo(
  'ceremony',
  timelineChoreo((tl, page) => {
    const all = (sel: string) => [...page.querySelectorAll<HTMLElement>(sel)];
    tl.from(all('.cm__platform'), { opacity: 0, duration: 0.4 }, 0)
      .from(all('.cm__pillar--back'), { opacity: 0, y: 24, duration: 0.6, stagger: 0.08 }, 0.3)
      .from(all('.cm__pillar--front, .cm__banana'), { opacity: 0, y: 24, duration: 0.6, stagger: 0.08 }, 0.5)
      .from(all('.cm__beam, .cm__drape'), { opacity: 0, y: -12, duration: 0.5 }, 0.7)
      .from(all('.cm__strand, .cm__chandelier, .cm__garland'), { scaleY: 0, transformOrigin: '50% 0%', duration: 0.6, stagger: 0.06, ease: 'power2.out' }, 0.8)
      .from(all('.cm__toran'), { opacity: 0, y: -6, duration: 0.5 }, 1.2)
      .from(all('.cm__lamp, .cm__kalasam'), { opacity: 0, y: 8, duration: 0.5, stagger: 0.06 }, 1.3)
      .from(all('.cm__plaque'), { opacity: 0, scale: 0.97, duration: 0.5 }, 1.45)
      .from(all('.cm__line'), { opacity: 0, y: 6, duration: 0.4, stagger: 0.08 }, 1.6)
      .from(all('.cm__thali'), { opacity: 0, y: 8, duration: 0.5 }, 1.9);
  }),
);
