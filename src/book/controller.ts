import { computeFold, constrainCorner, cornerPoint, liftedPath, toClipPath, turnedPoint, type Corner, type Point } from './geometry';
import { easePage, easeSilk } from './easing';
import {
  SWIPE_SLOP_PX,
  VelocityTracker,
  classifyAxis,
  cornerForDrag,
  cornerZone,
  directionOf,
  shouldComplete,
  type Direction,
  type GestureKind,
} from './gestures';

/**
 * BookController — turns the stacked page sections into a page-curl book (PRD §8.1).
 *
 * Page states (data-state): current · neighbour (pre-rendered underneath) · under (being
 * uncovered) · turning (being folded) · hidden. Pages emit `page:enter` / `page:leave`
 * CustomEvents so each page can run its own choreography (PRD §8.2).
 */
export type Transition = 'auto' | 'curl' | 'riffle' | 'bloom' | 'fade' | 'instant';
export type Via = 'gesture' | 'button' | 'keyboard' | 'wheel' | 'contents' | 'link' | 'open' | 'init';

export interface PageEnterDetail {
  index: number;
  firstVisit: boolean;
  via: Via;
}

interface Turn {
  dir: Direction;
  from: number;
  to: number;
  turning: HTMLElement;
  under: HTMLElement;
  corner: Corner;
  p: Point;
  w: number;
  h: number;
  entered: boolean;
}

interface PointerTrack {
  id: number;
  start: Point;
  zone: string | null;
  corner: ReturnType<typeof cornerZone>;
  kind: GestureKind | null;
  dir: Direction;
}

export interface BookOptions {
  root: HTMLElement;
  pages: HTMLElement[];
  reducedMotion: () => boolean;
  /** Extra flap drop-shadow; costly on low-end phones. */
  highQuality: boolean;
  onChange?: (index: number, previous: number, via: Via) => void;
}

const TURN_MS = 850;
const RIFFLE_MS = 420;
const RIFFLE_FLICKS = 6;
const RIFFLE_TOTAL_MS = 900;
const FADE_MS = 250;

export class BookController {
  index = 0;
  /** Page the cover opens to (deep links land here after opening, PRD §8.5). */
  openTarget = 1;
  /** False while an overlay is open or in Scroll View. */
  enabled = true;

  private readonly root: HTMLElement;
  private readonly pages: HTMLElement[];
  private readonly opts: BookOptions;
  private readonly flapWrap: HTMLElement;
  private readonly flap: HTMLElement;
  private readonly flapShade: HTMLElement;
  private readonly shadow: HTMLElement;
  private readonly bloom: HTMLElement;
  private turn: Turn | null = null;
  private busy = false;
  private queued: (() => void) | null = null;
  private visited = new Set<number>();
  private pointer: PointerTrack | null = null;
  private velocity = new VelocityTracker();
  private suppressClick = false;
  private frame = 0;

  constructor(opts: BookOptions) {
    this.opts = opts;
    this.root = opts.root;
    this.pages = opts.pages;

    this.shadow = this.layer('book__shadow');
    // The wrapper carries the optional drop-shadow, which the flap's own clip-path would cut off.
    this.flapWrap = this.layer('book__flap-wrap');
    this.flap = document.createElement('div');
    this.flap.className = 'book__flap';
    this.flapShade = document.createElement('div');
    this.flapShade.className = 'book__flap-shade';
    this.flap.append(this.flapShade);
    this.flapWrap.append(this.flap);
    this.bloom = this.layer('book__bloom');
    if (opts.highQuality) this.root.classList.add('book--hq');

    this.root.addEventListener('pointerdown', this.onPointerDown);
    this.root.addEventListener('pointermove', this.onPointerMove);
    this.root.addEventListener('pointerup', this.onPointerUp);
    this.root.addEventListener('pointercancel', this.onPointerCancel);
    this.root.addEventListener('click', this.onClickCapture, true);
  }

  get pageCount() {
    return this.pages.length;
  }

  get isBusy() {
    return this.busy;
  }

  /** Show a page immediately without animation (initial load, Scroll View exit). */
  show(index: number, via: Via = 'init') {
    const prev = this.index;
    this.index = this.clamp(index);
    this.applyStates();
    this.enter(this.index, via);
    if (prev !== this.index || via === 'init') this.opts.onChange?.(this.index, prev, via);
  }

  next(via: Via = 'button') {
    this.goTo(this.index === 0 ? this.openTarget : this.index + 1, 'auto', via);
  }

  prev(via: Via = 'button') {
    this.goTo(this.index - 1, 'auto', via);
  }

  goTo(target: number, transition: Transition = 'auto', via: Via = 'button') {
    target = this.clamp(target);
    if (target === this.index) return;
    if (this.busy) {
      this.queued = () => this.goTo(target, transition, via);
      return;
    }
    const distance = Math.abs(target - this.index);
    let t = transition;
    if (this.opts.reducedMotion() && t !== 'instant') t = 'fade';
    if (t === 'auto') t = distance === 1 || this.index === 0 ? 'curl' : distance <= 3 ? 'riffle' : 'bloom';

    if (t === 'instant') return this.show(target, via);
    if (t === 'fade') return void this.run(() => this.fadeTo(target, via));
    if (t === 'bloom') return void this.run(() => this.bloomTo(target, via));
    if (t === 'riffle') return void this.run(() => this.riffleTo(target, via));
    return void this.run(() => this.curlTo(target, via, TURN_MS));
  }

  /** First-visit hint: the bottom-right corner lifts twice (PRD §5.2). */
  async peek() {
    if (this.busy || this.index >= this.pageCount - 1 || this.opts.reducedMotion()) return;
    await this.run(async () => {
      const t = this.beginTurn(1, this.index + 1, 'bottom');
      const rest = cornerPoint('bottom', t.w, t.h);
      const lifted = { x: rest.x - 34, y: rest.y - 30 };
      for (let i = 0; i < 2; i++) {
        await this.animate(lifted, 420, easeSilk, false);
        await this.animate(rest, 360, easeSilk, false);
      }
      this.finishTurn(false, 'button');
    });
  }

  /* ---------------------------------------------------------------- transitions */

  private async run(task: () => Promise<void>) {
    this.busy = true;
    try {
      await task();
    } finally {
      this.busy = false;
      const q = this.queued;
      this.queued = null;
      q?.();
    }
  }

  private async curlTo(target: number, via: Via, duration: number) {
    const dir: Direction = target > this.index ? 1 : -1;
    const t = this.beginTurn(dir, target, 'bottom');
    const end = dir === 1 ? turnedPoint('bottom', t.w, t.h) : cornerPoint('bottom', t.w, t.h);
    await this.animate(end, duration, easePage, true, via);
    this.finishTurn(true, via);
  }

  private async riffleTo(target: number, via: Via) {
    const from = this.index;
    const distance = Math.abs(target - from);
    if (distance <= 3) {
      const dir: Direction = target > from ? 1 : -1;
      while (this.index !== target) await this.curlTo(this.index + dir, this.index + dir === target ? via : 'contents', RIFFLE_MS);
      return;
    }
    // A long riffle (Return to First Page, PRD §6.18) flicks through a handful of pages, ~900 ms in all.
    const stops = [...new Set(Array.from({ length: RIFFLE_FLICKS }, (_, i) => Math.round(from + ((target - from) * (i + 1)) / RIFFLE_FLICKS)))];
    const ms = Math.round(RIFFLE_TOTAL_MS / stops.length);
    for (const stop of stops) await this.curlTo(stop, stop === target ? via : 'contents', ms);
  }

  private async fadeTo(target: number, via: Via) {
    const from = this.pages[this.index];
    const to = this.pages[target];
    this.setState(to, 'under');
    this.setState(from, 'turning');
    from.style.transition = `opacity ${FADE_MS}ms linear`;
    await nextFrame();
    from.style.opacity = '0';
    await wait(FADE_MS);
    from.style.transition = '';
    from.style.opacity = '';
    this.commit(target, via);
  }

  /** Parchment bloom for distant jumps (PRD §8.1.8). */
  private async bloomTo(target: number, via: Via) {
    const b = this.bloom;
    b.style.transition = 'opacity 300ms ease-in';
    b.classList.add('is-on');
    await wait(300);
    this.commit(target, via);
    b.style.transition = 'opacity 700ms var(--ease-silk)';
    b.classList.remove('is-on');
    await wait(700);
    b.style.transition = '';
  }

  /* ---------------------------------------------------------------- turn engine */

  private beginTurn(dir: Direction, to: number, corner: Corner): Turn {
    const w = this.root.clientWidth;
    const h = this.root.clientHeight;
    const turning = this.pages[dir === 1 ? this.index : to];
    const under = this.pages[dir === 1 ? to : this.index];
    this.pages.forEach((p) => p !== turning && p !== under && this.setState(p, 'hidden'));
    this.setState(under, 'under');
    this.setState(turning, 'turning');

    const diag = Math.hypot(w, h);
    this.shadow.style.width = `${w * 0.22}px`;
    this.shadow.style.height = `${diag * 2}px`;
    this.flapShade.style.width = `${w * 0.75}px`;
    this.flapShade.style.height = `${diag * 2}px`;
    this.flapWrap.classList.add('is-on');
    this.shadow.classList.add('is-on');
    this.root.classList.add('is-turning');

    this.turn = {
      dir,
      from: this.index,
      to,
      turning,
      under,
      corner,
      p: dir === 1 ? cornerPoint(corner, w, h) : turnedPoint(corner, w, h),
      w,
      h,
      entered: false,
    };
    this.render();
    return this.turn;
  }

  private render(): number {
    const t = this.turn;
    if (!t) return 0;
    const p = constrainCorner(t.p, t.w, t.h, t.corner);
    const fold = computeFold(p, t.w, t.h, t.corner);
    if (!fold) {
      t.turning.style.clipPath = '';
      this.flap.style.clipPath = 'polygon(0 0, 0 0, 0 0)';
      this.shadow.style.opacity = '0';
      return 0;
    }
    t.turning.style.clipPath = toClipPath(fold.flat);
    this.flap.style.clipPath = toClipPath(fold.folded);
    this.flap.style.transform = `matrix(${fold.matrix.map((v) => v.toFixed(5)).join(',')})`;

    const angle = (Math.atan2(fold.normal.y, fold.normal.x) * 180) / Math.PI;
    const diag = Math.hypot(t.w, t.h);
    const line = `translate(${fold.mid.x.toFixed(2)}px, ${fold.mid.y.toFixed(2)}px) rotate(${angle.toFixed(3)}deg) translate(0, ${(-diag).toFixed(2)}px)`;
    this.shadow.style.transform = line;
    this.flapShade.style.transform = line;
    const intensity = Math.sin(Math.PI * fold.progress);
    this.shadow.style.opacity = Math.min(1, intensity * 1.6).toFixed(3);
    this.flapShade.style.opacity = (0.4 + 0.6 * intensity).toFixed(3);

    this.root.style.setProperty('--turn-progress', fold.progress.toFixed(3));
    return fold.progress;
  }

  /** Move the corner to `to`; when completing a forward turn, emit the destination's page:enter at 85%. */
  private animate(to: Point, duration: number, ease: (t: number) => number, lift: boolean, completingVia?: Via): Promise<void> {
    const t = this.turn!;
    const from = { ...t.p };
    const start = performance.now();
    cancelAnimationFrame(this.frame);
    return new Promise((resolve) => {
      let done = false;
      const step = (now: number) => {
        if (done) return;
        const k = Math.min(1, (now - start) / duration);
        const u = ease(k);
        t.p = lift ? liftedPath(from, to, u, t.w, t.h, t.corner) : { x: from.x + (to.x - from.x) * u, y: from.y + (to.y - from.y) * u };
        const progress = this.render();
        if (completingVia && t.dir === 1 && !t.entered && progress >= 0.85) {
          t.entered = true;
          this.enter(t.to, completingVia);
        }
        if (k < 1) {
          this.frame = requestAnimationFrame(step);
        } else {
          done = true;
          this.frame = 0;
          clearTimeout(safety);
          resolve();
        }
      };
      // Animation frames pause while the page is hidden (guest switches apps mid-turn);
      // timers still run, so this guarantees the turn always finishes.
      const safety = window.setTimeout(() => {
        if (done) return;
        cancelAnimationFrame(this.frame);
        step(start + duration);
      }, duration + 250);
      this.frame = requestAnimationFrame(step);
    });
  }

  private finishTurn(complete: boolean, via: Via) {
    const t = this.turn!;
    this.turn = null;
    t.turning.style.clipPath = '';
    this.flapWrap.classList.remove('is-on');
    this.shadow.classList.remove('is-on');
    this.root.classList.remove('is-turning');
    if (complete) this.commit(t.to, via, t.entered);
    else this.applyStates();
  }

  private commit(target: number, via: Via, alreadyEntered = false) {
    const prev = this.index;
    this.leave(prev, target);
    this.index = target;
    this.applyStates();
    if (!alreadyEntered) this.enter(target, via);
    this.opts.onChange?.(target, prev, via);
  }

  /* ---------------------------------------------------------------- gestures */

  private onPointerDown = (e: PointerEvent) => {
    if (!this.enabled || this.busy || this.pointer) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const target = e.target as Element;
    const zone = target.closest('[data-gesture]')?.getAttribute('data-gesture') ?? null;
    if (zone === 'scratch' || zone === 'none') return;
    const r = this.root.getBoundingClientRect();
    const start = { x: e.clientX - r.left, y: e.clientY - r.top };
    this.pointer = { id: e.pointerId, start, zone, corner: cornerZone(start.x, start.y, r.width, r.height), kind: null, dir: 1 };
    this.velocity.reset();
    this.velocity.add(e.timeStamp, e.clientX, e.clientY);
  };

  private onPointerMove = (e: PointerEvent) => {
    const ptr = this.pointer;
    if (!ptr || e.pointerId !== ptr.id) return;
    const r = this.root.getBoundingClientRect();
    const now = { x: e.clientX - r.left, y: e.clientY - r.top };
    this.velocity.add(e.timeStamp, e.clientX, e.clientY);

    if (!ptr.kind) {
      const dx = now.x - ptr.start.x;
      const dy = now.y - ptr.start.y;
      if (Math.hypot(dx, dy) < SWIPE_SLOP_PX) return;
      const axis = classifyAxis(dx, dy);
      if (ptr.zone === 'x' && axis === 'x') return void (this.pointer = null); // owned by a carousel
      const dir = directionOf(axis, dx, dy);
      const target = this.index === 0 ? (dir === 1 ? this.openTarget : -1) : this.index + dir;
      if (target < 0 || target >= this.pageCount || this.busy) return void (this.pointer = null);

      const useCorner = ptr.corner && ptr.corner.dir === dir;
      ptr.kind = useCorner ? 'corner' : axis === 'x' ? 'swipe-x' : 'swipe-y';
      ptr.dir = dir;
      this.busy = true;
      this.suppressClick = true;
      try {
        this.root.setPointerCapture(e.pointerId);
      } catch {
        /* pointer already released or synthetic: the drag still works without capture */
      }
      this.beginTurn(dir, target, useCorner ? ptr.corner!.corner : 'bottom');
    }

    const t = this.turn;
    if (!t) return;
    t.p = cornerForDrag(ptr.kind, ptr.dir, ptr.start, now, t.w, t.h, t.corner);
    if (!this.frame) {
      this.frame = requestAnimationFrame(() => {
        this.frame = 0;
        this.render();
      });
    }
  };

  private onPointerUp = (e: PointerEvent) => {
    const ptr = this.pointer;
    if (!ptr || e.pointerId !== ptr.id) return;
    this.pointer = null;
    if (!ptr.kind) {
      // A tap on a corner turns the page.
      if (ptr.corner && !(e.target as Element).closest('a, button, input, textarea, select, label')) {
        if (ptr.corner.dir === 1) this.next('gesture');
        else this.prev('gesture');
      }
      return;
    }
    void this.release(ptr, false);
  };

  private onPointerCancel = (e: PointerEvent) => {
    const ptr = this.pointer;
    if (!ptr || e.pointerId !== ptr.id) return;
    this.pointer = null;
    if (ptr.kind) void this.release(ptr, true);
  };

  private onClickCapture = (e: MouseEvent) => {
    if (!this.suppressClick) return;
    this.suppressClick = false;
    e.preventDefault();
    e.stopPropagation();
  };

  private async release(ptr: PointerTrack, cancelled: boolean) {
    const t = this.turn;
    if (!t) return;
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    const turned = computeFold(constrainCorner(t.p, t.w, t.h, t.corner), t.w, t.h, t.corner)?.progress ?? 0;
    const progress = ptr.dir === 1 ? turned : 1 - turned;
    const v = this.velocity.velocity();
    const along = ptr.kind === 'swipe-y' ? v.y : v.x;
    const velocity = ptr.dir === 1 ? -along : along;
    const complete = !cancelled && shouldComplete(progress, velocity);

    const rest = cornerPoint(t.corner, t.w, t.h);
    const turnedPt = turnedPoint(t.corner, t.w, t.h);
    if (complete) {
      await this.animate(ptr.dir === 1 ? turnedPt : rest, Math.max(260, TURN_MS * (1 - progress)), easePage, true, 'gesture');
    } else {
      await this.animate(ptr.dir === 1 ? rest : turnedPt, Math.min(350, Math.max(200, 350 * (progress / 0.3))), easeSilk, false);
    }
    this.finishTurn(complete, 'gesture');
    this.busy = false;
    window.setTimeout(() => (this.suppressClick = false), 0);
    const q = this.queued;
    this.queued = null;
    q?.();
  }

  /* ---------------------------------------------------------------- page states */

  private applyStates() {
    this.pages.forEach((p, k) => {
      const d = Math.abs(k - this.index);
      this.setState(p, d === 0 ? 'current' : d === 1 ? 'neighbour' : 'hidden');
    });
  }

  private setState(page: HTMLElement, state: string) {
    page.dataset.state = state;
    page.inert = state !== 'current';
  }

  private enter(index: number, via: Via) {
    const page = this.pages[index];
    const firstVisit = !this.visited.has(index);
    this.visited.add(index);
    page.dispatchEvent(new CustomEvent<PageEnterDetail>('page:enter', { bubbles: true, detail: { index, firstVisit, via } }));
  }

  private leave(index: number, to: number) {
    this.pages[index].dispatchEvent(new CustomEvent('page:leave', { bubbles: true, detail: { index, to } }));
  }

  private layer(className: string) {
    const el = document.createElement('div');
    el.className = className;
    el.setAttribute('aria-hidden', 'true');
    this.root.append(el);
    return el;
  }

  private clamp(i: number) {
    return Math.max(0, Math.min(this.pageCount - 1, i));
  }
}

// Timer fallback: animation frames pause while the page is hidden.
const nextFrame = () =>
  new Promise<void>((r) => {
    requestAnimationFrame(() => r());
    window.setTimeout(r, 50);
  });
const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));
