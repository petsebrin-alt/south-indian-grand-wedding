import { defineChoreo, gsap, timelineChoreo } from '../choreo';
import { initDeck } from '../deck';

/** Dress Code (PRD §6.12): the cards are dealt from a stack into the fan. */
defineChoreo('dress-code', (page) => {
  const deck = initDeck(page);
  return timelineChoreo((tl, p) => {
    const all = (sel: string) => [...p.querySelectorAll<HTMLElement>(sel)];
    tl.from(all('.dc__head'), { opacity: 0, y: 8, duration: 0.6 }, 0.15)
      .from(all('.dc__jasmine'), { opacity: 0, duration: 0.6, stagger: 0.1 }, 0.2)
      .add(() => {
        // Deal the visible cards from slightly below, back card first
        const visible = deck.cards().slice(0, 3).reverse();
        gsap.from(visible, { y: '+=30', opacity: 0, duration: 0.5, stagger: 0.12, ease: 'power3.out' });
      }, 0.3)
      .from(all('.dc__nav'), { opacity: 0, y: 6, duration: 0.5 }, 0.9);
  })(page);
});
