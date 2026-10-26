import { wedding } from '../data/wedding';

/** Contact cards on Need Help (PRD §6.17): one emblem per side; no numbers are ever invented. */
export const contactEmblem: Record<string, 'lotus' | 'jasmine' | 'bell'> = {
  'groom-rep': 'lotus',
  'bride-rep': 'jasmine',
  coordinator: 'bell',
};

export const contacts = () => wedding.contacts;
export const NUMBER_SOON = 'Number coming soon';
