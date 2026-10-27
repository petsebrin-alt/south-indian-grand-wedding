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
  it('keeps every family name, venue, contact and end time empty until provided', () => {
    expect(Object.values(wedding.family).flatMap((f) => [f.father, f.mother])).toEqual([null, null, null, null]);
    expect(wedding.venues.every((v) => v.name === null && v.address === null && v.mapsUrl === null)).toBe(true);
    expect(wedding.contacts.every((c) => c.name === null && c.phone === null)).toBe(true);
    expect(wedding.ceremony.endISO).toBeNull();
  });
});

describe('launch check', () => {
  it('blocks production while launch-critical details are missing', () => {
    const blockers = launchBlockers(wedding);
    expect(blockers.map((b) => b.id)).toEqual(expect.arrayContaining(['M-01', 'M-13', 'M-19', 'M-28']));
  });

  it('accepts a field the families chose to hide', () => {
    const hidden = { ...wedding, site: { ...wedding.site, hiddenFields: ['family.groom.father'] } };
    expect(launchBlockers(hidden).some((b) => b.path === 'family.groom.father')).toBe(false);
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
  it('has a cover plus 18 pages covering all 17 sections (Divine Blessings removed at the client\'s request)', () => {
    expect(bookPages).toHaveLength(19);
    expect(new Set(bookPages.map((p) => p.section)).size).toBe(17);
    expect(bookPages.filter((p) => p.contents)).toHaveLength(17);
  });
});
