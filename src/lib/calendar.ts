import { wedding } from '../data/wedding';
import type { WeddingEvent } from '../data/schema';
import { formatDateLong, formatTime } from './format';

/**
 * Add to Calendar (PRD §6.4.5). Never invents an end time: entries are start-only (zero
 * duration) unless the families supply an end time or approve a provisional duration.
 * Only confirmed events get calendar entries (Q-B2 default).
 */
export interface CalendarEntry {
  id: string;
  title: string;
  startISO: string;
  endISO: string | null;
  location: string;
  description: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** 2027-04-07T10:30:00+05:30 → 20270407T050000Z */
export function toUtcStamp(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

/** 2027-04-07T10:30:00+05:30 → 20270407T103000 (wall-clock time in IST) */
export function toIstLocal(iso: string): string {
  const [date, time] = iso.split('T');
  return `${date.replaceAll('-', '')}T${time.slice(0, 8).replaceAll(':', '')}`;
}

export function calendarEntry(event: WeddingEvent): CalendarEntry | null {
  if (event.timeStatus !== 'confirmed') return null;
  const venue = wedding.venues.find((v) => v.id === event.venueId)!;
  const isWedding = event.id === 'wedding';
  const { endISO, provisionalDurationMinutes } = wedding.ceremony;
  const end = isWedding
    ? (endISO ?? (provisionalDurationMinutes ? new Date(Date.parse(event.startISO) + provisionalDurationMinutes * 60000).toISOString() : null))
    : null;
  const endNote = end ? (isWedding && !endISO ? 'Provisional duration — final timing to be confirmed.' : '') : 'End time to be confirmed.';
  const location = venue.name && venue.address && venue.privacy === 'public' ? `${venue.name}, ${venue.address}` : wedding.ceremony.city;
  const { groom, bride } = wedding.couple;
  return {
    id: event.id,
    title: isWedding
      ? `${groom.name} & ${bride.name} — Wedding Ceremony (Muhurtham ${formatTime(event.startISO)} IST)`
      : `${groom.name} & ${bride.name} — ${event.name}`,
    startISO: event.startISO,
    endISO: end,
    location,
    description: [`${formatDateLong(event.startISO)}, ${formatTime(event.startISO)} IST.`, endNote, wedding.site.url ?? ''].filter(Boolean).join(' '),
  };
}

export function googleCalendarUrl(e: CalendarEntry): string {
  const start = toUtcStamp(e.startISO);
  const end = e.endISO ? toUtcStamp(e.endISO) : start;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${start}/${end}`,
    ctz: 'Asia/Kolkata',
    details: e.description,
    location: e.location,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

const escapeIcs = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Fold long lines at 75 octets as RFC 5545 requires. */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let current = '';
  let size = 0;
  for (const ch of line) {
    const n = new TextEncoder().encode(ch).length;
    if (size + n > (out.length ? 74 : 75)) {
      out.push(current);
      current = '';
      size = 0;
    }
    current += ch;
    size += n;
  }
  out.push(current);
  return out.join('\r\n ');
}

export function buildIcs(e: CalendarEntry, dtstamp = new Date()): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Rahul & Divya//Wedding Invitation//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Kolkata',
    'BEGIN:STANDARD',
    'DTSTART:19700101T000000',
    'TZOFFSETFROM:+0530',
    'TZOFFSETTO:+0530',
    'TZNAME:IST',
    'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `UID:${e.id}-${toIstLocal(e.startISO)}@rahul-divya-invitation`,
    `DTSTAMP:${toUtcStamp(dtstamp.toISOString())}`,
    `DTSTART;TZID=Asia/Kolkata:${toIstLocal(e.startISO)}`,
    ...(e.endISO ? [`DTEND:${toUtcStamp(e.endISO)}`] : []),
    `SUMMARY:${escapeIcs(e.title)}`,
    `LOCATION:${escapeIcs(e.location)}`,
    `DESCRIPTION:${escapeIcs(e.description)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}

/** Plain-text details for "Copy details". */
export function plainDetails(e: CalendarEntry): string {
  return `${e.title}\n${formatDateLong(e.startISO)}, ${formatTime(e.startISO)} IST\n${e.location}`;
}
