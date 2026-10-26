/**
 * Backend data model and dependency contracts (PRD §13).
 * Pure TypeScript shared by the Supabase Edge Functions (Deno), the local dev API (Node)
 * and the browser form validation. No runtime-specific APIs here.
 */
export type Attendance = 'accept' | 'decline';
export type WishStatus = 'pending' | 'approved' | 'rejected';

export interface RsvpInput {
  guestName: string;
  attendance: Attendance;
  attendeeCount: number;
  events: string[];
  dietary: string[];
  dietaryNote: string | null;
  message: string | null;
  consent: true;
}

export interface RsvpRecord {
  id: string;
  created_at: string;
  updated_at: string;
  guest_name: string;
  attendance: Attendance;
  attendee_count: number;
  events: string[];
  dietary: string[];
  dietary_note: string | null;
  message: string | null;
  consent: boolean;
  edit_token_hash: string;
  idempotency_key: string;
  ip_hash: string;
}

export interface WishInput {
  name: string;
  message: string;
}

export interface WishRecord {
  id: string;
  created_at: string;
  name: string;
  message: string;
  status: WishStatus;
  moderated_at: string | null;
  moderated_by: string | null;
  idempotency_key: string;
  ip_hash: string;
}

/** The fields of a wish that may be shown publicly. */
export interface PublicWish {
  id: string;
  name: string;
  message: string;
  created_at: string;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
  total: number;
}

export type NewRsvp = Omit<RsvpRecord, 'id' | 'created_at' | 'updated_at'>;
export type NewWish = Omit<WishRecord, 'id' | 'created_at' | 'moderated_at' | 'moderated_by'>;

export interface Store {
  findRsvpByKey(key: string): Promise<RsvpRecord | null>;
  getRsvp(id: string): Promise<RsvpRecord | null>;
  insertRsvp(row: NewRsvp): Promise<RsvpRecord>;
  updateRsvp(id: string, patch: Partial<NewRsvp>): Promise<RsvpRecord>;
  listRsvps(): Promise<RsvpRecord[]>;
  findWishByKey(key: string): Promise<WishRecord | null>;
  insertWish(row: NewWish): Promise<WishRecord>;
  listWishes(opts: { status: WishStatus; cursor?: string | null; limit: number }): Promise<Page<WishRecord>>;
  moderateWish(id: string, status: WishStatus, by: string): Promise<WishRecord | null>;
  /** Rate limiting: how many submissions of this kind came from this (hashed) address since `sinceIso`. */
  countEvents(kind: 'rsvp' | 'wish', ipHash: string, sinceIso: string): Promise<number>;
  addEvent(kind: 'rsvp' | 'wish', ipHash: string): Promise<void>;
}

export interface Mail {
  to: string[];
  subject: string;
  text: string;
  html: string;
}

export interface Mailer {
  send(mail: Mail): Promise<void>;
}

export interface BotCheck {
  /** Verifies the invisible bot-challenge token (Cloudflare Turnstile). */
  verify(token: string | null, ip: string): Promise<boolean>;
}

export interface BackendConfig {
  coupleNames: string;
  siteUrl: string | null;
  events: { id: string; name: string }[];
  dietaryOptions: string[];
  /** Upper limit for "number of attendees" per response. */
  maxAttendees: number;
  /** yyyy-mm-dd in IST; responses close at the end of that day. */
  rsvpDeadline: string | null;
  notifyEmails: string[];
  adminEmails: string[];
  /** Exact origins allowed to call the API (CORS); empty = any (development only). */
  allowedOrigins: string[];
  ipSalt: string;
}

export interface Deps {
  store: Store;
  mailer: Mailer;
  botCheck: BotCheck;
  config: BackendConfig;
  now: () => Date;
  /** Resolves the signed-in family admin from the request, or null. */
  auth: (req: Request) => Promise<{ email: string } | null>;
  log?: (message: string, detail?: unknown) => void;
}
