import { isReducedMotion } from './choreo';

/**
 * Restrained petal drift (THEME §10.4): at most 12 on screen, transform and opacity only,
 * never under reduced motion. Real petal assets in src/assets/decor/ override the placeholders.
 */
const real = import.meta.glob<string>('../assets/decor/{rose,jasmine}-petal-*.{avif,webp,png}', { eager: true, query: '?url', import: 'default' });
const placeholder = import.meta.glob<string>('../assets/placeholders/{rose,jasmine}-petal-*.svg', { eager: true, query: '?url', import: 'default' });

const MAX_PETALS = 12;
let live = 0;

function sources(kind: 'rose' | 'jasmine'): string[] {
  const pick = (all: Record<string, string>) => Object.entries(all).filter(([p]) => p.includes(`/${kind}-petal-`)).map(([, url]) => url);
  const found = pick(real);
  return found.length ? found : pick(placeholder);
}

export interface PetalOptions {
  count?: number;
  kinds?: ('rose' | 'jasmine')[];
  /** Horizontal spawn band as fractions of the container width. */
  from?: [number, number];
  delay?: number;
}

export function dropPetals(container: HTMLElement, { count = 10, kinds = ['jasmine'], from = [0.2, 0.8], delay = 0 }: PetalOptions = {}) {
  if (isReducedMotion()) return;
  const width = container.clientWidth;
  const height = container.clientHeight;
  const urls = kinds.flatMap(sources);
  const n = Math.min(count, MAX_PETALS - live);

  for (let i = 0; i < n; i++) {
    const img = document.createElement('img');
    img.src = urls[i % urls.length];
    img.alt = '';
    img.className = 'petal';
    img.setAttribute('aria-hidden', 'true');
    const size = 14 + Math.random() * 12;
    img.style.width = `${size}px`;
    img.style.left = `${(from[0] + Math.random() * (from[1] - from[0])) * width}px`;
    container.append(img);
    live++;

    const amp = 20 + Math.random() * 20;
    const phase = Math.random() * Math.PI * 2;
    const spin = (90 + Math.random() * 180) * (Math.random() < 0.5 ? -1 : 1);
    const steps = 6;
    const frames: Keyframe[] = [];
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      frames.push({
        transform: `translate(${(amp * Math.sin(phase + t * Math.PI * 2.4)).toFixed(1)}px, ${(t * (height + 80)).toFixed(1)}px) rotate(${(spin * t).toFixed(1)}deg)`,
        opacity: t < 0.1 ? t * 10 : t > 0.85 ? (1 - t) / 0.15 : 1,
      });
    }
    const anim = img.animate(frames, { duration: 5000 + Math.random() * 3000, delay: delay + i * 140, easing: 'linear', fill: 'both' });
    anim.onfinish = anim.oncancel = () => {
      img.remove();
      live--;
    };
  }
}
