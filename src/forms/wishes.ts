import { apiAvailable, errorMessage, fetchWishes, newIdempotencyKey, submitWish } from '../lib/api';
import { getBotToken } from '../lib/bot-check';
import { LIMITS, validateWish } from '../../supabase/functions/_shared/validate.ts';
import type { PublicWish } from '../../supabase/functions/_shared/types.ts';
import { atLeast, clearError, liveCounter, setSending, showErrors, store } from './shared';

/**
 * Wishing Wall (PRD §6.15, AC-23, AC-24).
 * - The wall shows the latest approved blessings.
 * - "Write a Blessing" confirms only after the server stored the wish (it then awaits approval).
 * - "View All Wishes" lists approved blessings, newest first, 20 at a time.
 */
const DRAFT_KEY = 'rdv:wish-draft';

/* ------------------------------------------------------------------ the wall */

let lastWallFetch = -Infinity;

export async function refreshWall(page: HTMLElement, onFilled?: (cards: HTMLElement[]) => void) {
  if (!apiAvailable || performance.now() - lastWallFetch < 60_000) return;
  lastWallFetch = performance.now();
  const res = await fetchWishes(null, 5);
  if (!res.ok) {
    lastWallFetch = -Infinity; // try again next time the page is shown
    return;
  }
  const slots = [...page.querySelectorAll<HTMLElement>('[data-wall-slot]')];
  const empty = page.querySelector<HTMLElement>('[data-wall-empty]')!;
  const filled: HTMLElement[] = [];
  slots.forEach((slot, i) => {
    const wish = res.data.items[i];
    if (!wish) {
      slot.hidden = true;
      return;
    }
    slot.querySelector('.ww__msg')!.textContent = wish.message;
    slot.querySelector('.ww__name')!.textContent = `— ${wish.name}`;
    if (slot.hidden) filled.push(slot);
    slot.hidden = false;
  });
  empty.hidden = res.data.items.length > 0;
  if (filled.length) onFilled?.(filled);
}

/* ------------------------------------------------------------------ composer */

function initComposer() {
  const dialog = document.getElementById('wish-composer');
  if (!dialog) return;
  const form = dialog.querySelector<HTMLFormElement>('[data-wish-form]')!;
  const formState = form.querySelector<HTMLElement>('[data-state-form]')!;
  const doneState = form.querySelector<HTMLElement>('[data-state-done]')!;
  const status = form.querySelector<HTMLElement>('[data-form-status]')!;
  const submit = form.querySelector<HTMLButtonElement>('[data-submit]')!;
  const label = submit.querySelector('.btn-label')!;
  const name = form.elements.namedItem('name') as HTMLInputElement;
  const message = form.elements.namedItem('message') as HTMLTextAreaElement;
  const website = form.elements.namedItem('website') as HTMLInputElement;
  const updateCount = liveCounter(message, form.querySelector('[data-counter-for="message"]'), LIMITS.messageMax);
  let openedAt = 0;
  let key: string | null = null;
  let signature = '';

  dialog.addEventListener('dialog:open', () => {
    openedAt = performance.now();
    if (!doneState.hidden) {
      doneState.hidden = true;
      formState.hidden = false;
    }
    const draft = store.get<{ name: string; message: string }>(DRAFT_KEY);
    if (draft && !name.value && !message.value) {
      name.value = draft.name;
      message.value = draft.message;
      updateCount();
    }
  });

  form.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    if (target.name) clearError(form, target.name);
    store.set(DRAFT_KEY, { name: name.value, message: message.value });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submit.disabled) return;
    status.textContent = '';
    const valid = validateWish({ name: name.value, message: message.value });
    if (!valid.ok) return showErrors(form, valid.errors);

    setSending(submit, true);
    // A retry of the same words reuses the key, so the server can never store it twice (AC-27).
    const sig = `${valid.value.name}\n${valid.value.message}`;
    if (sig !== signature || !key) {
      key = newIdempotencyKey();
      signature = sig;
    }
    await atLeast(openedAt, LIMITS.minFillMs + 200);
    const botToken = await getBotToken(form.querySelector('[data-bot]')!);
    const res = await submitWish({ ...valid.value, website: website.value, elapsedMs: Math.round(performance.now() - openedAt), botToken }, key);
    setSending(submit, false);

    if (res.ok) {
      store.remove(DRAFT_KEY);
      form.reset();
      updateCount();
      key = null;
      signature = '';
      label.textContent = 'Send Blessing';
      formState.hidden = true;
      doneState.hidden = false;
      doneState.focus();
      return;
    }
    if (res.kind === 'validation' && res.fields) return showErrors(form, res.fields);
    status.textContent = errorMessage(res.kind, 'blessing');
    label.textContent = 'Try again';
  });
}

/* ------------------------------------------------------------------ all wishes */

function renderWish(w: PublicWish): HTMLLIElement {
  const li = document.createElement('li');
  li.className = 'wishes-all__card';
  const msg = document.createElement('p');
  msg.className = 'wishes-all__msg';
  msg.textContent = w.message; // guest text is always rendered as text, never HTML
  const by = document.createElement('p');
  by.className = 'wishes-all__name';
  by.textContent = `— ${w.name}`;
  li.append(msg, by);
  return li;
}

function initAllWishes() {
  const dialog = document.querySelector<HTMLElement>('[data-wishes-all]');
  if (!dialog) return;
  const list = dialog.querySelector<HTMLElement>('[data-wishes-list]')!;
  const count = dialog.querySelector<HTMLElement>('[data-wishes-count]')!;
  const empty = dialog.querySelector<HTMLElement>('[data-wishes-empty]')!;
  const error = dialog.querySelector<HTMLElement>('[data-wishes-error]')!;
  const more = dialog.querySelector<HTMLButtonElement>('[data-wishes-more]')!;
  let cursor: string | null = null;
  let loading = false;

  const load = async (reset: boolean) => {
    if (loading) return;
    loading = true;
    if (reset) {
      cursor = null;
      list.replaceChildren();
      count.textContent = 'Gathering blessings…';
    }
    error.textContent = '';
    more.disabled = true;
    const res = await fetchWishes(cursor, 20);
    loading = false;
    more.disabled = false;
    if (!res.ok) {
      error.textContent = 'We could not load the blessings. Please try again.';
      more.hidden = false;
      more.textContent = 'Try again';
      if (reset) count.textContent = '';
      return;
    }
    res.data.items.forEach((w) => list.append(renderWish(w)));
    cursor = res.data.nextCursor;
    count.textContent = `${res.data.total} ${res.data.total === 1 ? 'blessing' : 'blessings'}`;
    empty.hidden = res.data.total > 0;
    more.hidden = !cursor;
    more.textContent = 'Load more blessings';
  };

  dialog.addEventListener('dialog:open', () => void load(true));
  more.addEventListener('click', () => void load(list.children.length === 0));
}

export function initWishes() {
  initComposer();
  initAllWishes();
}
