import { defineChoreo, timelineChoreo } from '../choreo';

/**
 * Meet the Couple (PRD §6.6, THEME M-07/M-08). The groom's portrait enters from the left and
 * the bride's from the right — 14% of the page width at most, so the frame never leaves the
 * screen — then the memory polaroids pop in from behind the frame.
 */
for (const [id, side] of [
  ['groom', -1],
  ['bride', 1],
] as const) {
  defineChoreo(
    id,
    timelineChoreo((tl, page) => {
      const all = (sel: string) => [...page.querySelectorAll<HTMLElement>(sel)];
      // The frame is 60% of the page wide, so 23% of its width ≈ 14% of the page.
      tl.from(all('.pt__heading'), { opacity: 0, y: 8, duration: 0.6 }, 0.15)
        .from(all('.pt__frame'), { xPercent: side * 23, rotation: side * 2, opacity: 0, duration: 0.9, ease: 'power3.out' }, 0.3)
        .from(all('.pt__polaroid'), { scale: 0.85, rotation: side * -8, opacity: 0, duration: 0.5, stagger: 0.09, ease: 'back.out(1.6)' }, 0.95)
        .from(all('.pt__bio'), { opacity: 0, y: 8, duration: 0.6 }, 1.2);
    }),
  );
}
