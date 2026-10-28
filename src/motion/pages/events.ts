import { defineChoreo, timelineChoreo } from '../choreo';

/**
 * Wedding Events (PRD §6.9), the client's picture as it is: the medallions are already in it, so
 * the page turns in on the finished picture and each medallion is lit in turn. A bright gold ring
 * draws round it (0.9 s, a slow ease) and fades into the picture's own ring, and the event's
 * details appear in the disc. Revisits and reduced motion show the finished page.
 */
for (const id of ['events', 'events-wedding']) {
  defineChoreo(
    id,
    timelineChoreo((tl, page) => {
      const all = (sel: string, root: ParentNode = page) => [...root.querySelectorAll<HTMLElement | SVGElement>(sel)];
      tl.from(all('.ev__bg'), { scale: 1.04, duration: 2.2, ease: 'sine.out' }, 0);
      let t = 0.55;
      all('.ev__item').forEach((item) => {
        const ring = all('.ev__ring circle', item);
        tl.fromTo(ring, { drawSVG: '0%', opacity: 1 }, { drawSVG: '100%', opacity: 1, duration: 0.9, ease: 'sine.inOut' }, t)
          .to(ring, { opacity: 0, duration: 0.7, ease: 'sine.in' }, t + 0.9)
          .from(all('.ev__disc > :not(.ev__open)', item), { opacity: 0, y: 5, duration: 0.45, stagger: 0.07 }, t + 0.45);
        t += 1.05;
      });
    }),
  );
}
