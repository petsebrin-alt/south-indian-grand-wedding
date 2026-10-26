// POST /functions/v1/rsvp · PATCH /functions/v1/rsvp/:id (PRD §13.3)
import { handleRsvp } from '../_shared/handlers.ts';
import { supabaseDeps } from '../_shared/supabase-adapter.ts';

Deno.serve((req) => handleRsvp(req, supabaseDeps()));
