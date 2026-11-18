"""Shared pieces of the homepage photo pipeline (scripts/home/).

The homepage (index.html) does not serve raw photos. It serves graded, cropped
derivatives from assets/home/ (WebP plus a progressive JPEG fallback):

  home_images.py   desktop hero scenes, tablet hero bands, the three "One filter"
                   panels, the hero tab thumbnails and the Families photo
  home_mobile.py   the phone hero bands (960x676)

Both scripts read the photos listed in SOURCES below, clean up each stand-in
(soften readable screens, signs and paper; mirror or retouch where noted),
apply one shared grade (navy shadows, warm gold-leaning highlights, gentle
contrast) and write the files the page references.

Swapping in a final photo: each slot names the photo it uses today and the
final file that replaces it (the data-standin path on the matching img in
index.html). When the final file exists, point the slot at it in SOURCES,
delete that slot's stand-in clean-up in prepare(), re-tune its crop boxes in
home_images.py and home_mobile.py, run both scripts for that slot, and look
at every output before committing. Then update data-source on the img tags.
For H2 (slot work), also delete the soften() line in home_mobile.py's work
branch.

Requirements: Python 3 with Pillow and NumPy, OpenCV (cv2) for the life-you
stand-in only, and cwebp on the PATH.
"""
import os
import subprocess

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

# slot: (photo used today, relative to the repo; final file that replaces it)
SOURCES = {
    "home": ("family/assets/photos/homework-boy.jpg", "assets/photos/hero-home.jpg"),
    "work": ("assets/hero-shot-banking.png", "assets/photos/hero-work.jpg"),
    "you": ("assets/hero-shot-accounting.png", "assets/photos/hero-you.jpg"),
    "life-family": ("family/assets/photos/teens-sunset.jpg", "assets/photos/life-family.jpg"),
    "life-business": ("assets/hero-shot-healthcare.png", "assets/photos/life-business.jpg"),
    "life-you": ("partners/max-hero.jpg", "assets/photos/life-you.jpg"),
    "families": ("family/assets/photos/study-together.jpg", "assets/photos/pack-family.jpg"),
}

NAVY = np.array([0.012, 0.075, 0.20], dtype=np.float32)
GOLD = np.array([1.0, 0.80, 0.50], dtype=np.float32)

# One grade per source photo (keyword arguments for grade()).
GRADES = {
    "home": dict(exposure=1.04, warm=0.03, sat=0.9, shadow=0.24, light=0.1),
    "work": dict(exposure=1.04, warm=0.07, sat=0.84, light=0.13),
    "you": dict(exposure=0.92, warm=0.05, sat=0.86, shadow=0.3, light=0.1, contrast=1.06),
    "life-family": dict(exposure=0.96, warm=0.03, sat=0.92, shadow=0.26, light=0.08, contrast=1.05),
    "life-business": dict(exposure=0.94, warm=0.09, sat=0.82, shadow=0.3, light=0.14, contrast=1.06),
    "life-you": dict(exposure=0.94, warm=0.06, sat=0.88, shadow=0.3, light=0.1, contrast=1.06),
    "families": dict(exposure=0.98, warm=0.04, sat=0.86, shadow=0.22, light=0.08),
}


def grade(img, exposure=1.0, warm=0.0, sat=0.9, shadow=0.26, light=0.10, contrast=1.05):
    """The shared homepage grade: navy shadows, warm gold-leaning highlights."""
    a = np.asarray(img.convert("RGB")).astype(np.float32) / 255.0
    a = a * exposure
    if warm:
        a[..., 0] *= 1 + warm
        a[..., 1] *= 1 + warm * 0.35
        a[..., 2] *= 1 - warm
    a = np.clip(a, 0, 1)
    lum = (0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2])[..., None]
    a = lum + (a - lum) * sat
    ws = (1 - lum) ** 2 * shadow
    wh = lum ** 2 * light
    a = a * (1 - ws) + NAVY * ws
    a = a + (GOLD - a) * wh
    a = 0.5 + (a - 0.5) * contrast
    return Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8))


def dof_left(img, start=0.30, end=0.58, radius=9):
    """Shallow depth of field on the copy side: full blur left of `start`,
    easing to sharp at `end` (fractions of the width)."""
    w, h = img.size
    blurred = img.filter(ImageFilter.GaussianBlur(radius))
    x = np.linspace(0, 1, w, dtype=np.float32)
    t = np.clip((end - x) / (end - start), 0, 1)
    t = t * t * (3 - 2 * t)
    mask = Image.fromarray((np.tile(t, (h, 1)) * 255).astype(np.uint8))
    return Image.composite(blurred, img, mask)


def soften(img, box, radius=6, feather=24):
    """Blur one rectangle (a readable screen, sign or logo) with a feathered edge."""
    w, h = img.size
    blurred = img.filter(ImageFilter.GaussianBlur(radius))
    m = Image.new("L", (w, h), 0)
    x0, y0, x1, y1 = box
    m.paste(255, (max(0, x0), max(0, y0), min(w, x1), min(h, y1)))
    if feather:
        m = m.filter(ImageFilter.GaussianBlur(feather / 2))
    return Image.composite(blurred, img, m)


def focus(img, ellipse, radius=12, feather=80):
    """Keep the subject (inside the ellipse) sharp; everything else goes soft,
    like a wide aperture. ellipse = (x0, y0, x1, y1) in image pixels."""
    w, h = img.size
    blurred = img.filter(ImageFilter.GaussianBlur(radius))
    m = Image.new("L", (w, h), 255)
    ImageDraw.Draw(m).ellipse(ellipse, fill=0)
    m = m.filter(ImageFilter.GaussianBlur(feather / 2))
    return Image.composite(blurred, img, m)


def extend_left(img, pad):
    """Extend the canvas to the left with a mirrored, heavily blurred copy of
    the edge (it sits under the navy copy gradient)."""
    w, h = img.size
    edge = img.crop((0, 0, pad, h)).transpose(Image.FLIP_LEFT_RIGHT).filter(ImageFilter.GaussianBlur(28))
    out = Image.new("RGB", (w + pad, h))
    out.paste(edge, (0, 0))
    out.paste(img, (pad, 0))
    m = Image.new("L", (w + pad, h), 0)
    m.paste(255, (0, 0, pad, h))
    m = m.filter(ImageFilter.GaussianBlur(40))
    return Image.composite(out.filter(ImageFilter.GaussianBlur(14)), out, m)


def fit(img, box, size):
    return img.crop(box).resize(size, Image.LANCZOS)


def save(img, out_dir, name, q_webp=74, q_jpg=78, webp_only=False):
    """Write <name>.jpg (progressive) and <name>.webp (cwebp from that JPEG).
    webp_only keeps just the WebP (the tab thumbnails)."""
    os.makedirs(out_dir, exist_ok=True)
    jpg = os.path.join(out_dir, name + ".jpg")
    img.save(jpg, "JPEG", quality=q_jpg, optimize=True, progressive=True)
    webp = os.path.join(out_dir, name + ".webp")
    subprocess.run(["cwebp", "-quiet", "-q", str(q_webp), "-m", "6", "-sharp_yuv", jpg, "-o", webp], check=True)
    if webp_only:
        os.remove(jpg)
        print(f"{name:20s} {img.size[0]}x{img.size[1]}  webp {os.path.getsize(webp)//1024}KB")
    else:
        print(f"{name:20s} {img.size[0]}x{img.size[1]}  jpg {os.path.getsize(jpg)//1024}KB  webp {os.path.getsize(webp)//1024}KB")


def _life_you_cleanup(mx):
    """partners/max-hero.jpg as the "One filter, You" panel: the woman at the
    whiteboard, alone in frame. The colleague's hand, the laptop he holds and
    his sleeve at the crop edge are painted out (her own sweater tiled over
    them, then a short OpenCV inpaint on the seam and a soft blur); the
    whiteboard writing and the room behind her go soft. Returns a 375x500 crop."""
    import cv2

    X0, Y0, X1, Y1 = 130, 330, 505, 830
    crop = np.asarray(mx.crop((X0, Y0, X1, Y1))).copy()
    mask = np.zeros(crop.shape[:2], np.uint8)

    def poly(pts):
        cv2.fillPoly(mask, [np.array([(x - X0, y - Y0) for x, y in pts], np.int32)], 255)

    poly([(424, 556), (438, 545), (474, 549), (505, 556), (505, 626), (478, 624), (444, 610), (424, 590)])  # his hand
    poly([(370, 618), (470, 622), (505, 630), (505, 750), (452, 744), (424, 714), (410, 694), (408, 652), (384, 646), (370, 636)])  # the laptop and his lower hand
    poly([(494, 520), (505, 520), (505, 780), (494, 780)])  # his sleeve at the edge
    keep = np.zeros_like(mask)
    cv2.ellipse(keep, ((358 - X0), (672 - Y0)), (46, 21), 0, 0, 360, 255, -1)  # her hand with the marker stays
    mask[keep > 0] = 0
    mask = cv2.dilate(mask, np.ones((7, 7), np.uint8))
    sw = crop[698 - Y0:752 - Y0, 334 - X0:398 - X0]
    reps = (crop.shape[0] // sw.shape[0] + 1, crop.shape[1] // sw.shape[1] + 1, 1)
    patch = np.tile(sw, reps)[:crop.shape[0], :crop.shape[1]]
    m3 = (cv2.GaussianBlur(mask, (0, 0), 6).astype(np.float32) / 255.0)[..., None]
    crop2 = (crop * (1 - m3) + patch * m3).astype(np.uint8)
    seam = cv2.subtract(cv2.dilate(mask, np.ones((9, 9), np.uint8)), cv2.erode(mask, np.ones((9, 9), np.uint8)))
    seam[keep > 0] = 0
    filled = cv2.inpaint(np.ascontiguousarray(crop2[:, :, ::-1]), seam, 5, cv2.INPAINT_TELEA)[:, :, ::-1]
    out = Image.fromarray(np.ascontiguousarray(filled))
    soft = out.filter(ImageFilter.GaussianBlur(7))
    out = Image.composite(soft, out, Image.fromarray(mask).filter(ImageFilter.GaussianBlur(8)))
    out = soften(out, (0, 0, 170, 500), 9, 30)  # whiteboard writing
    return focus(out, (95, 0, 375, 470), radius=9, feather=120)


def prepare(slot, root):
    """Open a slot's photo and apply its stand-in clean-up. The boxes are in the
    stand-in's own pixels: delete a slot's clean-up when its final photo lands."""
    rel, final = SOURCES[slot]
    if rel != final and os.path.exists(os.path.join(root, final)):
        print(f"note: {final} exists; point SOURCES['{slot}'] at it (see the header of home_common.py)")
    img = Image.open(os.path.join(root, rel)).convert("RGB")
    if slot == "home":
        # homework-boy.jpg (1400x1050): the dated worksheet is softened, then the
        # photo is mirrored so the boy sits right of the headline.
        img = soften(img, (565, 250, 1000, 740), 7, 26)
        img = img.transpose(Image.FLIP_LEFT_RIGHT)
    elif slot == "work":
        # hero-shot-banking.png (1888x2105): the "FINANCE US" mug, the ticker
        # boards and the monitors behind the analyst.
        img = soften(img, (1620, 1520, 1888, 1720), 9)
        img = soften(img, (0, 0, 1888, 760), 11)
        img = soften(img, (1380, 760, 1888, 1240), 7)
    elif slot == "you":
        # hero-shot-accounting.png (1888x2109): both monitors, the notebook and
        # the mug, then the colleagues at the right; her head and shoulders stay sharp.
        img = soften(img, (0, 900, 1260, 1700), 14, 40)
        img = soften(img, (1500, 700, 1888, 1300), 10, 60)
        img = focus(img, (1130, 820, 1720, 1720), radius=11, feather=160)
    elif slot == "life-business":
        # hero-shot-healthcare.png (1888x2103)
        img = soften(img, (1640, 540, 1888, 900), 12)   # wall sign
        img = soften(img, (1370, 1250, 1520, 1430), 9)  # jacket logo
        img = soften(img, (280, 860, 920, 1420), 12)    # big monitor
        img = soften(img, (40, 980, 330, 1810), 12)     # side monitor
    elif slot == "life-you":
        img = _life_you_cleanup(img)
    elif slot == "families":
        # study-together.jpg (1400x789): the girl's worksheet and the open book.
        img = soften(img, (330, 500, 1250, 720), 5, 24)
        img = soften(img, (880, 230, 1300, 520), 4, 20)
    return img


def parse_args(description, slots, argv=None):
    import argparse

    p = argparse.ArgumentParser(description=description)
    p.add_argument("slots", nargs="*", metavar="slot",
                   help="slots to build (default: all): " + ", ".join(slots))
    p.add_argument("--root", default=REPO, help="repo root (default: the repo this script is in)")
    p.add_argument("--out", default=None, help="output folder (default: <root>/assets/home); use a scratch folder to preview")
    a = p.parse_args(argv)
    bad = [s for s in a.slots if s not in slots]
    if bad:
        p.error("unknown slot(s): " + ", ".join(bad) + "; choose from " + ", ".join(slots))
    a.root = os.path.abspath(a.root)
    a.out = os.path.abspath(a.out) if a.out else os.path.join(a.root, "assets", "home")
    a.slots = a.slots or list(slots)
    return a
