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
