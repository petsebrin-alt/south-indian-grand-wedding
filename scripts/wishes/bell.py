"""
python3 scripts/wishes/bell.py → public/audio/temple-ding.wav, the single "ding" of a brass temple bell
that rings when a new blessing is hung on the Wishing Wall (src/lib/bell.ts plays it; if the file cannot be
loaded the page synthesises a bell instead). It is not a recording: it is built from how a cast brass bell
sounds: a clapper strike (a few milliseconds of bright, filtered noise and a short metallic click), then the
bell's own tones. Those tones are not harmonics of one note: a hum an octave below the strike note, the strike
note, a minor third, a fifth, the octave and higher, rattling partials, each ringing for its own time (the
low ones for several seconds, the high ones for a fraction of one), and each made of two very slightly
different pitches so that it shimmers and waves as it fades, as hand-cast brass does. A faint second strike
follows (the clapper bouncing back), and a small stone-hall reverb carries the tail.
Needs only python3 and numpy. If the family has a recording of their own temple bell, save it as
public/audio/temple-bell.mp3 for the opening and public/audio/temple-ding.wav here, and this is not needed.
"""
import sys
import wave
from pathlib import Path

import numpy as np

SR = 32000
DUR = 4.6
F0 = 880.0  # the strike note
rng = np.random.default_rng(1947)
t = np.arange(int(SR * DUR)) / SR

# ratio to the strike note, level, seconds to fall by 60 dB, beating (Hz between the pair of pitches)
PARTIALS = [
    (0.5, 0.34, 7.5, 0.7),
    (1.0, 1.00, 6.6, 1.1),
    (1.19, 0.52, 5.0, 1.6),
    (1.50, 0.36, 4.2, 0.9),
    (2.00, 0.60, 3.7, 1.3),
    (2.51, 0.28, 2.6, 1.8),
    (2.99, 0.21, 2.0, 2.2),
    (4.01, 0.17, 1.2, 2.7),
    (5.22, 0.11, 0.8, 3.1),
    (6.83, 0.07, 0.5, 3.6),
    (8.41, 0.045, 0.32, 4.0),
]


def strike(level, offset=0.0, detune=1.0):
    out = np.zeros_like(t)
    tt = t - offset
    live = tt >= 0
    for ratio, amp, t60, beat in PARTIALS:
        f = F0 * ratio * detune
        env = np.where(live, np.exp(-np.log(1000.0) * np.clip(tt, 0, None) / t60), 0.0)
        env *= np.clip(tt / 0.0016, 0, 1)  # a 1.6 ms rise, so there is no click
        p1, p2 = rng.uniform(0, 2 * np.pi, 2)
        tone = 0.5 * np.sin(2 * np.pi * f * tt + p1) + 0.5 * np.sin(2 * np.pi * (f + beat) * tt + p2)
        out += amp * env * tone
    # the clapper: a short bright burst of band-limited noise and a small metallic click
    n = int(SR * 0.035)
    noise = rng.normal(0, 1, n)
    spec = np.fft.rfft(noise)
    freqs = np.fft.rfftfreq(n, 1 / SR)
    band = np.exp(-0.5 * ((np.log(np.clip(freqs, 1, None)) - np.log(4200.0)) / 0.55) ** 2)
    burst = np.fft.irfft(spec * band, n) * np.exp(-np.arange(n) / (SR * 0.0045))
    burst /= np.abs(burst).max()
    i0 = int(offset * SR)
    out[i0:i0 + n] += 0.5 * burst
    click_t = np.arange(int(SR * 0.02)) / SR
    click = np.sin(2 * np.pi * 2350 * click_t) * np.exp(-click_t / 0.0055)
    out[i0:i0 + len(click)] += 0.22 * click
    return level * out


dry = strike(1.0) + strike(0.26, offset=0.43, detune=1.0015)

# a small stone hall: early reflections, then a soft, darkening tail
ir_len = int(SR * 1.5)
ir = rng.normal(0, 1, ir_len) * np.exp(-np.log(1000.0) * np.arange(ir_len) / (SR * 1.1))
ir[: int(SR * 0.012)] = 0
for d, g in ((0.017, 0.5), (0.029, 0.36), (0.043, 0.28), (0.061, 0.2)):
    ir[int(SR * d)] += g * 6
# darken the tail: smooth the later part of the impulse response
k = np.ones(9) / 9
ir_dark = np.convolve(ir, k, mode="same")
mix = np.linspace(0, 1, ir_len)
ir = ir * (1 - mix) + ir_dark * mix
ir /= np.sqrt((ir ** 2).sum())
size = 1 << int(np.ceil(np.log2(len(dry) + len(ir))))
wet = np.fft.irfft(np.fft.rfft(dry, size) * np.fft.rfft(ir, size), size)[: len(dry)]
out = 0.84 * dry + 0.26 * wet * (np.abs(dry).max() / max(np.abs(wet).max(), 1e-9)) * 0.55

# the tail fades to nothing, then normalise
fade = int(SR * 0.5)
out[-fade:] *= np.linspace(1, 0, fade) ** 2
out /= np.abs(out).max() / 0.89
pcm = (out * 32767).astype("<i2")

dest = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[2] / "public/audio/temple-ding.wav"
dest.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(dest), "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
rms = lambda a, b: float(np.sqrt((out[int(a * SR):int(b * SR)] ** 2).mean()))
print(f"✓ {dest}  {dest.stat().st_size // 1024} KB, {DUR}s; level 0–0.1 s {rms(0, 0.1):.3f}, 0.5–1 s {rms(0.5, 1):.3f}, 2–3 s {rms(2, 3):.3f}, 4–4.5 s {rms(4, 4.5):.4f}")
