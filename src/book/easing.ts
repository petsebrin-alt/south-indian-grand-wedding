/** Cubic-bezier easing matching the CSS tokens in tokens.css (THEME §10.2). */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = sampleX(t) - x;
      if (Math.abs(err) < 1e-5) break;
      const s = slopeX(t);
      if (Math.abs(s) < 1e-6) break;
      t -= err / s;
    }
    return sampleY(Math.min(1, Math.max(0, t)));
  };
}

export const easePage = cubicBezier(0.45, 0.05, 0.25, 1);
export const easeSilk = cubicBezier(0.22, 1, 0.36, 1);
