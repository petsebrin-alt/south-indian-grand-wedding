// Family admin: summary, moderation and CSV export, for allow-listed signed-in emails (PRD §13.6)
import { handleAdmin } from '../_shared/handlers.ts';
import { supabaseDeps } from '../_shared/supabase-adapter.ts';

Deno.serve((req) => handleAdmin(req, supabaseDeps()));
