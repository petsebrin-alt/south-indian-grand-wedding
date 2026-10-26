import { defineChoreo, timelineChoreo } from '../choreo';

/**
 * Divine Blessings (PRD §6.3, THEME M-04): the carved doors swing inward on their outer hinges,
 * a soft warm light rises behind the emblem (no beams), the view glides gently forward, and the
 * blessing scroll unrolls with its lines appearing one by one.
 */
defineChoreo(
  'blessings',
  timelineChoreo((tl, page) => {
    const one = (sel: string) => page.querySelector<HTMLElement>(sel)!;
    const all = (sel: string) => [...page.querySelectorAll<HTMLElement>(sel)];
    tl.to(one('.bl__door--l'), { rotationY: 82, duration: 1.4, ease: 'power2.inOut' }, 0.2)
      .to(one('.bl__door--r'), { rotationY: -82, duration: 1.4, ease: 'power2.inOut' }, 0.2)
      .from(one('.bl__light'), { opacity: 0, scale: 0.8, duration: 1.2, ease: 'power1.out' }, 0.6)
      .from(one('.bl__emblem'), { opacity: 0.4, y: 6, duration: 1, ease: 'power1.out' }, 0.7)
      .to(one('.bl__glide'), { scale: 1.06, duration: 1.5, ease: 'power1.inOut' }, 0.9)
      .to(one('.bl__frame'), { scale: 1.08, duration: 1.5, ease: 'power1.inOut' }, 0.9)
      .from(all('.bl__lamp'), { opacity: 0, y: 8, duration: 0.7, stagger: 0.1 }, 1.0)
      .from(one('.bl__scroll-body'), { scaleY: 0.04, duration: 0.7, ease: 'power2.out' }, 1.5)
      .from(one('.bl__roller--top'), { y: '4cqh', duration: 0.7, ease: 'power2.out' }, 1.5)
      .from(one('.bl__roller--bottom'), { y: '-4cqh', duration: 0.7, ease: 'power2.out' }, 1.5)
      .from(all('.bl__line'), { opacity: 0, y: 6, duration: 0.5, stagger: 0.15 }, 1.95);
  }),
);
