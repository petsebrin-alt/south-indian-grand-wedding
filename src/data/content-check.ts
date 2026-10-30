import type { WeddingData } from './schema';

/**
 * Launch check (PRD §4.2–§4.3). Lists every missing or unapproved item. In production
 * mode, any launch-blocking item that is neither filled nor listed in `site.hiddenFields`
 * fails the build.
 */
export interface CheckItem {
  id: string; // PRD missing-information ID (M-xx) or copy ID (C-xx)
  path: string;
  label: string;
  blocking: boolean;
}

export function checkContent(d: WeddingData): CheckItem[] {
  const items: CheckItem[] = [];
  const need = (ok: boolean, id: string, path: string, label: string, blocking = true) => {
    if (!ok) items.push({ id, path, label, blocking });
  };
  const venue = (id: string) => d.venues.find((v) => v.id === id)!;
  const contact = (id: string) => d.contacts.find((c) => c.id === id)!;

  need(!!d.family.groom.father, 'M-01', 'family.groom.father', "Groom's father's name");
  need(!!d.family.groom.mother, 'M-02', 'family.groom.mother', "Groom's mother's name");
  need(!!d.family.bride.father, 'M-03', 'family.bride.father', "Bride's father's name");
  need(!!d.family.bride.mother, 'M-04', 'family.bride.mother', "Bride's mother's name");
  need(d.family.groom.grandparents.length + d.family.bride.grandparents.length > 0, 'M-05', 'family.*.grandparents', 'Grandparents', false);
  need(d.family.groom.siblings.length + d.family.bride.siblings.length > 0, 'M-06', 'family.*.siblings', 'Siblings and other relatives', false);
  need(d.loveStory.filter((m) => m.photo).length >= 3, 'M-11', 'loveStory', 'At least 3 love-story photos');
  need([d.family.groom, d.family.bride].every((f) => !!f.photo), 'M-12', 'family.*.photo', 'The parents\' photographs', false);
  need([d.family.groom, d.family.bride].every((f) => f.siblings.every((x) => !!x.name)), 'M-06', 'family.*.siblings[].name', 'Names of the siblings shown on the Parents page', false);

  for (const [id, m] of [['ceremony', 'M-13'], ['function-hall', 'M-14'], ['bride-home', 'M-15'], ['groom-home', 'M-16']] as const) {
    const v = venue(id);
    // A home marked "shared personally" is resolved without a published address.
    const resolved = v.privacy === 'onRequest' || !!(v.name && v.address && (v.mapsUrl || (v.lat !== null && v.lng !== null)));
    need(resolved, m, `venues.${id}`, `${v.label}: name, address and map location`);
    need((v.locationStatus ?? 'confirmed') === 'confirmed', m, `venues.${id}.locationStatus`, `${v.label}: confirm the exact name and map pin (the invitation shows "${v.name}" from the client's words)`, false);
  }

  for (const e of d.events) {
    need(e.timeStatus === 'confirmed', 'M-17', `events.${e.id}.timeStatus`, `${e.name}: confirm the proposed time`);
  }
  need(!!d.ceremony.endISO || !!d.ceremony.provisionalDurationMinutes, 'M-18', 'ceremony.endISO', 'Ceremony end time (calendar uses start-only until provided)', false);

  for (const [id, m] of [['groom-rep', 'M-19'], ['bride-rep', 'M-20'], ['coordinator', 'M-21']] as const) {
    const c = contact(id);
    need(!!(c.name && c.phone), m, `contacts.${id}`, `${c.role}: name and phone number`);
  }
  need(!!d.travel.assistanceContactId, 'M-22', 'travel.assistanceContactId', 'Guest-assistance contact for travel', false);
  for (const key of ['parking', 'accommodation', 'shuttle'] as const) {
    need(d.travel[key].status !== 'toBeConfirmed', 'M-23', `travel.${key}`, `Travel: ${d.travel[key].title}`, false);
  }
  for (const key of ['airport', 'railway', 'guidance'] as const) {
    need(d.travel[key].status === 'verified', 'V-01', `travel.${key}`, `Travel: verify "${d.travel[key].title}" facts`);
  }

  need(!!d.rsvp.deadline, 'M-25', 'rsvp.deadline', 'RSVP deadline');
  need(!!d.rsvp.maxAttendees, 'M-25', 'rsvp.maxAttendees', 'Maximum attendees per RSVP');
  need(d.rsvp.notifyEmails.length > 0, 'M-25', 'rsvp.notifyEmails', 'RSVP notification email addresses');

  need(d.wishingWall.samples.length === 0, 'S-01', 'wishingWall.samples', 'Sample blessings on the Wishing Wall (replace them with real ones, or remove them)');

  const copyIds: Record<keyof WeddingData['copy'], string> = {
    welcomeMessage: 'C-01',
    teluguTitle: 'C-04',
    closingLine: 'C-05',
    countdownArrived: 'C-07',
    postWedding: 'C-08',
  };
  for (const [key, id] of Object.entries(copyIds) as [keyof WeddingData['copy'], string][]) {
    const t = d.copy[key].text;
    need(d.copy[key].status === 'approved', id, `copy.${key}`, `Approve draft text: "${t.length > 48 ? `${t.slice(0, 48)}…` : t}"`);
  }
  need(d.loveStory.every((m) => m.titleStatus === 'confirmed'), 'C-06', 'loveStory.*.title', 'Confirm love-story milestone titles');

  need(!!d.site.url, 'M-28', 'site.url', 'Domain name');
  need(d.site.adminEmails.length > 0, 'M-29', 'site.adminEmails', 'Family admin emails');

  return items;
}

/** Items that still block a production launch after honouring `site.hiddenFields`. */
export function launchBlockers(d: WeddingData, items = checkContent(d)): CheckItem[] {
  return items.filter((i) => i.blocking && !d.site.hiddenFields.includes(i.path));
}
