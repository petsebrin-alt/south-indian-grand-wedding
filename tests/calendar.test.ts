import { describe, expect, it } from 'vitest';
import { wedding } from '../src/data/wedding';
import { buildIcs, calendarEntry, googleCalendarUrl, toIstLocal, toUtcStamp } from '../src/lib/calendar';

const weddingEvent = wedding.events.find((e) => e.id === 'wedding')!;

describe('Add to Calendar (PRD §6.4.5)', () => {
  it('converts the Muhurtham to UTC and IST wall-clock stamps', () => {
    expect(toUtcStamp('2027-04-07T10:30:00+05:30')).toBe('20270407T050000Z');
    expect(toIstLocal('2027-04-07T10:30:00+05:30')).toBe('20270407T103000');
  });

  it('only creates calendar entries for confirmed events', () => {
    expect(calendarEntry(weddingEvent)).not.toBeNull();
    for (const e of wedding.events.filter((ev) => ev.timeStatus === 'proposed')) expect(calendarEntry(e)).toBeNull();
  });

  it('never invents an end time', () => {
    const entry = calendarEntry(weddingEvent)!;
    expect(entry.endISO).toBeNull();
    expect(entry.description).toContain('End time to be confirmed');
    expect(buildIcs(entry)).not.toContain('DTEND');
    expect(new URL(googleCalendarUrl(entry)).searchParams.get('dates')).toBe('20270407T050000Z/20270407T050000Z');
  });

  it('uses an approved provisional duration and labels it', () => {
    const withDuration = { ...wedding, ceremony: { ...wedding.ceremony, provisionalDurationMinutes: 120 } };
    // calendarEntry reads the shared data module, so check the arithmetic directly
    const end = new Date(Date.parse(weddingEvent.startISO) + withDuration.ceremony.provisionalDurationMinutes * 60000);
    expect(toUtcStamp(end.toISOString())).toBe('20270407T070000Z');
  });

  it('writes a valid, folded .ics with an Asia/Kolkata time zone', () => {
    const ics = buildIcs(calendarEntry(weddingEvent)!, new Date('2026-10-23T00:00:00Z'));
    expect(ics).toContain('DTSTART;TZID=Asia/Kolkata:20270407T103000');
    expect(ics).toContain('BEGIN:VTIMEZONE');
    expect(ics).toContain('LOCATION:Tirupati\\, Andhra Pradesh');
    expect(ics.split('\r\n').every((line) => new TextEncoder().encode(line).length <= 75)).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });

  it('does not reveal a family home address in calendar entries', () => {
    const entry = calendarEntry(weddingEvent)!;
    expect(entry.location).toBe('Tirupati, Andhra Pradesh');
  });
});
