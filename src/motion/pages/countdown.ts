import { defineChoreo, isReducedMotion, timelineChoreo } from '../choreo';
import { dropPetals } from '../petals';

/**
 * Wedding Countdown (PRD §6.5, THEME M-06). Counts to the fixed IST instant regardless of the
 * guest's time zone; only changed digits roll; the bells nod when the minute changes; at the
 * Muhurtham the panels give way to "Our Auspicious Wedding Day Has Arrived!".
 */
const ROLL = { duration: 350, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };

function setDigits(cell: HTMLElement, text: string, animate: boolean) {
  if (!cell.querySelector('.cd__slot')) cell.textContent = '';
  while (cell.children.length < text.length) {
    const slot = document.createElement('span');
    slot.className = 'cd__slot';
    slot.innerHTML = '<span class="cd__digit"></span>';
    cell.prepend(slot);
  }
  while (cell.children.length > text.length) cell.firstElementChild!.remove();

  [...text].forEach((ch, i) => {
    const slot = cell.children[i] as HTMLElement;
    const current = slot.lastElementChild as HTMLElement;
    if (current.textContent === ch) return;
    if (!animate || !current.textContent) {
      current.textContent = ch;
      return;
    }
    const next = document.createElement('span');
    next.className = 'cd__digit';
    next.textContent = ch;
    slot.append(next);
    current.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-60%)', opacity: 0 }], ROLL).onfinish = () => current.remove();
    next.animate([{ transform: 'translateY(60%)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], ROLL);
  });
}

function initCountdown(page: HTMLElement) {
  const root = page.querySelector<HTMLElement>('[data-countdown]')!;
  const target = Date.parse(root.dataset.countdown!);
  const cells = Object.fromEntries([...root.querySelectorAll<HTMLElement>('[data-unit]')].map((el) => [el.dataset.unit!, el]));
  const summary = page.querySelector<HTMLElement>('[data-countdown-summary]')!;
  const arrived = page.querySelector<HTMLElement>('[data-arrived]')!;
  const local = page.querySelector<HTMLElement>('[data-localtime]');
  const bells = [...page.querySelectorAll<HTMLElement>('.cd__bell')];
  let lastMinute = -1;
  let timer = 0;
  let celebrated = false;

  if (local && new Date(target).getTimezoneOffset() !== -330) {
    const fmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
    local.textContent = `That's ${fmt.format(target)} in your time zone`;
    local.hidden = false;
  }

  const visible = () => page.dataset.state === 'current' || page.dataset.state === 'flow';

  const tick = () => {
    const ms = target - Date.now();
    if (ms <= 0) {
      root.hidden = true;
      arrived.hidden = false;
      summary.textContent = arrived.textContent ?? '';
      if (!celebrated && visible()) {
        celebrated = true;
        dropPetals(page.querySelector('.page__particles')!, { count: 12, kinds: ['jasmine', 'rose'] });
      }
      return;
    }
    const s = Math.floor(ms / 1000);
    const parts = { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
    const animate = visible() && !isReducedMotion();
    for (const [key, value] of Object.entries(parts)) setDigits(cells[key], String(value).padStart(2, '0'), animate);
    if (parts.minutes !== lastMinute) {
      if (lastMinute !== -1 && animate)
        bells.forEach((b, i) => b.animate([{ rotate: '0deg' }, { rotate: '6deg' }, { rotate: '-3deg' }, { rotate: '0deg' }], { duration: 1100, delay: i * 90, easing: 'ease-in-out' }));
      lastMinute = parts.minutes;
      summary.textContent = `${parts.days} days, ${parts.hours} hours and ${parts.minutes} minutes until the Muhurtham`;
    }
    timer = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
  };

  document.addEventListener('visibilitychange', () => {
    clearTimeout(timer);
    if (!document.hidden) tick();
  });
  tick();
}

defineChoreo(
  'countdown',
  timelineChoreo((tl, page) => {
    initCountdown(page);
    const all = (sel: string) => [...page.querySelectorAll<HTMLElement | SVGElement>(sel)];
    tl.from(all('.cd__rule .draw'), { drawSVG: '0%', duration: 0.8, ease: 'power2.inOut' }, 0.1)
      .from(all('.cd__title'), { opacity: 0, y: 8, duration: 0.6 }, 0.2)
      .from(all('.cd__niche'), { opacity: 0, y: 14, duration: 0.6, stagger: 0.09 }, 0.45)
      .from(all('.cd__bell'), { opacity: 0, y: -12, duration: 0.6, stagger: 0.09 }, 0.6)
      .from(all('.cd__strand'), { opacity: 0, y: -10, duration: 0.6, stagger: 0.1 }, 0.8)
      .from(all('.cd__meta, .cd__lamp'), { opacity: 0, y: 8, duration: 0.6, stagger: 0.1 }, 1.0);
  }),
);
