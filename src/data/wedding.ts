import { weddingSchema, type WeddingData } from './schema';

/**
 * THE central wedding data file (PRD §14.2). Every name, date, venue and number on the
 * site comes from here. `null` = to be provided. Do not invent values.
 *
 * Confirmed facts: names, wedding date, 10:30 AM IST Muhurtham, Tirupati (city only).
 * Everything marked "proposed", "draft" or "verifyBeforeLaunch" still needs family sign-off.
 */
const data: WeddingData = {
  site: {
    url: null,
    title: 'Rahul & Divya — Wedding Invitation · 7 April 2027 · Tirupati',
    description: 'Together with our families, we joyfully invite you to celebrate the wedding of Rahul & Divya in Tirupati.',
    shareText: 'You are invited to the wedding of Rahul & Divya — Wednesday, 7 April 2027, Tirupati.',
    showDeityImage: false, // Q-C1 default: symbolic Shankha, Chakra and Srivari Namam
    musicTrack: null, // Q-B5 default: no audio until a licensed track is supplied
    adminEmails: [],
    hiddenFields: [],
  },

  couple: {
    groom: { name: 'Rahul', fullName: null, honorific: null },
    bride: { name: 'Divya', fullName: null, honorific: null },
  },

  ceremony: {
    startISO: '2027-04-07T10:30:00+05:30',
    timeZone: 'Asia/Kolkata',
    city: 'Tirupati, Andhra Pradesh',
    venueId: 'ceremony',
    endISO: null, // never invented (PRD §6.4.5)
    provisionalDurationMinutes: null,
  },

  events: [
    { id: 'mehndi', name: 'Mehndi', startISO: '2027-04-05T16:00:00+05:30', timeStatus: 'proposed', venueId: 'bride-home' },
    { id: 'haldi', name: 'Haldi', startISO: '2027-04-06T09:00:00+05:30', timeStatus: 'proposed', venueId: 'groom-home' },
    { id: 'sangeet', name: 'Sangeet Night', startISO: '2027-04-06T18:30:00+05:30', timeStatus: 'proposed', venueId: 'function-hall' },
    { id: 'wedding', name: 'Hindu Wedding Ceremony', startISO: '2027-04-07T10:30:00+05:30', timeStatus: 'confirmed', venueId: 'ceremony' },
    { id: 'reception', name: 'Grand Wedding Reception', startISO: '2027-04-07T18:30:00+05:30', timeStatus: 'proposed', venueId: 'function-hall' },
  ],

  venues: [
    // The client's words: "the Tirupati temple" (30 October 2026). The map and Get Directions search Google Maps for this name and
    // address; once the families confirm the exact temple or hall, put its name and address (or its coordinates in lat and lng, or
    // its Google Maps link in mapsUrl) here and set locationStatus to 'confirmed'.
    {
      id: 'ceremony',
      label: 'Wedding Ceremony Venue',
      name: 'Tirupati Temple',
      address: 'Tirupati, Andhra Pradesh',
      mapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=Tirupati+Temple%2C+Tirupati%2C+Andhra+Pradesh',
      lat: null,
      lng: null,
      photo: null,
      privacy: 'public',
      locationStatus: 'toVerify',
    },
    { id: 'function-hall', label: 'Sangeet & Reception Hall', name: null, address: null, mapsUrl: null, lat: null, lng: null, photo: null, privacy: 'public' },
    // Q-D3 default: family home addresses are shared personally, not published
    { id: 'bride-home', label: "Bride's Family Home", name: null, address: null, mapsUrl: null, lat: null, lng: null, photo: null, privacy: 'onRequest' },
    { id: 'groom-home', label: "Groom's Family Home", name: null, address: null, mapsUrl: null, lat: null, lng: null, photo: null, privacy: 'onRequest' },
  ],

  family: {
    // The parents' photograph (both together, supplied by the client on 30 October 2026) and one sibling photograph for each
    // side (their names are not supplied yet: add `name` and, if they wish, change `relation` to Brother or Sister). The two
    // sibling photographs are matched to the sides in the order the client sent them: Rahul's, then Divya's; swap them here
    // if that is the wrong way round. fatherPhoto / motherPhoto (single portraits) are not used by the Parents page.
    groom: {
      father: 'Ravichandran',
      fatherWork: 'College Principal',
      fatherPhoto: null,
      mother: 'Sopna',
      motherWork: 'College Lecturer',
      motherPhoto: null,
      grandparents: [],
      siblings: [{ name: null, relation: 'Sibling', photo: { src: '/photos/family/groom-sibling.webp', alt: "The groom's sibling, smiling in a green and gold half-saree in front of a temple tower", focus: '50% 26%' } }],
      others: [],
      photo: { src: '/photos/family/groom-parents.webp', alt: "The groom's parents: his mother in a silk saree standing with her hand on the shoulder of his father, seated in a cane chair in a garden", focus: '50% 38%' },
    },
    bride: {
      father: 'Ravichandran',
      fatherWork: 'Businessman',
      fatherPhoto: null,
      mother: 'Kanimalar',
      motherWork: 'Teacher',
      motherPhoto: null,
      grandparents: [],
      siblings: [{ name: null, relation: 'Sibling', photo: { src: '/photos/family/bride-sibling.webp', alt: "The bride's sibling, smiling in an orange silk saree on temple steps among garlands", focus: '48% 14%' } }],
      others: [],
      photo: { src: '/photos/family/bride-parents.webp', alt: "The bride's parents: her father in a dark suit standing behind her mother, seated in a red and gold saree", focus: '50% 30%' },
    },
  },

  contacts: [
    { id: 'groom-rep', role: "Groom's Family Representative", name: null, phone: null, whatsapp: null, languages: [] },
    { id: 'bride-rep', role: "Bride's Family Representative", name: null, phone: null, whatsapp: null, languages: [] },
    { id: 'coordinator', role: 'Wedding Event Coordinator', name: null, phone: null, whatsapp: null, languages: [] },
  ],

  rsvp: {
    deadline: null,
    maxAttendees: null,
    notifyEmails: [],
    dietaryOptions: ['Vegetarian', 'Jain', 'No onion & garlic', 'Allergies (please specify)'],
  },

  // The couple's photographs (supplied by the client on 29 October 2026, in the order of the story). The
  // milestone titles are proposed; the story text is for the family to write (the board shows a short
  // generic line under each title until then).
  loveStory: [
    { title: 'Our First Meeting', titleStatus: 'proposed', text: null, photo: { src: '/photos/story/story-1.webp', alt: 'Rahul and Divya on a country path in the golden evening light, he looking at her with a hand on his heart' } },
    { title: 'Becoming Friends', titleStatus: 'proposed', text: null, photo: { src: '/photos/story/story-2.webp', alt: 'Divya splashing happily through a rainy street while Rahul watches her' } },
    { title: 'Falling in Love', titleStatus: 'proposed', text: null, photo: { src: '/photos/story/story-3.webp', alt: 'Divya resting her head on Rahul\'s shoulder as they watch the sun set over the sea' } },
    { title: 'A Beautiful Proposal', titleStatus: 'proposed', text: null, photo: { src: '/photos/story/story-4.webp', alt: 'Rahul and Divya together on a flower-hung swing under fairy lights' } },
    { title: 'Forever Begins', titleStatus: 'proposed', text: null, photo: { src: '/photos/story/story-5.webp', alt: 'Rahul and Divya walking hand in hand at sunset, their shadows growing old together' } },
  ],

  // The Dress Code cards, one per celebration. Each card shows its title and mood, a line of guidance and up to four
  // shades (a name and a colour, #rrggbb). Change any of it and the card follows; the couple's outfits and the
  // decoration on each card are the pictures src/assets/dresscode/card-<event>.webp (npm run dresscode:assets).
  dressCode: [
    {
      eventId: 'mehndi',
      title: 'Mehendi',
      tagline: 'Fresh • Elegant • Festive',
      suggestion: 'Graceful and comfortable festive attire.',
      palette: [
        { name: 'Olive green', color: '#666531' },
        { name: 'Sage', color: '#a09e73' },
        { name: 'Blush pink', color: '#dca694' },
        { name: 'Cream', color: '#e5d2b0' },
      ],
    },
    {
      eventId: 'haldi',
      title: 'Haldi',
      tagline: 'Bright • Cheerful • Traditional',
      suggestion: 'Light, vibrant and joyful traditional attire.',
      palette: [
        { name: 'Turmeric yellow', color: '#f3bc20' },
        { name: 'Marigold', color: '#e5a306' },
        { name: 'Sand', color: '#e3cda7' },
        { name: 'Leaf green', color: '#4f621d' },
      ],
    },
    {
      eventId: 'sangeet',
      title: 'Sangeet Night',
      tagline: 'Glamorous • Colourful • Fun',
      suggestion: 'Elegant festive attire with a touch of glamour.',
      palette: [
        { name: 'Maroon', color: '#720c20' },
        { name: 'Navy', color: '#253e72' },
        { name: 'Emerald', color: '#09453c' },
        { name: 'Mauve', color: '#af868b' },
      ],
    },
    {
      eventId: 'wedding',
      title: 'Wedding',
      tagline: 'Traditional • Grand • Elegant',
      suggestion: 'Classic South Indian traditional attire.',
      palette: [
        { name: 'Temple red', color: '#9c1c20' },
        { name: 'Antique gold', color: '#d6a34b' },
        { name: 'Ivory', color: '#ede0c2' },
        { name: 'Leaf green', color: '#4a5e1c' },
      ],
    },
    {
      eventId: 'reception',
      title: 'Reception',
      tagline: 'Elegant • Modern • Festive',
      suggestion: 'Elegant and stylish attire for a grand evening.',
      palette: [
        { name: 'Plum', color: '#90515f' },
        { name: 'Midnight navy', color: '#18243b' },
        { name: 'Steel grey', color: '#81878c' },
        { name: 'Champagne', color: '#ecdfc1' },
      ],
    },
  ],

  // Past guests' blessings: they hang on the Wishing Wall (and are listed in "View all wishes") until real blessings
  // take their places, so the wall always shows four boards. These four are SAMPLES for the template: replace them with
  // real blessings the guests have given, or empty the list (the wall then waits with empty boards). The launch check
  // (npm run build:production) stops the build while samples remain, unless 'wishingWall.samples' is in site.hiddenFields.
  wishingWall: {
    samples: [
      { name: 'Lakshmi Aunty', message: 'May your life together be filled with love and laughter.', writtenAt: '2026-10-19T19:42:00+05:30' },
      { name: 'Karthik & Meera', message: 'Wishing you a lifetime of happiness. Cannot wait to celebrate!', writtenAt: '2026-10-21T08:15:00+05:30' },
      { name: 'Suresh Uncle', message: 'God bless you both. May every sunrise bring you joy.', writtenAt: '2026-10-24T21:03:00+05:30' },
      { name: 'Anitha', message: 'Two hearts, one beautiful journey. Best wishes always!', writtenAt: '2026-10-27T17:30:00+05:30' },
    ],
  },

  travel: {
    airport: {
      title: 'Airport',
      summary: 'Tirupati International Airport (TIR), Renigunta',
      details: 'About 15 km from Tirupati city. Chennai International Airport is roughly 140 km away by road.',
      status: 'verifyBeforeLaunch',
    },
    railway: {
      title: 'Railway',
      summary: 'Tirupati Main (TPTY) · Renigunta Junction (RU)',
      details: null,
      status: 'verifyBeforeLaunch',
    },
    guidance: {
      title: 'Getting here',
      summary: 'April in Tirupati is typically hot',
      details: 'Light cotton clothing and staying hydrated are recommended.',
      status: 'verifyBeforeLaunch',
    },
    parking: { title: 'Parking', summary: null, details: null, status: 'toBeConfirmed' },
    accommodation: { title: 'Stay', summary: null, details: null, status: 'toBeConfirmed' },
    shuttle: { title: 'Pickup & shuttle', summary: null, details: null, status: 'toBeConfirmed' },
    assistanceContactId: null,
  },

  copy: {
    welcomeMessage: { text: 'Two families, one sacred promise. Your presence and blessings will make our celebration complete.', status: 'approved' },
    teluguTitle: { text: 'శుభలేఖ', status: 'draft' },
    closingLine: { text: 'Until we see you in Tirupati.', status: 'draft' },
    countdownArrived: { text: 'Our Auspicious Wedding Day Has Arrived!', status: 'approved' },
    postWedding: { text: 'Happily married on 7 April 2027. Thank you for your blessings.', status: 'draft' },
  },
};

export const wedding = weddingSchema.parse(data);
