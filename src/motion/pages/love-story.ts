import { defineChoreo, timelineChoreo } from '../choreo';
import { initRing } from '../ring';

/** Our Love Story (PRD §6.8): the cards rise into the ring, then the caption and dots follow. */
defineChoreo('love-story', (page) => {
  const ring = initRing(page);
  const choreo = timelineChoreo((tl, p) => {
    const all = (sel: string) => [...p.querySelectorAll<HTMLElement>(sel)];
    tl.from(all('.ls__title'), { opacity: 0, y: 8, duration: 0.6 }, 0.15)
      .from(all('.ls__ring'), { opacity: 0, y: 16, duration: 0.8 }, 0.3)
      .from(all('.ls__garland'), { opacity: 0, y: -8, duration: 0.6 }, 0.6)
      .from(all('.ls__caption, .ls__dots'), { opacity: 0, y: 8, duration: 0.5, stagger: 0.1 }, 0.8);
  })(page);
  return {
    enter(animate) {
      choreo.enter(animate);
      ring.start();
    },
    leave() {
      ring.stop();
    },
  };
});
