import { isReducedMotion } from './choreo';
import { dropPetals } from './petals';
import { playCelebration } from '../lib/accept-melody';

/**
 * The celebration when a guest accepts the invitation (Wedding Ceremony page): a shower of rose petals over
 * the whole page, the two cone crackers on the floor throwing golden sparks upward (a fountain of fine
 * sparks that rise, arc over and fall, brightest at the start and dying away), and music
 * (src/lib/accept-melody.ts: a soft violin and flute phrase of about a second and a half). Visuals are skipped under reduced motion; the music follows the sound switch.
 */
const DURATION_MS = 7600;

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  age: number;
  size: number;
  warm: number;
}

/** White-hot at birth, gold, then ember orange as a spark cools */
const tint = (age: number, warm: number) => {
  const t = Math.min(1, age * (0.9 + warm * 0.5));
  return [255, Math.round(226 - 96 * t), Math.round(150 - 120 * t)];
};

export function startCelebration(page: HTMLElement) {
  const reduced = isReducedMotion();
  const crackers = [...page.querySelectorAll<HTMLElement>('[data-cracker]')];
  const canvas = page.querySelector<HTMLCanvasElement>('[data-sparks]');
  const particles = page.querySelector<HTMLElement>('.page__particles');
  const stopMusic = playCelebration();
  let showers = 0;
  let raf = 0;
  let stopped = false;

  if (!reduced && particles) {
    dropPetals(particles, { count: 16, kinds: ['rose'], from: [0.02, 0.98], max: 44 });
    let n = 0;
    showers = window.setInterval(() => {
      dropPetals(particles, { count: 4, kinds: ['rose'], from: [0.02, 0.98], max: 44 });
      if (++n > 16) window.clearInterval(showers);
    }, 380);
  }

  if (!reduced && canvas && crackers.length) {
    page.classList.add('is-burning');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext('2d')!;
    const scale = (rect.height / 844) * dpr;
    const mouths = crackers.map((c) => {
      const r = c.getBoundingClientRect();
      return { x: (r.left + r.width / 2 - rect.left) * dpr, y: (r.top + r.height * 0.13 - rect.top) * dpr };
    });
    const sparks: Spark[] = [];
    const t0 = performance.now();
    let last = t0;
    const frame = (now: number) => {
      if (stopped) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now - t0;
      // How strongly the crackers burn: up quickly, steady, then dying away
      const power = t < 350 ? t / 350 : t < DURATION_MS - 2800 ? 1 : Math.max(0, (DURATION_MS - t) / 2800);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter';

      for (const m of mouths) {
        const flicker = 0.85 + 0.15 * Math.sin(now / 37 + m.x);
        // The glow at the mouth and on the floor round it
        const gr = 46 * scale * (0.7 + 0.5 * power) * flicker;
        const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, gr);
        g.addColorStop(0, `rgba(255, 238, 190, ${0.55 * power})`);
        g.addColorStop(0.4, `rgba(255, 180, 80, ${0.22 * power})`);
        g.addColorStop(1, 'rgba(255, 150, 50, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(m.x - gr, m.y - gr, gr * 2, gr * 2);
        const fr = 90 * scale * power;
        if (fr > 1) {
          const fg = ctx.createRadialGradient(m.x, m.y + 56 * scale, 0, m.x, m.y + 56 * scale, fr);
          fg.addColorStop(0, `rgba(255, 190, 90, ${0.2 * power})`);
          fg.addColorStop(1, 'rgba(255, 150, 50, 0)');
          ctx.fillStyle = fg;
          ctx.fillRect(m.x - fr, m.y + 56 * scale - fr, fr * 2, fr * 2);
        }
        // New sparks, thrown up in a narrow fan
        const born = Math.round(dt * 230 * power * (0.8 + 0.4 * Math.random()));
        for (let i = 0; i < born && sparks.length < 700; i++) {
          const a = -Math.PI / 2 + (Math.random() - 0.5) * 0.85;
          const v = (300 + Math.random() * 330) * scale;
          sparks.push({ x: m.x + (Math.random() - 0.5) * 6 * scale, y: m.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.7 + Math.random() * 1.1, age: 0, size: (1 + Math.random() * 2) * dpr, warm: Math.random() });
        }
      }

      ctx.globalCompositeOperation = 'source-over';
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.age += dt;
        if (s.age >= s.life) {
          sparks.splice(i, 1);
          continue;
        }
        s.vy += 640 * scale * dt;
        s.vx *= 0.995;
        const px = s.x, py = s.y;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        const k = s.age / s.life;
        const [r, gC, b] = tint(k, s.warm);
        const alpha = (1 - k) ** 1.2;
        ctx.strokeStyle = `rgba(${r}, ${gC}, ${b}, ${alpha})`;
        ctx.lineWidth = s.size * (1.25 - k * 0.6);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(px - s.vx * dt * 1.6, py - s.vy * dt * 1.6);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
        if (k < 0.5) {
          ctx.fillStyle = `rgba(255, 250, 225, ${alpha})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size * 0.62, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (t < DURATION_MS || sparks.length) raf = requestAnimationFrame(frame);
      else finish();
    };
    raf = requestAnimationFrame(frame);
  }

  const timer = window.setTimeout(() => finish(), DURATION_MS + 2200);
  function finish() {
    window.clearInterval(showers);
    window.clearTimeout(timer);
    cancelAnimationFrame(raf);
    page.classList.remove('is-burning');
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
  }

  return {
    stop() {
      stopped = true;
      stopMusic();
      finish();
    },
  };
}
