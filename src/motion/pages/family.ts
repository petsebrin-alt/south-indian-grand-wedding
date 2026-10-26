import { defineChoreo, timelineChoreo } from '../choreo';
import { initFamilyTrees } from '../tree';

/**
 * Parents and Family (PRD §6.7): the gold arch rises, the names write in line by line
 * (left-to-right ink wipe), and the family frames settle beneath.
 */
defineChoreo(
  'family',
  timelineChoreo((tl, page) => {
    initFamilyTrees();
    const all = (sel: string) => [...page.querySelectorAll<HTMLElement>(sel)];
    tl.from(all('.fm__plate, .fm__garland'), { opacity: 0, y: 14, duration: 0.6 }, 0)
      .from(all('.fm__diya'), { opacity: 0, duration: 0.6, stagger: 0.1 }, 0.3);
    all('.fm__line').forEach((line, i) => {
      tl.fromTo(line, { '--wipe': '0%' }, { '--wipe': '115%', duration: 0.5, ease: 'power1.inOut' }, 0.4 + i * 0.3);
    });
    tl.from(all('.fm__side'), { opacity: 0, scale: 0.96, duration: 0.6, stagger: 0.12 }, 1.6);
  }),
);
