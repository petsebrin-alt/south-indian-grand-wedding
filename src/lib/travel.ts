import { wedding } from '../data/wedding';

/** Travel tiles (PRD §6.14): order, icon and sheet id for each item in wedding.travel. */
export const travelTiles = [
  { key: 'airport', icon: 'plane' },
  { key: 'railway', icon: 'train' },
  { key: 'guidance', icon: 'compass' },
  { key: 'parking', icon: 'parking' },
  { key: 'accommodation', icon: 'hotel' },
  { key: 'shuttle', icon: 'bus' },
] as const;

export type TravelKey = (typeof travelTiles)[number]['key'];

export const travelItem = (key: TravelKey) => wedding.travel[key];

export const assistanceContact = () => wedding.contacts.find((c) => c.id === wedding.travel.assistanceContactId) ?? null;

export const whatsappLink = (number: string, text = "Namaste! I have a question about Rahul & Divya's wedding.") =>
  `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
