import { isReducedMotion } from './choreo';
import { dropPetals } from './petals';

/**
 * Scratch-to-reveal gold foil (PRD §6.4, THEME M-20). The date text is always in the DOM
 * underneath, so screen readers read it before any scratching; "Reveal date" is the
 * single-tap alternative (WCAG 2.5.1). Revealed state persists for revisits.
 */
const STORE_KEY = 'rdv:date-revealed';
const BRUSH = 28;
const AUTO_CLEAR = 0.55;

const remember = () => {
  try {
    localStorage.setItem(STORE_KEY, '1');
  } catch {
    /* private mode */
  }
};
const remembered = () => {
  try {
    return localStorage.getItem(STORE_KEY) === '1';
  } catch {
    return false;
  }
};

function paintFoil(canvas: HTMLCanvasElement) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const { width, height } = canvas.getBoundingClientRect();
  if (!width || !height) return;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext('2d')!;
  ctx.globalCompositeOperation = 'source-over';
  const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  [
    [0, '#7a5718'],
    [0.22, '#c49a45'],
    [0.45, '#f4e3b5'],
    [0.62, '#c49a45'],
    [0.84, '#8a6420'],
    [1, '#c49a45'],
  ].forEach(([o, c]) => g.addColorStop(o as number, c as string));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Brushed-metal grain and a pulli (dot) pattern, so the foil reads as a real scratch card.
  for (let i = 0; i < canvas.width * canvas.height * 0.002; i++) {
    ctx.fillStyle = Math.random() < 0.5 ? 'rgba(255,248,220,0.18)' : 'rgba(90,60,20,0.12)';
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2 * dpr, 0.6 * dpr);
  }
  ctx.fillStyle = 'rgba(255, 246, 214, 0.45)';
  const step = 12 * dpr;
  for (let y = step / 2; y < canvas.height; y += step)
    for (let x = step / 2 + ((y / step) % 2) * (step / 2); x < canvas.width; x += step) {
      ctx.beginPath();
      ctx.arc(x, y, 0.9 * dpr, 0, Math.PI * 2);
      ctx.fill();
    }
}

function clearedRatio(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext('2d')!;
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let clear = 0;
  let total = 0;
  for (let i = 3; i < data.length; i += 4 * 16) {
    total++;
    if (data[i] < 32) clear++;
  }
  return total ? clear / total : 0;
}

export function initScratch(page: HTMLElement, onAllRevealed: (animate: boolean) => void) {
  const panels = [...page.querySelectorAll<HTMLElement>('[data-scratch]')];
  const button = page.querySelector<HTMLButtonElement>('[data-reveal-date]');
  let done = false;

  const finish = (animate: boolean) => {
    if (done) return;
    done = true;
    remember();
    page.classList.add('is-date-revealed');
    if (button) button.hidden = true;
    onAllRevealed(animate);
  };

  const reveal = (panel: HTMLElement, animate: boolean) => {
    if (panel.classList.contains('is-revealed')) return;
    panel.classList.add('is-revealed');
    if (!animate) panel.classList.add('no-anim');
    if (animate) dropPetals(page.querySelector('.page__particles')!, { count: 1, kinds: ['jasmine'], from: [0.3, 0.7] });
    if (panels.every((p) => p.classList.contains('is-revealed'))) finish(animate);
  };

  if (remembered() || isReducedMotion()) {
    panels.forEach((p) => reveal(p, false));
    return;
  }

  for (const panel of panels) {
    const canvas = panel.querySelector('canvas')!;
    let drawing = false;
    let last: { x: number; y: number } | null = null;
    let strokes = 0;
    const ready = () => paintFoil(canvas);
    new ResizeObserver(() => !panel.classList.contains('is-revealed') && ready()).observe(canvas);

    const point = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * canvas.width, y: ((e.clientY - r.top) / r.height) * canvas.height };
    };
    const scratch = (p: { x: number; y: number }) => {
      const ctx = canvas.getContext('2d')!;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = BRUSH * (canvas.width / canvas.getBoundingClientRect().width);
      ctx.beginPath();
      ctx.moveTo((last ?? p).x, (last ?? p).y);
      ctx.lineTo(p.x + 0.01, p.y);
      ctx.stroke();
      last = p;
      if (++strokes % 6 === 0 && clearedRatio(canvas) >= AUTO_CLEAR) {
        drawing = false;
        reveal(panel, true);
      }
    };

    panel.addEventListener('pointerdown', (e) => {
      if (panel.classList.contains('is-revealed')) return;
      drawing = true;
      last = null;
      try {
        panel.setPointerCapture(e.pointerId);
      } catch {
        /* scratching still works without capture */
      }
      scratch(point(e));
    });
    panel.addEventListener('pointermove', (e) => drawing && scratch(point(e)));
    const stop = () => {
      drawing = false;
      last = null;
      if (!panel.classList.contains('is-revealed') && clearedRatio(canvas) >= AUTO_CLEAR) reveal(panel, true);
    };
    panel.addEventListener('pointerup', stop);
    panel.addEventListener('pointercancel', stop);
  }

  button?.addEventListener('click', () => panels.forEach((p) => reveal(p, true)));
}
