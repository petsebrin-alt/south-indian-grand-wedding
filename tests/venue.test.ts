import { describe, expect, it } from 'vitest';
import type { Venue } from '../src/data/schema';
import { directionsUrl, hasLocation, locationUnavailableMessage, venueFallback } from '../src/lib/venue';
import { whatsappLink } from '../src/lib/travel';
import { wedding } from '../src/data/wedding';

const base: Venue = { id: 'ceremony', label: 'Wedding Ceremony Venue', name: null, address: null, mapsUrl: null, lat: null, lng: null, photo: null, privacy: 'public' };

describe('venue directions (PRD §6.9, §6.13)', () => {
  it('stays disabled until a public venue has a map link or coordinates', () => {
    expect(hasLocation(base)).toBe(false);
    expect(directionsUrl(base)).toBeNull();
    expect(locationUnavailableMessage(base)).toMatch(/once the venue is confirmed/);
  });

  it('builds Google Maps directions from coordinates', () => {
    expect(directionsUrl({ ...base, lat: 13.6288, lng: 79.4192 })).toBe('https://www.google.com/maps/dir/?api=1&destination=13.6288,79.4192');
  });

  it('prefers the families’ own map link', () => {
    expect(directionsUrl({ ...base, mapsUrl: 'https://maps.app.goo.gl/example', lat: 1, lng: 2 })).toBe('https://maps.app.goo.gl/example');
  });

  it('never publishes a family home marked "shared personally"', () => {
    const home = { ...base, privacy: 'onRequest' as const, lat: 1, lng: 2 };
    expect(directionsUrl(home)).toBeNull();
    expect(venueFallback(home)).toBe('Address shared personally');
  });

  it('has no venue locations yet in the real data (nothing invented)', () => {
    expect(wedding.venues.every((v) => directionsUrl(v) === null)).toBe(true);
  });
});

describe('dress code and contact helpers', () => {
  it('gives every dress-code card a title, a mood, a line of guidance and one to four named shades', () => {
    expect(wedding.dressCode.map((d) => d.eventId)).toEqual(wedding.events.map((e) => e.id));
    for (const d of wedding.dressCode) {
      expect(d.title.length).toBeGreaterThan(0);
      expect(d.tagline.length).toBeGreaterThan(0);
      expect(d.suggestion.length).toBeGreaterThan(0);
      expect(d.palette.length).toBeGreaterThanOrEqual(1);
      expect(d.palette.length).toBeLessThanOrEqual(4);
      for (const shade of d.palette) {
        expect(shade.name.length).toBeGreaterThan(0);
        expect(shade.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    }
  });

  it('builds a WhatsApp link with only digits and a friendly message', () => {
    expect(whatsappLink('+91 98765 43210')).toBe(`https://wa.me/919876543210?text=${encodeURIComponent("Namaste! I have a question about Rahul & Divya's wedding.")}`);
  });
});
