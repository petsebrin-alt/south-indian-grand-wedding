import { playClip, prefetchClip, soundOn } from './bell';

/**
 * The music when a guest accepts the invitation (scripts/ceremony/melody.py → public/audio/accept-melody.wav): about a
 * second and a half of violin and bamboo flute, a rising phrase in a pentatonic scale ending on a held, blooming note,
 * soft and tender (the client found the earlier festive tune and crackers hard and weird). It only ever starts from the
 * guest's own tap and follows the sound switch. If the file cannot be played, a short phrase of soft flute-like notes is
 * synthesised instead.
 */
const URL = `${import.meta.env.BASE_URL}audio/accept-melody.wav`;
let ctx: AudioContext | null = null;

export const prefetchAcceptMelody = () => void prefetchClip(URL);

/** [frequency, start, length] in seconds: G, A, B, then D an octave up (D4 = 293.66 Hz as the tonic) */
const PHRASE: [number, number, number][] = [
  [367.1, 0, 0.3],
  [440.5, 0.26, 0.3],
  [489.4, 0.52, 0.34],
  [587.3, 0.82, 0.62],
];

function synthesised(): () => void {
  ctx ??= new AudioContext();
  const ac = ctx;
  if (ac.state === 'suspended') void ac.resume();
  const t0 = ac.currentTime + 0.04;
  const master = ac.createGain();
  master.gain.value = 0.2;
  const warm = ac.createBiquadFilter();
  warm.type = 'lowpass';
  warm.frequency.value = 2600;
  master.connect(warm).connect(ac.destination);
  const nodes: OscillatorNode[] = [];
  for (const [freq, start, length] of PHRASE) {
    const at = t0 + start;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.linearRampToValueAtTime(1, at + 0.05);
    g.gain.setValueAtTime(1, at + Math.max(0.06, length - 0.1));
    g.gain.exponentialRampToValueAtTime(0.0001, at + length + 0.12);
    g.connect(master);
    const lfo = ac.createOscillator();
    lfo.frequency.value = 5.4;
    const depth = ac.createGain();
    depth.gain.value = freq * 0.008;
    lfo.connect(depth);
    for (const [mult, level, type] of [[1, 0.8, 'sine'], [2, 0.3, 'sine'], [1.002, 0.35, 'triangle']] as const) {
      const o = ac.createOscillator();
      o.type = type;
      o.frequency.value = freq * mult;
      depth.connect(o.frequency);
      const og = ac.createGain();
      og.gain.value = level;
      o.connect(og).connect(g);
      o.start(at);
      o.stop(at + length + 0.2);
      nodes.push(o);
    }
    lfo.start(at);
    lfo.stop(at + length + 0.2);
  }
  return () => {
    master.gain.setTargetAtTime(0, ac.currentTime, 0.05);
    nodes.forEach((o) => {
      try {
        o.stop(ac.currentTime + 0.3);
      } catch {
        /* already stopped */
      }
    });
  };
}

/** Plays the melody; returns a function that fades it out. */
export function playCelebration(): () => void {
  if (!soundOn()) return () => {};
  let stopped = false;
  let stop: () => void = () => {};
  void playClip(URL, { gain: 0.9, variance: 0.006 }).then((s) => {
    if (stopped) return s?.();
    stop = s ?? (() => {
      try {
        return synthesised();
      } catch {
        return () => {};
      }
    })();
  });
  return () => {
    stopped = true;
    stop();
  };
}
