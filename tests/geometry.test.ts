import { describe, expect, it } from 'vitest';
import { computeFold, constrainCorner, cornerPoint, liftedPath, polygonArea, turnedPoint } from '../src/book/geometry';

const W = 390;
const H = 844;

const apply = (m: number[], p: { x: number; y: number }) => ({ x: m[0] * p.x + m[2] * p.y + m[4], y: m[1] * p.x + m[3] * p.y + m[5] });

describe('page-curl geometry', () => {
  it('has no fold when the corner rests in place', () => {
    expect(computeFold(cornerPoint('bottom', W, H), W, H, 'bottom')).toBeNull();
  });

  it('splits the page into flat and folded parts that add up to the whole page', () => {
    for (const p of [
      { x: 300, y: 780 },
      { x: 120, y: 500 },
      { x: -100, y: 700 },
    ]) {
      const f = computeFold(constrainCorner(p, W, H, 'bottom'), W, H, 'bottom')!;
      expect(polygonArea(f.flat) + polygonArea(f.folded)).toBeCloseTo(W * H, 3);
    }
  });

  it('reflects the grabbed corner exactly onto the drag point', () => {
    const p = { x: 210, y: 640 };
    const f = computeFold(p, W, H, 'bottom')!;
    const moved = apply(f.matrix, cornerPoint('bottom', W, H));
    expect(moved.x).toBeCloseTo(p.x, 6);
    expect(moved.y).toBeCloseTo(p.y, 6);
  });

  it('keeps points on the fold line fixed under the reflection', () => {
    const f = computeFold({ x: 150, y: 600 }, W, H, 'bottom')!;
    const onLine = { x: f.mid.x - f.normal.y * 50, y: f.mid.y + f.normal.x * 50 };
    const moved = apply(f.matrix, onLine);
    expect(moved.x).toBeCloseTo(onLine.x, 6);
    expect(moved.y).toBeCloseTo(onLine.y, 6);
  });

  it('reports progress from 0 (flat) to 1 (turned over the spine)', () => {
    expect(computeFold({ x: W - 2, y: H }, W, H, 'bottom')!.progress).toBeCloseTo(0, 2);
    expect(computeFold({ x: 0, y: H }, W, H, 'bottom')!.progress).toBeCloseTo(0.5, 5);
    expect(computeFold(turnedPoint('bottom', W, H), W, H, 'bottom')!.progress).toBe(1);
  });

  it('hides the page completely once fully turned', () => {
    const f = computeFold(turnedPoint('bottom', W, H), W, H, 'bottom')!;
    expect(polygonArea(f.flat)).toBeCloseTo(0, 6);
  });

  it('never lets the corner tear away from the bound spine', () => {
    for (const p of [
      { x: -800, y: -400 },
      { x: -600, y: 900 },
      { x: 50, y: -300 },
    ]) {
      const q = constrainCorner(p, W, H, 'bottom');
      expect(Math.hypot(q.x, q.y - H)).toBeLessThanOrEqual(W + 1e-6);
      expect(Math.hypot(q.x, q.y)).toBeLessThanOrEqual(Math.hypot(W, H) + 1e-6);
    }
  });

  it('lifts the corner towards the page centre during an automatic turn', () => {
    const from = cornerPoint('bottom', W, H);
    const to = turnedPoint('bottom', W, H);
    expect(liftedPath(from, to, 0.5, W, H, 'bottom').y).toBeLessThan(H);
    expect(liftedPath(from, to, 1, W, H, 'bottom')).toEqual(to);
  });
});
