import { beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LIMITS, rsvpClosed, validateRsvp, validateWish } from '../supabase/functions/_shared/validate.ts';
import { handleAdmin, handleRsvp, handleWishes, runDigest } from '../supabase/functions/_shared/handlers.ts';
import { toCsv } from '../supabase/functions/_shared/util.ts';
import type { Deps, Mail } from '../supabase/functions/_shared/types.ts';
import { FileStore } from '../scripts/dev-api/file-store.ts';

const rules = { eventIds: ['mehndi', 'wedding', 'reception'], dietaryOptions: ['Vegetarian', 'Jain'], maxAttendees: 6 };
const good = { guestName: '  Lakshmi   N ', attendance: 'accept', attendeeCount: 2, events: ['wedding', 'nope', 'wedding'], dietary: ['Jain', 'Pizza'], consent: true };

describe('validateRsvp', () => {
  it('cleans and keeps only known events and dietary options', () => {
    const r = validateRsvp(good, rules);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.guestName).toBe('Lakshmi N');
    expect(r.value.events).toEqual(['wedding']);
    expect(r.value.dietary).toEqual(['Jain']);
  });

  it('reports every missing required field', () => {
    const r = validateRsvp({ attendance: 'accept', attendeeCount: 0, events: [] }, rules);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(Object.keys(r.errors).sort()).toEqual(['attendeeCount', 'consent', 'events', 'guestName']);
  });

  it('enforces the attendee limit', () => {
    const r = validateRsvp({ ...good, attendeeCount: 7 }, rules);
    expect(!r.ok && r.errors.attendeeCount).toBeTruthy();
  });

  it('clears accept-only answers when declining', () => {
    const r = validateRsvp({ ...good, attendance: 'decline' }, rules);
    expect(r.ok && r.value).toMatchObject({ attendeeCount: 0, events: [], dietary: [], dietaryNote: null });
  });

  it('limits the message length', () => {
    const r = validateRsvp({ ...good, message: 'a'.repeat(LIMITS.messageMax + 1) }, rules);
    expect(!r.ok && r.errors.message).toBeTruthy();
  });
});

describe('validateWish', () => {
  it('accepts a blessing and rejects links, profanity and short text', () => {
    expect(validateWish({ name: 'Ravi', message: 'Many happy years together!' }).ok).toBe(true);
    expect(validateWish({ name: 'Ravi', message: 'visit www.spam.com now' }).ok).toBe(false);
    expect(validateWish({ name: 'Ravi', message: 'what the shit' }).ok).toBe(false);
    expect(validateWish({ name: 'R', message: 'hi' }).ok).toBe(false);
  });
});

describe('rsvpClosed', () => {
  it('closes after the end of the deadline day in IST', () => {
    expect(rsvpClosed('2027-03-15', new Date('2027-03-15T18:00:00Z'))).toBe(false); // 11:30 pm IST
    expect(rsvpClosed('2027-03-15', new Date('2027-03-15T18:31:00Z'))).toBe(true);
    expect(rsvpClosed(null, new Date())).toBe(false);
  });
});

describe('toCsv', () => {
  it('quotes, joins lists and neutralises spreadsheet formulas', () => {
    const csv = toCsv([{ a: '=SUM(A1)', b: ['x', 'y'], c: 'say "hi", ok' }], [
      { key: 'a', label: 'A' },
      { key: 'b', label: 'B' },
      { key: 'c', label: 'C', format: (v) => String(v).toUpperCase() },
    ]);
    expect(csv).toBe(`A,B,C\r\n'=SUM(A1),x; y,"SAY ""HI"", OK"\r\n`);
  });
});

/* ------------------------------------------------------------------ handlers */

const store = new FileStore(join(mkdtempSync(join(tmpdir(), 'rdv-')), 'db.json'));
const sent: Mail[] = [];
// The store stamps rows with the real clock, so the handlers' clock starts there too.
let now = new Date();
const deps: Deps = {
  store,
  mailer: { send: async (m) => void sent.push(m) },
  botCheck: { verify: async () => true },
  config: {
    coupleNames: 'Rahul & Divya',
    siteUrl: 'https://example.test',
    events: [
      { id: 'wedding', name: 'Hindu Wedding Ceremony' },
      { id: 'reception', name: 'Grand Wedding Reception' },
    ],
    dietaryOptions: ['Vegetarian'],
    maxAttendees: 6,
    rsvpDeadline: '2099-03-15', // far ahead so the suite keeps passing after the real deadline
    notifyEmails: ['family@example.test'],
    adminEmails: ['admin@example.test'],
    allowedOrigins: ['https://example.test'],
    ipSalt: 'test',
  },
  now: () => now,
  auth: async (req) => (req.headers.get('authorization') === 'Bearer ok' ? { email: 'admin@example.test' } : null),
};

const KEY = 'k'.repeat(24);
const TOKEN = 't'.repeat(32);
const req = (method: string, path: string, body?: unknown, headers: Record<string, string> = {}) =>
  new Request(`https://api.example.test/functions/v1/${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Origin: 'https://example.test', 'X-Forwarded-For': '203.0.113.9', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const rsvpBody = { guestName: 'Lakshmi', attendance: 'accept', attendeeCount: 2, events: ['wedding'], dietary: [], consent: true, editToken: TOKEN, website: '', elapsedMs: 8000 };

beforeEach(() => {
  store.reset();
  sent.length = 0;
  now = new Date();
});

describe('handleRsvp', () => {
  it('stores once per idempotency key and emails the families (AC-26, AC-27)', async () => {
    const first = await handleRsvp(req('POST', 'rsvp', rsvpBody, { 'Idempotency-Key': KEY }), deps);
    expect(first.status).toBe(201);
    const { id } = await first.json();
    const retry = await handleRsvp(req('POST', 'rsvp', rsvpBody, { 'Idempotency-Key': KEY }), deps);
    expect(retry.status).toBe(200);
    expect(await retry.json()).toEqual({ id, duplicate: true });
    expect(await store.listRsvps()).toHaveLength(1);
    expect(sent).toHaveLength(1);
    expect(sent[0].subject).toContain('Lakshmi');
  });

  it('never stores the edit token itself, and edits only with it', async () => {
    const { id } = await (await handleRsvp(req('POST', 'rsvp', rsvpBody, { 'Idempotency-Key': KEY }), deps)).json();
    expect((await store.getRsvp(id))!.edit_token_hash).not.toBe(TOKEN);
    const change = { ...rsvpBody, attendance: 'decline' };
    expect((await handleRsvp(req('PATCH', `rsvp/${id}`, change, { 'X-Edit-Token': 'x'.repeat(32) }), deps)).status).toBe(403);
    expect((await handleRsvp(req('PATCH', `rsvp/${id}`, change, { 'X-Edit-Token': TOKEN }), deps)).status).toBe(200);
    expect((await store.getRsvp(id))!.attendance).toBe('decline');
  });

  it('rejects honeypots, instant submissions, other websites and late responses', async () => {
    const post = (body: object, headers: Record<string, string> = {}) => handleRsvp(req('POST', 'rsvp', body, { 'Idempotency-Key': KEY, ...headers }), deps);
    expect((await post({ ...rsvpBody, website: 'spam' })).status).toBe(400);
    expect((await post({ ...rsvpBody, elapsedMs: 500 })).status).toBe(400);
    expect((await post(rsvpBody, { Origin: 'https://evil.test' })).status).toBe(403);
    now = new Date('2099-03-16T00:00:00Z');
    const late = await post(rsvpBody);
    expect(late.status).toBe(403);
    expect(await late.json()).toEqual({ error: 'closed' });
    expect(await store.listRsvps()).toHaveLength(0);
  });

  it('returns field errors without storing anything', async () => {
    const res = await handleRsvp(req('POST', 'rsvp', { ...rsvpBody, guestName: '' }, { 'Idempotency-Key': KEY }), deps);
    expect(res.status).toBe(400);
    expect((await res.json()).fields.guestName).toBeTruthy();
    expect(await store.listRsvps()).toHaveLength(0);
  });

  it('limits each address to five submissions an hour', async () => {
    for (let i = 0; i < 5; i++) expect((await handleRsvp(req('POST', 'rsvp', rsvpBody, { 'Idempotency-Key': `${KEY}${i}` }), deps)).status).toBe(201);
    expect((await handleRsvp(req('POST', 'rsvp', rsvpBody, { 'Idempotency-Key': `${KEY}x` }), deps)).status).toBe(429);
  });
});

describe('handleWishes and moderation', () => {
  const wish = { name: 'Ravi', message: 'Many happy years together!', website: '', elapsedMs: 6000 };

  it('keeps new wishes private until an admin approves them (AC-23, AC-24)', async () => {
    const created = await handleWishes(req('POST', 'wishes', wish, { 'Idempotency-Key': KEY }), deps);
    expect(created.status).toBe(201);
    const { id } = await created.json();
    const list = async () => (await (await handleWishes(req('GET', 'wishes?limit=5'), deps)).json()) as { total: number; items: unknown[] };
    expect((await list()).total).toBe(0);

    expect((await handleAdmin(req('POST', `admin/wishes/${id}`, { status: 'approved' }), deps)).status).toBe(401);
    expect((await handleAdmin(req('POST', `admin/wishes/${id}`, { status: 'approved' }, { Authorization: 'Bearer ok' }), deps)).status).toBe(200);
    const after = await list();
    expect(after.total).toBe(1);
    expect(after.items[0]).toEqual({ id, name: 'Ravi', message: wish.message, created_at: expect.any(String) });
  });

  it('pages through every blessing, even several saved in the same instant (AC-24)', async () => {
    const at = '2026-10-27T11:02:35.892Z';
    for (let i = 0; i < 5; i++) {
      const w = await store.insertWish({ name: `Guest ${i}`, message: 'Blessings to you both!', status: 'approved', idempotency_key: `${KEY}w${i}` } as never);
      w.created_at = at; // the same millisecond
    }
    const seen: string[] = [];
    let cursor: string | null = null;
    do {
      const res = await handleWishes(req('GET', `wishes?limit=2${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`), deps);
      const page = (await res.json()) as { items: { id: string }[]; nextCursor: string | null; total: number };
      seen.push(...page.items.map((w) => w.id));
      cursor = page.nextCursor;
    } while (cursor);
    expect(seen).toHaveLength(5);
    expect(new Set(seen).size).toBe(5);
  });

  it('summarises headcount per celebration and exports CSV for admins only (AC-26)', async () => {
    await handleRsvp(req('POST', 'rsvp', rsvpBody, { 'Idempotency-Key': KEY }), deps);
    await handleRsvp(req('POST', 'rsvp', { ...rsvpBody, attendeeCount: 3, events: ['wedding', 'reception'] }, { 'Idempotency-Key': `${KEY}2` }), deps);
    const summary = await (await handleAdmin(req('GET', 'admin/summary', undefined, { Authorization: 'Bearer ok' }), deps)).json();
    expect(summary.totals).toMatchObject({ responses: 2, accepted: 2, headcount: 5, perEvent: { wedding: 5, reception: 3 } });
    expect(summary.rsvps[0]).not.toHaveProperty('edit_token_hash');

    const csv = await (await handleAdmin(req('GET', 'admin/export?type=rsvps', undefined, { Authorization: 'Bearer ok' }), deps)).text();
    expect(csv.split('\r\n')[0]).toBe('Guest,Response,Guests,Celebrations,Dietary,Dietary note,Message,Received,Last updated');
    expect(csv).toContain('Accepts,3,Hindu Wedding Ceremony; Grand Wedding Reception');
    expect(csv).toContain('IST');
    expect((await handleAdmin(req('GET', 'admin/export?type=rsvps'), deps)).status).toBe(401);
  });
});

describe('runDigest', () => {
  it('sends only when there is news', async () => {
    expect((await runDigest(deps)).sent).toBe(false);
    await handleRsvp(req('POST', 'rsvp', rsvpBody, { 'Idempotency-Key': KEY }), deps);
    sent.length = 0;
    const result = await runDigest(deps);
    expect(result.sent).toBe(true);
    expect(result.data.totals.headcount).toBe(2);
    expect(sent).toHaveLength(1);
  });
});

describe('contact links (AC-28)', () => {
  it('builds a WhatsApp chat with the pre-filled greeting and formats Indian numbers', async () => {
    const { whatsappLink } = await import('../src/lib/travel');
    const { formatPhone } = await import('../src/lib/format');
    const url = new URL(whatsappLink('+91 98765 43210'));
    expect(url.origin + url.pathname).toBe('https://wa.me/919876543210');
    expect(url.searchParams.get('text')).toBe("Namaste! I have a question about Rahul & Divya's wedding.");
    expect(formatPhone('+919876543210')).toBe('+91 98765 43210');
    expect(formatPhone('+14155550100')).toBe('+14155550100');
  });
});
