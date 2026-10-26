import { describe, expect, it } from 'vitest';
import { lettering } from '../src/lib/handwriting';

/** Highest and lowest y in a path's coordinates (every second number after the command letters). */
const yRange = (d: string) => {
  const nums = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
  const ys = nums.filter((_, i) => i % 2 === 1);
  return [Math.min(...ys), Math.max(...ys)];
};

describe('handwritten lettering (Thank You page)', () => {
  const l = lettering(['Thank You for', 'Blessing Our Journey']);

  it('has one path per visible letter, in writing order', () => {
    expect(l.glyphs).toHaveLength('ThankYoufor'.length + 'BlessingOurJourney'.length);
    expect(l.glyphs.filter((g) => g.line === 0)).toHaveLength(11);
    expect(l.glyphs.every((g) => g.d.startsWith('M'))).toBe(true);
  });

  it('draws upright, with the second line below the first (opentype.js must not flip Y)', () => {
    const firstLine = yRange(l.glyphs[0].d);
    const secondLine = yRange(l.glyphs[11].d);
    expect(secondLine[0]).toBeGreaterThan(firstLine[0]);
    // The capital T's crossbar sits near the top of its line: smaller y than most of the letter.
    const [top, bottom] = firstLine;
    expect(top).toBeLessThan(60);
    expect(bottom).toBeLessThan(140);
  });

  it('fits a viewBox around both lines', () => {
    const [, , w, h] = l.viewBox.split(' ').map(Number);
    expect(w).toBeGreaterThan(h);
    expect(h).toBeGreaterThan(150);
  });
});
