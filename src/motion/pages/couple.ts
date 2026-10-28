import { defineChoreo, timelineChoreo } from '../choreo';

/**
 * Meet the Couple (PRD §6.6), as in the client's reference video: the photograph settles (the
 * groom's from the left, the bride's from the right), the letters of "The Groom Rahul" / "The Bride
 * Divya" jump into place one by one, then the interest polaroids pop in one by one, down the left
 * edge and then the right. Revisits and reduced motion show the finished page.
 */
for (const [id, side] of [
  ['groom', -1],
  ['bride', 1],
] as const) {
  defineChoreo(
    id,
    timelineChoreo((tl, page) => {
      const all = (sel: string) => [...page.querySelectorAll<HTMLElement>(sel)];
      const letters = all('.pc__ch');
      const cards = [...all('.pc__col--l .pc__card'), ...all('.pc__col--r .pc__card')];
      tl.from(all('.pc__scene'), { xPercent: side * 6, scale: 1.06, duration: 1.4, ease: 'power2.out' }, 0)
        .from(all('.pc__glow'), { opacity: 0, duration: 1 }, 0.5)
        // Each letter drops in and bounces into place
        .from(letters, { y: -34, opacity: 0, scale: 0.5, duration: 0.55, ease: 'back.out(3)', stagger: 0.065 }, 0.45)
        // The polaroids pop in, each with a little spin as if set down by hand
        .from(cards, { scale: 0.2, opacity: 0, rotation: (i: number) => (i % 2 ? 14 : -14), duration: 0.5, ease: 'back.out(1.9)', stagger: 0.24 }, 0.6 + letters.length * 0.065);
    }),
  );
}
