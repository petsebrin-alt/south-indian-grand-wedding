/**
 * Local development store: the same Store contract as Postgres, persisted to .data/dev-db.json
 * so RSVPs and wishes survive dev-server restarts. Never used in production.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Mail, NewRsvp, NewWish, Page, RsvpRecord, Store, WishRecord, WishStatus } from '../../supabase/functions/_shared/types.ts';

interface Db {
  rsvps: RsvpRecord[];
  wishes: WishRecord[];
  events: { kind: string; ip_hash: string; created_at: string }[];
  outbox: (Mail & { sent_at: string })[];
}

const empty = (): Db => ({ rsvps: [], wishes: [], events: [], outbox: [] });

export class FileStore implements Store {
  private db: Db;

  constructor(private path: string) {
    this.db = existsSync(path) ? { ...empty(), ...JSON.parse(readFileSync(path, 'utf8')) } : empty();
  }

  private save() {
    mkdirSync(dirname(this.path), { recursive: true });
    writeFileSync(this.path, JSON.stringify(this.db, null, 2));
  }

  reset() {
    this.db = empty();
    this.save();
  }

  get outbox() {
    return this.db.outbox;
  }

  recordMail(mail: Mail) {
    this.db.outbox.push({ ...mail, sent_at: new Date().toISOString() });
    this.save();
  }

  async findRsvpByKey(key: string) {
    return this.db.rsvps.find((r) => r.idempotency_key === key) ?? null;
  }

  async getRsvp(id: string) {
    return this.db.rsvps.find((r) => r.id === id) ?? null;
  }

  async insertRsvp(row: NewRsvp) {
    const now = new Date().toISOString();
    const record: RsvpRecord = { ...row, id: randomUUID(), created_at: now, updated_at: now };
    this.db.rsvps.push(record);
    this.save();
    return record;
  }

  async updateRsvp(id: string, patch: Partial<NewRsvp>) {
    const record = this.db.rsvps.find((r) => r.id === id);
    if (!record) throw new Error('not found');
    Object.assign(record, patch, { updated_at: new Date().toISOString() });
    this.save();
    return record;
  }

  async listRsvps() {
    return [...this.db.rsvps].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async findWishByKey(key: string) {
    return this.db.wishes.find((w) => w.idempotency_key === key) ?? null;
  }

  async insertWish(row: NewWish) {
    const record: WishRecord = { ...row, id: randomUUID(), created_at: new Date().toISOString(), moderated_at: null, moderated_by: null };
    this.db.wishes.push(record);
    this.save();
    return record;
  }

  async listWishes({ status, cursor, limit }: { status: WishStatus; cursor?: string | null; limit: number }): Promise<Page<WishRecord>> {
    const all = this.db.wishes.filter((w) => w.status === status).sort((a, b) => b.created_at.localeCompare(a.created_at));
    const after = cursor ? all.filter((w) => w.created_at < cursor) : all;
    const items = after.slice(0, limit);
    return { items, nextCursor: after.length > limit ? items[items.length - 1].created_at : null, total: all.length };
  }

  async moderateWish(id: string, status: WishStatus, by: string) {
    const wish = this.db.wishes.find((w) => w.id === id);
    if (!wish) return null;
    Object.assign(wish, { status, moderated_by: by, moderated_at: new Date().toISOString() });
    this.save();
    return wish;
  }

  async countEvents(kind: 'rsvp' | 'wish', ipHash: string, sinceIso: string) {
    return this.db.events.filter((e) => e.kind === kind && e.ip_hash === ipHash && e.created_at >= sinceIso).length;
  }

  async addEvent(kind: 'rsvp' | 'wish', ipHash: string) {
    this.db.events.push({ kind, ip_hash: ipHash, created_at: new Date().toISOString() });
    this.save();
  }
}
