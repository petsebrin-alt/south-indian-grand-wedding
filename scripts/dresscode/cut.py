"""
python3 scripts/dresscode/cut.py <outdir> → the Dress Code page's pieces, cut from the client's two pictures
(src/assets/dresscode/source/cards.webp: the five finished dress-code cards, Haldi, Mehendi, Sangeet Night, Wedding
and Reception, each with its couple, garlands and lamps, a title banner, four colour discs and a line of text;
source/garden.webp: the page, a garden of jasmine garlands and bells with a stack of cards). Coordinates are in
src/assets/dresscode/scene.json. Run through `npm run dresscode:assets` (scripts/dresscode/derive.ts, which makes
the web pictures). Needs: python3, numpy, opencv-python.

  card-<id>.png   each card cut out with soft corners, with its lettering (title, tagline, "Suggested Colours", the
                  description) and its four colour discs rubbed out, the places filled in smoothly from the cream
                  paper round them with the picture's own grain; everything else stays exactly as the client drew it
  ornament.png    the gold lotus and rules over the heading
  scene.png       the garden without its heading, stack of cards and arrows, trimmed a little at the sides and made
                  taller to a phone's shape by repeating plain seams of it
  meta.json       sizes, where each card's title, tagline, label, discs and description were (as % of the card) and
                  the shades the discs had (the starting values of dressCode in src/data/wedding.ts)
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "lib"))
from imgtools import fill_with_grain, k, rgba, seam_extend, smooth, unsharp, vertical_fill  # noqa: E402

root = Path(__file__).resolve().parents[2]
src = root / "src/assets/dresscode"
cfg = json.loads((src / "scene.json").read_text())
out = Path(sys.argv[1])
out.mkdir(parents=True, exist_ok=True)

sheet = cv2.imread(str(src / "source/cards.webp"), cv2.IMREAD_COLOR)
garden = cv2.imread(str(src / "source/garden.webp"), cv2.IMREAD_COLOR)
meta: dict = {"cards": {}}


def bands(mask_rows, gap=3, min_len=3):
    """[start, end) runs of rows that hold anything, runs closer than `gap` rows joined."""
    idx = np.where(mask_rows)[0]
    if not len(idx):
        return []
    runs, start, prev = [], idx[0], idx[0]
    for i in idx[1:]:
        if i - prev > gap:
            runs.append((start, prev + 1))
            start = i
        prev = i
    runs.append((start, prev + 1))
    return [r for r in runs if r[1] - r[0] >= min_len]


def text_only(dark, max_h=36, min_w=20, join=19):
    """Keep only the dark pixels that belong to lines of lettering: letters joined into a line make a flat, wide
    blob; hair, leaves, flowers and pots make tall ones, and those are left alone."""
    u8 = dark.astype(np.uint8)
    joined = cv2.morphologyEx(u8, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (join, 3)))
    n, lab, st, _ = cv2.connectedComponentsWithStats(joined)
    keep = [i for i in range(1, n) if st[i, cv2.CC_STAT_HEIGHT] <= max_h and st[i, cv2.CC_STAT_WIDTH] >= min_w]
    return np.isin(lab, keep) & dark


def hexof(bgr):
    b, g, r = [int(round(v)) for v in bgr]
    return f"#{r:02x}{g:02x}{b:02x}"


def process_card(name, box):
    x0, y0, x1, y1 = box
    crop = np.ascontiguousarray(sheet[y0:y1, x0:x1])
    h, w = crop.shape[:2]
    hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
    V = hsv[..., 2].astype(np.int32)
    Sat = hsv[..., 1].astype(np.int32)
    lab = cv2.cvtColor(crop, cv2.COLOR_BGR2LAB).astype(np.float32)
    Hue = hsv[..., 0].astype(np.int32)
    # lettering: dark brown and grey, never the gold of the ornaments or the deep green of leaves
    dark = (V < 150) & ~((Hue >= 32) & (Hue <= 95) & (Sat > 60))

    # ---- the banner's lettering: a large title line and a smaller tagline line below it
    sx0, sy0, sx1, sy1 = cfg["search"]["title"]
    ax0, ay0, ax1, ay1 = int(sx0 * w), int(sy0 * h), int(sx1 * w), int(sy1 * h)
    tdark = np.zeros((h, w), bool)
    tdark[ay0:ay1, ax0:ax1] = text_only(dark[ay0:ay1, ax0:ax1], 40)
    # the title line, then the tagline line: the first two runs of rows from the top (a man's dark hair, a little
    # lower, is a third run and is left alone)
    runs = bands(tdark.sum(1) > 0, gap=2, min_len=8)
    if len(runs) < 2:
        raise SystemExit(f"{name}: expected a title line and a tagline line, found {runs}")
    (t0, t1), (g0, g1) = runs[0], runs[1]
    g1 = min(g1, g0 + 23)  # a tagline is never taller than this: anything lower is not lettering (a man's hair)
    tdark[g1 + 2:] = False
    cols = lambda a, b: np.where(tdark[a:b].sum(0) > 0)[0]
    tc, gc = cols(t0, t1), cols(g0, g1)

    # ---- the right column: "Suggested Colours", four colour discs, an ornament, the description
    cx0, cy0, cx1, cy1 = cfg["search"]["column"]
    bx0, by0, bx1, by1 = int(cx0 * w), int(cy0 * h), int(cx1 * w), int(cy1 * h)
    region = lab[by0:by1, bx0:bx1]
    paper = np.median(region.reshape(-1, 3), axis=0)
    delta = np.linalg.norm(region - paper, axis=2)
    soft = cv2.GaussianBlur(delta, (0, 0), 2.0)
    blob = (soft > 7).astype(np.uint8)
    n, lab_im, st, cen = cv2.connectedComponentsWithStats(blob)
    discs = []
    for i in range(1, n):
        cw, ch, area = st[i, cv2.CC_STAT_WIDTH], st[i, cv2.CC_STAT_HEIGHT], st[i, cv2.CC_STAT_AREA]
        if 38 <= cw <= 80 and 38 <= ch <= 80 and 0.8 < cw / ch < 1.25 and area > 0.68 * cw * ch:
            discs.append((bx0 + cen[i][0], by0 + cen[i][1], (cw + ch) / 4))
    if len(discs) != 4:
        raise SystemExit(f"{name}: expected four colour discs, found {len(discs)}")
    discs.sort(key=lambda d: (round(d[1] / 30), d[0]))
    rad = float(np.median([d[2] for d in discs]))
    top_d = min(d[1] for d in discs) - rad
    bot_d = max(d[1] for d in discs) + rad
    cdark = np.zeros((h, w), bool)
    cdark[by0:by1, bx0:bx1] = text_only(dark[by0:by1, bx0:bx1], 44, 20, 11)
    label_rows = np.zeros(h, bool)
    label_rows[by0:int(top_d) - 2] = cdark[by0:int(top_d) - 2].sum(1) > 0
    lruns = bands(label_rows, gap=6, min_len=8)
    desc_rows = np.zeros(h, bool)
    desc_rows[int(bot_d) + 10:by1] = cdark[int(bot_d) + 10:by1].sum(1) > 0
    druns = bands(desc_rows, gap=6, min_len=8)
    if not lruns or not druns:
        raise SystemExit(f"{name}: label {lruns} or description {druns} not found")
    l0, l1 = lruns[0][0], lruns[-1][1]
    d0, d1 = druns[0][0], druns[-1][1]
    lc = np.where(cdark[l0:l1].sum(0) > 0)[0]
    dc = np.where(cdark[d0:d1].sum(0) > 0)[0]

    # ---- rub them out and fill the cream paper in
    # the banner's lettering is widened a little, but never below the tagline (a man's hair may touch it)
    title_hole = cv2.dilate(tdark.astype(np.uint8), k(3))
    title_hole[g1 + 3:] = 0
    hole = title_hole
    col_hole = np.zeros((h, w), np.uint8)
    col_hole[l0 - 2:l1 + 2, :] |= cdark[l0 - 2:l1 + 2, :].astype(np.uint8)
    col_hole[d0 - 2:d1 + 2, :] |= cdark[d0 - 2:d1 + 2, :].astype(np.uint8)
    hole = hole | cv2.dilate(col_hole, k(4))
    for cx, cy, r in discs:
        cv2.circle(hole, (int(cx), int(cy)), int(rad + 5), 1, -1)
    filled = fill_with_grain(crop, hole > 0, 11, 80, 0.7, 2.0)

    # ---- soft rounded corners
    alpha = np.zeros((h, w), np.uint8)
    cv2.rectangle(alpha, (1, 1), (w - 2, h - 2), 255, -1, cv2.LINE_AA)
    m = np.zeros((h, w), np.uint8)
    r = 10
    cv2.rectangle(m, (r, 0), (w - r, h), 255, -1)
    cv2.rectangle(m, (0, r), (w, h - r), 255, -1)
    for cxy in ((r, r), (w - r - 1, r), (r, h - r - 1), (w - r - 1, h - r - 1)):
        cv2.circle(m, cxy, r, 255, -1, cv2.LINE_AA)
    a = cv2.GaussianBlur(cv2.erode(m, k(1)), (0, 0), 0.8).astype(np.float32) / 255
    cv2.imwrite(str(out / f"card-{name}.png"), rgba(filled, a, cfg["upscale"]["card"]))

    # ---- the shades the discs had (the middle of each disc)
    shades = []
    for cx, cy, r_ in discs:
        yy, xx = np.ogrid[:h, :w]
        inside = (xx - cx) ** 2 + (yy - cy) ** 2 <= (0.5 * rad) ** 2
        shades.append(hexof(np.median(crop[inside], axis=0)))
    P = lambda v, total: round(v / total * 100, 3)
    meta["cards"][name] = {
        "width": int(w * cfg["upscale"]["card"]),
        "height": int(h * cfg["upscale"]["card"]),
        "srcWidth": w,
        "title": {"cx": P((tc.min() + tc.max()) / 2, w), "cy": P((t0 + t1) / 2, h), "cap": P(t1 - t0, w)},
        "tagline": {"cx": P((gc.min() + gc.max()) / 2, w), "cy": P((g0 + g1) / 2, h), "h": P(g1 - g0, w)},
        "label": {"cx": P((lc.min() + lc.max()) / 2, w), "cy": P((l0 + l1) / 2, h), "w": P(lc.max() - lc.min(), w), "h": P(l1 - l0, w)},
        "discs": [{"cx": P(cx, w), "cy": P(cy, h)} for cx, cy, _ in discs],
        "disc": P(2 * rad, w),
        "desc": {"cx": P((dc.min() + dc.max()) / 2, w), "cy": P((d0 + d1) / 2, h), "w": P(dc.max() - dc.min(), w), "h": P(d1 - d0, w), "lines": len(druns)},
        "shades": shades,
    }


# ------------------------------------------------------------------ the garden
def cut_ornament():
    x0, y0, x1, y1 = cfg["garden"]["ornament"]
    crop = np.ascontiguousarray(garden[y0:y1, x0:x1])
    hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
    Hh, Ss, Vv = [hsv[..., i].astype(np.float32) for i in range(3)]
    # gold lines against pale blue sky: warm hue, and clearly more colourful than the sky
    alpha = smooth(70, 130, Ss) * (Hh < 45) * smooth(120, 170, Vv)
    cv2.imwrite(str(out / "ornament.png"), rgba(crop, alpha, cfg["upscale"]["ornament"]))
    meta["ornament"] = {"width": int((x1 - x0) * cfg["upscale"]["ornament"]), "height": int((y1 - y0) * cfg["upscale"]["ornament"])}


def clean_garden():
    h, w = garden.shape[:2]
    hole = np.zeros((h, w), bool)
    for x0, y0, x1, y1 in cfg["garden"]["holes"]:
        hole[y0:y1, x0:x1] = True
    # From the sky above down to the marble below (a smooth all-round fill goes muddy from the leaves at the sides),
    # then the picture's own grain
    sky = vertical_fill(garden, hole)
    rng = np.random.default_rng(13)
    lum = garden.astype(np.float32) @ np.array([0.114, 0.587, 0.299], np.float32)
    ring = (cv2.dilate(hole.astype(np.uint8), np.ones((41, 41), np.uint8)) > 0) & ~hole
    resid = lum - cv2.GaussianBlur(lum, (0, 0), 2.0)
    sigma = min(3.0, 1.4826 * float(np.median(np.abs(resid[ring] - np.median(resid[ring])))))
    noise = cv2.GaussianBlur(rng.normal(0, 1, lum.shape).astype(np.float32), (0, 0), 0.8) * 1.8
    filled = np.clip(np.where(hole[..., None], sky + (noise * sigma)[..., None], garden.astype(np.float32)), 0, 255).astype(np.uint8)
    # the edge of the filled place melts into the garden round it (as a soft focus would) instead of ending in a line
    band = cv2.dilate(hole.astype(np.uint8), k(30)) - cv2.erode(hole.astype(np.uint8), k(30))
    ramp = cv2.GaussianBlur(band.astype(np.float32), (0, 0), 11)[..., None]
    melted = cv2.GaussianBlur(filled, (0, 0), 15)
    filled = np.clip(filled * (1 - ramp) + melted * ramp, 0, 255).astype(np.uint8)
    trim = cfg["scene"]["trim"]
    img = filled[:, trim:w - trim]
    tw, th = cfg["scene"]["target"]
    target_h = int(round(img.shape[1] * th / tw))
    extra = target_h - img.shape[0]
    print(f"scene: {img.shape[1]} × {img.shape[0]} → {img.shape[1]} × {target_h} (+{extra} rows)")
    tall = unsharp(seam_extend(img, cfg["scene"]["band"][0], cfg["scene"]["band"][1], extra), 1.2, 0.35)
    meta["scene"] = {"width": tall.shape[1], "height": tall.shape[0]}
    cv2.imwrite(str(out / "scene.png"), tall)


if __name__ == "__main__":
    for name, box in cfg["cards"].items():
        process_card(name, box)
    cut_ornament()
    clean_garden()
    (out / "meta.json").write_text(json.dumps(meta, indent=2))
    print(json.dumps({n: {"discs": len(c["discs"]), "shades": c["shades"], "desc": c["desc"]["lines"]} for n, c in meta["cards"].items()}))
