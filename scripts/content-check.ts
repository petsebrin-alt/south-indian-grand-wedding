/**
 * npm run content:check            → report missing items (never fails)
 * npm run content:check:prod       → fail if launch-blocking items remain (PRD §4.3)
 */
import { wedding } from '../src/data/wedding';
import { checkContent, launchBlockers } from '../src/data/content-check';

const production = process.argv.includes('--production');
const items = checkContent(wedding);
const blockers = launchBlockers(wedding, items);

const line = (i: (typeof items)[number]) => `  ${i.id.padEnd(5)} ${i.label}  [${i.path}]`;
const blocking = items.filter((i) => blockers.includes(i));
const other = items.filter((i) => !blockers.includes(i));

console.log(`\nContent check — ${items.length} item(s) outstanding\n`);
if (blocking.length) console.log(`Blocks launch (${blocking.length}):\n${blocking.map(line).join('\n')}\n`);
if (other.length) console.log(`Optional or non-blocking (${other.length}):\n${other.map(line).join('\n')}\n`);

if (production && blockers.length) {
  console.error(`✗ Production build stopped: ${blockers.length} launch-blocking item(s). Fill them in src/data/wedding.ts or list their path in site.hiddenFields.`);
  process.exit(1);
}
console.log(production ? '✓ Ready for production.' : 'Preview build: placeholders will be shown with "To be provided" labels.');
