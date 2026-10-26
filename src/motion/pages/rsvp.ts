import { defineChoreo, timelineChoreo } from '../choreo';

/** RSVP (PRD §6.16): the card slides up 10 px and settles; its lines follow; the crest arrives last. */
defineChoreo('rsvp', (page) =>
  timelineChoreo((tl, p) => {
    const all = (sel: string) => [...p.querySelectorAll<HTMLElement>(sel)];
    tl.from(all('.rv__card'), { y: 10, opacity: 0, duration: 0.8, ease: 'power2.out' }, 0.1)
      .from(all('.rv__line'), { opacity: 0, y: 6, duration: 0.5, stagger: 0.08 }, 0.4)
      .from(all('.rv__crest'), { opacity: 0, scale: 0.85, duration: 0.6, ease: 'back.out(2)' }, 0.5)
      .from(all('.rv__jasmine'), { opacity: 0, duration: 0.6 }, 0.6);
  })(page),
);
