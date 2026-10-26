/**
 * npm run env:check   → part of build:production. A production build must reach the RSVP and
 * Wishing Wall API; without it the forms would show "opens soon" to every guest (PRD §13).
 * Reads .env.production and the shell environment the same way Astro's build does.
 */
import { loadEnv } from 'vite';

const env = { ...loadEnv('production', process.cwd(), 'PUBLIC_'), ...process.env } as Record<string, string | undefined>;
const errors: string[] = [];
const warnings: string[] = [];

const api = env.PUBLIC_API_BASE?.trim();
if (!api) errors.push('PUBLIC_API_BASE is not set: guests could not send RSVPs or blessings.');
else if (!/^https:\/\/[^/]+/.test(api)) errors.push(`PUBLIC_API_BASE must be an https URL (got "${api}").`);

if (!env.PUBLIC_TURNSTILE_SITE_KEY?.trim()) warnings.push('PUBLIC_TURNSTILE_SITE_KEY is not set: forms rely on the honeypot, timing and rate limits only.');
if (!env.PUBLIC_SUPABASE_URL?.trim() || !env.PUBLIC_SUPABASE_ANON_KEY?.trim())
  warnings.push('PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY are not set: the family dashboard (/admin) cannot sign anyone in.');

console.log('\nEnvironment check (production)\n');
warnings.forEach((w) => console.warn(`  ! ${w}`));
errors.forEach((e) => console.error(`  ✗ ${e}`));
if (errors.length) {
  console.error('\n✗ Production build stopped. Copy .env.example to .env.production and fill it in (see supabase/README.md).\n');
  process.exit(1);
}
console.log('  ✓ API configured.\n');
