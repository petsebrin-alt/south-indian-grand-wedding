// GET /functions/v1/wishes (approved only) · POST /functions/v1/wishes (pending) (PRD §13.3)
import { handleWishes } from '../_shared/handlers.ts';
import { supabaseDeps } from '../_shared/supabase-adapter.ts';

Deno.serve((req) => handleWishes(req, supabaseDeps()));
