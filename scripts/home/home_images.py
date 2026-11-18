#!/usr/bin/env python3
"""Homepage photo derivatives: desktop hero scenes, tablet hero bands, the
"One filter" panels, the hero tab thumbnails and the Families photo.

Crops each photo for its slot, applies the shared navy and gold grade, bakes a
shallow depth of field on the copy side of the desktop hero scenes, and writes
WebP plus progressive JPEG into assets/home/ (thumbnails: WebP only). The
photos, their stand-in clean-up and the grades live in home_common.py; the
phone bands are built by home_mobile.py.

Usage (from the repo root):
  python3 scripts/home/home_images.py                    every slot
  python3 scripts/home/home_images.py home families      some slots only
  python3 scripts/home/home_images.py --out /some/dir    preview elsewhere
Slots: home, work, you, life-family, life-business, life-you, families.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image  # noqa: E402

from home_common import GRADES, dof_left, extend_left, fit, grade, parse_args, prepare, save  # noqa: E402

SLOTS = ["home", "work", "you", "life-family", "life-business", "life-you", "families"]


def build(slot, root, out):
    g = GRADES[slot]
    img = prepare(slot, root)
    if slot == "home":
        # desktop 1.6:1, cropped as high as the frame allows so his face clears the console
        save(dof_left(grade(fit(img, (0, 175, 1400, 1050), (1600, 1000)), **g), start=0.28, end=0.56), out, "scene-family-1600")
        save(grade(fit(img, (360, 0, 1400, 1020), (960, 942)), **g), out, "scene-family-960", q_webp=70)
        save(grade(fit(img, (780, 250, 1240, 710), (112, 112)), **g), out, "thumb-family", q_webp=72, webp_only=True)
    elif slot == "work":
        # The analyst sits left of center in the stand-in: the canvas is extended
        # to the left so her face lands right of the headline and clear of the console.
        save(dof_left(grade(extend_left(img.crop((0, 760, 1440, 1940)), 560), **g), start=0.32, end=0.55, radius=10), out, "scene-business-2000")
        save(grade(fit(img, (560, 860, 1500, 1782), (960, 942)), **g), out, "scene-business-960", q_webp=70)
        save(grade(fit(img, (630, 1100, 950, 1420), (112, 112)), **g), out, "thumb-business", q_webp=72, webp_only=True)
    elif slot == "you":
        # desktop 1.6:1: face in the upper-middle right, clear of the console
        save(dof_left(grade(fit(img, (416, 760, 1888, 1680), (1600, 1000)), **g), start=0.30, end=0.56, radius=10), out, "scene-you-1600")
        save(grade(fit(img, (900, 720, 1888, 1690), (960, 942)), **g), out, "scene-you-960", q_webp=70)
        save(grade(fit(img, (1250, 860, 1590, 1200), (112, 112)), **g), out, "thumb-you", q_webp=72, webp_only=True)
    elif slot == "life-family":
        # One filter, Family panel (3:4): warm sky at the top for the label
        save(grade(fit(img, (380, 100, 1170, 1069), (780, 1040)), **g), out, "life-family-780", q_webp=70)
    elif slot == "life-business":
        save(grade(fit(img, (880, 300, 1880, 1633), (780, 1040)), **g), out, "life-business-780", q_webp=70)
    elif slot == "life-you":
        save(grade(img.resize((780, 1040), Image.LANCZOS), **g), out, "life-you-780", q_webp=70)
    elif slot == "families":
        # Families section, 4:5 portrait: mother and daughter both in frame
        save(grade(fit(img, (372, 0, 1003, 789), (880, 1100)), **g), out, "families-880", q_webp=72)


def main(argv=None):
    a = parse_args(" ".join(__doc__.split("\n\n")[0].split()), SLOTS, argv)
    for slot in a.slots:
        build(slot, a.root, a.out)


if __name__ == "__main__":
    main()
