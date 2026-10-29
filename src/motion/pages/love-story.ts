import { defineChoreo, timelineChoreo } from '../choreo';
import { initRing } from '../ring';
import { startSway } from '../sway';
import { courtyardLife } from '../courtyard';

/**
 * Our Love Story (PRD §6.8): the peacock frame settles in with the photographs riding the ring and
 * its board below, then the controls follow; the garland on the background hangs in the wind and rose
 * petals drift down, two at a time, while the page shows.
 */
defineChoreo('love-story', (page) => {
  const ring = initRing(page);
  let sway: ReturnType<typeof startSway> | null = null;
  let petals: ReturnType<typeof courtyardLife> | null = null;
  const choreo = timelineChoreo((tl, p) => {
    const all = (sel: string) => [...p.querySelectorAll<HTMLElement>(sel)];
    tl.from(all('.ls__scene .sway'), { opacity: 0, duration: 1, stagger: 0.12 }, 0)
      .from(all('.ls__title'), { opacity: 0, y: 8, duration: 0.6 }, 0.15)
      .from(all('.ls__frame'), { opacity: 0, y: 18, scale: 0.97, duration: 0.9, ease: 'power2.out' }, 0.3)
      .from(all('.ls__controls'), { opacity: 0, y: 8, duration: 0.5 }, 0.9);
  })(page);
  return {
    enter(animate) {
      choreo.enter(animate);
      ring.start();
      sway ??= startSway([...page.querySelectorAll<HTMLElement>('.ls__scene [data-sway]')], { active: () => page.dataset.state === 'current' });
      sway.start();
      (petals ??= courtyardLife(page)).start(false);
    },
    leave() {
      ring.stop();
      sway?.stop();
      petals?.stop();
    },
  };
});
