# RSVP and Wishing Wall backend (Supabase)

This folder holds the backend that stores RSVPs and blessings, emails the families, and powers the family dashboard at `/admin` (PRD §13).

| Part | What it does |
|---|---|
| `migrations/` | Tables `rsvps`, `wishes`, `submission_events`; row-level security on with **no** public policies (only the functions can read or write); `purge_guest_data()` for retention |
| `functions/rsvp` | `POST /rsvp` (new response, needs an `Idempotency-Key`), `PATCH /rsvp/:id` (edit with the guest's private edit token) |
| `functions/wishes` | `GET /wishes` (approved only, 20 per page), `POST /wishes` (stored as *pending*) |
| `functions/admin` | Family dashboard API: summary, approve or reject blessings, CSV export. Requires a signed-in family email that is in `site.adminEmails` |
| `functions/daily-digest` | 08:00 IST summary email; called by a scheduled job with `CRON_SECRET` |
| `functions/_shared/` | The request handlers, validation and emails. The same code runs in the local dev server and is covered by `tests/backend.test.ts` |

Locally, `npm run dev` serves the same API at `/api` with a file store (`.data/dev-db.json`), so nothing below is needed for development.

> **Not yet tested against a live Supabase project.** The Deno wiring (`functions/_shared/supabase-adapter.ts` and each `index.ts`) could not be run here. Everything it calls is tested, but do the end-to-end check in step 10 before sharing the invitation.

---

## What you need

- A **Supabase** project (the free tier is enough). Choose the **Mumbai (ap-south-1)** region for guests in India.
- A **Resend** account with your domain verified, for the RSVP emails.
- Optional but recommended: a **Cloudflare Turnstile** widget (free) for invisible bot protection.
- The **Supabase CLI** on your computer: `brew install supabase/tap/supabase`.

## 1. Fill in the wedding data

In `src/data/wedding.ts`:

- `site.url`: the invitation's address, for example `https://rahul-divya.in`. The functions accept requests only from this origin.
- `rsvp.notifyEmails`: who receives each RSVP and the daily digest.
- `site.adminEmails`: who may use the family dashboard.
- `rsvp.deadline` (optional) and `rsvp.maxAttendees` (defaults to 10).

## 2. Link the project and create the tables

```bash
supabase login
```

```bash
supabase link --project-ref <your-project-ref>
```

```bash
supabase db push
```

## 3. Set the secrets

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided to Edge Functions automatically. Set the rest:

| Secret | Value |
|---|---|
| `WEDDING_CONFIG` | Printed by `npm run backend:config`, which also prints the full `supabase secrets set` command |
| `IP_HASH_SALT` | A long random string: `openssl rand -hex 32` |
| `RESEND_API_KEY` | From Resend → API Keys |
| `MAIL_FROM` | A sender on your verified domain, for example `Rahul & Divya <rsvp@rahul-divya.in>` |
| `TURNSTILE_SECRET` | From Cloudflare Turnstile (leave unset only while testing) |
| `CRON_SECRET` | Another random string: `openssl rand -hex 32` |

```bash
supabase secrets set IP_HASH_SALT=... RESEND_API_KEY=... MAIL_FROM="Rahul & Divya <rsvp@your-domain>" TURNSTILE_SECRET=... CRON_SECRET=...
```

Run `npm run backend:config` again and update `WEDDING_CONFIG` whenever you change the celebrations, dietary options, attendee limit, deadline, emails or domain.

## 4. Deploy the functions

```bash
supabase functions deploy
```

`config.toml` turns off Supabase's JWT check for these four functions because each one checks access itself: the public forms are validated, rate-limited (5 per hour per address) and bot-checked; the admin function verifies the signed-in family email; the digest needs `CRON_SECRET`.

## 5. Family dashboard sign-in

In the Supabase dashboard:

1. **Authentication → URL Configuration**: set *Site URL* to your domain and add `https://<your-domain>/admin` to *Redirect URLs*.
2. **Authentication → Users → Add user**: add each family admin email (the same addresses as `site.adminEmails`). Sign-in links are sent only to existing users.
3. Recommended: **Authentication → SMTP Settings**, use Resend's SMTP so sign-in emails are not limited by Supabase's built-in sender.

## 6. Bot protection (Turnstile)

Create a widget for your domain in Cloudflare Turnstile (mode *Invisible*). The **site key** goes in `PUBLIC_TURNSTILE_SITE_KEY` (step 8); the **secret key** is the `TURNSTILE_SECRET` secret.

## 7. Schedule the digest and the clean-up

In **Database → Extensions**, enable `pg_cron` and `pg_net`. Then in the SQL editor:

```sql
-- Daily digest at 08:00 IST (02:30 UTC)
select cron.schedule('daily-digest', '30 2 * * *', $$
  select net.http_post(
    url := 'https://<your-project-ref>.supabase.co/functions/v1/daily-digest',
    headers := jsonb_build_object('Authorization', 'Bearer <your CRON_SECRET>')
  );
$$);

-- Daily clean-up: rate-limit records after 2 days; all guest data from 7 October 2027 (6 months after the wedding)
select cron.schedule('purge-guest-data', '0 3 * * *', $$ select public.purge_guest_data(); $$);
```

To keep the data longer, pass a later date: `select public.purge_guest_data('2028-04-07');` in the scheduled job, and update `RETENTION_UNTIL` in `src/lib/backend-config.ts` so the privacy note matches.

## 8. Build the site against the backend

Copy `.env.example` to `.env.production` and fill it in:

```
PUBLIC_API_BASE=https://<your-project-ref>.supabase.co/functions/v1
PUBLIC_TURNSTILE_SITE_KEY=...
PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
PUBLIC_SUPABASE_ANON_KEY=...   # Project Settings → API; public by design
```

```bash
npm run build:production
```

The build stops if launch-blocking content is missing or `PUBLIC_API_BASE` is not set, and warns if Turnstile or dashboard sign-in are not configured.

## 9. Moderation

New blessings are hidden until a family member approves them in `/admin`. The daily digest says how many are waiting.

## 10. End-to-end check before sharing

1. Send an RSVP from a phone. The thank-you card appears, and the email arrives within two minutes.
2. Edit that RSVP. An "Updated RSVP" email arrives, and `/admin` shows one response, not two.
3. Write a blessing. It is not on the wall yet. Approve it in `/admin` and reload: it appears.
4. Export both CSV files from `/admin`.
5. Delete the test data in the SQL editor: `delete from rsvps; delete from wishes;`

## Privacy

Guests give only their name, response and optional message; no phone or email is collected. IP addresses are stored only as salted one-way hashes for rate limiting, and removed after two days by the clean-up job. The edit token for an RSVP stays on the guest's device; the database keeps only its hash. The privacy note shown to guests is `src/components/PrivacySheet.astro`.
