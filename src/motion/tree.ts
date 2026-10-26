import { gsap, isReducedMotion } from './choreo';

/**
 * Flowering-branch reveal for the family-tree overlays (PRD §6.7, THEME M-09): the trunk grows
 * upward, twigs reach out, and each relative blossoms as the branch arrives.
 */
export function initFamilyTrees() {
  for (const overlay of document.querySelectorAll<HTMLElement>('[data-tree]')) {
    let tl: gsap.core.Timeline | null = null;
    overlay.addEventListener('dialog:open', () => {
      if (!tl) {
        const all = (sel: string) => [...overlay.querySelectorAll<HTMLElement | SVGElement>(sel)];
        // Bottom-up order so relatives blossom as the branch grows towards them
        const nodes = all('.tree__node').sort((a, b) => parseFloat((b as HTMLElement).style.top) - parseFloat((a as HTMLElement).style.top));
        tl = gsap
          .timeline()
          .from(all('.tree__trunk'), { drawSVG: '0%', duration: 1.2, ease: 'power1.inOut' }, 0)
          .from(all('.tree__twig'), { drawSVG: '0%', duration: 0.5, stagger: 0.15, ease: 'power1.out' }, 0.35)
          .from(all('.tree__leaf'), { scale: 0, transformOrigin: '50% 50%', duration: 0.4, stagger: 0.1, ease: 'back.out(2)' }, 0.3)
          .from(nodes, { scale: 0.3, opacity: 0, duration: 0.4, stagger: 0.12, ease: 'back.out(1.8)' }, 0.25)
          .from(all('.tree__chip'), { opacity: 0, y: 6, duration: 0.4, stagger: 0.06 }, 1.1);
      }
      if (isReducedMotion()) tl.progress(1);
      else tl.restart();
    });
  }
}
