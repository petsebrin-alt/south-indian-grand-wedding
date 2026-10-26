import type { PublicWish } from '../../supabase/functions/_shared/types.ts';

/**
 * Browser client for the RSVP and Wishing Wall API (PRD §13.3–§13.4).
 * PUBLIC_API_BASE points at the Supabase functions in production; in development the dev
 * server serves the same API at /api. Every call times out after 15 s and reports a clear
 * error kind so the forms can say what happened and keep the guest's input.
 */
const BASE: string = import.meta.env.PUBLIC_API_BASE ?? (import.meta.env.DEV ? '/api' : '');
export const API_BASE = BASE;
export const apiAvailable = BASE !== '';
const TIMEOUT_MS = 15_000;

export type ApiErrorKind = 'offline' | 'timeout' | 'validation' | 'rate' | 'closed' | 'rejected' | 'server' | 'unavailable';
export type ApiResult<T> = { ok: true; data: T } | { ok: false; kind: ApiErrorKind; fields?: Record<string, string> };

async function call<T>(path: string, init: RequestInit): Promise<ApiResult<T>> {
  if (!apiAvailable) return { ok: false, kind: 'unavailable' };
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return { ok: false, kind: 'offline' };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${path}`, { ...init, signal: ctrl.signal, headers: { 'Content-Type': 'application/json', ...init.headers } });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (res.ok) return { ok: true, data: data as T };
    if (res.status === 400 && data.error === 'validation') return { ok: false, kind: 'validation', fields: data.fields as Record<string, string> };
    if (res.status === 400 || (res.status === 403 && data.error === 'bot-check-failed')) return { ok: false, kind: 'rejected' };
    if (res.status === 403 && data.error === 'closed') return { ok: false, kind: 'closed' };
    if (res.status === 429) return { ok: false, kind: 'rate' };
    return { ok: false, kind: 'server' };
  } catch (err) {
    return { ok: false, kind: (err as Error).name === 'AbortError' ? 'timeout' : navigator.onLine === false ? 'offline' : 'server' };
  } finally {
    clearTimeout(timer);
  }
}

const randomId = (bytes: number) => {
  const a = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...a))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/** One per submission attempt; reused for retries so a retry can never create a duplicate. */
export const newIdempotencyKey = () => randomId(18);
/** Secret kept on this device so the guest can edit their RSVP later; only its hash is stored. */
export const newEditToken = () => randomId(24);

export const submitRsvp = (payload: Record<string, unknown>, key: string) =>
  call<{ id: string; duplicate?: boolean }>('/rsvp', { method: 'POST', headers: { 'Idempotency-Key': key }, body: JSON.stringify(payload) });

export const updateRsvp = (id: string, editToken: string, payload: Record<string, unknown>) =>
  call<{ id: string }>(`/rsvp/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'X-Edit-Token': editToken }, body: JSON.stringify(payload) });

export const submitWish = (payload: Record<string, unknown>, key: string) =>
  call<{ id: string; status: string }>('/wishes', { method: 'POST', headers: { 'Idempotency-Key': key }, body: JSON.stringify(payload) });

export const fetchWishes = (cursor: string | null, limit = 20) =>
  call<{ items: PublicWish[]; nextCursor: string | null; total: number }>(`/wishes?limit=${limit}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`, { method: 'GET' });

/** Guest-facing wording for each failure (PRD §6.15, §6.16). */
export function errorMessage(kind: ApiErrorKind, what: 'RSVP' | 'blessing'): string {
  switch (kind) {
    case 'offline':
      return 'You appear to be offline. Your details are still here — please try again when you are connected.';
    case 'timeout':
      return `This is taking longer than expected. Your ${what} may not have been saved — please try again.`;
    case 'rate':
      return 'Too many attempts from this connection. Please wait a little while and try again.';
    case 'closed':
      return 'RSVPs have now closed. Please contact the families on the Need Help page.';
    case 'rejected':
      return `We couldn't accept this ${what}. Please check your details and try again.`;
    case 'unavailable':
      return `${what === 'RSVP' ? 'RSVPs open' : 'The Wishing Wall opens'} soon.`;
    default:
      return what === 'RSVP' ? "We couldn't save your RSVP. Your details are still here. Please try again." : "We couldn't save your blessing. Please check your connection and try again.";
  }
}
