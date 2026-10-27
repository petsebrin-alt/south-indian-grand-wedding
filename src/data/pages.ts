/**
 * Book structure (PRD §5.1): 18 sections on a cover plus 19 pages.
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
  { id: 'blessings', section: 4, title: 'Divine Blessings', contents: 'Divine Blessings', tone: 'ivory' },
  { id: 'countdown', section: 5, title: 'Wedding Countdown', contents: 'Wedding Countdown', tone: 'ivory' },
  { id: 'groom', section: 6, title: 'Meet the Couple: Rahul', contents: 'Meet the Couple', tone: 'ivory' },
  { id: 'bride', section: 6, title: 'Meet the Couple: Divya', tone: 'jasmine' },
  { id: 'family', section: 7, title: 'Parents and Family', contents: 'Parents and Family', tone: 'ivory' },
  { id: 'love-story', section: 8, title: 'Our Love Story', contents: 'Our Love Story', tone: 'jasmine' },
  { id: 'events', section: 9, title: 'Wedding Celebrations: Mehndi, Haldi, Sangeet', contents: 'Wedding Events Timeline', tone: 'ivory' },
  { id: 'events-wedding', section: 9, title: 'Wedding Celebrations: Wedding and Reception', tone: 'ivory' },
  { id: 'ceremony', section: 10, title: 'The Sacred Wedding Ceremony', contents: 'Wedding Ceremony', tone: 'ivory' },
  { id: 'reception', section: 11, title: 'Grand Wedding Reception', contents: 'Grand Reception', tone: 'evening' },
  { id: 'dress-code', section: 12, title: 'Dress Code', contents: 'Dress Code', tone: 'jasmine' },
  { id: 'venues', section: 13, title: 'Venues and Directions', contents: 'Venues and Directions', tone: 'ivory' },
  { id: 'travel', section: 14, title: 'Transportation and Accommodation', contents: 'Travel and Stay', tone: 'sandal-light' },
  { id: 'wishes', section: 15, title: 'Wishing Wall', contents: 'Wishing Wall', tone: 'ivory' },
  { id: 'rsvp', section: 16, title: 'RSVP', contents: 'RSVP', tone: 'sandal' },
  { id: 'help', section: 17, title: 'Need Help? Contact', contents: 'Need Help', tone: 'sandal-light' },
  { id: 'thank-you', section: 18, title: 'Thank You', contents: 'Thank You', tone: 'golden' },
];

export const lastPageIndex = bookPages.length - 1;
export const pageIndexById = (id: string) => bookPages.findIndex((p) => p.id === id);
