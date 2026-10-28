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
    { id: 'ceremony', label: 'Wedding Ceremony Venue', name: null, address: null, mapsUrl: null, lat: null, lng: null, photo: null, privacy: 'public' },
    { id: 'function-hall', label: 'Sangeet & Reception Hall', name: null, address: null, mapsUrl: null, lat: null, lng: null, photo: null, privacy: 'public' },
    // Q-D3 default: family home addresses are shared personally, not published
    { id: 'bride-home', label: "Bride's Family Home", name: null, address: null, mapsUrl: null, lat: null, lng: null, photo: null, privacy: 'onRequest' },
    { id: 'groom-home', label: "Groom's Family Home", name: null, address: null, mapsUrl: null, lat: null, lng: null, photo: null, privacy: 'onRequest' },
  ],

  family: {
    groom: { father: 'Ravichandran', fatherWork: 'College Principal', fatherPhoto: { src: '/photos/family/groom-father.webp', alt: 'Ravichandran, the groom\'s father' }, mother: 'Sopna', motherWork: 'College Lecturer', motherPhoto: { src: '/photos/family/groom-mother.webp', alt: 'Sopna, the groom\'s mother' }, grandparents: [], siblings: [], others: [], photo: null },
    bride: { father: 'Ravichandran', fatherWork: 'Businessman', fatherPhoto: { src: '/photos/family/bride-father.webp', alt: 'Ravichandran, the bride\'s father' }, mother: 'Kanimalar', motherWork: 'Teacher', motherPhoto: { src: '/photos/family/bride-mother.webp', alt: 'Kanimalar, the bride\'s mother' }, grandparents: [], siblings: [], others: [], photo: null },
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

  loveStory: [
    { title: 'Our First Meeting', titleStatus: 'proposed', text: null, photo: null },
    { title: 'Becoming Friends', titleStatus: 'proposed', text: null, photo: null },
    { title: 'Falling in Love', titleStatus: 'proposed', text: null, photo: null },
    { title: 'A Beautiful Proposal', titleStatus: 'proposed', text: null, photo: null },
    { title: 'Forever Begins', titleStatus: 'proposed', text: null, photo: null },
  ],

  dressCode: [
    { eventId: 'mehndi', suggestion: 'Colourful festive ethnic wear', palette: ['Leaf green', 'Rose pink', 'Marigold'] },
    { eventId: 'haldi', suggestion: 'Yellow or ivory traditional clothing', palette: ['Turmeric yellow', 'Ivory', 'Soft green'] },
    { eventId: 'sangeet', suggestion: 'Elegant festive attire', palette: ['Emerald', 'Ruby', 'Sapphire'] },
    { eventId: 'wedding', suggestion: 'Traditional South Indian silk sarees, veshti (pancha), kurta or ethnic formal wear', palette: ['Temple maroon', 'Antique gold', 'Ivory'] },
    { eventId: 'reception', suggestion: 'Elegant traditional or formal clothing', palette: ['Ivory', 'Champagne gold', 'Blush'] },
  ],

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
