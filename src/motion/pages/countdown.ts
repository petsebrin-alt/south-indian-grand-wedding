import { defineChoreo, isReducedMotion, timelineChoreo } from '../choreo';
import { courtyardLife } from '../courtyard';
import { dropPetals } from '../petals';

/**
 * Wedding Countdown (PRD §6.5, THEME M-06). Counts to the fixed IST instant regardless of the
 * guest's time zone; only changed digits roll; at the Muhurtham the countdown gives way to "Our
 * Auspicious Wedding Day Has Arrived!". The page: the courtyard settles, the elephant board rises
 * into place and the units appear one by one; the elephants' trunks swing in CSS; the courtyard
 * stirs in the breeze and rose petals drift down.
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

let life: ReturnType<typeof courtyardLife> | null = null;

defineChoreo(
  'countdown',
  timelineChoreo(
    (tl, page) => {
      initCountdown(page);
      const all = (sel: string) => [...page.querySelectorAll<HTMLElement | SVGElement>(sel)];
      tl.fromTo(all('[data-courtyard]'), { scale: 1.04 }, { scale: 1, duration: 2.4, ease: 'sine.out' }, 0)
        .from(all('.cd__board'), { y: 20, opacity: 0, duration: 1.1, ease: 'power2.out' }, 0.1)
        .from(all('.cd__title'), { opacity: 0, y: 8, duration: 0.7 }, 0.3)
        .from(all('.cd__unit'), { opacity: 0, y: 10, duration: 0.5, stagger: 0.12 }, 0.9)
        .from(all('.cd__meta'), { opacity: 0, y: 6, duration: 0.6 }, 1.5);
    },
    {
      enter: (page) => (life ??= courtyardLife(page)).start(false),
      leave: () => life?.stop(),
    },
  ),
);
