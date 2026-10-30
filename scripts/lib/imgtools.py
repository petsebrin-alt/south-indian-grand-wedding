"""
Image helpers shared by the picture-cutting scripts (scripts/wishes/cut.py, scripts/dresscode/cut.py): smooth fills of
areas a cut-out leaves behind, soft-edged cut-outs, and making a picture taller by repeating its plainest seams.
Needs: numpy, opencv-python.
"""
import cv2
import numpy as np


def k(r):
    """An elliptical structuring element of radius r."""
    return cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def unsharp(img, sigma=1.1, amount=0.45):
    blur = cv2.GaussianBlur(img, (0, 0), sigma)
    return cv2.addWeighted(img, 1 + amount, blur, -amount, 0)


def harmonic_fill(img, hole, iters=60):
    """Fill `hole` (bool) by solving Laplace's equation from the known pixels round it, coarse to fine."""
    known = (~hole).astype(np.float32)
    levels = []
    im, kn = img.astype(np.float32), known
    while True:
        levels.append((im, kn))
        if min(im.shape[:2]) <= 24:
            break
        size = (im.shape[1] // 2, im.shape[0] // 2)
        num = cv2.resize(im * kn[..., None], size, interpolation=cv2.INTER_AREA)
        den = cv2.resize(kn, size, interpolation=cv2.INTER_AREA)
        im, kn = num / np.maximum(den, 1e-4)[..., None], (den > 0.5).astype(np.float32)
    ker = np.array([[0, 1, 0], [1, 0, 1], [0, 1, 0]], np.float32) / 4
    cim, ckn = levels[-1]
    est = np.where(ckn[..., None] > 0, cim, (cim * ckn[..., None]).sum((0, 1)) / max(ckn.sum(), 1))
    for lvl in range(len(levels) - 1, -1, -1):
        lim, lkn = levels[lvl]
        if est.shape[:2] != lim.shape[:2]:
            est = cv2.resize(est, (lim.shape[1], lim.shape[0]), interpolation=cv2.INTER_LINEAR)
        est = np.where(lkn[..., None] > 0, lim, est)
        for _ in range(iters if lvl > 0 else iters * 3):
            est = np.where(lkn[..., None] > 0, lim, cv2.filter2D(est, -1, ker, borderType=cv2.BORDER_REPLICATE))
    return est


def fill_with_grain(img, hole, seed, iters=60, strength=0.9, cap=99):
    """harmonic_fill plus the picture's own grain (brightness only, so it never speckles in colour) round the
    hole, so the filled area is not unnaturally smooth. The grain's size is read robustly (median deviation)
    from the pixels ring the hole, so edges and lettering beside it do not inflate it."""
    est = harmonic_fill(img, hole, iters)
    f = img.astype(np.float32)
    lum = f @ np.array([0.114, 0.587, 0.299], np.float32)
    resid = lum - cv2.GaussianBlur(lum, (0, 0), 2.0)
    ring = (cv2.dilate(hole.astype(np.uint8), np.ones((41, 41), np.uint8)) > 0) & ~hole
    sigma = 0.0
    if ring.any():
        r = resid[ring]
        sigma = min(cap, 1.4826 * float(np.median(np.abs(r - np.median(r)))))
    rng = np.random.default_rng(seed)
    noise = cv2.GaussianBlur(rng.normal(0, 1, lum.shape).astype(np.float32), (0, 0), 0.8) * 1.8
    return np.clip(np.where(hole[..., None], est + (noise * sigma * strength)[..., None], f), 0, 255).astype(np.uint8)


def bleed(color, alpha, rounds=6):
    """Spread the colours of the opaque edge outwards under transparent pixels, so resizing leaves no dark halo."""
    col = color.astype(np.float32).copy()
    w = (alpha > 0.5).astype(np.float32)
    for _ in range(rounds):
        num = cv2.dilate(col * w[..., None], k(1))
        cnt = cv2.blur(w, (3, 3)) * 9
        avg = cv2.blur(col * w[..., None], (3, 3)) * 9 / np.maximum(cnt, 1e-3)[..., None]
        grow = (w == 0) & (cnt > 0)
        col[grow] = avg[grow]
        w = np.where(grow, 1.0, w)
    return col


def rgba(color, alpha, scale=1):
    """Colour + alpha (0..1) → BGRA, resized with Lanczos and lightly sharpened."""
    col = bleed(color, alpha)
    if scale != 1:
        size = (int(round(col.shape[1] * scale)), int(round(col.shape[0] * scale)))
        col = unsharp(cv2.resize(col, size, interpolation=cv2.INTER_LANCZOS4), 1.0, 0.4)
        alpha = cv2.resize(alpha.astype(np.float32), size, interpolation=cv2.INTER_CUBIC)
    a = np.clip(alpha, 0, 1)
    return np.dstack([np.clip(col, 0, 255), a * 255]).astype(np.uint8)


def seam_extend(img, top, bottom, extra):
    """Make img `extra` rows taller by repeating the plainest seams between rows top..bottom."""
    Hh_, Ww_ = img.shape[:2]
    bh = bottom - top + 1
    band = img[top:bottom + 1].astype(np.float32)
    lum = cv2.GaussianBlur(band, (0, 0), 1.6) @ np.array([0.114, 0.587, 0.299], np.float32)
    T = np.ascontiguousarray(lum.T)  # one row per image column
    idx = np.tile(np.arange(bh), (Ww_, 1))
    removed = np.zeros((Ww_, bh), np.uint8)
    rows = bh
    cols = np.arange(Ww_)
    for _ in range(extra):
        E = np.abs(np.gradient(T, axis=0)) + np.abs(np.gradient(T, axis=1))
        M = E.copy()
        for x in range(1, Ww_):
            p = M[x - 1]
            up = np.empty_like(p); up[1:] = p[:-1]; up[0] = np.inf
            dn = np.empty_like(p); dn[:-1] = p[1:]; dn[-1] = np.inf
            M[x] += np.minimum(p, np.minimum(up, dn))
        r = int(np.argmin(M[Ww_ - 1]))
        seam = np.empty(Ww_, np.int64)
        for x in range(Ww_ - 1, -1, -1):
            seam[x] = r
            if x > 0:
                c = [(M[x - 1][r], r)]
                if r > 0: c.append((M[x - 1][r - 1], r - 1))
                if r < rows - 1: c.append((M[x - 1][r + 1], r + 1))
                r = min(c)[1]
        keep = np.ones((Ww_, rows), bool)
        keep[cols, seam] = False
        removed[cols, idx[cols, seam]] = 1
        T = T[keep].reshape(Ww_, rows - 1)
        idx = idx[keep].reshape(Ww_, rows - 1)
        rows -= 1
    res = np.empty((Hh_ + extra, Ww_, 3), img.dtype)
    res[:top] = img[:top]
    res[top + bh + extra:] = img[bottom + 1:]
    srcb = img[top:bottom + 1].astype(np.float32)
    for x in range(Ww_):
        rep = 1 + removed[x]
        order = np.repeat(np.arange(bh), rep)
        col = srcb[order, x]
        first = np.cumsum(rep) - rep
        dup = first[removed[x] > 0] + 1
        nxt = np.minimum(order[dup] + 1, bh - 1)
        col[dup] = 0.5 * (srcb[order[dup], x] + srcb[nxt, x])
        res[top:top + bh + extra, x] = col.astype(img.dtype)
    return res


def vertical_fill(img, hole, spread=14, probe=8):
    """Fill `hole` (bool) column by column, from the colour just above each stretch of it to the colour just below,
    so a hazy sky meeting a bright floor stays a clean gradient (a smooth all-round fill picks up the leaves at the
    sides and goes muddy). Neighbouring columns are averaged so no streaks show."""
    h, w = hole.shape
    f = img.astype(np.float32)
    out = f.copy()
    for x in range(w):
        col = hole[:, x]
        if not col.any():
            continue
        y = 0
        while y < h:
            if not col[y]:
                y += 1
                continue
            y0 = y
            while y < h and col[y]:
                y += 1
            y1 = y  # the stretch is y0..y1-1
            above = f[max(0, y0 - probe):y0, x].mean(0) if y0 > 0 else None
            below = f[y1:min(h, y1 + probe), x].mean(0) if y1 < h else None
            if above is None:
                above = below
            if below is None:
                below = above
            t = (np.arange(y0, y1) - y0 + 0.5) / (y1 - y0)
            out[y0:y1, x] = above[None, :] * (1 - t)[:, None] + below[None, :] * t[:, None]
    # across columns, so the stretches of neighbouring columns blend; only inside the hole
    soft = cv2.GaussianBlur(out, (0, 0), spread)
    return np.where(hole[..., None], soft, f)
