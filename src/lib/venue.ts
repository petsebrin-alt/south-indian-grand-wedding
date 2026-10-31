import type { Venue, WeddingEvent } from '../data/schema';
import { wedding } from '../data/wedding';

/**
 * Venue and action rules (PRD §6.9, §6.13). Directions activate only once a public venue has a
 * map link or coordinates; family homes marked "shared personally" never publish a location.
 */
export const venueById = (id: string): Venue => wedding.venues.find((v) => v.id === id)!;

export function hasLocation(v: Venue): boolean {
  return v.privacy === 'public' && !!(v.mapsUrl || (v.lat !== null && v.lng !== null));
}

export function directionsUrl(v: Venue): string | null {
  if (!hasLocation(v)) return null;
  if (v.mapsUrl) return v.mapsUrl;
  return `https://www.google.com/maps/dir/?api=1&destination=${v.lat},${v.lng}`;
}

/** What Google Maps is asked for: the venue's mapQuery, else its coordinates, else its name and address. */
const mapQueryOf = (v: Venue): string => v.mapQuery ?? (v.lat !== null && v.lng !== null ? `${v.lat},${v.lng}` : [v.name, v.address].filter(Boolean).join(', '));

/**
 * The map shown on the Venue page: Google Maps' own embed (no key needed), on a search for the venue's mapQuery, or else on its
 * coordinates, or else on a search for its name and address. Null while the venue has no public location.
 */
export function mapEmbedUrl(v: Venue): string | null {
  if (!hasLocation(v)) return null;
  const q = mapQueryOf(v);
  return q ? `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed` : null;
}

/**
 * Google Maps' route to the venue from a place (an airport, a station): its own directions page, on the venue's coordinates,
 * or its search query, or its name and address. Null while the venue has no public location or the place is not known.
 */
export function routeUrl(from: string | null | undefined, v: Venue): string | null {
  if (!from || !hasLocation(v)) return null;
  const to = mapQueryOf(v);
  return to ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&travelmode=driving` : null;
}

/** Guest-facing line when the venue name or address is not available. */
export function venueFallback(v: Venue): string {
  return v.privacy === 'onRequest' ? 'Address shared personally' : 'Venue details will be shared soon';
}

/** Why the Location / Get Directions button is not active yet. */
export function locationUnavailableMessage(v: Venue): string {
  return v.privacy === 'onRequest' ? 'The address is shared personally — please contact the family' : 'Location will be shared once the venue is confirmed';
}

export const CALENDAR_PENDING = 'Calendar opens once the timing is confirmed';

export const dressCodeFor = (e: WeddingEvent) => wedding.dressCode.find((d) => d.eventId === e.id);
