// Deno-only wiring for the Supabase Edge Functions: Postgres store, Resend mailer,
// Cloudflare Turnstile check and Supabase Auth for family admins. Not type-checked by the
// site build (see tsconfig exclude); the shared handlers it feeds are.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import type { BackendConfig, Deps, NewRsvp, NewWish, Page, RsvpRecord, Store, WishRecord, WishStatus } from './types.ts';

const env = (name: string, fallback?: string) => {
  const v = Deno.env.get(name) ?? fallback;
  if (v === undefined) throw new Error(`Missing secret ${name}`);
  return v;
};

function supabaseStore(db: SupabaseClient): Store {
  const one = async <T>(q: PromiseLike<{ data: T | null; error: unknown }>) => {
    const { data, error } = await q;
    if (error) throw error;
    return data;
  };
  return {
    findRsvpByKey: (key) => one(db.from('rsvps').select('*').eq('idempotency_key', key).maybeSingle()) as Promise<RsvpRecord | null>,
    getRsvp: (id) => one(db.from('rsvps').select('*').eq('id', id).maybeSingle()) as Promise<RsvpRecord | null>,
    insertRsvp: (row: NewRsvp) => one(db.from('rsvps').insert(row).select('*').single()) as Promise<RsvpRecord>,
    updateRsvp: (id, patch) => one(db.from('rsvps').update(patch).eq('id', id).select('*').single()) as Promise<RsvpRecord>,
    listRsvps: async () => ((await one(db.from('rsvps').select('*').order('created_at', { ascending: false }))) ?? []) as RsvpRecord[],
    findWishByKey: (key) => one(db.from('wishes').select('*').eq('idempotency_key', key).maybeSingle()) as Promise<WishRecord | null>,
    insertWish: (row: NewWish) => one(db.from('wishes').insert(row).select('*').single()) as Promise<WishRecord>,
    listWishes: async ({ status, cursor, limit }): Promise<Page<WishRecord>> => {
      let q = db.from('wishes').select('*').eq('status', status).order('created_at', { ascending: false }).limit(limit + 1);
      if (cursor) q = q.lt('created_at', cursor);
      const rows = ((await one(q)) ?? []) as WishRecord[];
      const { count, error } = await db.from('wishes').select('id', { count: 'exact', head: true }).eq('status', status);
      if (error) throw error;
      const items = rows.slice(0, limit);
      return { items, nextCursor: rows.length > limit ? items[items.length - 1].created_at : null, total: count ?? 0 };
    },
    moderateWish: (id, status: WishStatus, by) =>
      one(db.from('wishes').update({ status, moderated_by: by, moderated_at: new Date().toISOString() }).eq('id', id).select('*').maybeSingle()) as Promise<WishRecord | null>,
    countEvents: async (kind, ipHash, sinceIso) => {
      const { count, error } = await db.from('submission_events').select('id', { count: 'exact', head: true }).eq('kind', kind).eq('ip_hash', ipHash).gte('created_at', sinceIso);
      if (error) throw error;
      return count ?? 0;
    },
    addEvent: async (kind, ipHash) => {
      await one(db.from('submission_events').insert({ kind, ip_hash: ipHash }));
    },
  };
}

let cached: Deps | null = null;

export function supabaseDeps(): Deps {
  if (cached) return cached;
  const url = env('SUPABASE_URL');
  const db = createClient(url, env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
  const config = JSON.parse(env('WEDDING_CONFIG')) as Omit<BackendConfig, 'ipSalt'>;
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const turnstileSecret = Deno.env.get('TURNSTILE_SECRET');

  cached = {
    store: supabaseStore(db),
    config: { ...config, ipSalt: env('IP_HASH_SALT') },
    now: () => new Date(),
    log: (message, detail) => console.error(message, detail),
    mailer: {
      async send(mail) {
        if (!resendKey) throw new Error('RESEND_API_KEY is not set');
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: env('MAIL_FROM'), to: mail.to, subject: mail.subject, text: mail.text, html: mail.html }),
        });
        if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
      },
    },
    botCheck: {
      async verify(token, ip) {
        if (!turnstileSecret) return true; // allowed only until Turnstile is configured; the launch check warns
        if (!token) return false;
        const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          body: new URLSearchParams({ secret: turnstileSecret, response: token, remoteip: ip }),
        });
        return res.ok && (await res.json()).success === true;
      },
    },
    async auth(req) {
      const jwt = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
      if (!jwt) return null;
      const { data, error } = await db.auth.getUser(jwt);
      return error || !data.user?.email ? null : { email: data.user.email };
    },
  };
  return cached;
}
