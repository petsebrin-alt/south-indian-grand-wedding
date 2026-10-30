"""
python3 scripts/ceremony/melody.py → public/audio/accept-melody.wav, the soft music that plays for about a second and a
half when a guest accepts the invitation (src/lib/accept-melody.ts plays it; if the file cannot be loaded the page
synthesises a simple phrase instead). It is not a recording: it is built from the sound of a violin and a bamboo flute
(the Tamil pullankuzhal), meant to feel tender and blessing-like, not loud or festive.
  - A rising four-note phrase in a pentatonic scale (G, A, B, then D an octave up: the raga Mohanam's G, P, D, S'),
    played legato on the violin, and doubled an octave higher by the flute from the second note on. The last note is
    held and blooms, the flute ending with a small falling sigh.
  - Violin: a bowed tone (a soft 55 ms attack with a faint scoop up to the pitch, a sawtooth-like set of harmonics
    shaped by the body's resonances, a trace of bow noise, a vibrato that grows in), with a very quiet bowed drone
    (D and A) underneath for warmth.
  - Flute: a nearly pure tone with a little second and third harmonic, a breath of noise and a soft chiff at the start
    of each note, and a slower vibrato.
  - A small, warm stone-hall echo joins the notes and fades by about two seconds; the top is rolled off so nothing is
    bright or sharp; the level is gentle.
Needs only python3 and numpy. If the family has a recording they prefer (for instance their own violin or flute),
save it as public/audio/accept-melody.wav and this is not needed.
"""
import sys
import wave
from pathlib import Path

import numpy as np

SR = 32000
DUR = 2.15
rng = np.random.default_rng(1947)
N = int(SR * DUR)
t = np.arange(N) / SR

SA = 293.66  # D4
G, P, D, S2 = SA * 5 / 4, SA * 3 / 2, SA * 5 / 3, SA * 2

# [frequency, start, length] in seconds; each note is joined to the one before it
VIOLIN = [(G, 0.00, 0.30), (P, 0.26, 0.30), (D, 0.52, 0.34), (S2, 0.82, 0.68)]
FLUTE = [(P * 2, 0.30, 0.26), (D * 2, 0.52, 0.34), (S2 * 2, 0.82, 0.56), (D * 2, 1.34, 0.22)]  # the last is the falling sigh


def smooth_step(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def contour(notes, glide, scoop):
    """Pitch over time: each note holds its pitch, sliding to it from the last note's over `glide` seconds."""
    f = np.zeros(N)
    prev = notes[0][0] * (1 - scoop)
    for freq, start, length in notes:
        i0 = int(start * SR)
        seg = t[i0:] - start
        f[i0:] = prev + (freq - prev) * smooth_step(seg / glide)
        prev = freq
    return f


def envelope(notes, attack, release, swell_last=0.0):
    e = np.zeros(N)
    for k, (freq, start, length) in enumerate(notes):
        i0 = int(start * SR)
        seg = t - start
        up = np.sin(np.clip(seg / attack, 0, 1) * np.pi / 2) ** 2
        down = np.clip((start + length - t) / release, 0, 1) ** 1.3
        body = 1.0 + (swell_last * np.sin(np.clip(seg / length, 0, 1) * np.pi) if k == len(notes) - 1 else 0)
        e = np.maximum(e, np.where(t >= start, up * down * body, 0.0))
    return e


def vibrato(rate, depth, delay, ramp):
    return depth * np.clip((t - delay) / ramp, 0, 1) * np.sin(2 * np.pi * rate * np.clip(t - delay, 0, None))


def body_gain(freq):
    """The violin body's resonances (a warm hump near 450 Hz, a brighter one near 1.2 kHz and a nasal one near 2.4 kHz)."""
    lf = np.log(np.clip(freq, 40, None))
    return 0.55 + 1.0 * np.exp(-0.5 * ((lf - np.log(450)) / 0.35) ** 2) + 0.7 * np.exp(-0.5 * ((lf - np.log(1200)) / 0.3) ** 2) + 0.35 * np.exp(-0.5 * ((lf - np.log(2400)) / 0.3) ** 2)


def bowed(f, env, harmonics=14, tilt=1.15):
    phase = 2 * np.pi * np.cumsum(f) / SR
    out = np.zeros(N)
    for n in range(1, harmonics + 1):
        hf = f * n
        a = n ** -tilt * body_gain(hf) * (hf < 5200)
        out += a * np.sin(n * phase + rng.uniform(0, 2 * np.pi))
    jitter = 1 + 0.02 * np.convolve(rng.normal(0, 1, N), np.ones(160) / 160, "same") * 6
    return out * env * jitter


def breath(env, centre, width):
    """Band-limited noise: the breath over a flute note."""
    spec = np.fft.rfft(rng.normal(0, 1, N))
    fr = np.fft.rfftfreq(N, 1 / SR)
    band = np.exp(-0.5 * ((np.log(np.clip(fr, 1, None)) - np.log(centre)) / width) ** 2)
    return np.fft.irfft(spec * band, N) * env


# ------------------------------------------------------------------ violin
vf = contour(VIOLIN, 0.07, 0.012) * (1 + vibrato(5.7, 0.0085, 0.10, 0.22))
venv = envelope(VIOLIN, 0.055, 0.10, swell_last=0.18)
violin = bowed(vf, venv)
violin += 0.05 * breath(venv, 3200, 0.5)  # bow noise
violin *= 0.55 / max(np.abs(violin).max(), 1e-9)

# a very quiet bowed drone, D and A below the tune, swelling in and out
drone_env = np.sin(np.clip(t / 1.5, 0, 1) * np.pi) ** 1.5 * (t < 1.75)
drone = sum(bowed(np.full(N, f), drone_env, 8, 1.6) for f in (SA / 2, SA * 3 / 4))
drone *= 0.15 / max(np.abs(drone).max(), 1e-9)

# ------------------------------------------------------------------ flute
ff = contour(FLUTE, 0.06, 0.006) * (1 + vibrato(5.0, 0.007, 0.16, 0.25))
fenv = envelope(FLUTE, 0.045, 0.09, swell_last=0.0) * 0.92
phase = 2 * np.pi * np.cumsum(ff) / SR
flute = np.sin(phase) + 0.30 * np.sin(2 * phase + 0.4) + 0.10 * np.sin(3 * phase + 1.1) + 0.04 * np.sin(4 * phase)
flute = flute * fenv
# the breath, and a soft chiff as each note starts
flute += 0.07 * breath(fenv, 2600, 0.45)
for freq, start, length in FLUTE:
    i0 = int(start * SR)
    n = int(SR * 0.03)
    chiff = rng.normal(0, 1, n) * np.exp(-np.arange(n) / (SR * 0.008))
    flute[i0:i0 + n] += 0.05 * np.convolve(chiff, np.ones(6) / 6, "same")
flute *= 0.34 / max(np.abs(flute).max(), 1e-9)

dry = violin + drone + flute

# ------------------------------------------------------------------ a small, warm stone hall
ir_len = int(SR * 0.9)
ir = rng.normal(0, 1, ir_len) * np.exp(-np.log(1000.0) * np.arange(ir_len) / (SR * 0.75))
ir[: int(SR * 0.014)] = 0
for d, g in ((0.019, 0.5), (0.033, 0.36), (0.049, 0.27)):
    ir[int(SR * d)] += g * 5
dark = ir.copy()
for width in (5, 11):
    dark = np.convolve(dark, np.ones(width) / width, mode="same")
ir = ir * (1 - np.clip(np.linspace(0, 1.5, ir_len), 0, 1)) + dark * np.clip(np.linspace(0, 1.5, ir_len), 0, 1)
ir /= np.sqrt((ir ** 2).sum())
size = 1 << int(np.ceil(np.log2(N + ir_len)))
wet = np.fft.irfft(np.fft.rfft(dry, size) * np.fft.rfft(ir, size), size)[:N]
wet *= np.abs(dry).max() / max(np.abs(wet).max(), 1e-9)
out = 0.8 * dry + 0.32 * wet

# roll the top off (one-pole low-pass near 4.2 kHz, twice)
a = np.exp(-2 * np.pi * 4200 / SR)
for _ in range(2):
    y = np.empty_like(out)
    acc = 0.0
    for i, x in enumerate(out):
        acc = (1 - a) * x + a * acc
        y[i] = acc
    out = y

fade = int(SR * 0.45)
out[-fade:] *= np.linspace(1, 0, fade) ** 2
out[: int(SR * 0.004)] *= np.linspace(0, 1, int(SR * 0.004))
out /= np.abs(out).max() / 0.62  # a comfortable level, never loud
pcm = (out * 32767).astype("<i2")

dest = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[2] / "public/audio/accept-melody.wav"
dest.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(dest), "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
rms = lambda a_, b_: float(np.sqrt((out[int(a_ * SR):int(b_ * SR)] ** 2).mean()))
print(f"✓ {dest}  {dest.stat().st_size // 1024} KB, {DUR}s; level 0–0.3 s {rms(0, 0.3):.3f}, 0.9–1.3 s {rms(0.9, 1.3):.3f}, 1.6–1.8 s {rms(1.6, 1.8):.4f}, 2.0–2.15 s {rms(2.0, 2.15):.5f}")
