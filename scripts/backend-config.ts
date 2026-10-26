/**
 * npm run backend:config → prints the WEDDING_CONFIG secret for the Supabase functions, derived
 * from src/data/wedding.ts so the server's rules always match the invitation. Re-run and update
 * the secret whenever events, dietary options, the attendee limit, deadline or emails change.
 */
import { backendConfig } from '../src/lib/backend-config';

const config = backendConfig();
const json = JSON.stringify(config);
if (process.argv.includes('--raw')) {
  process.stdout.write(json);
} else {
  console.log('\nWEDDING_CONFIG (set it with the command below):\n');
  console.log(JSON.stringify(config, null, 2));
  console.log(`\n  supabase secrets set WEDDING_CONFIG='${json.replace(/'/g, "'\\''")}'\n`);
  if (!config.notifyEmails.length) console.warn('  ! rsvp.notifyEmails is empty: nobody will be emailed about new RSVPs.');
  if (!config.adminEmails.length) console.warn('  ! site.adminEmails is empty: nobody can use the family dashboard.');
  if (!config.allowedOrigins.length) console.warn('  ! site.url is empty: the functions will accept requests from any website until the domain is set.');
}
