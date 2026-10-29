import { soundOn } from './bell';

/**
 * The music when a guest accepts the invitation, made with the Web Audio API (nothing to download, and it
 * only ever starts from the guest's own tap): a festive tune in a pentatonic raga (Mohanam, on D) played
 * on a reed instrument with a gentle vibrato over a soft drone, with a hand-drum keeping time, a temple
 * bell to open, and the whoosh and crackle of the two cone crackers. About eight seconds; the sound
 * switch on the first page silences it.
 */
let ctx: AudioContext | null = null;

const SA = 293.66; // D4
const RATIO = { S: 1, R: 9 / 8, G: 5 / 4, P: 3 / 2, D: 5 / 3 } as const;
type Degree = keyof typeof RATIO;
/** [degree, octave (0 = middle, 1 = upper), beats] */
const TUNE: [Degree, number, number][] = [
  ['S', 0, 1], ['G', 0, 1], ['P', 0, 1], ['D', 0, 1], ['P', 0, 1], ['G', 0, 1], ['R', 0, 1], ['S', 0, 1],
  ['D', 0, 0.5], ['S', 1, 0.5], ['R', 1, 1], ['G', 1, 1], ['R', 1, 0.5], ['S', 1, 0.5], ['D', 0, 1], ['P', 0, 1],
  ['G', 0, 1], ['P', 0, 1], ['D', 0, 1], ['S', 1, 1], ['D', 0, 0.5], ['P', 0, 0.5], ['G', 0, 1], ['S', 0, 3],
];
const BEAT = 60 / 124;

export function playCelebration(): () => void {
  if (!soundOn()) return () => {};
  ctx ??= new AudioContext();
  const ac = ctx;
  if (ac.state === 'suspended') void ac.resume();
  const t0 = ac.currentTime + 0.06;

  const master = ac.createGain();
  master.gain.setValueAtTime(0.0001, t0);
  master.gain.exponentialRampToValueAtTime(0.34, t0 + 0.5);
  const comp = ac.createDynamicsCompressor();
  master.connect(comp).connect(ac.destination);
  const nodes: AudioScheduledSourceNode[] = [];
  const start = (n: AudioScheduledSourceNode, at: number, stop: number) => {
    n.start(at);
    n.stop(stop);
    nodes.push(n);
  };

  // A pinch of noise for the drum, the crackers and the bell's strike
  const noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  const burst = (at: number, len: number, freq: number, q: number, level: number, sweepTo?: number) => {
    const src = ac.createBufferSource();
    src.buffer = noiseBuf;
    const f = ac.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(freq, at);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, at + len);
    f.Q.value = q;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.linearRampToValueAtTime(level, at + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, at + len);
    src.connect(f).connect(g).connect(master);
    start(src, at, at + len + 0.05);
  };

  // The temple bell, to open
  for (const [ratio, level, decay] of [[1, 0.5, 2.6], [1.183, 0.22, 1.9], [1.506, 0.16, 1.5], [2, 0.24, 1.3], [2.514, 0.1, 0.9]] as const) {
    const o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.value = 880 * ratio;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(level * 0.5, t0 + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + decay);
    o.connect(g).connect(master);
    start(o, t0, t0 + decay + 0.05);
  }

  // The drone: Sa and Pa, soft
  for (const [freq, level] of [[SA / 2, 0.07], [(SA / 2) * 1.5, 0.045], [SA, 0.03]] as const) {
    const o = ac.createOscillator();
    o.type = 'triangle';
    o.frequency.value = freq;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t0 + 0.2);
    g.gain.linearRampToValueAtTime(level, t0 + 1.4);
    const end = t0 + 0.6 + TUNE.reduce((a, n) => a + n[2], 0) * BEAT;
    g.gain.setValueAtTime(level, end - 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, end + 0.9);
    o.connect(g).connect(master);
    start(o, t0 + 0.2, end + 1);
  }

  // The tune on a reed, a little vibrato, each note joined to the last with a short glide
  let t = t0 + 0.6;
  let last = SA;
  for (const [deg, oct, beats] of TUNE) {
    const freq = SA * RATIO[deg] * (oct ? 2 : 1);
    const dur = beats * BEAT;
    const filt = ac.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 2100;
    filt.Q.value = 2.2;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.2, t + 0.05);
    g.gain.setValueAtTime(0.2, t + Math.max(0.06, dur - 0.14));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.1);
    filt.connect(g).connect(master);
    const lfo = ac.createOscillator();
    lfo.frequency.value = 5.6;
    const lfoGain = ac.createGain();
    lfoGain.gain.value = freq * 0.006;
    lfo.connect(lfoGain);
    for (const detune of [-7, 7]) {
      const o = ac.createOscillator();
      o.type = 'sawtooth';
      o.detune.value = detune;
      o.frequency.setValueAtTime(last, t);
      o.frequency.exponentialRampToValueAtTime(freq, t + 0.06);
      lfoGain.connect(o.frequency);
      o.connect(filt);
      start(o, t, t + dur + 0.15);
    }
    start(lfo, t, t + dur + 0.15);
    last = freq;
    t += dur;
  }

  // The hand-drum keeping an eight-beat cycle: a low stroke on the downbeats, lighter taps between
  const beats = TUNE.reduce((a, n) => a + n[2], 0);
  for (let b = 0; b < beats; b++) {
    const at = t0 + 0.6 + b * BEAT;
    if (b % 4 === 0 || b % 4 === 2) {
      const o = ac.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(190, at);
      o.frequency.exponentialRampToValueAtTime(82, at + 0.2);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.linearRampToValueAtTime(b % 4 === 0 ? 0.5 : 0.34, at + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.3);
      o.connect(g).connect(master);
      start(o, at, at + 0.35);
    }
    burst(at + (b % 2 ? 0 : BEAT / 2), 0.07, 1500, 1.4, b % 2 ? 0.1 : 0.06);
  }

  // The crackers: a whoosh as each is lit, then a crackle of small pops
  burst(t0 + 0.15, 0.8, 500, 0.9, 0.22, 3800);
  burst(t0 + 0.34, 0.8, 600, 0.9, 0.2, 4200);
  const popEnd = t0 + 6.4;
  for (let at = t0 + 0.55; at < popEnd; at += 0.05 + Math.random() * 0.16) {
    const fade = 1 - (at - t0) / 6.4;
    burst(at, 0.02 + Math.random() * 0.05, 1800 + Math.random() * 3600, 1.1, (0.07 + Math.random() * 0.18) * (0.35 + 0.65 * fade));
  }

  return () => {
    master.gain.cancelScheduledValues(ac.currentTime);
    master.gain.setValueAtTime(master.gain.value, ac.currentTime);
    master.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.25);
    window.setTimeout(() => nodes.forEach((n) => { try { n.stop(); } catch { /* already stopped */ } }), 320);
  };
}
