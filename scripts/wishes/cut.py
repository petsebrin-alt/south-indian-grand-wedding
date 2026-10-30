"""
python3 scripts/wishes/cut.py <outdir> → the Wishing Wall's pieces, cut from the client's two pictures
(src/assets/wishes/source/wall.webp: a temple hall with a jasmine garland, five hanging blessing boards,
a heading and a "Write a Blessing" card; source/door.webp: a pair of golden doors). Coordinates are in
src/assets/wishes/scene.json. Run through `npm run wishes:assets` (scripts/wishes/derive.ts, which makes
the web pictures from these PNGs). Needs: python3, numpy, opencv-python.

  scene.png     the hall without its boards, chains, heading and card (the places they covered are filled
                in smoothly from what lies round them, with the picture's own grain), trimmed a little at
                the sides and made taller to a phone's shape by repeating plain seams of the hall (the
                garland, door, lamps and bowls keep their shape)
  door-l/r.png  the doors, trimmed to a phone's shape and cut down the middle, to slide apart
  board.png     one hanging board: medallion, cream board, clasp, jasmine and brass bell, cut out from its
                background, its lettering rubbed out (the page writes the real wish on it)
  chain.png     a few links of the gold chain, to tile
  orn-top/bottom.png  the gold flourishes round the heading
  card.png      the card, cut out, its lettering and fields rubbed out (the page puts real fields on it)
  meta.json     sizes and the positions of the board's lettering and the card's fields
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "lib"))
from imgtools import bleed, fill_with_grain, harmonic_fill, k, mirror_fill, reflect_rows_fill, rgba, seam_extend, smooth, unsharp  # noqa: E402,F401

root = Path(__file__).resolve().parents[2]
src = root / "src/assets/wishes"
cfg = json.loads((src / "scene.json").read_text())
out = Path(sys.argv[1])
out.mkdir(parents=True, exist_ok=True)

wall = cv2.imread(str(src / "source/wall.webp"), cv2.IMREAD_COLOR)
door = cv2.imread(str(src / "source/door.webp"), cv2.IMREAD_COLOR)
H, W = wall.shape[:2]
hsv = cv2.cvtColor(wall, cv2.COLOR_BGR2HSV)
Hh, Ss, Vv = [hsv[..., i].astype(np.int32) for i in range(3)]
meta: dict = {}


# ------------------------------------------------------------------ the board (medallion → bell)
def unit_shape(dx, dy, shape=(H, W)):
    m = np.zeros(shape, np.uint8)
    P = lambda pts: np.array([[x + dx, y + dy] for x, y in pts], np.int32)
    cv2.circle(m, (265 + dx, 283 + dy), 20, 255, -1)
    cv2.fillPoly(m, [P([(254, 240), (276, 240), (282, 262), (272, 272), (258, 272), (250, 262)])], 255)
    cv2.fillPoly(m, [P([(265, 292), (240, 296), (218, 304), (205, 314), (197, 320), (197, 484), (205, 492), (222, 504), (245, 512), (265, 514), (285, 512), (308, 504), (325, 492), (332, 484), (332, 320), (325, 314), (312, 304), (290, 296)])], 255)
    cv2.fillPoly(m, [P([(247, 506), (283, 506), (285, 524), (245, 524)])], 255)
    cv2.ellipse(m, (265 + dx, 546 + dy), (21, 23), 0, 0, 360, 255, -1)
    cv2.fillPoly(m, [P([(255, 566), (275, 566), (281, 580), (289, 598), (298, 612), (298, 622), (276, 628), (265, 632), (254, 628), (232, 622), (232, 612), (241, 598), (249, 580)])], 255)
    return m


def cut_board():
    x0, y0, x1, y1 = cfg["unit"]["crop"]
    crop = np.ascontiguousarray(wall[y0:y1, x0:x1])
    h, w = crop.shape[:2]
    rough = unit_shape(-x0, -y0, (h, w))
    gc = np.full((h, w), cv2.GC_BGD, np.uint8)
    gc[cv2.dilate(rough, k(7)) > 0] = cv2.GC_PR_BGD
    gc[rough > 0] = cv2.GC_PR_FGD
    gc[cv2.erode(rough, k(4)) > 0] = cv2.GC_FGD
    cv2.grabCut(crop, gc, None, np.zeros((1, 65)), np.zeros((1, 65)), 6, cv2.GC_INIT_WITH_MASK)
    m = np.where((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    m = np.where(lab == 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA])), 255, 0).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(cv2.bitwise_not(m))
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] < 400:
            m[lab == i] = 255
    alpha = cv2.GaussianBlur(m, (0, 0), 0.8).astype(np.float32) / 255
    # rub out the lettering
    tx0, ty0, tx1, ty1 = cfg["unit"]["text"]
    hole = np.zeros((h, w), bool)
    hole[ty0 - y0:ty1 - y0, tx0 - x0:tx1 - x0] = True
    clean = fill_with_grain(crop, hole, 3, 80, 0.7, 2.0)
    meta["board"] = {
        "width": int(w * cfg["upscale"]["board"]),
        "height": int(h * cfg["upscale"]["board"]),
        # the cream board (where the lettering goes), as % of the sprite
        "text": [round((tx0 - x0) / w * 100, 3), round((ty0 - y0) / h * 100, 3), round((tx1 - tx0) / w * 100, 3), round((ty1 - ty0) / h * 100, 3)],
        # the board's own edges (the cream body), as % of the sprite, so the page can set the lettering's width
        "body": [round((197 - x0) / w * 100, 3), round((292 - y0) / h * 100, 3), round((332 - 197) / w * 100, 3), round((514 - 292) / h * 100, 3)],
        # where the chain meets the sprite (its top), x as % of the sprite
        "hang": round((265 - x0) / w * 100, 3),
    }
    cv2.imwrite(str(out / "board.png"), rgba(clean, alpha, cfg["upscale"]["board"]))
    return alpha


# ------------------------------------------------------------------ the heading's flourishes
def cut_flourish(name, box):
    x0, y0, x1, y1 = box
    crop = np.ascontiguousarray(wall[y0:y1, x0:x1])
    v = Vv[y0:y1, x0:x1].astype(np.float32)
    s = Ss[y0:y1, x0:x1].astype(np.float32)
    alpha = smooth(150, 215, v) * smooth(30, 90, s)
    cv2.imwrite(str(out / f"{name}.png"), rgba(crop, alpha, cfg["upscale"]["title"]))
    meta[name] = {"width": int((x1 - x0) * cfg["upscale"]["title"]), "height": int((y1 - y0) * cfg["upscale"]["title"])}


# ------------------------------------------------------------------ the chain
def cut_chain():
    cx0, cx1 = cfg["chain"]["x"]
    cy0, cy1 = cfg["chain"]["y"]
    strip = np.ascontiguousarray(wall[cy0:cy1, cx0:cx1])
    v = Vv[cy0:cy1, cx0:cx1].astype(np.float32)
    s = Ss[cy0:cy1, cx0:cx1].astype(np.float32)
    alpha = smooth(150, 210, v) * smooth(70, 130, s)
    # the length of one link: the strongest repeat of the picture's brightness down the strip
    prof = alpha.sum(1)
    prof = prof - prof.mean()
    ac = np.correlate(prof, prof, "full")[len(prof) - 1:]
    lo, hi = 10, 26
    period = lo + int(np.argmax(ac[lo:hi]))
    links = max(2, round(36 / period))
    r0 = 20
    tile_h = period * links
    tile = strip[r0:r0 + tile_h]
    ta = alpha[r0:r0 + tile_h]
    # a seamless tile: fade the end of the run into its start
    blend = min(period // 2, 6)
    for i in range(blend):
        t = (i + 1) / (blend + 1)
        tile[tile_h - blend + i] = (1 - t) * tile[tile_h - blend + i] + t * strip[r0 - blend + i]
        ta[tile_h - blend + i] = (1 - t) * ta[tile_h - blend + i] + t * alpha[r0 - blend + i]
    scale = 2
    meta["chain"] = {"width": (cx1 - cx0) * scale, "height": tile_h * scale, "period": period}
    cv2.imwrite(str(out / "chain.png"), rgba(tile, ta, scale))


# ------------------------------------------------------------------ the card
def card_silhouette():
    x0, y0, x1, y1 = cfg["card"]["region"]
    cream = ((Vv > 205) & (Ss < 125)).astype(np.uint8)
    left = np.full(H, np.nan)
    right = np.full(H, np.nan)
    for y in range(y0, y1):
        row = cream[y, x0:x1].astype(np.int8)
        d = np.diff(np.concatenate(([0], row, [0])))
        starts, ends = np.where(d == 1)[0], np.where(d == -1)[0]
        ok = (ends - starts) >= 28
        if ok.any():
            left[y], right[y] = x0 + starts[ok][0], x0 + ends[ok][-1]
    ys = np.where(~np.isnan(left))[0]
    ys = ys[(ys >= y0)]
    def med(a):
        b = a.copy()
        for y in ys:
            win = a[max(y0, y - 9):y + 10]
            win = win[~np.isnan(win)]
            b[y] = np.median(win)
        return b
    left, right = med(left), med(right)
    m = np.zeros((H, W), np.uint8)
    pts = [(left[y] - 3, y) for y in ys] + [(right[y] + 3, y) for y in ys[::-1]]
    cv2.fillPoly(m, [np.array(pts, np.int32)], 255)
    # the card's rows run from its arch to its foot: keep only the main block
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    return np.where(lab == 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA])), 255, 0).astype(np.uint8)


def cut_card(sil):
    bx, by, bw, bh = cv2.boundingRect(sil)
    m = 14
    x0, y0, x1, y1 = bx - m, by - m, bx + bw + m, by + bh + m
    crop = np.ascontiguousarray(wall[y0:y1, x0:x1])
    s = sil[y0:y1, x0:x1]
    alpha = cv2.GaussianBlur(cv2.erode(s, k(1)), (0, 0), 0.9).astype(np.float32) / 255
    ex0, ey0, ex1, ey1 = cfg["card"]["erase"]
    hole = np.zeros(crop.shape[:2], bool)
    hole[ey0 - y0:ey1 - y0, ex0 - x0:ex1 - x0] = True
    # outside the card is not known cream: only the card itself feeds the fill
    known_only = (s > 0) | hole
    work = np.where(known_only[..., None], crop, 0).astype(np.uint8)
    est = fill_with_grain(work, hole | ~(s > 0), 5, 80, 0.7, 2.0)
    clean = np.where(hole[..., None], est, crop)
    L = cfg["card"]["layout"]
    w, h = x1 - x0, y1 - y0
    pct = lambda b: [round((b[0] - x0) / w * 100, 3), round((b[1] - y0) / h * 100, 3), round((b[2] - b[0]) / w * 100, 3), round((b[3] - b[1]) / h * 100, 3)]
    meta["card"] = {
        "width": int(w * cfg["upscale"]["card"]),
        "height": int(h * cfg["upscale"]["card"]),
        "title": round((L["titleY"] - y0) / h * 100, 3),
        "subtitle": pct(L["subtitle"]),
        "name": pct(L["name"]),
        "wish": pct(L["wish"]),
        "button": pct(L["button"]),
        "box": [x0, y0, x1, y1],
    }
    cv2.imwrite(str(out / "card.png"), rgba(clean, alpha, cfg["upscale"]["card"]))


# ------------------------------------------------------------------ the hall, made clean and phone-shaped
def clean_hall(sil):
    hole = np.zeros((H, W), np.uint8)
    gold = ((Vv > 150) & (Ss > 105) & (Hh > 13) & (Hh < 36)).astype(np.uint8) * 255
    white = (Vv > 195) & (Ss < 90)
    for dx, dy in cfg["boards"]:
        hole |= cv2.dilate(unit_shape(dx, dy), k(7))
        xc = 265 + dx
        # the chain, from just below the jasmine garland (which hangs over its top) down to the board
        cnt = white[30:200, xc - 9:xc + 10].sum(1)
        rows = np.where(cnt >= 4)[0]
        start = 30 + (int(rows.max()) if len(rows) else 0) + 4
        win = np.zeros((H, W), np.uint8)
        win[start:max(start + 6, 244 + dy), xc - 9:xc + 10] = 255
        hole |= cv2.dilate(cv2.bitwise_and(gold, win), k(4))
    tx0, ty0, tx1, ty1 = cfg["title"]["box"]
    tb = np.zeros((H, W), np.uint8)
    tb[ty0:ty1, tx0:tx1] = 255
    bright = ((Vv > 150) & (Ss < 200)).astype(np.uint8) * 255
    hole |= cv2.dilate(cv2.bitwise_and(bright, tb), k(5))
    # the card, a little larger than itself (its gold edge), but not down over the floor under it
    card = cv2.dilate(sil, k(8))
    card[cfg["card"]["region"][3] + 10:] = 0
    hole |= card
    hole_b = hole > 0
    # 1. a smooth fill for everything (it gives the blends below their colours)
    base = fill_with_grain(wall, hole_b, 7, 80, 0.9)
    # 2. the floor under the card: the real floor below it, reflected upwards (its streaks of light and tile lines run on)
    base = reflect_rows_fill(base, card > 0, cfg["card"]["region"][3] + 16, H)
    # 3. the walls, pillars and plants behind the boards: the real picture from the other side of the hall (it is nearly
    #    the same either side of the door), blended in
    filled, _ = mirror_fill(wall, base, hole_b, cfg["scene"]["axis"])
    cv2.imwrite(str(out / "filled.png"), filled)
    trim = cfg["scene"]["trim"]
    img = filled[:, trim:W - trim]
    tw, th = cfg["scene"]["target"]
    target_h = int(round(img.shape[1] * th / tw))
    extra = target_h - img.shape[0]
    print(f"scene: {img.shape[1]} × {img.shape[0]} → {img.shape[1]} × {target_h} (+{extra} rows)")
    tall = seam_extend(img, cfg["scene"]["band"][0], cfg["scene"]["band"][1], extra)
    # larger, crisper and with more local contrast, so the carvings and panels read as structure and not as haze
    up = cfg["scene"]["upscale"]
    tall = cv2.resize(tall, None, fx=up, fy=up, interpolation=cv2.INTER_LANCZOS4)
    tall = unsharp(tall, 1.0, 0.6)
    f = tall.astype(np.float32)
    tall = np.clip(f + 0.22 * (f - cv2.GaussianBlur(f, (0, 0), 9)), 0, 255).astype(np.uint8)
    meta["scene"] = {"width": tall.shape[1], "height": tall.shape[0]}
    cv2.imwrite(str(out / "scene.png"), tall)


# ------------------------------------------------------------------ the doors
def cut_doors():
    dh, dw = door.shape[:2]
    tw, th = cfg["door"]["target"]
    want = int(round(dh * tw / th))
    x0 = (dw - want) // 2
    img = door[:, x0:x0 + want]
    mid = want // 2
    s = cfg["door"]["upscale"]
    for name, part in (("door-l", img[:, :mid]), ("door-r", img[:, mid:])):
        up = unsharp(cv2.resize(part, (int(part.shape[1] * s), int(part.shape[0] * s)), interpolation=cv2.INTER_LANCZOS4), 1.2, 0.5)
        cv2.imwrite(str(out / f"{name}.png"), up)
    meta["door"] = {"width": int(want * s), "height": int(dh * s)}


if __name__ == "__main__":
    cut_board()
    cut_flourish("orn-top", cfg["title"]["top"])
    cut_flourish("orn-bottom", cfg["title"]["bottom"])
    cut_chain()
    sil = card_silhouette()
    cut_card(sil)
    clean_hall(sil)
    cut_doors()
    (out / "meta.json").write_text(json.dumps(meta, indent=2))
    print(json.dumps(meta))
