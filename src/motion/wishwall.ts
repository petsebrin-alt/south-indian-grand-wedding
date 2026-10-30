import { gsap, isReducedMotion } from './choreo';
import type { PublicWish } from '../../supabase/functions/_shared/types.ts';

/**
 * The Wishing Wall's hanging boards (src/components/pages/Wishes.astro). Each blessing hangs on its own gold
 * chain from the brass rod: the board is lowered on the chain, swings a little and settles; the others make
 * room (each slides on to the next place along its chain). The newest blessing hangs top-left, the next top-right,
 * then the two lower ones; older ones go up out of sight and stay in "View all wishes". Boards sway gently
 * in the breeze while the page shows. Positions are in the page's design units (a pixel of a 430 × 932 phone).
 */
export interface WallWish extends PublicWish {
  /** written by this guest on this device (shows "yours", and hangs even before the family has approved it) */
  mine?: boolean;
  /** the invitation to be the first, when nothing hangs yet */
  placeholder?: boolean;
  /** an empty board waiting for a blessing (the wall always holds a full set of boards) */
  blank?: boolean;
}

/** [left, chain length]: where the 1st, 2nd, 3rd and 4th newest hang. The lower pair's chains run clear of the bells above. */
const SLOTS: [number, number][] = [
  [5, 24],
  [321, 50],
  [38, 270],
  [288, 296],
];
export const WALL_SIZE = SLOTS.length;

interface Board {
  el: HTMLElement;
  swing: HTMLElement;
  wish: WallWish;
  ambient?: gsap.core.Tween;
  impact?: gsap.core.Tween;
}

const place = (el: HTMLElement, slot: number) => {
  el.style.setProperty('--x', String(SLOTS[slot][0]));
  el.style.setProperty('--chain', String(SLOTS[slot][1]));
  el.style.zIndex = String(WALL_SIZE - slot);
};

export interface Wall {
  /** Show these blessings (newest first) without any movement; the boards wait above the rod until `lower()`. */
  set(wishes: WallWish[]): void;
  /** Lower every board on its chain, one after another. */
  lower(onTouch?: (n: number) => void): void;
  /** A new blessing arrives: the others make room and it is lowered into the first place. Resolves when it has settled. */
  hang(wish: WallWish, onTouch?: () => void): Promise<void>;
  /** Boards currently hanging, newest first */
  ids(): string[];
  start(): void;
  stop(): void;
}

export function createWall(page: HTMLElement): Wall {
  const list = page.querySelector<HTMLElement>('[data-wall]')!;
  const tpl = page.querySelector<HTMLTemplateElement>('template[data-board-template]')!;
  let boards: Board[] = [];
  let running = false;

  const make = (wish: WallWish, slot: number): Board => {
    const el = (tpl.content.firstElementChild!.cloneNode(true) as HTMLElement);
    const swing = el.querySelector<HTMLElement>('.ww__swing')!;
    const pendant = el.querySelector<HTMLButtonElement>('.ww__pendant')!;
    // Guest text is always set as text, never as HTML
    el.querySelector('.ww__msg')!.textContent = wish.message;
    el.querySelector('.ww__by')!.textContent = wish.placeholder ? '' : `— ${wish.name}`;
    el.classList.toggle('is-mine', !!wish.mine);
    el.classList.toggle('is-blank', !!wish.blank);
    el.dataset.wishId = wish.id;
    if (wish.blank) {
      // an empty board: decoration until a blessing hangs in its place
      el.setAttribute('aria-hidden', 'true');
      pendant.tabIndex = -1;
      pendant.removeAttribute('data-open-dialog');
      pendant.removeAttribute('aria-haspopup');
    } else if (wish.placeholder) {
      pendant.removeAttribute('data-open-dialog');
      pendant.removeAttribute('aria-haspopup');
      pendant.setAttribute('aria-label', 'Be the first to bless the couple. Write your blessing below.');
      pendant.addEventListener('click', () => page.querySelector<HTMLElement>('.ww__field--name input')?.focus());
    } else {
      pendant.setAttribute('aria-label', `Blessing from ${wish.name}: ${wish.message.slice(0, 80)}${wish.message.length > 80 ? '…' : ''}. Open all blessings.`);
      pendant.addEventListener('click', () => document.dispatchEvent(new CustomEvent('wishes:focus', { detail: wish.id })));
    }
    place(el, slot);
    list.append(el);
    return { el, swing, wish };
  };

  const tilt = (_: Board, i: number) => (i % 2 ? 1 : -1);

  const startAmbient = (b: Board, i: number, delay = 0) => {
    b.ambient?.kill();
    if (isReducedMotion()) return;
    const amp = 0.55 + (i % 3) * 0.12;
    b.ambient = gsap.fromTo(
      b.swing,
      { rotation: -amp * tilt(b, i) },
      { rotation: amp * tilt(b, i), duration: 3.4 + i * 0.55, ease: 'sine.inOut', yoyo: true, repeat: -1, delay, transformOrigin: '50% 0', overwrite: false },
    );
    if (!running) b.ambient.pause();
  };

  /** Lower one board on its chain from above the rod; calls `onTouch` as it comes to rest and swings. */
  const lowerOne = (b: Board, i: number, delay: number, onTouch?: () => void) => {
    b.ambient?.kill();
    b.impact?.kill();
    gsap.killTweensOf(b.el);
    if (isReducedMotion()) {
      gsap.set(b.el, { yPercent: 0, opacity: 1 });
      gsap.set(b.swing, { rotation: 0 });
      return;
    }
    gsap.set(b.swing, { rotation: 0 });
    gsap.fromTo(
      b.el,
      { yPercent: -108 },
      {
        yPercent: 0,
        duration: 1.35,
        delay,
        ease: 'power2.out',
        onComplete: () => {
          onTouch?.();
          const kick = tilt(b, i) * (3.2 + (i % 2) * 0.8);
          b.impact = gsap.fromTo(b.swing, { rotation: kick }, { rotation: 0, duration: 3.2, ease: 'elastic.out(1, 0.28)', transformOrigin: '50% 0', onComplete: () => startAmbient(b, i) });
        },
      },
    );
  };

  return {
    set(wishes) {
      boards.forEach((b) => {
        b.ambient?.kill();
        b.impact?.kill();
        gsap.killTweensOf([b.el, b.swing]);
        b.el.remove();
      });
      boards = wishes.slice(0, WALL_SIZE).map((w, i) => make(w, i));
      // Waiting above the rod until lowered
      boards.forEach((b) => gsap.set(b.el, { yPercent: isReducedMotion() ? 0 : -108 }));
    },

    lower(onTouch) {
      boards.forEach((b, i) => lowerOne(b, i, 0.1 + i * 0.28, () => onTouch?.(i)));
    },

    hang(wish, onTouch) {
      return new Promise<void>((resolve) => {
        // An invitation to be the first goes up out of sight when a real blessing comes
        boards
          .filter((b) => b.wish.placeholder)
          .forEach((b) => {
            b.ambient?.kill();
            gsap.to(b.el, { yPercent: -110, duration: 0.7, ease: 'power2.in', onComplete: () => b.el.remove() });
          });
        boards = boards.filter((b) => !b.wish.placeholder);
        // The others move on a place (the oldest goes up out of sight)
        boards.forEach((b, i) => {
          const next = i + 1;
          b.ambient?.kill();
          b.impact?.kill();
          if (next >= WALL_SIZE) {
            gsap.to(b.el, { yPercent: -110, duration: 0.9, ease: 'power2.in', onComplete: () => b.el.remove() });
            return;
          }
          b.el.style.zIndex = String(WALL_SIZE - next);
          if (isReducedMotion()) {
            place(b.el, next);
            return;
          }
          gsap.to(b.el, { '--x': SLOTS[next][0], '--chain': SLOTS[next][1], duration: 1.15, ease: 'power2.inOut', delay: 0.05 * i });
          gsap.fromTo(b.swing, { rotation: tilt(b, i) * 2.4 }, { rotation: 0, duration: 2.6, ease: 'elastic.out(1, 0.3)', delay: 0.5, transformOrigin: '50% 0', onComplete: () => startAmbient(b, next) });
        });
        boards = boards.filter((_, i) => i + 1 < WALL_SIZE);
        const fresh = make(wish, 0);
        gsap.set(fresh.el, { yPercent: isReducedMotion() ? 0 : -108 });
        boards.unshift(fresh);
        lowerOne(fresh, 0, isReducedMotion() ? 0 : 0.35, () => onTouch?.());
        window.setTimeout(resolve, isReducedMotion() ? 0 : 1900);
      });
    },

    ids: () => boards.map((b) => b.wish.id),

    start() {
      running = true;
      boards.forEach((b) => b.ambient?.resume());
    },

    stop() {
      running = false;
      boards.forEach((b) => b.ambient?.pause());
    },
  };
}

/** The wall of the page that is set up, so the guest form can hang a new blessing on it. */
let current: Wall | null = null;
export const setWall = (w: Wall | null) => (current = w);
export const getWall = () => current;
