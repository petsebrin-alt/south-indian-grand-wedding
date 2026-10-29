"""
python3 scripts/couple/matte.py → the two people cut out of the client's groom-and-bride picture
(src/assets/couple/source/mask-groom.png, mask-bride.png: white where the person is, soft at the edge).
The rough outlines in scene.json (`person`) say where each person roughly is; GrabCut (OpenCV) then
finds the true edge from colour: inside the outline (shrunk) is certainly the person, well outside it
certainly not, and the band between is decided from the colours of both sides. The edge is then softened
a little. Needs: python3, numpy, opencv-python. The masks are committed, so this only has to be run again
after the picture or the outlines change.
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np

root = Path(__file__).resolve().parents[2]
src = root / "src/assets/couple"
scene = json.loads((src / "scene.json").read_text())
img = cv2.imread(str(src / "source/groom-bride.webp"), cv2.IMREAD_COLOR)
H, W = img.shape[:2]

for side in ("groom", "bride"):
    x0, x1 = scene[side]["span"]
    half = np.ascontiguousarray(img[:, x0:x1])
    poly = np.array([[p[0] - x0, p[1]] for p in scene[side]["person"]], np.int32)
    outline = np.zeros(half.shape[:2], np.uint8)
    cv2.fillPoly(outline, [poly], 255)
    k = lambda r: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
    sure_fg = cv2.erode(outline, k(scene["matte"]["inner"]))
    maybe_fg = cv2.erode(outline, k(3))
    maybe_bg = cv2.dilate(outline, k(scene["matte"]["outer"]))
    gc = np.full(half.shape[:2], cv2.GC_BGD, np.uint8)
    gc[maybe_bg > 0] = cv2.GC_PR_BGD
    gc[maybe_fg > 0] = cv2.GC_PR_FGD
    gc[sure_fg > 0] = cv2.GC_FGD
    # the picture's bottom edge cuts the person off: the person reaches it
    bg_model = np.zeros((1, 65), np.float64)
    fg_model = np.zeros((1, 65), np.float64)
    cv2.grabCut(half, gc, None, bg_model, fg_model, scene["matte"]["iterations"], cv2.GC_INIT_WITH_MASK)
    m = np.where((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    # keep the biggest piece, fill pin-holes, and take the edge in by a pixel before softening it
    n, labels, stats, _ = cv2.connectedComponentsWithStats(m)
    if n > 1:
        biggest = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
        m = np.where(labels == biggest, 255, 0).astype(np.uint8)
    inv = cv2.bitwise_not(m)
    n, labels, stats, _ = cv2.connectedComponentsWithStats(inv)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] < 900:
            m[labels == i] = 255
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, k(1))
    m = cv2.erode(m, k(1))
    soft = cv2.GaussianBlur(m, (0, 0), scene["matte"]["soften"])
    cv2.imwrite(str(src / f"source/mask-{side}.png"), soft)
    print(f"{side}: person {int((m > 0).sum())} px")
