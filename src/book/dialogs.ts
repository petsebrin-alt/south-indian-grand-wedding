/**
 * Full-screen overlays and sheets (PRD §6.7, §6.15, §8.5, §12.1): mounted at the app root,
 * focus trapped, Esc and the browser Back button close them, background is inert.
 */
interface OpenDialog {
  el: HTMLElement;
  trigger: HTMLElement | null;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

export class DialogManager {
  private stack: OpenDialog[] = [];
  private popResolvers: (() => void)[] = [];
  private expectingPop = 0;

  constructor(
    private background: HTMLElement[],
    private onChange: (open: boolean) => void,
  ) {
    window.addEventListener('popstate', this.onPop);
    document.addEventListener('keydown', this.onKey);
    document.addEventListener('click', (e) => {
      const top = this.stack[this.stack.length - 1];
      if (!top) return;
      const closer = (e.target as Element).closest('[data-dialog-close]');
      // A tap on a sheet's dimmed backdrop (outside its panel) closes it too.
      const backdrop = e.target === top.el && top.el.classList.contains('sheet');
      if (closer || backdrop) void this.close();
    });
  }

  get isOpen() {
    return this.stack.length > 0;
  }

  open(el: HTMLElement, trigger: HTMLElement | null = null) {
    this.stack.push({ el, trigger });
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add('is-open'));
    this.background.forEach((b) => (b.inert = true));
    history.pushState({ overlay: el.id }, '');
    const first = el.querySelector<HTMLElement>('[data-autofocus]') ?? el.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus({ preventScroll: true });
    this.onChange(true);
    this.enableSwipeDown(el);
    el.dispatchEvent(new CustomEvent('dialog:open'));
  }

  /** Full-screen overlays close with a downward swipe on their header (PRD §6.7). */
  private enableSwipeDown(el: HTMLElement) {
    const header = el.querySelector<HTMLElement>('.overlay__header');
    if (!header || header.dataset.swipeReady) return;
    header.dataset.swipeReady = '1';
    header.style.touchAction = 'none';
    let startY: number | null = null;
    let dy = 0;
    header.addEventListener('pointerdown', (e) => {
      if ((e.target as Element).closest('button')) return;
      startY = e.clientY;
      dy = 0;
    });
    header.addEventListener('pointermove', (e) => {
      if (startY === null) return;
      dy = Math.max(0, e.clientY - startY);
      el.style.transform = `translateY(${dy * 0.6}px)`;
    });
    const end = () => {
      if (startY === null) return;
      startY = null;
      el.style.transform = '';
      if (dy > 80 && this.stack[this.stack.length - 1]?.el === el) void this.close();
    };
    header.addEventListener('pointerup', end);
    header.addEventListener('pointercancel', end);
  }

  /** Close the top dialog. Resolves once the history entry has been popped. */
  close(): Promise<void> {
    if (!this.stack.length) return Promise.resolve();
    const trigger = this.hideTop();
    this.expectingPop++;
    return new Promise((resolve) => {
      this.popResolvers.push(() => {
        this.refocus(trigger);
        resolve();
      });
      history.back();
    });
  }

  private hideTop(): HTMLElement | null {
    const top = this.stack.pop()!;
    top.el.classList.remove('is-open');
    top.el.hidden = true;
    if (!this.stack.length) {
      this.background.forEach((b) => (b.inert = false));
      this.onChange(false);
    }
    top.trigger?.focus({ preventScroll: true });
    return top.trigger;
  }

  /** Browsers may reset focus while restoring a history entry, so return it to the trigger afterwards. */
  private refocus(trigger: HTMLElement | null) {
    if (!trigger) return;
    window.setTimeout(() => {
      if (!this.stack.length && document.activeElement !== trigger) trigger.focus({ preventScroll: true });
    }, 0);
  }

  private onPop = () => {
    if (this.expectingPop > 0) {
      this.expectingPop--;
      this.popResolvers.shift()?.();
      return;
    }
    if (this.stack.length) this.refocus(this.hideTop()); // Back button closes the overlay
  };

  private onKey = (e: KeyboardEvent) => {
    const top = this.stack[this.stack.length - 1];
    if (!top) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      void this.close();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = [...top.el.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => n.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
}
