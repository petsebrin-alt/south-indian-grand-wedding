import { apiAvailable, errorMessage, fetchWishes, newIdempotencyKey, submitWish } from '../lib/api';
import { getBotToken } from '../lib/bot-check';
import { prefetchDing, ringDing } from '../lib/bell';
import { LIMITS, validateWish } from '../../supabase/functions/_shared/validate.ts';
import type { PublicWish } from '../../supabase/functions/_shared/types.ts';
import { getWall, WALL_SIZE, type WallWish } from '../motion/wishwall';
import { atLeast, clearError, liveCounter, setSending, showErrors, store } from './shared';

/**
 * Wishing Wall (PRD §6.15, AC-23, AC-24).
 * - The wall shows the latest approved blessings, and this guest's own as soon as they have written them.
 * - "Send Your Wish" confirms only after the server stored the wish (it then awaits approval), and hangs
 *   the new board on the wall with the temple bell's ding.
 * - "View all wishes" lists approved blessings, newest first, 20 at a time, with each guest's name and
 *   the date and time they wrote it.
 * A static preview build has no server: there the wall keeps the guest's own blessings on this device only
 * (so the page can be tried), and a production build without a server says the wall opens soon.
 */
const DRAFT_KEY = 'rdv:wish-draft';
const MINE_KEY = 'rdv:wishes-mine';

type Mine = PublicWish & { pending?: boolean };

const wishesRoot = () => document.querySelector<HTMLElement>('[data-wishes]');
/** A preview build with no API: blessings live in this browser only. */
export const localMode = () => !apiAvailable && wishesRoot()?.dataset.siteMode === 'preview';

const readMine = () => store.get<Mine[]>(MINE_KEY) ?? [];
const addMine = (w: Mine) => store.set(MINE_KEY, [w, ...readMine().filter((m) => m.id !== w.id)].slice(0, 60));

/* ------------------------------------------------------------------ the wall */

let serverWall: PublicWish[] = [];
let lastWallFetch = -Infinity;

/** Fetch the latest approved blessings (at most once a minute). Returns true when the list changed. */
export async function refreshServerWall(): Promise<boolean> {
  if (!apiAvailable || performance.now() - lastWallFetch < 60_000) return false;
  lastWallFetch = performance.now();
  const res = await fetchWishes(null, 8);
  if (!res.ok) {
    lastWallFetch = -Infinity; // try again next time the page is shown
    return false;
  }
  const changed = res.data.items.map((w) => w.id).join() !== serverWall.map((w) => w.id).join();
  serverWall = res.data.items;
  return changed;
}

const byNewest = (a: PublicWish, b: PublicWish) => b.created_at.localeCompare(a.created_at);

/** Past guests' blessings from the data (`wishingWall.samples`), newest first: they fill the wall until real ones take their places. */
function sampleWishes(): PublicWish[] {
  const raw = wishesRoot()?.querySelector('script[data-wall-samples]')?.textContent;
  if (!raw) return [];
  try {
    return (JSON.parse(raw) as { name: string; message: string; writtenAt: string }[])
      .map((w, i) => ({ id: `sample-${i}`, name: w.name, message: w.message, created_at: w.writtenAt }))
      .sort(byNewest);
  } catch {
    return [];
  }
}

/** What hangs on the wall now, newest first: the guest's own blessings and the approved ones, each once, then past guests' blessings. */
export function wallWishes(): WallWish[] {
  const mine = readMine();
  const mineIds = new Set(mine.map((m) => m.id));
  const seen = new Set<string>();
  const all: WallWish[] = [...mine.map((m) => ({ ...m, mine: true })), ...serverWall.map((w) => ({ ...w, mine: mineIds.has(w.id) }))]
    .sort(byNewest)
    .filter((w) => (seen.has(w.id) ? false : (seen.add(w.id), true)));
  // The wall always holds a full set of four boards: real blessings first, then past guests' blessings in their
  // places, and empty boards only if there are none of those either
  const blanks = (n: number): WallWish[] => Array.from({ length: n }, (_, i) => ({ id: `blank-${i}`, name: '', message: '', created_at: '', blank: true }));
  const real = all.slice(0, WALL_SIZE);
  const past = sampleWishes().slice(0, WALL_SIZE - real.length);
  if (real.length + past.length) return [...real, ...past, ...blanks(WALL_SIZE - real.length - past.length)];
  const names = wishesRoot()?.querySelector('.ww__t3')?.textContent?.replace(/\s+/g, ' ').trim() ?? 'the couple';
  return [{ id: 'placeholder', name: '', message: `Be the first to bless ${names}`, created_at: '', placeholder: true }, ...blanks(WALL_SIZE - 1)];
}

/** Keep the ding ready for the first blessing (no sound until the guest writes one). */
export const prepareWall = () => prefetchDing();

/* ------------------------------------------------------------------ the card */

function initComposer() {
  const root = wishesRoot();
  const form = root?.querySelector<HTMLFormElement>('[data-wish-form]');
  if (!root || !form) return;
  const status = form.querySelector<HTMLElement>('[data-form-status]')!;
  const ok = form.querySelector<HTMLElement>('[data-form-ok]')!;
  const submit = form.querySelector<HTMLButtonElement>('[data-submit]')!;
  const label = submit.querySelector('.btn-label')!;
  const name = form.elements.namedItem('name') as HTMLInputElement;
  const message = form.elements.namedItem('message') as HTMLTextAreaElement;
  const website = form.elements.namedItem('website') as HTMLInputElement;
  const live = root.querySelector<HTMLElement>('[data-wall-live]');
  const updateCount = liveCounter(message, form.querySelector('[data-counter-for="message"]'), LIMITS.messageMax);
  const local = localMode();

  if (local) root.querySelector<HTMLElement>('[data-wall-local]')!.hidden = false;
  if (!apiAvailable && !local) {
    // A production build with no server: say so rather than take words that could never be kept
    status.textContent = errorMessage('unavailable', 'blessing');
    const all = root.querySelector<HTMLElement>('.ww__all');
    all?.setAttribute('aria-disabled', 'true');
    if (all) all.dataset.disabledMessage = errorMessage('unavailable', 'blessing');
    form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement>('input, textarea, button').forEach((c) => (c.disabled = true));
    return;
  }

  let startedAt = 0; // when the guest started writing (the server turns away forms filled in implausibly fast)
  let key: string | null = null;
  let signature = '';

  const draft = store.get<{ name: string; message: string }>(DRAFT_KEY);
  if (draft) {
    name.value = draft.name;
    message.value = draft.message;
    updateCount();
  }

  form.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    startedAt ||= performance.now();
    if (target.name) clearError(form, target.name);
    status.textContent = '';
    ok.textContent = '';
    store.set(DRAFT_KEY, { name: name.value, message: message.value });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submit.disabled) return;
    status.textContent = '';
    ok.textContent = '';
    const valid = validateWish({ name: name.value, message: message.value });
    if (!valid.ok) return showErrors(form, valid.errors);

    setSending(submit, true);
    let wish: Mine;
    if (local) {
      wish = { id: `local-${Date.now().toString(36)}`, name: valid.value.name, message: valid.value.message, created_at: new Date().toISOString() };
      await new Promise((r) => setTimeout(r, 450));
    } else {
      // A retry of the same words reuses the key, so the server can never store it twice (AC-27).
      const sig = `${valid.value.name}\n${valid.value.message}`;
      if (sig !== signature || !key) {
        key = newIdempotencyKey();
        signature = sig;
      }
      startedAt ||= performance.now();
      await atLeast(startedAt, LIMITS.minFillMs + 200);
      const botToken = await getBotToken(form.querySelector('[data-bot]')!);
      const res = await submitWish({ ...valid.value, website: website.value, elapsedMs: Math.round(performance.now() - startedAt), botToken }, key);
      if (!res.ok) {
        setSending(submit, false);
        if (res.kind === 'validation' && res.fields) return showErrors(form, res.fields);
        status.textContent = errorMessage(res.kind, 'blessing');
        label.textContent = 'Try again';
        return;
      }
      wish = { id: res.data.id, name: valid.value.name, message: valid.value.message, created_at: new Date().toISOString(), pending: true };
      key = null;
      signature = '';
    }
    setSending(submit, false);
    store.remove(DRAFT_KEY);
    addMine(wish);
    form.reset();
    updateCount();
    startedAt = 0;
    label.textContent = 'Send Your Wish';
    ok.textContent = local
      ? 'Thank you! Your blessing hangs on the wall (kept on this device).'
      : 'Thank you! Your blessing hangs on the wall now, and joins everyone’s once the family has seen it.';
    if (live) live.textContent = 'Your blessing is hanging on the wall.';
    const wall = getWall();
    if (wall) await wall.hang({ ...wish, mine: true }, () => void ringDing());
    else void ringDing();
  });
}

/* ------------------------------------------------------------------ all wishes */

const whenFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
const fmtWhen = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : whenFormat.format(d).replace(',', ' ·').replace(/\b(am|pm)\b/i, (m) => m.toLowerCase());
};

function renderWish(w: Mine): HTMLLIElement {
  const li = document.createElement('li');
  li.className = 'wishes-all__card';
  li.dataset.wishId = w.id;
  const msg = document.createElement('p');
  msg.className = 'wishes-all__msg';
  msg.textContent = w.message; // guest text is always rendered as text, never HTML
  const by = document.createElement('p');
  by.className = 'wishes-all__by';
  const who = document.createElement('span');
  who.className = 'wishes-all__name';
  who.textContent = `— ${w.name}`;
  by.append(who);
  const when = fmtWhen(w.created_at);
  if (when) {
    const time = document.createElement('time');
    time.className = 'wishes-all__when';
    time.dateTime = w.created_at;
    time.textContent = when;
    by.append(time);
  }
  li.append(msg, by);
  if (w.pending) {
    const note = document.createElement('p');
    note.className = 'wishes-all__note';
    note.textContent = 'Yours · will show for everyone once the family has seen it';
    li.append(note);
  }
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
  let focusId: string | null = null;
  document.addEventListener('wishes:focus', (e) => (focusId = (e as CustomEvent<string>).detail));

  const showFocus = () => {
    const id = focusId;
    focusId = null;
    if (!id) return;
    const card = [...list.children].find((c) => (c as HTMLElement).dataset.wishId === id) as HTMLElement | undefined;
    if (!card) return;
    card.classList.add('is-focus');
    requestAnimationFrame(() => card.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  };

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

    if (localMode()) {
      const mine = readMine().sort(byNewest);
      const past = sampleWishes();
      mine.forEach((w) => list.append(renderWish({ ...w, pending: false })));
      past.forEach((w) => list.append(renderWish(w)));
      const n = mine.length + past.length;
      count.textContent = `${n} ${n === 1 ? 'blessing' : 'blessings'}`;
      empty.hidden = n > 0;
      more.hidden = true;
      loading = false;
      more.disabled = false;
      showFocus();
      return;
    }

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
    // This guest's own blessing that the family has not yet approved leads the list, marked as theirs. It is
    // one that falls within the first page's span of time yet is not in it (an older one may simply be on a later page).
    const shown = new Set(res.data.items.map((w) => w.id));
    const oldest = res.data.items.length ? res.data.items[res.data.items.length - 1].created_at : '';
    const waiting = reset ? readMine().filter((m) => m.pending && !shown.has(m.id) && (!res.data.nextCursor || m.created_at > oldest)).sort(byNewest) : [];
    waiting.forEach((w) => list.append(renderWish(w)));
    const have = new Set([...list.children].map((c) => (c as HTMLElement).dataset.wishId));
    res.data.items.filter((w) => !have.has(w.id)).forEach((w) => list.append(renderWish(w)));
    cursor = res.data.nextCursor;
    // Past guests' blessings close the list, after the last of the real ones
    const past = sampleWishes();
    if (!cursor) past.filter((w) => !have.has(w.id)).forEach((w) => list.append(renderWish(w)));
    const total = res.data.total + (reset ? waiting.length : 0) + past.length;
    count.textContent = `${total} ${total === 1 ? 'blessing' : 'blessings'}`;
    empty.hidden = total > 0;
    more.hidden = !cursor;
    more.textContent = 'Load more blessings';
    showFocus();
  };

  dialog.addEventListener('dialog:open', () => void load(true));
  more.addEventListener('click', () => void load(list.children.length === 0));
}

export function initWishes() {
  initComposer();
  initAllWishes();
}
