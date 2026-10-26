import { defineChoreo, timelineChoreo } from '../choreo';

/** Need Help (PRD §6.17): the visiting cards fan out from a stack, 100 ms apart. */
defineChoreo('help', (page) =>
  timelineChoreo((tl, p) => {
    const cards = [...p.querySelectorAll<HTMLElement>('.nh__card')];
    tl.from(p.querySelectorAll('.nh__head'), { opacity: 0, y: 8, duration: 0.6 }, 0.1).from(
      cards,
      {
        opacity: 0,
        y: (i) => -(cards[i].offsetTop - cards[0].offsetTop) * 0.85,
        rotation: (i) => (i - 1) * 4,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
      },
      0.3,
    );
  })(page),
);
