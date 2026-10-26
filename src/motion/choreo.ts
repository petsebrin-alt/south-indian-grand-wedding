import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';

gsap.registerPlugin(DrawSVGPlugin);
gsap.defaults({ ease: 'power3.out', duration: 0.6 });

export { gsap };

/**
 * Per-page choreography (PRD §8.2). A page's timeline is built paused at start-up, so its
 * hidden starting states already apply while the page is being uncovered by a turn.
 * First visit → plays; revisit or reduced motion → jumps straight to the finished state.
 */
export interface Choreo {
  enter(animate: boolean): void;
  /** `step` is the signed page distance travelled (negative = turning back). */
  leave?(step: number): void;
}

type Factory = (page: HTMLElement) => Choreo;
const factories = new Map<string, Factory>();

export function defineChoreo(pageId: string, factory: Factory) {
  factories.set(pageId, factory);
}

export function timelineChoreo(
  build: (tl: gsap.core.Timeline, page: HTMLElement) => void,
  hooks: { enter?: (page: HTMLElement, animate: boolean) => void; leave?: (page: HTMLElement) => void } = {},
): Factory {
  return (page) => {
    const tl = gsap.timeline({ paused: true });
    build(tl, page);
    return {
      enter(animate) {
        if (animate) tl.restart();
        else tl.progress(1).pause();
        hooks.enter?.(page, animate);
      },
      leave() {
        hooks.leave?.(page);
      },
    };
  };
}

export function mountChoreos(pages: HTMLElement[]): Map<HTMLElement, Choreo> {
  const out = new Map<HTMLElement, Choreo>();
  for (const page of pages) {
    const factory = factories.get(page.id);
    if (!factory) continue;
    page.dataset.choreo = '';
    out.set(page, factory(page));
  }
  return out;
}

export const isReducedMotion = () => document.documentElement.classList.contains('reduce-motion');
