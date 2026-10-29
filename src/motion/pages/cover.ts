import { breeze, type Breeze } from '../breeze';
import { defineChoreo, gsap, isReducedMotion, timelineChoreo } from '../choreo';

/**
 * Cover — the temple entrance opening (PRD §6.1), animating the client's photographs.
 * Doors: a breeze stirs the garlands, swag and banana leaves; the bell sways on its chain.
 * Entering (~10 s): the bell swings and rings; the doorway is cut from the photograph as the
 * door leaves swing open on their hinges; birds cross the sky; we walk through the doorway into
 * the courtyard; the R·D logo comes out of the temple's shrine door towards us, then closer
 * still, and gives way to the invitation card.
 * Opening: the card's cover swings open on its hinge; main.ts then turns the page.
 * Reduced motion: no breeze, birds, swing or walk; the doors fade and the invitation appears.
 */
type Stage = 'doors' | 'entering' | 'book';

const q = (page: HTMLElement, sel: string) => page.querySelector<HTMLElement>(sel)!;
const qa = (page: HTMLElement, sel: string) => [...page.querySelectorAll<HTMLElement>(sel)];

const DOOR_OPEN = 78; // degrees: wide open, still in view
const SCENE_RESET = '[data-door], [data-front], [data-court], [data-mono], [data-book], .cv-open, .cv-inv__names, [data-cover], [data-cover-shade], [data-glow], [data-scrim], .op-bell';

export const coverStage = (page: HTMLElement) => (page.dataset.stage ?? 'book') as Stage;
const setStage = (page: HTMLElement, stage: Stage) => {
  page.dataset.stage = stage;
  page.closest('.app')?.classList.toggle('cover-book', stage === 'book');
};

/** Entry on a first visit: the entrance settles in (only while the doors are still closed). */
defineChoreo(
  'cover',
  timelineChoreo((tl, page) => {
    tl.from(qa(page, '.op-frame--whole'), { opacity: 0, duration: 1.1, ease: 'power1.out' }, 0).from(qa(page, '.op-bell, .cv-enter, .cv-sound'), { opacity: 0, y: 8, duration: 0.8, stagger: 0.1 }, 0.5);
  }),
);

/* ------------------------------------------------------------------ the breeze */

let wind: Breeze | null = null;
let gust = 1;

/** A gentle, irregular breeze on the garlands, swag, banana leaves and the hanging bell. */
function startBreeze(page: HTMLElement) {
  if (wind) return;
  wind = breeze(qa(page, '[data-wind], .op-bell'), {
    active: () => page.dataset.state === 'current' && coverStage(page) !== 'book',
    // Slow swells in the wind, plus any gust the opening doors add
    gust: () => gust,
  });
}

function stopBreeze() {
  wind?.stop();
  wind = null;
}

/* ------------------------------------------------------------------ birds */

const BIRD = `<svg viewBox="0 0 40 18" aria-hidden="true"><g class="op-bird__wing"><path d="M20 9C15 3 8 1 1 4c7 0 13 3 19 7z"/><path d="M20 9C25 3 32 1 39 4c-7 0-13 3-19 7z"/></g><ellipse cx="20" cy="10" rx="3.6" ry="1.9"/></svg>`;

/** A loose flock crossing the courtyard sky, wings beating at their own pace. */
/**
 * The logo travels from the shrine door to where it rests, as a real object coming straight
 * towards us would look: its size grows with 1 / distance and its path follows the perspective,
 * so it lingers small at the door, then draws near and settles. The door is read from the
 * courtyard photograph each frame, so the logo leaves it even while we are still walking in.
 */
function emerge(page: HTMLElement, mono: HTMLElement, duration: number) {
  const court = q(page, '[data-court]');
  const photo = q(page, '.op-court__img');
  const [sx, sy] = (court.dataset.shrine ?? '50 60').split(' ').map(Number);
  const far = 9; // the shrine door is this many times farther away than where the logo rests
  const rest = { x: 0, y: 0 };
  const travel = { p: 0 };
  return gsap.to(travel, {
    p: 1,
    duration,
    ease: 'sine.inOut',
    onStart() {
      gsap.set(mono, { x: 0, y: 0, scale: 1 });
      const r = mono.getBoundingClientRect();
      rest.x = r.left + r.width / 2;
      rest.y = r.top + r.height / 2;
    },
    onUpdate() {
      const r = photo.getBoundingClientRect();
      const dx = r.left + (r.width * sx) / 100 - rest.x;
      const dy = r.top + (r.height * sy) / 100 - rest.y;
      const z = far + (1 - far) * travel.p; // distance, from the door to the resting place
      gsap.set(mono, { x: (dx * far * (1 - travel.p)) / z, y: (dy * far * (1 - travel.p)) / z, scale: 1 / z });
    },
  });
}

function launchBirds(container: HTMLElement) {
  if (isReducedMotion()) return;
  const ltr = Math.random() < 0.5;
  for (let i = 0; i < 13; i++) {
    const bird = document.createElement('span');
    bird.className = 'op-bird';
    bird.innerHTML = BIRD;
    const depth = 0.45 + Math.random() * 0.55; // nearer birds are larger, faster and darker
    bird.style.width = `${(2.2 + depth * 2.8).toFixed(2)}%`;
    bird.style.opacity = (0.55 + depth * 0.4).toFixed(2);
    bird.style.setProperty('--beat', `${(0.22 + Math.random() * 0.14).toFixed(2)}s`);
    container.append(bird);
    const y0 = 14 + Math.random() * 16;
    const from = ltr ? -8 - Math.random() * 14 : 108 + Math.random() * 14;
    gsap.set(bird, { left: `${from}%`, top: `${y0}%`, scaleX: ltr ? 1 : -1 });
    gsap.to(bird, {
      left: `${ltr ? 110 : -10}%`,
      top: `${y0 + (Math.random() - 0.4) * 10}%`,
      duration: 6.5 + (1 - depth) * 4 + Math.random(),
      delay: Math.random() * 1.6,
      ease: 'none',
      onComplete: () => bird.remove(),
    });
    gsap.to(bird, { y: -4 - Math.random() * 6, duration: 1.2 + Math.random(), yoyo: true, repeat: 5, ease: 'sine.inOut' });
  }
}

/* ------------------------------------------------------------------ stages */

/** Undo the animation's changes only: these elements carry their own layout in inline styles. */
function resetScene(page: HTMLElement) {
  const els = qa(page, SCENE_RESET);
  gsap.set(els, { clearProps: 'transform,opacity,visibility' });
  els.forEach((el) => el.style.removeProperty('--shade'));
}

/** Doors closed, scene reset (first visit in this session). */
export function showDoors(page: HTMLElement) {
  resetScene(page);
  q(page, '[data-front]').classList.remove('is-open');
  setStage(page, 'doors');
  startBreeze(page);
  loadAfterDoors(page);
}

/** The finished scene: the invitation in the courtyard, ready to open. */
export function showBook(page: HTMLElement) {
  resetScene(page);
  loadDeferred(page);
  setStage(page, 'book');
  stopBreeze();
  fitGreeting(page);
}

/** "Dear …": the guest's name from a personal link (…/?to=Lakshmi%20Aunty), otherwise everyone. */
export function greetGuest(page: HTMLElement) {
  const raw = new URLSearchParams(location.search).get('to') ?? '';
  const name = raw
    .replace(/[^\p{L}\p{M}\p{N} .,'&()-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 48);
  if (name) q(page, '[data-guest]').textContent = name;
}

/**
 * Fit the guest's name to its place under "Dear": one line, smaller for a longer name; a very long
 * name wraps onto two. Measured once the card is laid out and its capitals face has loaded.
 */
function fitGreeting(page: HTMLElement) {
  const box = q(page, '.cv-inv__dear');
  const name = q(page, '[data-guest]');
  void document.fonts.load(`600 40px ${getComputedStyle(name).fontFamily}`).then(() => {
    if (!box.clientWidth) return;
    box.style.setProperty('--guest-scale', '1');
    name.style.whiteSpace = 'nowrap';
    const room = box.clientWidth / name.scrollWidth;
    name.style.whiteSpace = '';
    let scale = Math.min(1, room * 0.98);
    box.style.setProperty('--guest-scale', String(scale));
    if (scale >= 0.62) return;
    // Too long for one line: the largest size at which it breaks onto two
    for (scale = 0.7; scale > 0.4; scale -= 0.02) {
      box.style.setProperty('--guest-scale', String(scale));
      if (name.offsetHeight <= parseFloat(getComputedStyle(name).fontSize) * 1.2 * 2.1) break;
    }
  });
}

/**
 * Request the pictures held back so the door photograph loads first (ScenePhoto `defer`): the rest
 * of the opening, and the Welcome page's courtyard and couple waiting beneath it.
 */
function loadDeferred(page: HTMLElement) {
  const book = page.parentElement ?? page;
  book.querySelectorAll<HTMLSourceElement>('source[data-srcset]').forEach((el) => {
    el.srcset = el.dataset.srcset!;
    delete el.dataset.srcset;
  });
  book.querySelectorAll<HTMLImageElement>('img[data-src]').forEach((el) => {
    el.src = el.dataset.src!;
    delete el.dataset.src;
  });
}

/** Once the door photograph is in, quietly fetch the rest of the scene. */
function loadAfterDoors(page: HTMLElement) {
  const whole = page.querySelector<HTMLImageElement>('.op-frame--whole');
  const go = () => window.setTimeout(() => loadDeferred(page), 200);
  if (!whole || whole.complete) go();
  else whole.addEventListener('load', go, { once: true });
}

/** Wait (briefly) for the door layers, which only show once the doors move, so they never pop in. */
function layersReady(page: HTMLElement) {
  loadDeferred(page);
  const imgs = page.querySelectorAll<HTMLImageElement>('.op-leaf img, .op-hangings, .op-frame--cut');
  const ready = Promise.all([...imgs].map((img) => img.decode().catch(() => undefined)));
  return Promise.race([ready, new Promise((r) => setTimeout(r, 500))]);
}

function ringSwing(bell: HTMLElement) {
  return gsap.fromTo(
    bell,
    { rotation: 0 },
    {
      keyframes: [
        { rotation: 9, duration: 0.28, ease: 'power2.out' },
        { rotation: -7, duration: 0.5, ease: 'sine.inOut' },
        { rotation: 5, duration: 0.46, ease: 'sine.inOut' },
        { rotation: -3, duration: 0.44, ease: 'sine.inOut' },
        { rotation: 1.5, duration: 0.42, ease: 'sine.inOut' },
        { rotation: 0, duration: 0.4, ease: 'sine.out' },
      ],
    },
  );
}

/** Ring the bell and play the whole entrance. Resolves when the invitation is ready to open. */
export async function enterTemple(page: HTMLElement, bell: HTMLElement | null): Promise<void> {
  if (coverStage(page) !== 'doors') return;
  setStage(page, 'entering');
  fitGreeting(page);
  const front = q(page, '[data-front]');
  const doors = qa(page, '[data-door]');
  const glow = q(page, '[data-glow]');
  const court = q(page, '[data-court]');
  const mono = q(page, '[data-mono]');
  const scrim = q(page, '[data-scrim]');
  const book = q(page, '[data-book]');
  const open = q(page, '.cv-open');
  const names = q(page, '.cv-inv__names');
  const prompts = qa(page, '.cv-enter, .op-bell__halo');
  const h = page.clientHeight;
  const near = Number(getComputedStyle(court).getPropertyValue('--near')) || 1.44;
  const behind = Number(getComputedStyle(court).getPropertyValue('--behind')) || 1.3;

  gsap.set([book, open, names, mono, scrim], { autoAlpha: 0 });
  const swing = bell && !isReducedMotion() ? ringSwing(bell) : null;
  await layersReady(page);

  const tl = gsap.timeline({ paused: true });
  if (isReducedMotion()) {
    tl.to(prompts, { autoAlpha: 0, duration: 0.2 }, 0)
      .add(() => front.classList.add('is-open'), 0.1)
      .to(doors, { autoAlpha: 0, duration: 0.5 }, 0.1)
      .to(front, { autoAlpha: 0, duration: 0.5 }, 0.6)
      .to(scrim, { autoAlpha: 1, duration: 0.4 }, 0.9)
      .to([book, open, names], { autoAlpha: 1, duration: 0.4 }, 1.0);
  } else {
    const wind = { v: 1 };
    const setGust = () => (gust = wind.v);
    tl.to(prompts, { autoAlpha: 0, duration: 0.3 }, 0)
      // The doors move: the doorway is cut from the photograph and the leaves swing in on their hinges
      .add(() => front.classList.add('is-open'), 0.3)
      .to(wind, { v: 2.4, duration: 1.2, ease: 'sine.inOut', onUpdate: setGust }, 0.3)
      .to(doors[0], { rotationY: DOOR_OPEN, '--shade': 0.85, duration: 2.6, ease: 'sine.inOut' }, 0.3)
      .to(doors[1], { rotationY: -DOOR_OPEN, '--shade': 0.85, duration: 2.6, ease: 'sine.inOut' }, 0.3)
      .to(glow, { opacity: 0.5, duration: 1, ease: 'sine.out' }, 0.5)
      .to(glow, { opacity: 0, duration: 1.4, ease: 'sine.inOut' }, 1.6)
      .to(wind, { v: 1, duration: 2.5, ease: 'sine.inOut', onUpdate: setGust }, 1.6)
      .add(() => launchBirds(q(page, '[data-birds]')), 1.4)
      // Walking forward through the doorway into the courtyard
      .to(front, { scale: 2.6, duration: 3.4, ease: 'power2.in' }, 2.8)
      .to(front, { autoAlpha: 0, duration: 0.8, ease: 'power1.in' }, 5.4)
      .fromTo(court, { scale: behind }, { scale: near, duration: 4.8, ease: 'sine.inOut' }, 2.8)
      // The logo comes out of the shrine door at the foot of the tower and towards us…
      .add(emerge(page, mono, 2.8), 5.7)
      .fromTo(mono, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, ease: 'sine.out' }, 5.7)
      // …then closer still, and gives way to the invitation
      .to(mono, { scale: 2.1, y: h * 0.12, duration: 1, ease: 'power2.in' }, 8.8)
      .to(mono, { autoAlpha: 0, duration: 0.45, ease: 'power1.in' }, 9.4)
      .to(scrim, { autoAlpha: 1, duration: 1, ease: 'sine.inOut' }, 9)
      .fromTo(book, { autoAlpha: 0, scale: 0.86, y: h * 0.03 }, { autoAlpha: 1, scale: 1, y: 0, duration: 1.1, ease: 'power3.out' }, 9.55)
      // "Dear Guest" arrives with the card; the couple's names follow, then the button
      .fromTo(names, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'sine.out' }, 10.25)
      .fromTo(open, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, ease: 'sine.out' }, 10.9);
  }

  await new Promise<void>((resolve) => {
    const finish = () => {
      if (coverStage(page) === 'entering') {
        swing?.progress(1);
        gust = 1;
        showBook(page);
      }
      resolve();
    };
    tl.eventCallback('onComplete', finish);
    tl.play();
    // Animation frames pause when the guest switches apps; never leave them half-way through.
    window.setTimeout(() => {
      if (tl.progress() < 1) tl.progress(1);
      finish();
    }, (tl.duration() + 1.5) * 1000);
  });
}

/** "Open the Invitation": the card's cover opens on its hinge (then the first page turns). */
export function openCard(page: HTMLElement): Promise<void> {
  if (isReducedMotion()) return Promise.resolve();
  const tl = gsap.timeline();
  // The card eases to the right as its cover swings open, so the inside comes into view
  tl.to(q(page, '[data-book]'), { xPercent: 17, scale: 0.8, duration: 0.95, ease: 'sine.inOut' }, 0)
    .to(q(page, '[data-cover]'), { rotationY: -168, duration: 0.95, ease: 'sine.inOut' }, 0)
    .to(q(page, '[data-cover-shade]'), { opacity: 1, duration: 0.45, ease: 'sine.in' }, 0);
  return new Promise((resolve) => {
    tl.eventCallback('onComplete', () => resolve());
    window.setTimeout(resolve, 1500);
  });
}
