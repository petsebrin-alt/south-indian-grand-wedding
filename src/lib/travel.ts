import { wedding } from '../data/wedding';

/** The items of wedding.travel that have a title and a summary (the Venue and Travel page shows airport, railway and stay). */
export type TravelKey = 'airport' | 'railway' | 'guidance' | 'parking' | 'accommodation' | 'shuttle';

export const travelItem = (key: TravelKey) => wedding.travel[key];

export const assistanceContact = () => wedding.contacts.find((c) => c.id === wedding.travel.assistanceContactId) ?? null;

export const whatsappLink = (number: string, text = "Namaste! I have a question about Rahul & Divya's wedding.") =>
  `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
