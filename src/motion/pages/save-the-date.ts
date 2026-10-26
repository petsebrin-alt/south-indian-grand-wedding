import { defineChoreo, gsap, timelineChoreo } from '../choreo';
import { initScratch } from '../scratch';

/**
 * Save the Date (PRD §6.4): the card settles, "Save the Date" is inked in from left to right,
 * the gold foil panels shimmer once, and once all three panels are scratched (or revealed)
 * a jasmine wreath draws around the 7th on the month grid.
 */
defineChoreo(
  'save-the-date',
  timelineChoreo(
    (tl, page) => {
      const one = (sel: string) => page.querySelector<HTMLElement>(sel)!;
      const all = (sel: string) => [...page.querySelectorAll<HTMLElement>(sel)];
      const wreath = all('.sd__wreath .draw');
      const buds = all('.sd__wreath .bud');
      gsap.set(wreath, { drawSVG: '0%' });
      gsap.set(buds, { opacity: 0, scale: 0, transformOrigin: '50% 50%' });

      initScratch(page, (animate) => {
        if (!animate) {
          gsap.set(wreath, { drawSVG: '100%' });
          gsap.set(buds, { opacity: 1, scale: 1 });
          return;
        }
        gsap.to(wreath, { drawSVG: '100%', duration: 0.6, ease: 'power2.inOut' });
        gsap.to(buds, { opacity: 1, scale: 1, duration: 0.3, stagger: 0.04, delay: 0.4, ease: 'back.out(2)' });
      });

      tl.from(one('.sd__card'), { y: 6, opacity: 0, duration: 0.5 }, 0)
        .from(all('.sd__jasmine'), { opacity: 0, scale: 0.92, duration: 0.6, stagger: 0.05 }, 0.1)
        .fromTo(one('.sd__title'), { '--wipe': '0%' }, { '--wipe': '115%', duration: 1.1, ease: 'power1.inOut' }, 0.3)
        .to(all('.sd__sheen'), { backgroundPosition: '-50% 0', duration: 0.7, stagger: 0.12, ease: 'power1.inOut' }, 0.9)
        .from(all('.sd__hint, .sd__month, .sd__when, .sd__names, .sd__cal'), { opacity: 0, y: 6, duration: 0.5, stagger: 0.08 }, 1.0);
    },
  ),
);
