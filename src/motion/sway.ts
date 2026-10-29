import { isReducedMotion } from './choreo';

/**
 * Hanging garlands, lamps and bells moving in a light wind (src/assets/stage/, npm run stage:assets).
 * Each piece is a transparent picture drawn onto its own canvas in thin horizontal slices, each
 * slice nudged sideways a little more than the one above it, so the top stays where it hangs and a
 * soft wave runs down to the tip (the tip trailing a moment behind), instead of a stiff swing. Slow
 * swells of wind lift and ease the movement; the lamp's two flames flicker. Nothing moves under
 * reduced motion, while the tab is hidden, or while the piece is not on screen.
 *
 * Markup: an element with data-sway (the piece's picture), data-amp (tip swing as a share of its
 * length), data-period (seconds), data-lag, data-phase and optionally data-flames (JSON: [x%, y%, r%]).
 */
interface Piece {
  host: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  img: HTMLImageElement;
  amp: number;
  period: number;
  lag: number;
  phase: number;
  flames: number[][];
  pad: number; // css px each side the canvas extends past the piece, for the swing
  w: number; // css px
  h: number;
  dpr: number;
  ready: boolean;
}

const SLICE = 5; // css px per slice
const swell = (t: number, phase: number) => 0.8 + 0.3 * Math.sin((t / 11) * Math.PI * 2 + phase) + 0.18 * Math.sin((t / 3.7) * Math.PI * 2 + phase * 1.7);

export function startSway(hosts: HTMLElement[], { active = () => true }: { active?: () => boolean } = {}) {
  const pieces: Piece[] = [];
  const reduced = isReducedMotion();
  let raf = 0;
  let running = false;

  const size = (p: Piece) => {
    const r = p.host.getBoundingClientRect();
    p.w = r.width;
    p.h = r.height;
    p.dpr = Math.min(2, window.devicePixelRatio || 1);
    p.pad = Math.ceil(p.amp * p.h * 1.6) + 4;
    p.canvas.style.left = `${-p.pad}px`;
    p.canvas.style.width = `${p.w + 2 * p.pad}px`;
    p.canvas.style.height = `${p.h}px`;
    p.canvas.width = Math.max(1, Math.round((p.w + 2 * p.pad) * p.dpr));
    p.canvas.height = Math.max(1, Math.round(p.h * p.dpr));
    p.ctx.imageSmoothingEnabled = true;
    p.ctx.imageSmoothingQuality = 'high';
  };

  function draw(p: Piece, t: number) {
    if (!p.ready || p.w < 2) return;
    const { ctx, canvas, img } = p;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const k = p.dpr;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const sw = swell(t, p.phase);
    const slices = Math.max(8, Math.round(p.h / SLICE));
    const dyPx = canvas.height / slices;
    const srcH = ih / slices;
    const A = p.amp * p.h * k; // tip swing in device px
    const offsetAt = (y: number) => {
      const wave = 0.7 * Math.sin(((t - p.lag * y) / p.period) * Math.PI * 2 + p.phase) + 0.3 * Math.sin(((t - p.lag * 0.6 * y) / (p.period * 0.43)) * Math.PI * 2 + p.phase * 1.7);
      return A * Math.pow(y, 1.4) * wave * sw;
    };
    for (let s = 0; s < slices; s++) {
      const y = (s + 0.5) / slices;
      ctx.drawImage(img, 0, s * srcH, iw, srcH + 0.6, p.pad * k + offsetAt(y), s * dyPx, p.w * k, dyPx + 0.6);
    }
    // Flickering flames (the lamp)
    if (p.flames.length) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      p.flames.forEach(([fx, fy, fr], n) => {
        const y = fy / 100;
        const cx = p.pad * k + (fx / 100) * p.w * k + offsetAt(y);
        const cy = y * canvas.height;
        const r = (fr / 100) * p.w * k * (1.9 + 0.35 * Math.sin(t * 9.1 + n * 2.3) * Math.sin(t * 5.3 + n));
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        const a = 0.34 + 0.16 * Math.sin(t * 7.7 + n * 1.9) + 0.08 * Math.sin(t * 13.1 + n);
        g.addColorStop(0, `rgba(255, 226, 150, ${a})`);
        g.addColorStop(0.45, `rgba(255, 190, 90, ${a * 0.35})`);
        g.addColorStop(1, 'rgba(255, 170, 70, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      });
      ctx.restore();
    }
  }

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    if (!active() || document.hidden) return;
    const t = now / 1000;
    for (const p of pieces) if (p.host.offsetParent !== null || p.host.getClientRects().length) draw(p, t);
  };

  for (const host of hosts) {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;top:0;pointer-events:none';
    host.appendChild(canvas);
    const img = new Image();
    img.decoding = 'async';
    const piece: Piece = {
      host,
      canvas,
      ctx: canvas.getContext('2d')!,
      img,
      amp: Number(host.dataset.amp ?? 0.03),
      period: Number(host.dataset.period ?? 4.5),
      lag: Number(host.dataset.lag ?? 1.2),
      phase: Number(host.dataset.phase ?? 0),
      flames: host.dataset.flames ? JSON.parse(host.dataset.flames) : [],
      pad: 0,
      w: 0,
      h: 0,
      dpr: 1,
      ready: false,
    };
    pieces.push(piece);
    img.onload = () => {
      piece.ready = true;
      size(piece);
      draw(piece, 0);
    };
    img.src = host.dataset.sway!;
  }

  const ro = new ResizeObserver(() => pieces.forEach((p) => p.ready && (size(p), draw(p, 0))));
  hosts.forEach((h) => ro.observe(h));

  return {
    start() {
      if (running || reduced) return;
      running = true;
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      pieces.forEach((p) => draw(p, 0));
    },
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      pieces.forEach((p) => p.canvas.remove());
    },
  };
}
