import { wedding } from '../data/wedding';
import { formatPhone } from './format';
import { whatsappLink } from './travel';

/** Need Help (PRD §6.17): one card per contact (the groom's father, the bride's father, the event coordinator); no number is ever invented. */
export const NUMBER_SOON = 'Number coming soon';
export const EMAIL_SOON = 'Email coming soon';

const emblem = { 'groom-rep': 'lotus', 'bride-rep': 'jasmine', coordinator: 'bell' } as const;
const side = { 'groom-rep': "Groom's Family", 'bride-rep': "Bride's Family", coordinator: 'Event Coordinator' } as const;
const tab = { 'groom-rep': 'Groom', 'bride-rep': 'Bride', coordinator: 'Events' } as const;

export const contactCards = (list: typeof wedding.contacts = wedding.contacts) =>
  list.map((c) => {
    const partner = c.id === 'groom-rep' ? wedding.couple.groom.name : c.id === 'bride-rep' ? wedding.couple.bride.name : null;
    const family = c.id === 'groom-rep' ? wedding.family.groom : c.id === 'bride-rep' ? wedding.family.bride : null;
    return {
      id: c.id,
      emblem: emblem[c.id],
      side: side[c.id],
      tab: tab[c.id],
      // "Rahul's Father", "Divya's Father", "Wedding Event Coordinator"
      relation: partner ? `${partner}'s Father` : c.role,
      name: c.name,
      // what the bar and the card show: the name over what they are, or (until a name is given) what they are over a note
      title: c.name ?? side[c.id],
      subtitle: c.name ? (partner ? `${partner}'s Father` : c.role) : 'To be announced',
      photo: family?.photo ?? null,
      phone: c.phone,
      phoneText: c.phone ? formatPhone(c.phone) : null,
      telHref: c.phone ? `tel:${c.phone}` : null,
      whatsapp: c.whatsapp,
      whatsappText: c.whatsapp ? formatPhone(c.whatsapp) : null,
      whatsappHref: c.whatsapp ? whatsappLink(c.whatsapp) : null,
      email: c.email ?? null,
      mailHref: c.email ? `mailto:${c.email}` : null,
      languages: c.languages,
    };
  });
