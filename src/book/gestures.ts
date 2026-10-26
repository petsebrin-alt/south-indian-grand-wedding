import type { Corner, Point } from './geometry';

/**
 * Gesture rules (PRD §8.1.2–§8.1.4, §8.4). Pure functions so they can be unit-tested.
 * Forward = swipe left or up, or drag the right-hand corner. Backward = swipe right or down,
 * or drag the bottom-left corner.
 */
export const SWIPE_SLOP_PX = 12;
export const CORNER_ZONE_PX = 64;
export const COMPLETE_PROGRESS = 0.3;
export const COMPLETE_VELOCITY = 0.45; // px per ms

export type Axis = 'x' | 'y';
export type Direction = 1 | -1;
export type GestureKind = 'corner' | 'swipe-x' | 'swipe-y';

/** Dominant axis of a movement. Within 30° of an axis it is that axis; between, the larger delta wins. */
export function classifyAxis(dx: number, dy: number): Axis {
  return Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
}

export function directionOf(axis: Axis, dx: number, dy: number): Direction {
  return (axis === 'x' ? dx : dy) < 0 ? 1 : -1;
}

/** Which corner hot zone (if any) a pointer started in. */
export function cornerZone(x: number, y: number, w: number, h: number): { dir: Direction; corner: Corner } | null {
  const z = CORNER_ZONE_PX;
  if (x >= w - z && y >= h - z) return { dir: 1, corner: 'bottom' };
  if (x >= w - z && y <= z) return { dir: 1, corner: 'top' };
  if (x <= z && y >= h - z) return { dir: -1, corner: 'bottom' };
  return null;
}

/**
 * Corner position for a drag in progress.
 * - Forward corner drag: the corner follows the finger (1:1).
 * - Backward corner drag: the fold line follows the finger.
 * - Swipes: mapped so a comfortable swipe produces a diagonal curl from the bottom-right corner.
 */
export function cornerForDrag(
  kind: GestureKind,
  dir: Direction,
  start: Point,
  now: Point,
  w: number,
  h: number,
  corner: Corner,
): Point {
  const dx = now.x - start.x;
  const dy = now.y - start.y;
  const cornerY = corner === 'bottom' ? h : 0;
  const clampY = (y: number) => (corner === 'bottom' ? Math.min(h, Math.max(h * 0.3, y)) : Math.max(0, Math.min(h * 0.7, y)));

  if (kind === 'corner') {
    if (dir === 1) return { x: Math.min(w, now.x + (w - start.x)), y: clampY(now.y + (cornerY - start.y)) };
    return { x: Math.min(w, 2 * now.x - w), y: clampY(now.y + (cornerY - start.y)) };
  }

  const lift = (amount: number) => (corner === 'bottom' ? -amount : amount);
  if (kind === 'swipe-x') {
    const base = dir === 1 ? w : -w;
    return { x: Math.max(-w, Math.min(w, base + dx * 1.3)), y: clampY(cornerY + lift(Math.abs(dx) * 0.1) + dy * 0.25) };
  }
  // swipe-y: up turns forward, down turns back
  if (dir === 1) return { x: Math.max(-w, w + dy * 1.35), y: clampY(cornerY + dy * 0.4) };
  return { x: Math.min(w, -w + dy * 1.35), y: clampY(cornerY - dy * 0.15) };
}

/**
 * Decide on release whether the turn completes (PRD §8.1.4).
 * `progress` is how far the turn has travelled in its own direction (0–1);
 * `velocity` is the finger speed in the turn's direction (px/ms, positive = towards completion).
 */
export function shouldComplete(progress: number, velocity: number): boolean {
  if (velocity < -COMPLETE_VELOCITY) return false;
  return progress > COMPLETE_PROGRESS || velocity > COMPLETE_VELOCITY;
}

/** Tracks recent pointer samples to estimate release velocity. */
export class VelocityTracker {
  private samples: { t: number; x: number; y: number }[] = [];

  add(t: number, x: number, y: number) {
    this.samples.push({ t, x, y });
    while (this.samples.length > 2 && t - this.samples[0].t > 100) this.samples.shift();
  }

  velocity(): Point {
    if (this.samples.length < 2) return { x: 0, y: 0 };
    const a = this.samples[0];
    const b = this.samples[this.samples.length - 1];
    const dt = Math.max(1, b.t - a.t);
    return { x: (b.x - a.x) / dt, y: (b.y - a.y) / dt };
  }

  reset() {
    this.samples = [];
  }
}

/**
 * Mouse wheel / trackpad: one page per gesture (PRD §8.1.2). A gesture is a stream of wheel
 * events without a quiet gap, so trackpad inertia never turns a second page.
 */
export class WheelGate {
  private accum = 0;
  private fired = false;
  private lastEvent = -Infinity;
  private lastFire = -Infinity;

  constructor(
    private threshold = 40,
    private lockMs = 700,
    private quietMs = 160,
  ) {}

  /** Returns a direction when a turn should happen, otherwise null. */
  push(delta: number, now: number): Direction | null {
    if (now - this.lastEvent > this.quietMs) {
      this.accum = 0;
      this.fired = false;
    }
    this.lastEvent = now;
    if (this.fired || now - this.lastFire < this.lockMs) return null;
    this.accum += delta;
    if (Math.abs(this.accum) < this.threshold) return null;
    this.fired = true;
    this.lastFire = now;
    return this.accum > 0 ? 1 : -1;
  }
}
