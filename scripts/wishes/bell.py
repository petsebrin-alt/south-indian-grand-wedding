"""
python3 scripts/wishes/bell.py → public/audio/temple-ding.wav, the soft temple-bell blessing that chimes when a new
blessing is hung on the Wishing Wall (src/lib/bell.ts plays it; if the file cannot be loaded the page synthesises a
single bell instead). It is not a recording: it is built from bell tones, kept gentle on purpose.
  - A short, lilting phrase of five soft strokes on a pentatonic scale (D, G, A, B, then G again, as in raga
    Bhoopali's S, M, P, D), with the rhythm of a small temple-bell pattern (ta-ta, ta-ta, ta---), the last
    stroke the longest and warmest, with a low hum beneath it. It reads as a blessing, not an alarm.
  - Each stroke is struck softly (a rounded attack of about a hundredth of a second, with no noise burst or
    click), and its tones are mostly whole-number multiples of the note (an octave, a fifth, a twelfth), with only
    a trace of the inharmonic metal in them, so it sounds like a chime and not a clang. Each tone has its own
    ring-out and a slow, tiny shimmer from two almost-equal pitches. The top is rolled off so nothing is shrill.
  - A warm, dark stone-hall reverb carries the ends of the strokes into one another.
Needs only python3 and numpy. If the family has a recording of their own temple bell, save it as
public/audio/temple-ding.wav and this is not needed.
"""
import sys
import wave
from pathlib import Path

import numpy as np

SR = 32000
DUR = 5.4
rng = np.random.default_rng(108)
t = np.arange(int(SR * DUR)) / SR

# note, seconds from the start, loudness. The rhythm lilts: short, short, a little longer, then a held last stroke.
PHRASE = [
    (587.33, 0.00, 0.80),  # D5
    (783.99, 0.36, 0.55),  # G5
    (880.00, 0.66, 0.46),  # A5
    (987.77, 1.08, 0.40),  # B5
    (783.99, 1.74, 0.78),  # G5, held
]
HUM = (392.00, 1.74, 0.30)  # G4 under the last stroke

# ratio to the note, level, seconds to fall by 60 dB, shimmer (Hz between the pair of pitches)
TONES = [
    (0.5, 0.20, 3.4, 0.35),
    (1.0, 1.00, 3.3, 0.45),
    (1.5, 0.09, 2.0, 0.55),
    (2.0, 0.34, 2.0, 0.60),
    (2.76, 0.045, 1.0, 0.8),
    (3.0, 0.13, 1.2, 0.8),
    (4.0, 0.055, 0.7, 1.0),
]


def stroke(freq, start, loud, long=False):
    out = np.zeros_like(t)
    tt = t - start
    live = tt >= 0
    stretch = 1.35 if long else 1.0
    for ratio, amp, t60, beat in TONES:
        f = freq * ratio
        if f > 5200:
            continue
        env = np.where(live, np.exp(-np.log(1000.0) * np.clip(tt, 0, None) / (t60 * stretch)), 0.0)
        # a rounded attack of ~10 ms: a soft touch, never a click
        env *= np.sin(np.clip(tt / 0.011, 0, 1) * np.pi / 2) ** 2
        p1, p2 = rng.uniform(0, 2 * np.pi, 2)
        tone = 0.5 * np.sin(2 * np.pi * f * tt + p1) + 0.5 * np.sin(2 * np.pi * (f + beat) * tt + p2)
        out += amp * env * tone
    return loud * out


dry = np.zeros_like(t)
for i, (f, s, v) in enumerate(PHRASE):
    dry += stroke(f, s, v, long=(i == len(PHRASE) - 1))
dry += stroke(HUM[0], HUM[1], HUM[2], long=True)

# a very soft felt tap under each stroke, low and dull (a mallet of cloth, not metal)
for f, s, v in PHRASE:
    n = int(SR * 0.012)
    tap = rng.normal(0, 1, n)
    k = np.ones(25) / 25
    tap = np.convolve(tap, k, mode="same") * np.exp(-np.arange(n) / (SR * 0.004))
    i0 = int(s * SR)
    dry[i0:i0 + n] += 0.035 * v * tap / max(np.abs(tap).max(), 1e-9)

# a warm, dark stone hall
ir_len = int(SR * 2.4)
ir = rng.normal(0, 1, ir_len) * np.exp(-np.log(1000.0) * np.arange(ir_len) / (SR * 1.9))
ir[: int(SR * 0.02)] = 0
for d, g in ((0.024, 0.45), (0.041, 0.34), (0.059, 0.26), (0.083, 0.2)):
    ir[int(SR * d)] += g * 5
# darker as it goes on: smooth the impulse response more and more
dark = ir.copy()
for width in (5, 9, 17):
    dark = np.convolve(dark, np.ones(width) / width, mode="same")
mix = np.clip(np.linspace(0, 1.6, ir_len), 0, 1)
ir = ir * (1 - mix) + dark * mix
ir /= np.sqrt((ir ** 2).sum())
size = 1 << int(np.ceil(np.log2(len(dry) + len(ir))))
wet = np.fft.irfft(np.fft.rfft(dry, size) * np.fft.rfft(ir, size), size)[: len(dry)]
wet *= np.abs(dry).max() / max(np.abs(wet).max(), 1e-9)
out = 0.72 * dry + 0.40 * wet

# roll the top off gently (a one-pole low-pass near 4.5 kHz, twice), so nothing is bright or shrill
a = np.exp(-2 * np.pi * 4500 / SR)
for _ in range(2):
    y = np.empty_like(out)
    acc = 0.0
    for i, x in enumerate(out):
        acc = (1 - a) * x + a * acc
        y[i] = acc
    out = y

fade = int(SR * 0.9)
out[-fade:] *= np.linspace(1, 0, fade) ** 2
out /= np.abs(out).max() / 0.7  # a comfortable level, never loud
pcm = (out * 32767).astype("<i2")

dest = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[2] / "public/audio/temple-ding.wav"
dest.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(dest), "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
rms = lambda a_, b_: float(np.sqrt((out[int(a_ * SR):int(b_ * SR)] ** 2).mean()))
print(f"✓ {dest}  {dest.stat().st_size // 1024} KB, {DUR}s; level 0–0.3 s {rms(0, 0.3):.3f}, 1.7–2.2 s {rms(1.7, 2.2):.3f}, 3–4 s {rms(3, 4):.3f}, 4.6–5.2 s {rms(4.6, 5.2):.4f}")
