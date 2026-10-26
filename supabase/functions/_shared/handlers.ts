import type { BackendConfig, Deps, PublicWish, RsvpRecord, WishRecord, WishStatus } from './types.ts';
import { isValidKey, isValidToken, looksAutomated, rsvpClosed, validateRsvp, validateWish } from './validate.ts';
import { clientIp, corsHeaders, formatIst, hashIp, json, originAllowed, readJson, routeAfter, safeEqual, sha256, toCsv, type CsvColumn } from './util.ts';
import { digestMail, rsvpMail, type DigestData } from './email.ts';

/**
 * Request handlers for RSVPs, wishes and the family admin (PRD §13). Runtime-agnostic:
 * the same code runs in Supabase Edge Functions and in the local dev API.
 * Success responses are only sent after the store has committed the record (PRD §13.4).
 */
const RATE_LIMIT = 5; // per hour, per hashed address, per form
const HOUR = 3600_000;

async function guard(req: Request, deps: Deps, kind: 'rsvp' | 'wish', body: Record<string, unknown>, cors: Record<string, string>) {
  const automated = looksAutomated(body);
  if (automated) return { error: json({ error: 'rejected', reason: automated }, 400, cors) };
  const ip = clientIp(req);
  if (!(await deps.botCheck.verify(typeof body.botToken === 'string' ? body.botToken : null, ip))) return { error: json({ error: 'bot-check-failed' }, 403, cors) };
  const ipHash = await hashIp(ip, deps.config.ipSalt);
  const since = new Date(deps.now().getTime() - HOUR).toISOString();
  if ((await deps.store.countEvents(kind, ipHash, since)) >= RATE_LIMIT) return { error: json({ error: 'rate-limited' }, 429, cors) };
  return { ipHash };
}

async function notify(deps: Deps, record: RsvpRecord, kind: 'new' | 'updated') {
  if (!deps.config.notifyEmails.length) return;
  try {
    await deps.mailer.send(rsvpMail(record, deps.config, kind));
  } catch (err) {
    // A failed email must never lose or fail the guest's response; the daily digest also reports it.
    deps.log?.('rsvp notification failed', err);
  }
}

const rsvpRules = (deps: Deps) => ({ eventIds: deps.config.events.map((e) => e.id), dietaryOptions: deps.config.dietaryOptions, maxAttendees: deps.config.maxAttendees });

export async function handleRsvp(req: Request, deps: Deps): Promise<Response> {
  const cors = corsHeaders(req, deps.config.allowedOrigins);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (!originAllowed(req, deps.config.allowedOrigins)) return json({ error: 'origin' }, 403, cors);
  if (rsvpClosed(deps.config.rsvpDeadline, deps.now())) return json({ error: 'closed' }, 403, cors);

  const [id] = routeAfter(req, 'rsvp');
  const body = await readJson(req);
  if (!body) return json({ error: 'invalid-json' }, 400, cors);

  if (req.method === 'POST' && !id) {
    const key = req.headers.get('idempotency-key');
    if (!isValidKey(key)) return json({ error: 'idempotency-key' }, 400, cors);
    const existing = await deps.store.findRsvpByKey(key);
    if (existing) return json({ id: existing.id, duplicate: true }, 200, cors);
    if (!isValidToken(body.editToken)) return json({ error: 'edit-token' }, 400, cors);

    const checked = await guard(req, deps, 'rsvp', body, cors);
    if ('error' in checked) return checked.error!;
    const valid = validateRsvp(body, rsvpRules(deps));
    if (!valid.ok) return json({ error: 'validation', fields: valid.errors }, 400, cors);

    const v = valid.value;
    const record = await deps.store.insertRsvp({
      guest_name: v.guestName,
      attendance: v.attendance,
      attendee_count: v.attendeeCount,
      events: v.events,
      dietary: v.dietary,
      dietary_note: v.dietaryNote,
      message: v.message,
      consent: true,
      edit_token_hash: await sha256(body.editToken),
      idempotency_key: key,
      ip_hash: checked.ipHash,
    });
    await deps.store.addEvent('rsvp', checked.ipHash);
    await notify(deps, record, 'new');
    return json({ id: record.id }, 201, cors);
  }

  if (req.method === 'PATCH' && id) {
    const token = req.headers.get('x-edit-token');
    const record = await deps.store.getRsvp(id);
    if (!record || !isValidToken(token) || !safeEqual(await sha256(token), record.edit_token_hash)) return json({ error: 'forbidden' }, 403, cors);
    const valid = validateRsvp(body, rsvpRules(deps));
    if (!valid.ok) return json({ error: 'validation', fields: valid.errors }, 400, cors);
    const v = valid.value;
    const updated = await deps.store.updateRsvp(id, {
      guest_name: v.guestName,
      attendance: v.attendance,
      attendee_count: v.attendeeCount,
      events: v.events,
      dietary: v.dietary,
      dietary_note: v.dietaryNote,
      message: v.message,
    });
    await notify(deps, updated, 'updated');
    return json({ id: updated.id }, 200, cors);
  }

  return json({ error: 'method' }, 405, cors);
}

const publicWish = (w: WishRecord): PublicWish => ({ id: w.id, name: w.name, message: w.message, created_at: w.created_at });

export async function handleWishes(req: Request, deps: Deps): Promise<Response> {
  const cors = corsHeaders(req, deps.config.allowedOrigins);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (!originAllowed(req, deps.config.allowedOrigins)) return json({ error: 'origin' }, 403, cors);

  if (req.method === 'GET') {
    const url = new URL(req.url);
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || 20));
    const page = await deps.store.listWishes({ status: 'approved', cursor: url.searchParams.get('cursor'), limit });
    return json({ items: page.items.map(publicWish), nextCursor: page.nextCursor, total: page.total }, 200, cors);
  }

  if (req.method === 'POST') {
    const body = await readJson(req);
    if (!body) return json({ error: 'invalid-json' }, 400, cors);
    const key = req.headers.get('idempotency-key');
    if (!isValidKey(key)) return json({ error: 'idempotency-key' }, 400, cors);
    const existing = await deps.store.findWishByKey(key);
    if (existing) return json({ id: existing.id, status: existing.status, duplicate: true }, 200, cors);
    const checked = await guard(req, deps, 'wish', body, cors);
    if ('error' in checked) return checked.error!;
    const valid = validateWish(body);
    if (!valid.ok) return json({ error: 'validation', fields: valid.errors }, 400, cors);
    const record = await deps.store.insertWish({ ...valid.value, status: 'pending', idempotency_key: key, ip_hash: checked.ipHash });
    await deps.store.addEvent('wish', checked.ipHash);
    return json({ id: record.id, status: 'pending' }, 201, cors);
  }

  return json({ error: 'method' }, 405, cors);
}

/* ------------------------------------------------------------------ family admin (PRD §13.6) */

export function summarize(rsvps: RsvpRecord[], eventIds: string[], dietaryOptions: string[]) {
  const accepted = rsvps.filter((r) => r.attendance === 'accept');
  const perEvent = Object.fromEntries(eventIds.map((id) => [id, accepted.filter((r) => r.events.includes(id)).reduce((n, r) => n + r.attendee_count, 0)]));
  const dietary = Object.fromEntries(dietaryOptions.map((d) => [d, accepted.filter((r) => r.dietary.includes(d)).length]));
  return {
    responses: rsvps.length,
    accepted: accepted.length,
    declined: rsvps.length - accepted.length,
    headcount: accepted.reduce((n, r) => n + r.attendee_count, 0),
    perEvent,
    dietary,
  };
}

// Spreadsheet-friendly values: IST times, readable responses and celebration names.
const ist = (v: unknown) => formatIst(String(v));
const rsvpColumns = (config: BackendConfig): CsvColumn[] => [
  { key: 'guest_name', label: 'Guest' },
  { key: 'attendance', label: 'Response', format: (v) => (v === 'accept' ? 'Accepts' : 'Declines') },
  { key: 'attendee_count', label: 'Guests' },
  { key: 'events', label: 'Celebrations', format: (v) => (v as string[]).map((id) => config.events.find((e) => e.id === id)?.name ?? id).join('; ') },
  { key: 'dietary', label: 'Dietary' },
  { key: 'dietary_note', label: 'Dietary note' },
  { key: 'message', label: 'Message' },
  { key: 'created_at', label: 'Received', format: ist },
  { key: 'updated_at', label: 'Last updated', format: ist },
];
const WISH_COLUMNS: CsvColumn[] = [
  { key: 'name', label: 'Name' },
  { key: 'message', label: 'Blessing' },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Received', format: ist },
  { key: 'moderated_by', label: 'Moderated by' },
];

async function allWishes(deps: Deps, status: WishStatus) {
  const out: WishRecord[] = [];
  let cursor: string | null = null;
  do {
    const page = await deps.store.listWishes({ status, cursor, limit: 50 });
    out.push(...page.items);
    cursor = page.nextCursor;
  } while (cursor);
  return out;
}

export async function handleAdmin(req: Request, deps: Deps): Promise<Response> {
  const cors = corsHeaders(req, deps.config.allowedOrigins);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  const user = await deps.auth(req);
  if (!user || !deps.config.adminEmails.map((e) => e.toLowerCase()).includes(user.email.toLowerCase())) return json({ error: 'unauthorised' }, 401, cors);

  const [resource, id] = routeAfter(req, 'admin');
  const eventIds = deps.config.events.map((e) => e.id);

  if (req.method === 'GET' && resource === 'summary') {
    const rsvps = await deps.store.listRsvps();
    const pending = await allWishes(deps, 'pending');
    const approved = await deps.store.listWishes({ status: 'approved', limit: 1 });
    return json(
      {
        totals: summarize(rsvps, eventIds, deps.config.dietaryOptions),
        events: deps.config.events,
        rsvps: rsvps.map(({ edit_token_hash: _t, ip_hash: _i, idempotency_key: _k, ...r }) => r),
        pendingWishes: pending.map((w) => ({ ...publicWish(w), status: w.status })),
        approvedCount: approved.total,
        admin: user.email,
      },
      200,
      cors,
    );
  }

  if (req.method === 'POST' && resource === 'wishes' && id) {
    const body = await readJson(req);
    const status = body?.status;
    if (status !== 'approved' && status !== 'rejected') return json({ error: 'status' }, 400, cors);
    const updated = await deps.store.moderateWish(id, status, user.email);
    return updated ? json({ id, status }, 200, cors) : json({ error: 'not-found' }, 404, cors);
  }

  if (req.method === 'GET' && resource === 'export') {
    const type = new URL(req.url).searchParams.get('type');
    const csv =
      type === 'wishes'
        ? toCsv([...(await allWishes(deps, 'approved')), ...(await allWishes(deps, 'pending')), ...(await allWishes(deps, 'rejected'))] as unknown as Record<string, unknown>[], WISH_COLUMNS)
        : toCsv((await deps.store.listRsvps()) as unknown as Record<string, unknown>[], rsvpColumns(deps.config));
    return new Response(csv, {
      status: 200,
      headers: { ...cors, 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${type === 'wishes' ? 'blessings' : 'rsvps'}.csv"`, 'Cache-Control': 'no-store' },
    });
  }

  return json({ error: 'not-found' }, 404, cors);
}

/** Daily digest at 08:00 IST (PRD §13.7). Sends only when there is something to report. */
export async function runDigest(deps: Deps): Promise<{ sent: boolean; data: DigestData }> {
  const rsvps = await deps.store.listRsvps();
  const since = deps.now().getTime() - 24 * HOUR;
  const newRsvps = rsvps.filter((r) => Date.parse(r.updated_at) >= since);
  const pending = await deps.store.listWishes({ status: 'pending', limit: 1 });
  const totals = summarize(rsvps, deps.config.events.map((e) => e.id), deps.config.dietaryOptions);
  const data: DigestData = { newRsvps, pendingWishes: pending.total, totals };
  if (!deps.config.notifyEmails.length || (!newRsvps.length && !pending.total)) return { sent: false, data };
  await deps.mailer.send(digestMail(data, deps.config));
  return { sent: true, data };
}
