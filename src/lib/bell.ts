/**
 * The temple bell rung on the opening screen. A real recording (public/audio/temple-bell.mp3,
 * passed in by the cover) is played when supplied; until then a brass temple bell is synthesised
 * with the Web Audio API: a clapper strike, then inharmonic partials that shimmer and fade over a
 * few seconds, as a hand bell (ghanta) does. Sound only ever starts from the guest's own tap.
 */
const PREF = 'rdv:sound';

export const soundOn = () => {
  try {
    return localStorage.getItem(PREF) !== 'off';
  } catch {
    return true;
  }
};

export const setSound = (on: boolean) => {
  try {
    localStorage.setItem(PREF, on ? 'on' : 'off');
  } catch {
    /* private mode: the choice lasts for this visit */
  }
};

let ctx: AudioContext | null = null;

/** [frequency ratio, level, decay in seconds] — a bright brass bell around 660 Hz. */
const PARTIALS: [number, number, number][] = [
  [0.5, 0.28, 4.2],
  [1, 1, 3.6],
  [1.183, 0.45, 2.8],
  [1.506, 0.32, 2.4],
  [2.0, 0.5, 2.1],
  [2.514, 0.22, 1.5],
  [3.011, 0.16, 1.2],
  [4.166, 0.1, 0.8],
  [5.433, 0.06, 0.5],
];

function synthesise(fundamental = 660) {
  ctx ??= new AudioContext();
  const ac = ctx;
  if (ac.state === 'suspended') void ac.resume();
  const now = ac.currentTime + 0.01;

  const master = ac.createGain();
  master.gain.value = 0.32;
  const comp = ac.createDynamicsCompressor();
  master.connect(comp).connect(ac.destination);

  // Each partial is a pair of slightly detuned tones, so the note shimmers as it fades.
  for (const [ratio, level, decay] of PARTIALS) {
    for (const detune of [-0.9, 0.9]) {
      const osc = ac.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = fundamental * ratio + detune;
      const g = ac.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(level * 0.5, now + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, now + decay);
      osc.connect(g).connect(master);
      osc.start(now);
      osc.stop(now + decay + 0.05);
    }
  }

  // The clapper striking brass: a very short, bright burst of filtered noise.
  const len = Math.floor(ac.sampleRate * 0.05);
  const buffer = ac.createBuffer(1, len, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  const noise = ac.createBufferSource();
  noise.buffer = buffer;
  const band = ac.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 3200;
  band.Q.value = 1.2;
  const ng = ac.createGain();
  ng.gain.value = 0.5;
  noise.connect(band).connect(ng).connect(master);
  noise.start(now);
}

/** Ring once (twice gives the double strike heard at temple entrances). */
export function ringBell(recording: string | null, strikes = 2) {
  if (!soundOn()) return;
  for (let i = 0; i < strikes; i++) {
    window.setTimeout(() => {
      if (recording) {
        const a = new Audio(recording);
        a.volume = 0.8;
        void a.play().catch(() => synthesise());
      } else {
        synthesise(i === 0 ? 660 : 652);
      }
    }, i * 520);
  }
}
