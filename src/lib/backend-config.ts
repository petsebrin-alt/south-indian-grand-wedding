import type { BackendConfig } from '../../supabase/functions/_shared/types.ts';
import { wedding } from '../data/wedding';

/**
 * Backend settings derived from the central wedding data file, so the RSVP rules (celebrations,
 * dietary options, attendee limit, deadline) and the notification and admin emails have a
 * single source. `npm run backend:config` prints this as the WEDDING_CONFIG secret.
 */
export const DEFAULT_MAX_ATTENDEES = 10; // used until the families set rsvp.maxAttendees (M-25)
/** Guest data is deleted six months after the wedding (PRD §13.8); matches purge_guest_data()'s default cutoff. */
export const RETENTION_UNTIL = '2027-10-07';

export function backendConfig(): Omit<BackendConfig, 'ipSalt'> {
  const { groom, bride } = wedding.couple;
  return {
    coupleNames: `${groom.name} & ${bride.name}`,
    siteUrl: wedding.site.url,
    events: wedding.events.map((e) => ({ id: e.id, name: e.name })),
    dietaryOptions: wedding.rsvp.dietaryOptions,
    maxAttendees: wedding.rsvp.maxAttendees ?? DEFAULT_MAX_ATTENDEES,
    rsvpDeadline: wedding.rsvp.deadline,
    notifyEmails: wedding.rsvp.notifyEmails,
    adminEmails: wedding.site.adminEmails,
    allowedOrigins: wedding.site.url ? [new URL(wedding.site.url).origin] : [],
  };
}
