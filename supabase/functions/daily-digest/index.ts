// Daily 08:00 IST digest to the families (PRD §13.7). Called by a scheduled job with the CRON_SECRET.
import { runDigest } from '../_shared/handlers.ts';
import { supabaseDeps } from '../_shared/supabase-adapter.ts';

Deno.serve(async (req) => {
  if (req.headers.get('authorization') !== `Bearer ${Deno.env.get('CRON_SECRET')}`) return new Response('Forbidden', { status: 403 });
  const { sent, data } = await runDigest(supabaseDeps());
  return Response.json({ sent, newRsvps: data.newRsvps.length, pendingWishes: data.pendingWishes });
});
