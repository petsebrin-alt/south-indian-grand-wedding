import { describe, expect, it } from 'vitest';
import { WheelGate, classifyAxis, cornerForDrag, cornerZone, directionOf, shouldComplete } from '../src/book/gestures';

const W = 390;
const H = 844;

describe('gesture rules (PRD §8.1, §8.4)', () => {
  it('maps swipe directions: left/up forward, right/down back', () => {
    expect(directionOf('x', -40, 3)).toBe(1);
    expect(directionOf('y', 2, -40)).toBe(1);
    expect(directionOf('x', 40, 3)).toBe(-1);
    expect(directionOf('y', 2, 40)).toBe(-1);
  });

  it('classifies the dominant axis', () => {
    expect(classifyAxis(30, 10)).toBe('x');
    expect(classifyAxis(8, -30)).toBe('y');
  });

  it('recognises the corner hot zones', () => {
    expect(cornerZone(W - 10, H - 10, W, H)).toEqual({ dir: 1, corner: 'bottom' });
    expect(cornerZone(W - 10, 10, W, H)).toEqual({ dir: 1, corner: 'top' });
    expect(cornerZone(10, H - 10, W, H)).toEqual({ dir: -1, corner: 'bottom' });
    expect(cornerZone(W / 2, H / 2, W, H)).toBeNull();
  });

  it('makes the dragged corner follow the finger on a forward corner drag', () => {
    const p = cornerForDrag('corner', 1, { x: W - 10, y: H - 10 }, { x: 200, y: 700 }, W, H, 'bottom');
    expect(p).toEqual({ x: 210, y: 710 });
  });

  it('turns a swipe up into a diagonal curl from the bottom-right corner', () => {
    const p = cornerForDrag('swipe-y', 1, { x: 200, y: 600 }, { x: 200, y: 400 }, W, H, 'bottom');
    expect(p.x).toBeLessThan(W);
    expect(p.y).toBeLessThan(H);
  });

  it('completes a turn past 30% or on a quick flick, and cancels on a flick back', () => {
    expect(shouldComplete(0.31, 0)).toBe(true);
    expect(shouldComplete(0.1, 0.6)).toBe(true);
    expect(shouldComplete(0.2, 0.1)).toBe(false);
    expect(shouldComplete(0.6, -0.6)).toBe(false);
  });

  it('turns exactly one page per wheel gesture, ignoring trackpad inertia', () => {
    const gate = new WheelGate();
    const fired = [];
    for (let t = 0; t < 1200; t += 16) {
      const dir = gate.push(30, t);
      if (dir) fired.push(dir);
    }
    expect(fired).toEqual([1]);
    expect(gate.push(60, 1600)).toBe(1); // a new gesture after a quiet gap
  });
});
