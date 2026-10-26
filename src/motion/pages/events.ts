import { defineChoreo, gsap, isReducedMotion } from '../choreo';

/**
 * Wedding Events Timeline (PRD §6.9, THEME M-11). The golden thread is laid through the
 * medallions as they sit on this screen, then draws down the page so it reaches each
 * celebration as its wreath blooms, its still-life slides in and its plate appears.
 * Turning back to an earlier page resets the thread so it draws again on the next visit.
 */
interface Pt {
  x: number;
  y: number;
}

function layoutThread(page: HTMLElement) {
  const svg = page.querySelector<SVGSVGElement>('.ev__thread');
  if (!svg) return;
  const base = page.getBoundingClientRect();
  if (!base.width) return;
  const centre = (el: Element): Pt => {
    const r = el.getBoundingClientRect();
    return { x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height / 2 };
  };
  const medallions = [...page.querySelectorAll('.ev__medallion')].map(centre);
  const sign = page.querySelector('.ev__sign');
  const knot = page.querySelector('.ev__knot');
  const start: Pt = sign ? { x: base.width / 2, y: sign.getBoundingClientRect().bottom - base.top - 6 } : { x: base.width / 2, y: -4 };
  const end: Pt = knot ? centre(knot) : { x: base.width / 2, y: base.height + 4 };
  const points = [start, ...medallions, end];

  let d = `M${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const k = (b.y - a.y) * 0.55;
    d += ` C${a.x.toFixed(1)} ${(a.y + k).toFixed(1)} ${b.x.toFixed(1)} ${(b.y - k).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  }
  svg.querySelectorAll('path').forEach((p) => p.setAttribute('d', d));

  // Brass bells hang where the thread crosses between two medallions.
  page.querySelectorAll<HTMLElement>('.ev__bell').forEach((bell, i) => {
    const a = medallions[i];
    const b = medallions[i + 1];
    if (!a || !b) return;
    bell.style.left = `${(a.x + b.x) / 2}px`;
    bell.style.top = `${(a.y + b.y) / 2}px`;
  });
}

function eventsChoreo(page: HTMLElement) {
  const all = (sel: string, root: ParentNode = page) => [...root.querySelectorAll<HTMLElement | SVGElement>(sel)];
  const items = all('.ev__item') as HTMLElement[];
  const threads = all('.ev__thread path');
  const header = all('.ev__sign, .ev__head');
  const bells = all('.ev__bell');
  const parts = items.map((item) => ({
    item,
    bloom: all('.ev__wreath, .ev__disc', item),
    still: all('.ev__still', item),
    plate: all('.ev__plate, .ev__hanging', item),
    dir: item.classList.contains('ev__item--left') ? 1 : -1,
  }));
  let tl: gsap.core.Timeline | null = null;
  let replay = false;

  const showAll = () => {
    gsap.set([...header, ...bells, ...parts.flatMap((p) => [...p.bloom, ...p.still, ...p.plate])], { opacity: 1, scale: 1, x: 0, y: 0 });
    gsap.set(threads, { drawSVG: '100%' });
  };
  const hideAll = () => {
    gsap.set(parts.flatMap((p) => [...p.bloom, ...p.still, ...p.plate]), { opacity: 0 });
    gsap.set(bells, { opacity: 0 });
    gsap.set(threads, { drawSVG: '0%' });
  };

  hideAll();
  new ResizeObserver(() => layoutThread(page)).observe(page.querySelector('.page__content')!);

  return {
    enter(animate: boolean) {
      layoutThread(page);
      tl?.kill();
      const play = (animate || replay) && !isReducedMotion();
      replay = false;
      if (!play) return showAll();
      hideAll();
      const per = 0.45;
      tl = gsap.timeline();
      tl.from(header, { opacity: 0, y: -8, duration: 0.5 }, 0).fromTo(threads, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.3 + per * (parts.length + 1), ease: 'none' }, 0.2);
      parts.forEach((p, i) => {
        const t = 0.35 + i * per;
        tl!
          .fromTo(p.bloom, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.6)' }, t)
          .fromTo(p.still, { opacity: 0, x: p.dir * 12 }, { opacity: 1, x: 0, duration: 0.4 }, t + 0.15)
          .fromTo(p.plate, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.35 }, t + 0.2);
      });
      bells.forEach((bell, i) => {
        tl!.fromTo(bell, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.6 + i * per).add(() => {
          (bell as HTMLElement).animate([{ rotate: '0deg' }, { rotate: '7deg' }, { rotate: '-4deg' }, { rotate: '0deg' }], { duration: 1000, easing: 'ease-in-out' });
        }, 0.7 + i * per);
      });
    },
    leave(step: number) {
      if (step < 0) replay = true;
    },
  };
}

defineChoreo('events', eventsChoreo);
defineChoreo('events-wedding', eventsChoreo);
