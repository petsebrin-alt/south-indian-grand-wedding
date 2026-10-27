import { z } from 'zod';

/**
 * Schema for the central wedding data file (PRD §14.2).
 * `null` always means "to be provided" (PRD §4.3) — never replace it with invented values.
 */

/** ISO date-time fixed to India Standard Time, e.g. 2027-04-07T10:30:00+05:30 */
const istDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+05:30$/, 'Use an IST ISO time like 2027-04-07T10:30:00+05:30');
const text = z.string().trim().min(1);
const maybeText = text.nullable();

const photo = z.object({ src: text, alt: text }).nullable();
const draft = z.object({ text, status: z.enum(['draft', 'approved']) });

const relative = z.object({ name: text, relation: text, photo });
const familySide = z.object({
  father: maybeText,
  mother: maybeText,
  grandparents: z.array(relative),
  siblings: z.array(relative),
  others: z.array(relative),
  photo,
});

const partner = z.object({
  name: text,
  fullName: maybeText,
  honorific: maybeText,
  portrait: photo,
  bio: maybeText,
  memories: z.array(z.object({ photo: photo.unwrap(), caption: maybeText })).max(6),
});

export const eventIds = ['mehndi', 'haldi', 'sangeet', 'wedding', 'reception'] as const;
export const venueIds = ['ceremony', 'function-hall', 'bride-home', 'groom-home'] as const;

const travelItem = z.object({
  title: text,
  summary: maybeText,
  details: maybeText,
  status: z.enum(['verifyBeforeLaunch', 'toBeConfirmed', 'verified']),
});

export const weddingSchema = z.object({
  site: z.object({
    url: z.url().nullable(),
    title: text,
    description: text,
    shareText: text,
    showDeityImage: z.boolean(),
    musicTrack: maybeText,
    adminEmails: z.array(z.email()),
    /** Dotted paths of launch-blocking fields the families chose to hide rather than fill. */
    hiddenFields: z.array(text),
  }),
  couple: z.object({ groom: partner, bride: partner }),
  ceremony: z.object({
    startISO: istDateTime,
    timeZone: z.literal('Asia/Kolkata'),
    city: text,
    venueId: z.enum(venueIds),
    endISO: istDateTime.nullable(),
    provisionalDurationMinutes: z.number().int().positive().nullable(),
  }),
  events: z
    .array(
      z.object({
        id: z.enum(eventIds),
        name: text,
        startISO: istDateTime,
        timeStatus: z.enum(['proposed', 'confirmed']),
        venueId: z.enum(venueIds),
      }),
    )
    .length(5),
  venues: z
    .array(
      z.object({
        id: z.enum(venueIds),
        label: text,
        name: maybeText,
        address: maybeText,
        mapsUrl: z.url().nullable(),
        lat: z.number().nullable(),
        lng: z.number().nullable(),
        photo,
        privacy: z.enum(['public', 'onRequest']),
      }),
    )
    .length(4),
  family: z.object({ groom: familySide, bride: familySide }),
  contacts: z.array(
    z.object({
      id: z.enum(['groom-rep', 'bride-rep', 'coordinator']),
      role: text,
      name: maybeText,
      phone: z.string().regex(/^\+\d{8,15}$/, 'Use international format, e.g. +91XXXXXXXXXX').nullable(),
      whatsapp: z.string().regex(/^\+\d{8,15}$/).nullable(),
      languages: z.array(text),
    }),
  ),
  rsvp: z.object({
    deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    maxAttendees: z.number().int().min(1).max(20).nullable(),
    notifyEmails: z.array(z.email()),
    dietaryOptions: z.array(text),
  }),
  loveStory: z.array(
    z.object({
      title: text,
      titleStatus: z.enum(['proposed', 'confirmed']),
      text: maybeText,
      photo,
    }),
  ),
  dressCode: z.array(z.object({ eventId: z.enum(eventIds), suggestion: text, palette: z.array(text) })),
  travel: z.object({
    airport: travelItem,
    railway: travelItem,
    guidance: travelItem,
    parking: travelItem,
    accommodation: travelItem,
    shuttle: travelItem,
    assistanceContactId: z.enum(['groom-rep', 'bride-rep', 'coordinator']).nullable(),
  }),
  copy: z.object({
    welcomeMessage: draft,
    teluguTitle: draft,
    closingLine: draft,
    countdownArrived: draft,
    postWedding: draft,
  }),
});

export type WeddingData = z.infer<typeof weddingSchema>;
export type WeddingEvent = WeddingData['events'][number];
export type Venue = WeddingData['venues'][number];
