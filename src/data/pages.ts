/**
 * Book structure (PRD §5.1): 13 sections on a cover plus 13 pages. The Grand Reception page, the RSVP form page, the two
 * Meet the Couple pages (Rahul, Divya) and the separate Travel page (now one page with the Venue) are no longer in the book
 * (the client's requests, 30 October 2026).
 * `index` 0 is the cover; page numbers shown to guests equal the index.
 */
export type PageTone = 'ivory' | 'jasmine' | 'sandal' | 'sandal-light' | 'evening' | 'golden';

export interface BookPage {
  id: string;
  section: number;
  title: string;
  /** Contents label; only the first page of a section appears in Contents. */
  contents?: string;
  tone: PageTone;
}

export const bookPages: BookPage[] = [
  { id: 'cover', section: 1, title: 'Royal Temple Invitation Opening', contents: 'The Invitation Opening', tone: 'ivory' },
  { id: 'welcome', section: 2, title: 'Welcome Invitation', contents: 'Welcome', tone: 'jasmine' },
  { id: 'save-the-date', section: 3, title: 'Save the Date', contents: 'Save the Date', tone: 'sandal' },
  { id: 'countdown', section: 4, title: 'Wedding Countdown', contents: 'Wedding Countdown', tone: 'ivory' },
  { id: 'family', section: 5, title: 'Parents and Family', contents: 'Parents and Family', tone: 'ivory' },
  { id: 'love-story', section: 6, title: 'Our Love Story', contents: 'Our Love Story', tone: 'jasmine' },
  { id: 'events', section: 7, title: 'Wedding Events: Mehndi and Haldi', contents: 'Wedding Events', tone: 'ivory' },
  { id: 'events-wedding', section: 7, title: 'Wedding Events: Sangeet, Wedding and Reception', tone: 'ivory' },
  { id: 'ceremony', section: 8, title: 'The Sacred Wedding Ceremony', contents: 'Wedding Ceremony', tone: 'ivory' },
  { id: 'wishes', section: 9, title: 'Wishing Wall', contents: 'Wishing Wall', tone: 'ivory' },
  { id: 'dress-code', section: 10, title: 'Dress Code', contents: 'Dress Code', tone: 'jasmine' },
  { id: 'venues', section: 11, title: 'Venue and Travel', contents: 'Venue and Travel', tone: 'ivory' },
  { id: 'help', section: 12, title: 'Need Help? Contact', contents: 'Need Help', tone: 'sandal-light' },
  { id: 'thank-you', section: 13, title: 'Thank You', contents: 'Thank You', tone: 'golden' },
];

export const lastPageIndex = bookPages.length - 1;
export const pageIndexById = (id: string) => bookPages.findIndex((p) => p.id === id);
