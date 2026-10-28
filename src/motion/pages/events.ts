import { defineChoreo, timelineChoreo } from '../choreo';

/**
 * Wedding Events (PRD §6.9), from the client's picture: the gold rod draws down from the signboard
 * to the first medallion, which blooms into place with its details; then on from its foot to the
 * next, and so on, smoothly. Revisits and reduced motion show the finished page.
 */
for (const id of ['events', 'events-wedding']) {
  defineChoreo(
    id,
    timelineChoreo((tl, page) => {
      const all = (sel: string, root: ParentNode = page) => [...root.querySelectorAll<HTMLElement | SVGElement>(sel)];
      const rods = all('.ev__rod');
      const drops = all('.ev__drop');
      const items = all('.ev__item');
      tl.from(all('.ev__bg'), { scale: 1.04, duration: 2.2, ease: 'sine.out' }, 0);
      let t = 0.35;
      items.forEach((item, i) => {
        const rod = rods[i];
        if (rod) tl.fromTo(all('path', rod), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.75, ease: 'sine.inOut' }, t);
        if (drops[i]) tl.from(drops[i], { opacity: 0, scale: 0.4, transformOrigin: '50% 0%', duration: 0.4, ease: 'back.out(2.4)' }, t + 0.35);
        t += 0.6;
        tl.from(all('.ev__medallion', item), { opacity: 0, scale: 0.72, transformOrigin: '50% 30%', duration: 0.7, ease: 'back.out(1.5)' }, t)
          .from(all('.ev__disc > :not(.ev__open)', item), { opacity: 0, y: 5, duration: 0.45, stagger: 0.06 }, t + 0.3);
        t += 0.55;
      });
    }),
  );
}
