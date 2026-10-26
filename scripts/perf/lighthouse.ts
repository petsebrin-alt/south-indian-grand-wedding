/**
 * npm run perf → Lighthouse (mobile, simulated slow 4G) on the cover of the built site (AC-33).
 * Build first (`npm run build:preview`). Serves dist/ on port 4323 (or uses the preview server that
 * is already running), runs Lighthouse three times and reports the median; fails below 85.
 * Lighthouse is fetched with npx on first use.
 */
import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PORT = 4323;
const RUNS = 3;
const TARGET = 85;

// Astro runs one preview server per project: reuse it if one is already running.
let URL = `http://localhost:${PORT}/`;
const server = spawn('npx', ['astro', 'preview', '--port', String(PORT)], { stdio: ['ignore', 'pipe', 'pipe'] });
const stop = () => server.kill();
process.on('exit', stop);
const onOutput = (chunk: Buffer) => {
  const running = /already running at (http:\/\/[^\s"\\]+)/.exec(chunk.toString());
  if (running) URL = running[1].replace(/\/?$/, '/');
};
server.stdout.on('data', onOutput);
server.stderr.on('data', onOutput);

for (let i = 0; i < 60; i++) {
  try {
    if ((await fetch(URL)).ok) break;
  } catch {
    /* not up yet */
  }
  await new Promise((r) => setTimeout(r, 500));
}

const dir = mkdtempSync(join(tmpdir(), 'rdv-lighthouse-'));
const runs: { perf: number; a11y: number; bp: number; fcp: string; lcp: string; tbt: string; cls: string }[] = [];
for (let i = 1; i <= RUNS; i++) {
  const out = join(dir, `run-${i}.json`);
  execFileSync(
    'npx',
    ['--yes', 'lighthouse@13.5.0', URL, '--quiet', '--only-categories=performance,accessibility,best-practices', '--output=json', `--output-path=${out}`, '--chrome-flags=--headless=new'],
    { stdio: 'ignore' },
  );
  const r = JSON.parse(readFileSync(out, 'utf8'));
  const score = (k: string) => Math.round(r.categories[k].score * 100);
  runs.push({
    perf: score('performance'),
    a11y: score('accessibility'),
    bp: score('best-practices'),
    fcp: r.audits['first-contentful-paint'].displayValue,
    lcp: r.audits['largest-contentful-paint'].displayValue,
    tbt: r.audits['total-blocking-time'].displayValue,
    cls: r.audits['cumulative-layout-shift'].displayValue,
  });
  const last = runs[runs.length - 1];
  console.log(`run ${i}: performance ${last.perf} · accessibility ${last.a11y} · best practices ${last.bp} · FCP ${last.fcp} · LCP ${last.lcp} · TBT ${last.tbt} · CLS ${last.cls}`);
}
stop();

const median = runs.map((r) => r.perf).sort((a, b) => a - b)[Math.floor(RUNS / 2)];
console.log(`\n${median >= TARGET ? '✓' : '✗'} Median mobile performance on the cover: ${median} (target ≥ ${TARGET})`);
process.exit(median >= TARGET ? 0 : 1);
