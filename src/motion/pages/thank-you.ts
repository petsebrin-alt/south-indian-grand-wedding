import { defineChoreo, timelineChoreo } from '../choreo';

/**
 * Thank You (PRD §6.18): the veil settles, then the message is written letter by letter: each
 * letter's outline is drawn in ink (DrawSVG) and filled as the pen moves on, 2.4 s in all.
 * The names fade in, then the sign-off, the closing line and the buttons. Revisits and reduced
 * motion show the finished page; without JavaScript the letters are already solid.
 */
const WRITE_S = 2.4;
const LETTER_S = 0.32;

defineChoreo('thank-you', (page) =>
  timelineChoreo((tl, p) => {
    const all = (sel: string) => [...p.querySelectorAll<SVGPathElement | HTMLElement>(sel)];
    const glyphs = all('.ty__glyph');
    const gap = glyphs.length > 1 ? (WRITE_S - LETTER_S) / (glyphs.length - 1) : 0;
    const start = 0.5;

    tl.from(all('.ty__veil'), { opacity: 0, y: 10, duration: 0.6 }, 0)
      .fromTo(glyphs, { drawSVG: '0%', strokeWidth: 3.2 }, { drawSVG: '100%', duration: LETTER_S, ease: 'power1.inOut', stagger: gap }, start)
      .fromTo(glyphs, { fillOpacity: 0 }, { fillOpacity: 1, duration: 0.3, ease: 'power1.out', stagger: gap }, start + LETTER_S * 0.6)
      .to(glyphs, { strokeWidth: 0.6, duration: 0.6 }, start + WRITE_S)
      .from(all('.ty__divider'), { opacity: 0, scaleX: 0.4, duration: 0.6 }, start + WRITE_S - 0.2)
      .from(all('.ty__names'), { opacity: 0, y: 6, duration: 0.8 }, start + WRITE_S)
      .from(all('.ty__signoff'), { opacity: 0, duration: 0.6 }, start + WRITE_S + 0.5)
      .from(all('.ty__line'), { opacity: 0, duration: 0.6 }, start + WRITE_S + 0.8)
      .from(all('.ty__actions > *'), { opacity: 0, y: 8, duration: 0.5, stagger: 0.12 }, start + WRITE_S + 1);
  })(page),
);
