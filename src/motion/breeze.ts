import { gsap, isReducedMotion } from './choreo';

/**
 * A gentle, irregular breeze (THEME §10.3): each piece of a photograph (garland, leaf, bell) rocks
 * on its own pivot (CSS transform-origin) by up to its `data-wind` degrees, in slow swells, each
 * on its own rhythm. `active` pauses it (for example while its page is not showing) and `gust`
 * scales it (the opening doors stir the air). Never under reduced motion.
 */
export interface Breeze {
  stop(): void;
}

export function breeze(pieces: HTMLElement[], { active = () => true, gust = () => 1 }: { active?: () => boolean; gust?: () => number } = {}): Breeze | null {
  if (isReducedMotion() || !pieces.length) return null;
  const sway = pieces.map((el, i) => ({
    el,
    amp: Number(el.dataset.wind ?? 0.6),
    t1: 3.2 + ((i * 0.37) % 1.4),
    t2: 1.3 + ((i * 0.23) % 0.7),
    p1: i * 1.7,
    p2: i * 2.9,
  }));
  const tick = (time: number) => {
    if (!active()) return;
    const swell = (0.75 + 0.35 * Math.sin((time / 9) * Math.PI * 2) + 0.15 * Math.sin((time / 3.7) * Math.PI * 2)) * gust();
    for (const p of sway) {
      const a = p.amp * swell * (0.68 * Math.sin((time / p.t1) * Math.PI * 2 + p.p1) + 0.32 * Math.sin((time / p.t2) * Math.PI * 2 + p.p2));
      p.el.style.rotate = `${a.toFixed(3)}deg`;
    }
  };
  gsap.ticker.add(tick);
  return {
    stop() {
      gsap.ticker.remove(tick);
      pieces.forEach((el) => (el.style.rotate = ''));
    },
  };
}
