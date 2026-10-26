import { API_BASE } from '../lib/api';
import { accessToken, devSignIn, emailSignIn, sendMagicLink, signInForDevelopment, signOut, takeRedirect } from './session';

/**
 * Family dashboard (PRD §13.6, AC-26): RSVP totals and headcount per celebration, dietary counts,
 * blessings awaiting approval, every response, and CSV exports. Guest text is always set as text.
 */
interface Rsvp {
  id: string;
  guest_name: string;
  attendance: 'accept' | 'decline';
  attendee_count: number;
  events: string[];
  dietary: string[];
  dietary_note: string | null;
  message: string | null;
  created_at: string;
  updated_at: string;
}
interface Summary {
  totals: { responses: number; accepted: number; declined: number; headcount: number; perEvent: Record<string, number>; dietary: Record<string, number> };
  events: { id: string; name: string }[];
  rsvps: Rsvp[];
  pendingWishes: { id: string; name: string; message: string; created_at: string }[];
  approvedCount: number;
  admin: string;
}

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const signInView = $('[data-view="sign-in"]');
const dashView = $('[data-view="dashboard"]');
const signInStatus = $('[data-sign-in-status]');
const dashStatus = $('[data-dash-status]');

const when = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const fmt = (iso: string) => when.format(new Date(iso));

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string | number) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
}

async function api(path: string, init: RequestInit = {}): Promise<Response | null> {
  const token = await accessToken();
  if (!token) {
    show('sign-in', 'Your session has ended. Please sign in again.');
    return null;
  }
  try {
    const res = await fetch(`${API_BASE}/admin/${path}`, { ...init, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init.headers } });
    if (res.status === 401) {
      signOut();
      show('sign-in', 'This account is not on the family list for this invitation.');
      return null;
    }
    return res;
  } catch {
    dashStatus.textContent = 'We could not reach the server. Please check your connection and refresh.';
    return null;
  }
}

function show(view: 'sign-in' | 'dashboard', message = '') {
  signInView.hidden = view !== 'sign-in';
  dashView.hidden = view !== 'dashboard';
  if (view === 'sign-in') signInStatus.textContent = message;
}

/* ---------------------------------------------------------------- rendering */

function renderTotals(s: Summary) {
  const t = s.totals;
  $('[data-tiles]').replaceChildren(
    ...[
      ['Responses', t.responses],
      ['Joyfully accepted', t.accepted],
      ['Regretfully declined', t.declined],
      ['Expected guests', t.headcount],
      ['Blessings on the wall', s.approvedCount],
    ].map(([label, value]) => {
      const tile = el('div', 'tile');
      tile.append(el('p', 'tile__value', value), el('p', 'tile__label', label));
      return tile;
    }),
  );
  $('[data-per-event]').replaceChildren(
    ...s.events.map((e) => {
      const row = el('tr');
      row.append(el('th', '', e.name), el('td', 'num', t.perEvent[e.id] ?? 0));
      return row;
    }),
  );
  $('[data-dietary]').replaceChildren(
    ...Object.entries(t.dietary).map(([d, n]) => {
      const row = el('tr');
      row.append(el('th', '', d.replace(/\s*\(please specify\)/i, '')), el('td', 'num', n));
      return row;
    }),
  );
}

function renderPending(s: Summary) {
  const list = $('[data-pending]');
  $('[data-pending-count]').textContent = String(s.pendingWishes.length);
  $('[data-pending-empty]').hidden = s.pendingWishes.length > 0;
  list.replaceChildren(
    ...s.pendingWishes.map((w) => {
      const card = el('li', 'wish');
      const actions = el('div', 'wish__actions');
      const approve = el('button', 'btn-primary', 'Approve');
      const reject = el('button', 'btn-secondary', 'Reject');
      approve.type = reject.type = 'button';
      const moderate = async (status: 'approved' | 'rejected') => {
        approve.disabled = reject.disabled = true;
        const res = await api(`wishes/${encodeURIComponent(w.id)}`, { method: 'POST', body: JSON.stringify({ status }) });
        if (res?.ok) await load();
        else {
          approve.disabled = reject.disabled = false;
          dashStatus.textContent = 'That change was not saved. Please try again.';
        }
      };
      approve.addEventListener('click', () => void moderate('approved'));
      reject.addEventListener('click', () => void moderate('rejected'));
      actions.append(approve, reject);
      card.append(el('p', 'wish__msg', w.message), el('p', 'wish__meta', `${w.name} · ${fmt(w.created_at)}`), actions);
      return card;
    }),
  );
}

function renderRsvps(s: Summary) {
  const name = (id: string) => s.events.find((e) => e.id === id)?.name ?? id;
  $('[data-rsvp-count]').textContent = String(s.rsvps.length);
  $('[data-rsvps-empty]').hidden = s.rsvps.length > 0;
  $('[data-rsvps]').replaceChildren(
    ...s.rsvps.map((r) => {
      const row = el('tr');
      const accepted = r.attendance === 'accept';
      row.append(
        el('td', 'strong', r.guest_name),
        el('td', accepted ? 'yes' : 'no', accepted ? 'Accepts' : 'Declines'),
        el('td', 'num', accepted ? r.attendee_count : '—'),
        el('td', '', r.events.map(name).join(', ') || '—'),
        el('td', '', [...r.dietary, r.dietary_note].filter(Boolean).join(' · ') || '—'),
        el('td', 'msg', r.message ?? '—'),
        el('td', 'nowrap', fmt(r.updated_at) + (r.updated_at !== r.created_at ? ' (edited)' : '')),
      );
      return row;
    }),
  );
}

async function load() {
  dashStatus.textContent = '';
  const res = await api('summary');
  if (!res) return;
  if (!res.ok) {
    dashStatus.textContent = 'The dashboard could not be loaded. Please refresh.';
    return;
  }
  const s = (await res.json()) as Summary;
  show('dashboard');
  $('[data-admin-email]').textContent = s.admin;
  renderTotals(s);
  renderPending(s);
  renderRsvps(s);
  $('[data-updated]').textContent = `Updated ${fmt(new Date().toISOString())}`;
}

async function download(type: 'rsvps' | 'wishes') {
  const res = await api(`export?type=${type}`);
  if (!res?.ok) {
    dashStatus.textContent = 'The export could not be created. Please try again.';
    return;
  }
  const url = URL.createObjectURL(await res.blob());
  const a = el('a');
  a.href = url;
  a.download = `${type === 'wishes' ? 'blessings' : 'rsvps'}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------------------------------------------------------------- start */

const emailForm = $<HTMLFormElement>('[data-email-form]');
const devButton = $<HTMLButtonElement>('[data-dev-sign-in]');
emailForm.hidden = !emailSignIn;
devButton.hidden = !devSignIn;
$('[data-not-configured]').hidden = emailSignIn || devSignIn;

emailForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = (emailForm.elements.namedItem('email') as HTMLInputElement).value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    signInStatus.textContent = 'Please enter a valid email address.';
    return;
  }
  const button = emailForm.querySelector('button')!;
  button.disabled = true;
  const res = await sendMagicLink(email);
  button.disabled = false;
  signInStatus.textContent = res.message;
});

devButton.addEventListener('click', () => {
  signInForDevelopment();
  void load();
});

$('[data-refresh]').addEventListener('click', () => void load());
$('[data-sign-out]').addEventListener('click', () => {
  signOut();
  show('sign-in', 'You have signed out.');
});
$('[data-export="rsvps"]').addEventListener('click', () => void download('rsvps'));
$('[data-export="wishes"]').addEventListener('click', () => void download('wishes'));

const { error } = takeRedirect();
if (error) show('sign-in', `Sign-in failed: ${error}`);
else
  void accessToken().then((token) => {
    if (token) void load();
    else show('sign-in');
  });
