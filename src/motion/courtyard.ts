import { breeze, type Breeze } from './breeze';
import { dropPetals } from './petals';

/**
 * Life in the courtyard photograph (CourtyardScene) while its page shows: the garlands, bells,
 * banana leaf and palms stir in the breeze, and rose petals drift down, two at a time. `burst`
 * starts with a fuller shower over the middle of the page after `burstAfter` ms (first visits).
 * Nothing moves under reduced motion (breeze and petals both check it).
 */
export function courtyardLife(page: HTMLElement) {
  let wind: Breeze | null = null;
  let shower = 0;
  let burst = 0;
  const particles = () => page.querySelector<HTMLElement>('.page__particles')!;
  const fall = () => dropPetals(particles(), { count: 2, kinds: ['rose'], from: [0.04, 0.96] });
  return {
    start(withBurst: boolean, burstAfter = 1500) {
      // Still while the page is being turned, so the turn itself stays smooth
      wind ??= breeze([...page.querySelectorAll<HTMLElement>('[data-wind]')], { active: () => page.dataset.state === 'current' });
      if (shower) return;
      if (withBurst) burst = window.setTimeout(() => dropPetals(particles(), { count: 8, kinds: ['rose'], from: [0.22, 0.78] }), burstAfter);
      else fall();
      shower = window.setInterval(fall, 1500);
    },
    stop() {
      wind?.stop();
      wind = null;
      window.clearInterval(shower);
      window.clearTimeout(burst);
      shower = 0;
    },
  };
}
