import { errorMessage, newEditToken, newIdempotencyKey, submitRsvp, updateRsvp } from '../lib/api';
import { getBotToken } from '../lib/bot-check';
import { LIMITS, rsvpClosed, validateRsvp } from '../../supabase/functions/_shared/validate.ts';
import type { RsvpInput } from '../../supabase/functions/_shared/types.ts';
import { atLeast, clearError, liveCounter, setSending, showErrors, store } from './shared';

/**
 * RSVP (PRD §6.16, AC-25, AC-27).
 * - Two steps in focus mode; the page card's fields open focus mode with that choice made.
 * - Success (the card flips to its thank-you face) appears only after the server returns a stored ID.
 * - Retries reuse one idempotency key and edit token, so double taps and timeouts never duplicate.
 * - The response, its ID and its edit token stay on this device so the guest can edit it later.
 */
const SAVED_KEY = 'rdv:rsvp';
const DRAFT_KEY = 'rdv:rsvp-draft';
const PENDING_KEY = 'rdv:rsvp-pending';
const STEP1 = ['guestName', 'attendance', 'attendeeCount'];

interface Config {
  maxAttendees: number;
  deadline: string | null;
  events: { id: string; name: string; short: string }[];
  dietaryOptions: string[];
}
interface Saved {
  id: string;
  editToken: string;
  data: RsvpInput;
  savedAt: number;
}
interface Pending {
  key: string;
  editToken: string;
  signature: string;
}

export function initRsvp() {
  const dialog = document.getElementById('rsvp-form');
  const configEl = document.getElementById('rsvp-config');
  if (!dialog || !configEl) return;
  const config = JSON.parse(configEl.textContent!) as Config;
  const rules = { eventIds: config.events.map((e) => e.id), dietaryOptions: config.dietaryOptions, maxAttendees: config.maxAttendees };

  const form = dialog.querySelector<HTMLFormElement>('[data-rsvp-form]')!;
  const flipper = dialog.querySelector<HTMLElement>('[data-rsvp-flip]')!;
  const done = dialog.querySelector<HTMLElement>('[data-rsvp-done]')!;
  const status = form.querySelector<HTMLElement>('[data-form-status]')!;
  const stepLabel = form.querySelector<HTMLElement>('[data-step-label]')!;
  const steps = [...form.querySelectorAll<HTMLElement>('[data-step]')];
  const submit = form.querySelector<HTMLButtonElement>('[data-submit]')!;
  const submitLabel = submit.querySelector('.btn-label')!;
  const count = form.elements.namedItem('attendeeCount') as HTMLInputElement;
  const consent = form.elements.namedItem('consent') as HTMLInputElement;
  const website = form.elements.namedItem('website') as HTMLInputElement;
  const message = form.elements.namedItem('message') as HTMLTextAreaElement;
  const dietaryNote = form.querySelector<HTMLElement>('[data-dietary-note]')!;
  const particles = dialog.querySelector<HTMLElement>('[data-rsvp-particles]')!;
  const updateCount = liveCounter(message, form.querySelector('[data-counter-for="message"]'), LIMITS.messageMax);

  const page = document.querySelector<HTMLElement>('[data-rsvp-page]');
  const eventName = (id: string) => config.events.find((e) => e.id === id)?.name ?? id;
  const shortName = (id: string) => config.events.find((e) => e.id === id)?.short ?? id;

  let saved = store.get<Saved>(SAVED_KEY);
  let pending = store.get<Pending>(PENDING_KEY);
  let openedAt = 0;
  let step = 1;
  let intent: string | null = null;

  /* ---------------------------------------------------------------- reading and filling */

  const read = (): Record<string, unknown> => {
    const fd = new FormData(form);
    return {
      guestName: fd.get('guestName'),
      attendance: fd.get('attendance'),
      attendeeCount: Number(fd.get('attendeeCount')),
      events: fd.getAll('events'),
      dietary: fd.getAll('dietary'),
      dietaryNote: fd.get('dietaryNote'),
      message: fd.get('message'),
      consent: consent.checked,
    };
  };

  const fill = (d: Partial<RsvpInput>) => {
    (form.elements.namedItem('guestName') as HTMLInputElement).value = d.guestName ?? '';
    form.querySelectorAll<HTMLInputElement>('[name="attendance"]').forEach((r) => (r.checked = r.value === d.attendance));
    count.value = String(d.attendeeCount || 1);
    if (d.events?.length) form.querySelectorAll<HTMLInputElement>('[name="events"]').forEach((c) => (c.checked = d.events!.includes(c.value)));
    form.querySelectorAll<HTMLInputElement>('[name="dietary"]').forEach((c) => (c.checked = !!d.dietary?.includes(c.value)));
    (form.elements.namedItem('dietaryNote') as HTMLInputElement).value = d.dietaryNote ?? '';
    message.value = d.message ?? '';
    consent.checked = !!d.consent;
    updateCount();
    sync();
  };

  /** Accept-only fields (attendees, events, dietary) follow the attendance choice. */
  const sync = () => {
    const accepting = (form.querySelector<HTMLInputElement>('[name="attendance"]:checked')?.value ?? '') === 'accept';
    form.querySelectorAll<HTMLElement>('[data-accept-only]').forEach((el) => (el.hidden = !accepting));
    const allergy = [...form.querySelectorAll<HTMLInputElement>('[name="dietary"]:checked')].some((c) => /specify/i.test(c.value));
    dietaryNote.hidden = !accepting || !allergy;
  };

  const showStep = (n: number, focus = true) => {
    step = n;
    steps.forEach((s) => (s.hidden = Number(s.dataset.step) !== n));
    stepLabel.textContent = `Step ${n} of 2`;
    if (focus) steps[n - 1].querySelector<HTMLElement>('input:not([type="hidden"]), textarea, button')?.focus();
  };

  /* ---------------------------------------------------------------- thank-you face */

  const summaryLines = (d: RsvpInput): [string, string][] => {
    const lines: [string, string][] = [];
    if (d.attendance === 'accept') {
      lines.push(['Attending', `Joyfully accepted · ${d.attendeeCount} ${d.attendeeCount === 1 ? 'guest' : 'guests'}`]);
      lines.push(['Celebrations', d.events.map(eventName).join(', ')]);
      if (d.dietary.length) lines.push(['Dietary', [...d.dietary.map((x) => x.replace(/\s*\(please specify\)/i, '')), d.dietaryNote].filter(Boolean).join(' · ')]);
    } else {
      lines.push(['Attending', 'Regretfully declined']);
    }
    if (d.message) lines.push(['Your message', d.message]);
    return lines;
  };

  const renderDone = (d: RsvpInput) => {
    done.querySelector('[data-done-name]')!.textContent = d.guestName.split(' ')[0];
    done.querySelector('[data-done-title]')!.textContent = d.attendance === 'accept' ? 'Your RSVP is confirmed' : 'Your response has been received';
    const list = done.querySelector<HTMLElement>('[data-done-summary]')!;
    list.replaceChildren(
      ...summaryLines(d).map(([label, value]) => {
        const li = document.createElement('li');
        const strong = document.createElement('strong');
        strong.textContent = label;
        li.append(strong, value); // guest text is set as text, never HTML
        return li;
      }),
    );
  };

  const reduced = () => document.documentElement.classList.contains('reduce-motion');

  const body = dialog.querySelector<HTMLElement>('.overlay__body')!;
  let flipTimer = 0;

  /** Turn the card between its form and thank-you faces; the hidden face is removed once turned, so each face keeps its own height. */
  const flip = (toDone: boolean, animate: boolean) => {
    const instant = !animate || reduced();
    clearTimeout(flipTimer);
    flipper.classList.toggle('is-instant', instant);
    const [showing, leaving] = toDone ? [done, form] : [form, done];
    showing.hidden = false;
    void showing.offsetWidth; // start the turn from the face's current angle
    flipper.classList.toggle('is-done', toDone);
    form.inert = toDone;
    done.inert = !toDone;
    done.setAttribute('aria-hidden', String(!toDone));
    body.scrollTo({ top: 0, behavior: instant ? 'auto' : 'smooth' });
    const settle = () => {
      leaving.hidden = true;
      flipper.classList.remove('is-instant');
    };
    if (instant) requestAnimationFrame(settle);
    else flipTimer = window.setTimeout(settle, 620);
  };

  /** A gentle fall of eight jasmine petals (PRD §6.16); none with reduced motion. */
  const petals = () => {
    if (reduced()) return;
    particles.replaceChildren(
      ...Array.from({ length: 8 }, (_, i) => {
        const p = document.createElement('span');
        p.className = 'rsvp-petal';
        p.style.left = `${8 + i * 11.5 + Math.random() * 6}%`;
        p.style.animationDelay = `${(i % 4) * 160 + Math.random() * 200}ms`;
        p.style.setProperty('--drift', `${Math.round((Math.random() - 0.5) * 60)}px`);
        p.style.setProperty('--spin', `${Math.round(120 + Math.random() * 240)}deg`);
        return p;
      }),
    );
    window.setTimeout(() => particles.replaceChildren(), 4200);
  };

  /* ---------------------------------------------------------------- page card */

  const closed = () => rsvpClosed(config.deadline, new Date());

  const renderPage = () => {
    if (!page) return;
    const statusBox = page.querySelector<HTMLElement>('[data-rsvp-status]')!;
    const statusText = page.querySelector<HTMLElement>('[data-rsvp-status-text]')!;
    const closedNote = page.querySelector<HTMLElement>('[data-rsvp-closed]')!;
    const openBtn = page.querySelector<HTMLElement>('[data-rsvp-open]')!;
    const preview = page.querySelector<HTMLElement>('[data-rsvp-preview]');
    statusBox.hidden = !saved;
    if (saved) {
      const d = saved.data;
      statusText.textContent =
        d.attendance === 'accept'
          ? `${d.guestName} · attending with ${d.attendeeCount} ${d.attendeeCount === 1 ? 'guest' : 'guests'} · ${d.events.map(shortName).join(', ')}`
          : `${d.guestName} · regretfully declined`;
    }
    if (preview) preview.hidden = !!saved;
    openBtn.textContent = saved ? 'View or edit my response' : 'Respond now';
    const isClosed = closed();
    closedNote.hidden = !isClosed;
    if (isClosed)
      page.querySelectorAll<HTMLElement>('[data-open-dialog="rsvp-form"]').forEach((b) => {
        b.setAttribute('aria-disabled', 'true');
        b.dataset.disabledMessage = errorMessage('closed', 'RSVP');
      });
  };

  // Which field on the page card opened focus mode, so the form opens with that choice made.
  document.addEventListener(
    'click',
    (e) => {
      const el = (e.target as Element).closest<HTMLElement>('[data-rsvp-intent]');
      intent = el && el.getAttribute('aria-disabled') !== 'true' ? el.dataset.rsvpIntent! : null;
    },
    true,
  );

  /* ---------------------------------------------------------------- opening */

  dialog.addEventListener('dialog:open', () => {
    openedAt = performance.now();
    status.textContent = '';
    submitLabel.textContent = saved ? 'Update RSVP' : 'Confirm RSVP';
    if (saved && intent === null) {
      renderDone(saved.data);
      flip(true, false);
      done.focus({ preventScroll: true });
      return;
    }
    flip(false, false);
    if (saved) fill(saved.data);
    else {
      const draft = store.get<Partial<RsvpInput>>(DRAFT_KEY);
      if (draft && !(form.elements.namedItem('guestName') as HTMLInputElement).value) fill(draft);
    }
    if (intent === 'accept' || intent === 'decline') {
      form.querySelector<HTMLInputElement>(`[name="attendance"][value="${intent}"]`)!.checked = true;
      sync();
    }
    showStep(1, false);
    const target = intent === 'accept' || intent === 'decline' ? form.querySelector<HTMLInputElement>(`[name="attendance"][value="${intent}"]`) : form.querySelector<HTMLElement>('[data-autofocus]');
    target?.focus({ preventScroll: true });
    intent = null;
  });

  /* ---------------------------------------------------------------- editing the form */

  form.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    if (target.name) clearError(form, target.name);
    if (target.name === 'attendance' || target.name === 'dietary') sync();
    if (!saved) {
      const { consent: _c, ...draft } = read();
      store.set(DRAFT_KEY, draft);
    }
  });

  const stepBy = (delta: number) => {
    const next = Math.min(config.maxAttendees, Math.max(1, (Number(count.value) || 1) + delta));
    count.value = String(next);
    clearError(form, 'attendeeCount');
    count.dispatchEvent(new Event('input', { bubbles: true }));
  };
  form.querySelector('[data-step-down]')!.addEventListener('click', () => stepBy(-1));
  form.querySelector('[data-step-up]')!.addEventListener('click', () => stepBy(1));

  form.querySelector('[data-next-step]')!.addEventListener('click', () => {
    const valid = validateRsvp(read(), rules);
    const errors = valid.ok ? {} : Object.fromEntries(Object.entries(valid.errors).filter(([k]) => STEP1.includes(k)));
    if (Object.keys(errors).length) return showErrors(form, errors);
    showErrors(form, {}, false);
    showStep(2);
  });
  form.querySelector('[data-prev-step]')!.addEventListener('click', () => showStep(1));

  done.querySelector('[data-edit-response]')!.addEventListener('click', () => {
    if (!saved) return;
    fill(saved.data);
    submitLabel.textContent = 'Update RSVP';
    flip(false, true);
    showStep(1);
  });

  // Keep the field being typed into above the on-screen keyboard (PRD §6.16).
  const reveal = () => {
    const active = document.activeElement as HTMLElement | null;
    if (active && form.contains(active) && active.matches('input, textarea')) active.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' });
  };
  form.addEventListener('focusin', () => window.setTimeout(reveal, 320));
  window.visualViewport?.addEventListener('resize', () => !dialog.hidden && reveal());

  /* ---------------------------------------------------------------- submitting */

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submit.disabled) return; // a double tap while sending does nothing (AC-27)
    status.textContent = '';
    const valid = validateRsvp(read(), rules);
    if (!valid.ok) {
      if (step === 2 && Object.keys(valid.errors).some((k) => STEP1.includes(k))) showStep(1, false);
      return showErrors(form, valid.errors);
    }
    if (navigator.onLine === false) {
      status.textContent = errorMessage('offline', 'RSVP');
      submitLabel.textContent = 'Retry';
      return;
    }

    setSending(submit, true);
    form.setAttribute('aria-busy', 'true');
    let result: Awaited<ReturnType<typeof submitRsvp>>;
    let editToken: string;
    if (saved) {
      editToken = saved.editToken;
      result = await updateRsvp(saved.id, editToken, { ...valid.value });
    } else {
      // The same answers keep the same key and token, so a retry after a timeout returns the stored record.
      const signature = JSON.stringify(valid.value);
      if (!pending || pending.signature !== signature) {
        pending = { key: newIdempotencyKey(), editToken: newEditToken(), signature };
        store.set(PENDING_KEY, pending);
      }
      editToken = pending.editToken;
      await atLeast(openedAt, LIMITS.minFillMs + 200);
      const botToken = await getBotToken(form.querySelector('[data-bot]')!);
      result = await submitRsvp(
        { ...valid.value, editToken, website: website.value, elapsedMs: Math.round(performance.now() - openedAt), botToken },
        pending.key,
      );
    }
    setSending(submit, false);
    form.removeAttribute('aria-busy');

    if (result.ok && result.data.id) {
      saved = { id: result.data.id, editToken, data: valid.value, savedAt: Date.now() };
      store.set(SAVED_KEY, saved);
      store.remove(PENDING_KEY);
      store.remove(DRAFT_KEY);
      pending = null;
      renderDone(valid.value);
      flip(true, true);
      petals();
      window.setTimeout(() => done.focus({ preventScroll: true }), reduced() ? 0 : 620);
      renderPage();
      return;
    }
    if (!result.ok && result.kind === 'validation' && result.fields) {
      if (Object.keys(result.fields).some((k) => STEP1.includes(k))) showStep(1, false);
      return showErrors(form, result.fields);
    }
    const kind = result.ok ? 'server' : result.kind;
    status.textContent = errorMessage(kind, 'RSVP');
    status.scrollIntoView({ block: 'nearest' });
    submitLabel.textContent = 'Retry';
    if (kind === 'closed') renderPage();
  });

  renderPage();
}
