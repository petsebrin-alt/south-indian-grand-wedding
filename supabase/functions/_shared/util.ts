/** Small helpers shared by the handlers: hashing, HTTP responses, CSV and HTML escaping. */

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

export async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return b64url(new Uint8Array(digest));
}

/** Salted hash of the caller's address, used only for rate limiting (never shown). */
export const hashIp = (ip: string, salt: string) => sha256(`${salt}:${ip}`).then((h) => h.slice(0, 32));

/** Constant-time comparison for token hashes. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function clientIp(req: Request): string {
  const h = req.headers;
  return h.get('cf-connecting-ip') ?? h.get('x-real-ip') ?? h.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
}

export function corsHeaders(req: Request, allowedOrigins: string[]): Record<string, string> {
  const origin = req.headers.get('origin');
  const allow = allowedOrigins.length === 0 ? (origin ?? '*') : origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type, idempotency-key, x-edit-token, apikey, x-client-info',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  };
}

export function originAllowed(req: Request, allowedOrigins: string[]): boolean {
  const origin = req.headers.get('origin');
  return allowedOrigins.length === 0 || !origin || allowedOrigins.includes(origin);
}

export function json(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
}

export async function readJson(req: Request, maxBytes = 10_000): Promise<Record<string, unknown> | null> {
  const text = await req.text();
  if (!text || text.length > maxBytes) return null;
  try {
    const value = JSON.parse(text);
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Path segments after the function name, e.g. /functions/v1/rsvp/abc → ['abc']. */
export function routeAfter(req: Request, name: string): string[] {
  const parts = new URL(req.url).pathname.split('/').filter(Boolean);
  const at = parts.lastIndexOf(name);
  return at === -1 ? [] : parts.slice(at + 1);
}

export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** CSV with quoting, and spreadsheet-formula injection guarded (cells starting = + - @ get a leading quote). */
export interface CsvColumn {
  key: string;
  label: string;
  format?: (value: unknown) => string;
}

export function toCsv(rows: Record<string, unknown>[], columns: CsvColumn[]): string {
  const cell = (v: unknown) => {
    let s = Array.isArray(v) ? v.join('; ') : v === null || v === undefined ? '' : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [columns.map((c) => cell(c.label)).join(','), ...rows.map((r) => columns.map((c) => cell(c.format && r[c.key] != null ? c.format(r[c.key]) : r[c.key])).join(','))].join('\r\n') + '\r\n';
}

export function formatIst(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(iso)) + ' IST';
}

/**
 * Paging through blessings: the cursor names the last one shown by its time and id, so the next
 * page starts strictly after it even when several share the same instant. Opaque to the browser.
 */
export const makeCursor = (w: { created_at: string; id: string }) => `${w.created_at}|${w.id}`;
export const parseCursor = (cursor: string | null | undefined): { at: string; id: string | null } | null => {
  if (!cursor) return null;
  const [at, id] = cursor.split('|');
  return { at, id: id ?? null };
};
