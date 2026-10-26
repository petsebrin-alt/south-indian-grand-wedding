/**
 * Page-curl geometry (PRD §8.1, THEME §11): a flat diagonal fold like a real paper page.
 *
 * Page coordinates: origin top-left, width w, height h, spine on the left edge (x = 0).
 * The guest drags the free corner C to point P. The fold line is the perpendicular
 * bisector of C–P; everything on C's side of it is folded over (reflected across the line)
 * and shows the parchment back.
 */
export interface Point {
  x: number;
  y: number;
}

export type Corner = 'bottom' | 'top';

export interface Fold {
  /** Still-flat part of the turning page (clip for the page itself). */
  flat: Point[];
  /** Folded part, in unreflected page coordinates (clip for the flap). */
  folded: Point[];
  /** CSS matrix(a, b, c, d, e, f) reflecting the flap across the fold line. */
  matrix: [number, number, number, number, number, number];
  /** Midpoint of the fold line. */
  mid: Point;
  /** Unit normal of the fold line, pointing towards the grabbed corner. */
  normal: Point;
  /** 0 = flat, 1 = fully turned. */
  progress: number;
}

export const cornerPoint = (corner: Corner, w: number, h: number): Point => ({ x: w, y: corner === 'bottom' ? h : 0 });

/** Where the corner rests once the page has fully turned over the spine. */
export const turnedPoint = (corner: Corner, w: number, h: number): Point => ({ x: -w, y: corner === 'bottom' ? h : 0 });

function clampToCircle(p: Point, c: Point, r: number): Point {
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  const d = Math.hypot(dx, dy);
  return d <= r ? p : { x: c.x + (dx * r) / d, y: c.y + (dy * r) / d };
}

/**
 * The spine is bound, so the folded corner can be at most one page-width from the spine end
 * on its own edge and one diagonal from the opposite spine end. Keeps the page from tearing.
 */
export function constrainCorner(p: Point, w: number, h: number, corner: Corner): Point {
  const near = { x: 0, y: corner === 'bottom' ? h : 0 };
  const far = { x: 0, y: corner === 'bottom' ? 0 : h };
  const diag = Math.hypot(w, h);
  let q = p;
  for (let i = 0; i < 3; i++) q = clampToCircle(clampToCircle(q, near, w), far, diag);
  return q;
}

/** Sutherland–Hodgman clip of a convex polygon, keeping points where f >= 0. */
export function clipPolygon(poly: Point[], f: (p: Point) => number): Point[] {
  const out: Point[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const fa = f(a);
    const fb = f(b);
    if (fa >= 0) out.push(a);
    if (fa >= 0 !== fb >= 0) {
      const t = fa / (fa - fb);
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  return out;
}

export function computeFold(p: Point, w: number, h: number, corner: Corner): Fold | null {
  const c = cornerPoint(corner, w, h);
  const dx = c.x - p.x;
  const dy = c.y - p.y;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return null;

  const n = { x: dx / len, y: dy / len };
  const mid = { x: (c.x + p.x) / 2, y: (c.y + p.y) / 2 };
  const side = (q: Point) => (q.x - mid.x) * n.x + (q.y - mid.y) * n.y; // > 0 on the corner's side
  const rect = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ];

  // Reflection across the fold line: R(v) = (I − 2nnᵀ)v + 2(mid·n)n
  const k = 2 * (mid.x * n.x + mid.y * n.y);
  const a = 1 - 2 * n.x * n.x;
  const b = -2 * n.x * n.y;
  const d = 1 - 2 * n.y * n.y;

  return {
    flat: clipPolygon(rect, (q) => -side(q)),
    folded: clipPolygon(rect, side),
    matrix: [a, b, b, d, k * n.x, k * n.y],
    mid,
    normal: n,
    progress: Math.min(1, Math.max(0, (c.x - p.x) / (2 * w))),
  };
}

export function polygonArea(poly: Point[]): number {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    s += a.x * b.y - b.x * a.y;
  }
  return Math.abs(s) / 2;
}

export function toClipPath(poly: Point[]): string {
  if (poly.length < 3) return 'polygon(0 0, 0 0, 0 0)';
  return `polygon(${poly.map((q) => `${q.x.toFixed(2)}px ${q.y.toFixed(2)}px`).join(', ')})`;
}

/**
 * Corner position for an automatic turn at eased time u ∈ [0, 1]: travels from `from` to `to`
 * while lifting towards the page centre, so the fold sweeps diagonally (as in the reference).
 */
export function liftedPath(from: Point, to: Point, u: number, w: number, h: number, corner: Corner): Point {
  const lift = 0.16 * h * Math.min(1, Math.abs(to.x - from.x) / (2 * w)) * Math.sin(Math.PI * u);
  return {
    x: from.x + (to.x - from.x) * u,
    y: from.y + (to.y - from.y) * u + (corner === 'bottom' ? -lift : lift),
  };
}
