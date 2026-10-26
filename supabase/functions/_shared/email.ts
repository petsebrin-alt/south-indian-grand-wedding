import type { BackendConfig, Mail, RsvpRecord } from './types.ts';
import { escapeHtml, formatIst } from './util.ts';

/** Notification emails to the families (PRD §13.7). Plain and readable on a phone. */
const wrap = (title: string, body: string) =>
  `<div style="font-family:Georgia,serif;color:#4b3026;max-width:560px;margin:auto;padding:24px;border:1px solid #c49a45;background:#fffdf8"><h2 style="font-weight:600;color:#7a2635;margin:0 0 12px">${escapeHtml(title)}</h2>${body}</div>`;

const eventNames = (ids: string[], config: BackendConfig) => ids.map((id) => config.events.find((e) => e.id === id)?.name ?? id).join(', ');

export function rsvpMail(r: RsvpRecord, config: BackendConfig, kind: 'new' | 'updated'): Mail {
  const accepting = r.attendance === 'accept';
  const lines = [
    `Guest: ${r.guest_name}`,
    `Response: ${accepting ? `Joyfully accepts (${r.attendee_count} ${r.attendee_count === 1 ? 'guest' : 'guests'})` : 'Regretfully declines'}`,
    accepting ? `Celebrations: ${eventNames(r.events, config) || '—'}` : null,
    accepting && (r.dietary.length || r.dietary_note) ? `Dietary: ${[...r.dietary, r.dietary_note].filter(Boolean).join('; ')}` : null,
    r.message ? `Message: ${r.message}` : null,
    `Received: ${formatIst(r.updated_at)}`,
  ].filter(Boolean) as string[];
  const subject = `${kind === 'new' ? 'New RSVP' : 'Updated RSVP'}: ${r.guest_name} — ${accepting ? `accepts (${r.attendee_count})` : 'declines'}`;
  return {
    to: config.notifyEmails,
    subject,
    text: `${config.coupleNames} — ${subject}\n\n${lines.join('\n')}\n`,
    html: wrap(subject, lines.map((l) => `<p style="margin:4px 0">${escapeHtml(l)}</p>`).join('')),
  };
}

export interface DigestData {
  newRsvps: RsvpRecord[];
  pendingWishes: number;
  totals: { accepted: number; declined: number; headcount: number; perEvent: Record<string, number> };
}

export function digestMail(d: DigestData, config: BackendConfig): Mail {
  const perEvent = config.events.map((e) => `${e.name}: ${d.totals.perEvent[e.id] ?? 0}`);
  const lines = [
    `New or updated RSVPs in the last 24 hours: ${d.newRsvps.length}`,
    ...d.newRsvps.map((r) => `  • ${r.guest_name} — ${r.attendance === 'accept' ? `accepts (${r.attendee_count})` : 'declines'}`),
    `Blessings waiting for approval: ${d.pendingWishes}`,
    '',
    `Totals: ${d.totals.accepted} accepted, ${d.totals.declined} declined, ${d.totals.headcount} guests expected`,
    ...perEvent.map((p) => `  • ${p}`),
  ];
  const subject = `Daily wedding update — ${d.newRsvps.length} new RSVP${d.newRsvps.length === 1 ? '' : 's'}, ${d.pendingWishes} blessing${d.pendingWishes === 1 ? '' : 's'} to approve`;
  return {
    to: config.notifyEmails,
    subject,
    text: `${config.coupleNames}\n\n${lines.join('\n')}\n`,
    html: wrap(subject, `<pre style="font-family:inherit;white-space:pre-wrap;margin:0">${escapeHtml(lines.join('\n'))}</pre>`),
  };
}
