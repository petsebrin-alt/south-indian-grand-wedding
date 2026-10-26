import type { APIRoute, GetStaticPaths } from 'astro';
import { wedding } from '../../data/wedding';
import { buildIcs, calendarEntry } from '../../lib/calendar';

/** Static .ics files for confirmed events, e.g. /calendar/wedding.ics (PRD §6.4.5). */
export const getStaticPaths: GetStaticPaths = () =>
  wedding.events.flatMap((event) => {
    const entry = calendarEntry(event);
    return entry ? [{ params: { id: event.id }, props: { ics: buildIcs(entry) } }] : [];
  });

export const GET: APIRoute = ({ props }) =>
  new Response(props.ics as string, {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': 'attachment; filename="rahul-divya-wedding.ics"' },
  });
