import { describe, expect, it } from 'vitest';
import { wedding } from '../src/data/wedding';
import { weddingSchema } from '../src/data/schema';
import { checkContent, launchBlockers } from '../src/data/content-check';
import { bookPages } from '../src/data/pages';
import { dateParts, formatDateLong, formatDateShort, formatTime } from '../src/lib/format';

describe('confirmed wedding facts', () => {
  it('formats the Muhurtham in IST regardless of the machine time zone', () => {
    expect(formatDateLong(wedding.ceremony.startISO)).toBe('Wednesday, 7 April 2027');
    expect(formatTime(wedding.ceremony.startISO)).toBe('10:30 AM');
    expect(dateParts(wedding.ceremony.startISO)).toEqual({ day: '07', month: 'APRIL', year: '2027', weekday: 'Wednesday' });
  });

  it('lists the five events in order with the right weekdays', () => {
    expect(wedding.events.map((e) => e.id)).toEqual(['mehndi', 'haldi', 'sangeet', 'wedding', 'reception']);
    expect(wedding.events.map((e) => formatDateShort(e.startISO))).toEqual([
      'Mon, 5 Apr 2027',
      'Tue, 6 Apr 2027',
      'Tue, 6 Apr 2027',
      'Wed, 7 Apr 2027',
      'Wed, 7 Apr 2027',
    ]);
  });

  it('marks only the wedding ceremony time as confirmed', () => {
    expect(wedding.events.filter((e) => e.timeStatus === 'confirmed').map((e) => e.id)).toEqual(['wedding']);
  });
});

describe('no invented personal details (PRD §4)', () => {
  it('holds only the family details the client supplied, and keeps venues, contacts and end time empty until provided', () => {
    // Supplied by the client on 28 October 2026
    expect(Object.values(wedding.family).flatMap((f) => [f.father, f.mother])).toEqual(['Ravichandran', 'Sopna', 'Ravichandran', 'Kanimalar']);
    expect(Object.values(wedding.family).every((f) => f.siblings.every((x) => x.name === null) && f.grandparents.length === 0)).toBe(true);
    // The parents' photographs (each side's two parents together) and one sibling photograph each, supplied on 30 October 2026; no sibling names
    expect(Object.values(wedding.family).map((f) => f.photo?.src)).toEqual(['/photos/family/groom-parents.webp', '/photos/family/bride-parents.webp']);
    expect(Object.values(wedding.family).flatMap((f) => f.siblings.map((x) => [x.name, x.photo?.src]))).toEqual([
      [null, '/photos/family/groom-sibling.webp'],
      [null, '/photos/family/bride-sibling.webp'],
    ]);
    expect(Object.values(wedding.family).every((f) => f.fatherPhoto === null && f.motherPhoto === null)).toBe(true);
    // only the wedding venue is known (the client's "Tirupati temple"); the hall and the family homes are not
    expect(wedding.venues.filter((v) => v.name !== null).map((v) => v.id)).toEqual(['ceremony']);
    expect(wedding.venues.filter((v) => v.id !== 'ceremony').every((v) => v.name === null && v.address === null && v.mapsUrl === null)).toBe(true);
    expect(wedding.contacts.every((c) => c.name === null && c.phone === null)).toBe(true);
    expect(wedding.ceremony.endISO).toBeNull();
  });
});

describe('wishing wall samples', () => {
  it('has four past guests\' blessings, each with a name, a message short enough for a board and a time in the past', () => {
    expect(wedding.wishingWall.samples).toHaveLength(4);
    for (const w of wedding.wishingWall.samples) {
      expect(w.name.length).toBeGreaterThan(0);
      expect(w.message.length).toBeGreaterThan(10);
      expect(w.message.length).toBeLessThanOrEqual(80);
      expect(new Date(w.writtenAt).getTime()).toBeLessThan(Date.parse('2027-04-07'));
    }
  });

  it('holds production back while samples remain, unless the families chose to keep them', () => {
    expect(launchBlockers(wedding).some((b) => b.id === 'S-01')).toBe(true);
    expect(launchBlockers({ ...wedding, wishingWall: { samples: [] } }).some((b) => b.id === 'S-01')).toBe(false);
    expect(launchBlockers({ ...wedding, site: { ...wedding.site, hiddenFields: ['wishingWall.samples'] } }).some((b) => b.id === 'S-01')).toBe(false);
  });
});

describe('launch check', () => {
  it('blocks production while launch-critical details are missing', () => {
    const blockers = launchBlockers(wedding);
    expect(blockers.map((b) => b.id)).toEqual(expect.arrayContaining(['M-14', 'M-19', 'M-28']));
  });

  it('does not block on the wedding venue (the Tirupati main temple, as the client asked) and has nothing to confirm about it', () => {
    expect(launchBlockers(wedding).some((b) => b.id === 'M-13')).toBe(false);
    expect(checkContent(wedding).some((i) => i.id === 'M-13')).toBe(false);
  });

  it('notes, without blocking, a venue marked as still to be verified', () => {
    const unsure = { ...wedding, venues: wedding.venues.map((v) => (v.id === 'ceremony' ? { ...v, locationStatus: 'toVerify' as const } : v)) };
    expect(launchBlockers(unsure).some((b) => b.id === 'M-13')).toBe(false);
    expect(checkContent(unsure).some((i) => i.id === 'M-13' && !i.blocking && /confirm the exact name and map pin/.test(i.label))).toBe(true);
  });

  it('accepts a field the families chose to hide', () => {
    expect(launchBlockers(wedding).some((b) => b.path === 'site.url')).toBe(true);
    const hidden = { ...wedding, site: { ...wedding.site, hiddenFields: ['site.url'] } };
    expect(launchBlockers(hidden).some((b) => b.path === 'site.url')).toBe(false);
  });

  it('treats a home marked "shared personally" as resolved', () => {
    expect(checkContent(wedding).some((i) => i.path === 'venues.bride-home')).toBe(false);
  });

  it('rejects malformed data such as a non-IST time', () => {
    const bad = structuredClone(wedding) as typeof wedding;
    (bad.ceremony as { startISO: string }).startISO = '2027-04-07T10:30:00Z';
    expect(weddingSchema.safeParse(bad).success).toBe(false);
  });
});

describe('book structure (PRD §5.1)', () => {
  it('has a cover plus 13 pages covering all 13 sections (Divine Blessings, the Reception page, the RSVP page, the two Meet the Couple pages and the separate Travel page removed at the client\'s request)', () => {
    expect(bookPages).toHaveLength(14);
    expect(new Set(bookPages.map((p) => p.section)).size).toBe(13);
    expect(bookPages.filter((p) => p.contents)).toHaveLength(13);
  });

  it('runs Welcome, Save the Date, Countdown, Parents, Love Story, Events, Ceremony, Wishing Wall, Dress Code, Venue and Travel, Need Help, Thank You', () => {
    const ids = bookPages.map((p) => p.id);
    expect(ids).toEqual(['cover', 'welcome', 'save-the-date', 'countdown', 'family', 'love-story', 'events', 'events-wedding', 'ceremony', 'wishes', 'dress-code', 'venues', 'help', 'thank-you']);
    for (const gone of ['groom', 'bride', 'reception', 'rsvp', 'travel']) expect(ids).not.toContain(gone);
  });
});

