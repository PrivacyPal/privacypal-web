#!/usr/bin/env python3
"""Homepage photo derivatives: the phone hero bands (960x676, about 1.42:1).

Each band sits under the transparent nav and fades into navy, so faces go in
the top half. Same photos, stand-in clean-up and grade as home_images.py (see
home_common.py). Writes WebP plus progressive JPEG into assets/home/.

Usage (from the repo root):
  python3 scripts/home/home_mobile.py                    every slot
  python3 scripts/home/home_mobile.py home               some slots only
  python3 scripts/home/home_mobile.py --out /some/dir    preview elsewhere
Slots: home, work, you.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from home_common import GRADES, fit, grade, parse_args, prepare, save, soften  # noqa: E402

SLOTS = ["home", "work", "you"]
SIZE = (960, 676)


def band(img, x0, y0, w):
    """A SIZE-shaped crop w pixels wide from (x0, y0)."""
    h = round(w * SIZE[1] / SIZE[0])
    return fit(img, (x0, y0, x0 + w, y0 + h), SIZE)


def build(slot, root, out):
    g = GRADES[slot]
    img = prepare(slot, root)
    if slot == "home":
        save(grade(fit(img, (520, 250, 1400, 870), SIZE), **g), out, "scene-family-m", q_webp=72)
    elif slot == "work":
        # the phone crop also reaches the monitors at the left of the trading floor
        img = soften(img, (0, 760, 560, 1500), 9)
        save(grade(band(img, 300, 1020, 1100), **g), out, "scene-business-m", q_webp=72)
    elif slot == "you":
        save(grade(fit(img, (840, 820, 1888, 1558), SIZE), **g), out, "scene-you-m", q_webp=72)


def main(argv=None):
    a = parse_args(" ".join(__doc__.split("\n\n")[0].split()), SLOTS, argv)
    for slot in a.slots:
        build(slot, a.root, a.out)


if __name__ == "__main__":
    main()
