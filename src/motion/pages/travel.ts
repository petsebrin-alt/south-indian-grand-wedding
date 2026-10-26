import { defineChoreo, timelineChoreo } from '../choreo';

/** Travel and Stay (PRD §6.14): the board settles, tiles appear in reading order, florals sway in. Calm by design. */
defineChoreo(
  'travel',
  timelineChoreo((tl, page) => {
    const all = (sel: string) => [...page.querySelectorAll<HTMLElement>(sel)];
    tl.from(all('.tv__board'), { opacity: 0, y: 10, duration: 0.6 }, 0)
      .from(all('.tv__corner, .tv__toran'), { opacity: 0, scale: 0.94, duration: 0.6, stagger: 0.05 }, 0.2)
      .from(all('.tv__title, .tv__intro'), { opacity: 0, y: 6, duration: 0.5, stagger: 0.08 }, 0.3)
      .from(all('.tv__tiles li'), { opacity: 0, y: 8, duration: 0.45, stagger: 0.06 }, 0.45)
      .from(all('.tv__ribbon'), { opacity: 0, y: 6, duration: 0.5 }, 0.9);
  }),
);
