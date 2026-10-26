import { defineChoreo, gsap, isReducedMotion, timelineChoreo } from '../choreo';

/**
 * Venues and Directions (PRD §6.13): the garland arch settles, the card rises, and the map pin
 * drops with a single soft bounce. Tabs switch venues with a cross-fade and re-drop the pin;
 * arrow keys move between tabs (ARIA tabs pattern).
 */
function dropPin(panel: HTMLElement) {
  const pin = panel.querySelector('.vn__pin');
  if (!pin || isReducedMotion()) return;
  gsap.fromTo(pin, { y: -26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(2.2)' });
}

function initTabs(page: HTMLElement) {
  const tabs = [...page.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const panels = [...page.querySelectorAll<HTMLElement>('[role="tabpanel"]')];
  const select = (i: number, focus = false) => {
    tabs.forEach((t, k) => {
      t.setAttribute('aria-selected', String(k === i));
      t.tabIndex = k === i ? 0 : -1;
    });
    panels.forEach((p, k) => p.classList.toggle('is-active', k === i));
    if (focus) tabs[i].focus();
    tabs[i].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    dropPin(panels[i]);
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i));
    tab.addEventListener('keydown', (e) => {
      const keys: Record<string, number> = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
      if (!(e.key in keys)) return;
      e.preventDefault();
      e.stopPropagation();
      select((keys[e.key] + tabs.length) % tabs.length, true);
    });
  });
}

defineChoreo(
  'venues',
  timelineChoreo((tl, page) => {
    initTabs(page);
    const all = (sel: string) => [...page.querySelectorAll<HTMLElement>(sel)];
    tl.from(all('.vn__swag, .vn__marigold'), { opacity: 0, y: -12, duration: 0.6, stagger: 0.1 }, 0)
      .from(all('.vn__pillar'), { opacity: 0, y: 20, duration: 0.6, stagger: 0.08 }, 0.1)
      .from(all('.vn__card'), { opacity: 0, y: 12, duration: 0.6 }, 0.3)
      .from(all('.vn__panel.is-active .vn__photo'), { opacity: 0, scale: 0.97, duration: 0.5 }, 0.6)
      .fromTo(all('.vn__panel.is-active .vn__pin'), { y: -26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(2.2)' }, 0.95);
  }),
);
