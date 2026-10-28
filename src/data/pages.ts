/**
 * Book structure (PRD §5.1): 17 sections on a cover plus 18 pages.
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
  { id: 'groom', section: 5, title: 'Meet the Couple: Rahul', contents: 'Meet the Couple', tone: 'ivory' },
  { id: 'bride', section: 5, title: 'Meet the Couple: Divya', tone: 'jasmine' },
  { id: 'family', section: 6, title: 'Parents and Family', contents: 'Parents and Family', tone: 'ivory' },
  { id: 'love-story', section: 7, title: 'Our Love Story', contents: 'Our Love Story', tone: 'jasmine' },
  { id: 'events', section: 8, title: 'Wedding Events: Mehndi and Haldi', contents: 'Wedding Events', tone: 'ivory' },
  { id: 'events-wedding', section: 8, title: 'Wedding Events: Sangeet, Wedding and Reception', tone: 'ivory' },
  { id: 'ceremony', section: 9, title: 'The Sacred Wedding Ceremony', contents: 'Wedding Ceremony', tone: 'ivory' },
  { id: 'reception', section: 10, title: 'Grand Wedding Reception', contents: 'Grand Reception', tone: 'evening' },
  { id: 'dress-code', section: 11, title: 'Dress Code', contents: 'Dress Code', tone: 'jasmine' },
  { id: 'venues', section: 12, title: 'Venues and Directions', contents: 'Venues and Directions', tone: 'ivory' },
  { id: 'travel', section: 13, title: 'Transportation and Accommodation', contents: 'Travel and Stay', tone: 'sandal-light' },
  { id: 'wishes', section: 14, title: 'Wishing Wall', contents: 'Wishing Wall', tone: 'ivory' },
  { id: 'rsvp', section: 15, title: 'RSVP', contents: 'RSVP', tone: 'sandal' },
  { id: 'help', section: 16, title: 'Need Help? Contact', contents: 'Need Help', tone: 'sandal-light' },
  { id: 'thank-you', section: 17, title: 'Thank You', contents: 'Thank You', tone: 'golden' },
];

export const lastPageIndex = bookPages.length - 1;
export const pageIndexById = (id: string) => bookPages.findIndex((p) => p.id === id);
