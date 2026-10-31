import { z } from 'zod';

/**
 * Schema for the central wedding data file (PRD §14.2).
 * `null` always means "to be provided" (PRD §4.3) — never replace it with invented values.
 */

/** ISO date-time fixed to India Standard Time, e.g. 2027-04-07T10:30:00+05:30 */
const istDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+05:30$/, 'Use an IST ISO time like 2027-04-07T10:30:00+05:30');
const text = z.string().trim().min(1);
const maybeText = text.nullable();

// `focus` is where the picture is anchored when it is cropped to a frame (CSS object-position, e.g. '50% 20%': the middle, a fifth down)
const photo = z.object({ src: text, alt: text, focus: z.string().regex(/^\d{1,3}% \d{1,3}%$/).optional() }).nullable();
const draft = z.object({ text, status: z.enum(['draft', 'approved']) });

const relative = z.object({ name: maybeText, relation: text, photo });
const familySide = z.object({
  father: maybeText,
  fatherWork: maybeText,
  fatherPhoto: photo,
  mother: maybeText,
  motherWork: maybeText,
  motherPhoto: photo,
  grandparents: z.array(relative),
  siblings: z.array(relative),
  others: z.array(relative),
  photo,
});

const partner = z.object({
  name: text,
  fullName: maybeText,
  honorific: maybeText,
});

export const eventIds = ['mehndi', 'haldi', 'sangeet', 'wedding', 'reception'] as const;
export const venueIds = ['ceremony', 'function-hall', 'bride-home', 'groom-home'] as const;

const travelItem = z.object({
  title: text,
  summary: maybeText,
  details: maybeText,
  // Where it is, as Google Maps would be asked for it: the arrow on its line opens the route from here to the wedding venue
  place: maybeText.optional(),
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
        // What Google Maps is asked for (the embedded map and, when there is no mapsUrl, Get Directions): left out, the name and address are used
        mapQuery: text.optional(),
        lat: z.number().nullable(),
        lng: z.number().nullable(),
        photo,
        privacy: z.enum(['public', 'onRequest']),
        // 'toVerify' while the families have not yet confirmed the exact name and map pin (a launch note, not a blocker); left out means confirmed
        locationStatus: z.enum(['confirmed', 'toVerify']).optional(),
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
      email: z.email().nullable().optional(),
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
  // One card per celebration on the Dress Code page: its title and three-word mood, the line of guidance, and up to four
  // shades (a name and a #rrggbb colour each) shown as colour discs. All of it can be changed here.
  dressCode: z.array(
    z.object({
      eventId: z.enum(eventIds),
      title: text,
      tagline: text,
      suggestion: text,
      palette: z.array(z.object({ name: text, color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'a colour like #7a2635') })).min(1).max(4),
    }),
  ),
  // Past guests' blessings shown on the Wishing Wall (and in "View all wishes") until real ones fill it, so the wall always
  // hangs four boards. They are samples for the template: replace them with real blessings or empty the list before launch.
  wishingWall: z.object({
    samples: z.array(z.object({ name: text, message: text, writtenAt: istDateTime })).max(4),
  }),
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
