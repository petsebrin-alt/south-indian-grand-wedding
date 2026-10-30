import { defineChoreo, gsap, isReducedMotion } from '../choreo';
import { createWall, setWall } from '../wishwall';
import { prepareWall, refreshServerWall, wallWishes } from '../../forms/wishes';

/**
 * Wishing Wall (PRD §6.15): the page turns to a closed golden double door. As soon as it is in view the
 * doors slide apart on the temple hall behind them (which settles back from a slight close-up), the heading
 * appears, the blessings are lowered one after another on their gold chains from the jasmine-garlanded rod, and
 * the card and "View all wishes" follow. The doors close again once the page has been left, so each visit
 * begins with them opening. Under reduced motion the doors are simply open.
 */
defineChoreo('wishes', (page) => {
  const q = <T extends HTMLElement>(sel: string) => page.querySelector<T>(sel)!;
  const doors = q('[data-doors]');
  const left = q('.ww__door--l');
  const right = q('.ww__door--r');
  const scene = q('.ww__bg');
  const content = [q('.ww__heading'), q('.ww__card'), q('.ww__all')];
  const wall = createWall(page);
  setWall(wall);
  let opening: gsap.core.Timeline | null = null;
  let closeLater: gsap.core.Tween | null = null;

  /** Doors shut, the hall a little closer, nothing on the wall yet */
  const shut = () => {
    opening?.kill();
    closeLater?.kill();
    wall.stop();
    gsap.set([left, right], { xPercent: 0 });
    gsap.set(scene, { scale: isReducedMotion() ? 1 : 1.07, transformOrigin: '50% 38%' });
    gsap.set(content, { opacity: isReducedMotion() ? 1 : 0, y: isReducedMotion() ? 0 : 14 });
    doors.classList.toggle('is-open', isReducedMotion());
    wall.set(wallWishes());
  };
  shut();

  return {
    enter() {
      shut();
      prepareWall();
      if (isReducedMotion()) {
        wall.lower();
        wall.start();
        void refreshServerWall().then((changed) => changed && wall.set(wallWishes()));
        return;
      }
      // Pick up the latest approved blessings while the doors begin to move (never holding them up for long)
      const fresh = Promise.race([refreshServerWall(), new Promise<boolean>((r) => setTimeout(() => r(false), 700))]).then((changed) => changed && wall.set(wallWishes()));
      opening = gsap
        .timeline()
        .to(left, { xPercent: -100, duration: 2.7, ease: 'power3.inOut' }, 0.5)
        .to(right, { xPercent: 100, duration: 2.7, ease: 'power3.inOut' }, 0.5)
        .to(scene, { scale: 1, duration: 3.6, ease: 'power2.out' }, 0.5)
        .add(() => doors.classList.add('is-open'), 3.25)
        .to(content[0], { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }, 1.5)
        .add(() => void fresh.then(() => wall.lower()), 1.65)
        .to(content.slice(1), { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out', stagger: 0.18 }, 2.35)
        .add(() => wall.start(), 3);
    },
    leave() {
      wall.stop();
      // Shut the doors once the page is out of sight (the page turn takes about a second)
      closeLater = gsap.delayedCall(1.6, () => {
        if (page.dataset.state !== 'current') shut();
      });
    },
  };
});
