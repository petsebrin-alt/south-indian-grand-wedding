import type { Attendance, RsvpInput, WishInput } from './types.ts';

/**
 * Validation rules for RSVPs and wishes (PRD §6.15, §6.16, §13.2, §13.5).
 * Used by the browser for instant feedback and by the server as the authority.
 */
export const LIMITS = {
  nameMin: 2,
  guestNameMax: 80,
  wishNameMax: 60,
  wishMin: 5,
  messageMax: 500,
  dietaryNoteMax: 200,
  /** Minimum time a person plausibly needs to fill a form. */
  minFillMs: 3000,
} as const;

export type FieldErrors = Record<string, string>;
export type Result<T> = { ok: true; value: T } | { ok: false; errors: FieldErrors };

// Control characters are removed; runs of spaces collapse; new lines survive in messages.
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
export const cleanLine = (v: unknown): string => (typeof v === 'string' ? v.replace(CONTROL, '').replace(/\s+/g, ' ').trim() : '');
export const cleanText = (v: unknown): string =>
  typeof v === 'string'
    ? v
        .replace(CONTROL, '')
        .replace(/\r\n?/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    : '';

const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|in|io|co|xyz|info|ru|top|link|site|online|shop)\b)/i;
// A short list of common English profanities; every wish is also read by a family admin before it appears.
const BLOCKED = ['fuck', 'shit', 'bitch', 'bastard', 'asshole', 'dick', 'cunt', 'slut', 'whore', 'motherfucker'];
const BLOCKED_RE = new RegExp(`\\b(${BLOCKED.join('|')})\\w*`, 'i');

export interface RsvpRules {
  eventIds: string[];
  dietaryOptions: string[];
  maxAttendees: number;
}

export function validateRsvp(raw: Record<string, unknown>, rules: RsvpRules): Result<RsvpInput> {
  const errors: FieldErrors = {};
  const guestName = cleanLine(raw.guestName);
  if (guestName.length < LIMITS.nameMin) errors.guestName = 'Please enter your name.';
  else if (guestName.length > LIMITS.guestNameMax) errors.guestName = `Please keep your name under ${LIMITS.guestNameMax} characters.`;

  const attendance = raw.attendance as Attendance;
  if (attendance !== 'accept' && attendance !== 'decline') errors.attendance = 'Please let us know if you can attend.';

  const accepting = attendance === 'accept';
  let attendeeCount = Number(raw.attendeeCount);
  if (!accepting) attendeeCount = 0;
  else if (!Number.isInteger(attendeeCount) || attendeeCount < 1 || attendeeCount > rules.maxAttendees)
    errors.attendeeCount = `Please choose between 1 and ${rules.maxAttendees} guests.`;

  const events = Array.isArray(raw.events) ? [...new Set(raw.events.filter((e): e is string => typeof e === 'string' && rules.eventIds.includes(e)))] : [];
  if (accepting && events.length === 0) errors.events = 'Please choose at least one celebration.';

  const dietary = Array.isArray(raw.dietary) ? [...new Set(raw.dietary.filter((d): d is string => typeof d === 'string' && rules.dietaryOptions.includes(d)))] : [];
  const dietaryNote = cleanLine(raw.dietaryNote) || null;
  if (dietaryNote && dietaryNote.length > LIMITS.dietaryNoteMax) errors.dietaryNote = `Please keep this under ${LIMITS.dietaryNoteMax} characters.`;

  const message = cleanText(raw.message) || null;
  if (message && message.length > LIMITS.messageMax) errors.message = `Please keep your message under ${LIMITS.messageMax} characters.`;

  if (raw.consent !== true) errors.consent = 'Please confirm we may share your response with the families.';

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: { guestName, attendance, attendeeCount, events: accepting ? events : [], dietary: accepting ? dietary : [], dietaryNote: accepting ? dietaryNote : null, message, consent: true },
  };
}

export function validateWish(raw: Record<string, unknown>): Result<WishInput> {
  const errors: FieldErrors = {};
  const name = cleanLine(raw.name);
  const message = cleanText(raw.message);
  if (name.length < LIMITS.nameMin) errors.name = 'Please enter your name.';
  else if (name.length > LIMITS.wishNameMax) errors.name = `Please keep your name under ${LIMITS.wishNameMax} characters.`;
  if (message.length < LIMITS.wishMin) errors.message = 'Please write a few words of blessing.';
  else if (message.length > LIMITS.messageMax) errors.message = `Please keep your blessing under ${LIMITS.messageMax} characters.`;
  else if (LINK.test(message) || LINK.test(name)) errors.message = 'Links cannot be included in a blessing.';
  else if (BLOCKED_RE.test(message) || BLOCKED_RE.test(name)) errors.message = 'Please rephrase your blessing.';
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: { name, message } };
}

/** Light automated-submission checks shared by both forms (PRD §13.5). */
export function looksAutomated(raw: Record<string, unknown>): string | null {
  if (typeof raw.website === 'string' && raw.website.trim()) return 'honeypot';
  const elapsed = Number(raw.elapsedMs);
  if (!Number.isFinite(elapsed) || elapsed < LIMITS.minFillMs) return 'too-fast';
  return null;
}

export const isValidKey = (key: string | null): key is string => !!key && /^[A-Za-z0-9_-]{16,64}$/.test(key);
export const isValidToken = (token: unknown): token is string => typeof token === 'string' && /^[A-Za-z0-9_-]{22,128}$/.test(token);

/** True when responses are past the deadline (end of that day, IST). */
export function rsvpClosed(deadline: string | null, now: Date): boolean {
  if (!deadline) return false;
  return now.getTime() > Date.parse(`${deadline}T23:59:59+05:30`);
}
