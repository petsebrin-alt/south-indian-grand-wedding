import kolamCorner from '../assets/svg/kolam-corner.svg?raw';
import kolamMedallion from '../assets/svg/kolam-medallion.svg?raw';
import divider from '../assets/svg/divider.svg?raw';
import dividerLine from '../assets/svg/divider-line.svg?raw';
import monogramRing from '../assets/svg/monogram-ring.svg?raw';
import pillarLine from '../assets/svg/pillar-line.svg?raw';

/** The ornament drawings (src/assets/svg/), split into viewBox and inner markup for the sprite. */
const raw = {
  'kolam-corner': kolamCorner,
  'kolam-medallion': kolamMedallion,
  divider,
  'divider-line': dividerLine,
  'monogram-ring': monogramRing,
  'pillar-line': pillarLine,
} as const;

export type OrnamentName = keyof typeof raw;

/** Drawn in by page choreography (DrawSVG needs the real paths), so these stay inline. */
export const animated: OrnamentName[] = ['divider-line'];

export const ornaments = Object.fromEntries(
  Object.entries(raw).map(([name, svg]) => [
    name,
    { svg, viewBox: /viewBox="([^"]+)"/.exec(svg)![1], inner: svg.slice(svg.indexOf('>') + 1, svg.lastIndexOf('</svg>')) },
  ]),
) as Record<OrnamentName, { svg: string; viewBox: string; inner: string }>;
