/**
 * Local dev API mounted at /api by the dev server (scripts/dev-api/integration.mjs).
 * Runs the production handlers against a file store and an outbox instead of email.
 *
 *   /api/rsvp, /api/wishes, /api/admin/*   same contract as the Supabase functions
 *   /api/__dev/outbox                      emails that would have been sent
 *   /api/__dev/fail  {count, status}       make the next requests fail (error-state testing)
 *   /api/__dev/reset                       clear all local data
 *   /api/__dev/digest                      run the daily digest now
 *   /api/__dev/auto-approve                approve every pending wish (quick preview)
 */
import { join } from 'node:path';
import { handleAdmin, handleRsvp, handleWishes, runDigest } from '../../supabase/functions/_shared/handlers.ts';
import type { Deps } from '../../supabase/functions/_shared/types.ts';
import { backendConfig } from '../../src/lib/backend-config.ts';
import { FileStore } from './file-store.ts';

export const DEV_ADMIN = { token: 'dev-admin', email: 'family@example.test' };

const store = new FileStore(join(process.cwd(), '.data', 'dev-db.json'));
const base = backendConfig();
const deps: Deps = {
  store,
  config: {
    ...base,
    // Development only: a placeholder family inbox so notifications can be inspected in the outbox.
    notifyEmails: base.notifyEmails.length ? base.notifyEmails : [DEV_ADMIN.email],
    adminEmails: [...base.adminEmails, DEV_ADMIN.email],
    allowedOrigins: [],
    ipSalt: 'local-development-salt',
  },
  now: () => new Date(),
  mailer: { send: async (mail) => store.recordMail(mail) },
  botCheck: { verify: async () => true },
  auth: async (req) => (req.headers.get('authorization') === `Bearer ${DEV_ADMIN.token}` ? { email: DEV_ADMIN.email } : null),
  log: (message, detail) => console.warn(`[dev-api] ${message}`, detail),
};

let failures: { remaining: number; status: number } = { remaining: 0, status: 500 };

export async function handleDevRequest(req: Request): Promise<Response | null> {
  const path = new URL(req.url).pathname;
  if (!path.startsWith('/api/')) return null;

  if (path.startsWith('/api/__dev/')) {
    const action = path.slice('/api/__dev/'.length);
    if (action === 'outbox') return Response.json(store.outbox);
    if (action === 'reset') {
      store.reset();
      failures = { remaining: 0, status: 500 };
      return Response.json({ ok: true });
    }
    if (action === 'fail') {
      const body = (await req.json().catch(() => ({}))) as { count?: number; status?: number };
      failures = { remaining: body.count ?? 1, status: body.status ?? 500 };
      return Response.json({ ok: true, ...failures });
    }
    if (action === 'digest') return Response.json(await runDigest(deps));
    if (action === 'auto-approve') {
      const pending = await store.listWishes({ status: 'pending', limit: 500 });
      for (const w of pending.items) await store.moderateWish(w.id, 'approved', DEV_ADMIN.email);
      return Response.json({ approved: pending.items.length });
    }
    return Response.json({ error: 'unknown dev action' }, { status: 404 });
  }

  const isForm = path.startsWith('/api/rsvp') || path.startsWith('/api/wishes');
  if (isForm && failures.remaining > 0 && req.method !== 'OPTIONS') {
    failures.remaining--;
    return Response.json({ error: 'simulated-failure' }, { status: failures.status });
  }
  if (path.startsWith('/api/rsvp')) return handleRsvp(req, deps);
  if (path.startsWith('/api/wishes')) return handleWishes(req, deps);
  if (path.startsWith('/api/admin')) return handleAdmin(req, deps);
  return Response.json({ error: 'not found' }, { status: 404 });
}
