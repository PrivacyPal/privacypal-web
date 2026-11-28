"""Recolor a story cover's coral ground to the brand navy, in place of the
October covers' red (#D54851) art.

Every pixel outside the speaker's photo is read as a mix of three things: the
coral ground, white laid over it (the headline, the boxes, the arcs, the glow,
the frame), and shade under it (the drop shadows and the vignette):

    pixel = shade * (coral * (1 - white) + #fff * white)

The same pixel is then rebuilt with navy for coral. White stays white, so the
headline, the eyebrow and the frame are untouched; coral words in a white box
come out navy on white; anti-aliasing, arcs, glow and shadows carry over. Pixels
the mix cannot explain (the name chip's navy and grey text, the ChatGPT mark's
green) are left as they are, and so is the photo inside the white frame.
"""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

CORAL = np.array([213, 72, 81], float)  # the covers' flat ground, sampled
WHITE = np.array([255, 255, 255], float)
INKS = {"navy": np.array([1, 32, 78], float)}  # --ink #01204E

_A = np.stack([CORAL, WHITE - CORAL], 1)  # 3x2: pixel = u*coral + v*(white-coral)
_PINV = np.linalg.pinv(_A)


def _decompose(p):
    """(shade, white, residual) per pixel; residual 99 where the mix is not physical."""
    uv = np.einsum("hwc,kc->hwk", p, _PINV)
    fit = np.einsum("hwk,ck->hwc", uv, _A)
    res = np.sqrt(((p - fit) ** 2).mean(-1))
    u = uv[..., 0]
    a = uv[..., 1] / np.maximum(u, 1e-3)
    # shadows read slightly below zero white; green and teal read as negative shade
    ok = (u > 0.04) & (a > -0.3) & (a < 1.06)
    return np.clip(u, 0, 1.2), np.clip(a, 0, 1), np.where(ok, res, 99)


def _runs(line, min_len=6):
    d = np.diff(np.concatenate([[0], line.astype(np.int8), [0]]))
    s, e = np.nonzero(d == 1)[0], np.nonzero(d == -1)[0]
    return [(a, b) for a, b in zip(s, e) if b - a >= min_len]


def _fit(t, x):
    """x = m*t + c, refitted without the points far off the first fit."""
    t, x = np.asarray(t, float), np.asarray(x, float)
    m, c = np.polyfit(t, x, 1)
    keep = np.abs(x - (m * t + c)) < 3
    return np.polyfit(t[keep], x[keep], 1)


def _photo_mask(white, y0=900, band=(8, 40), pad=2):
    """The (slightly rotated) photo inside the white frame, as the quad between
    the frame's four inner edges. Each edge is a line fitted over the rows or
    columns where both opposite bands of the frame are plain, away from the
    name chip and the corner badge."""
    h, w = white.shape
    left, right, top, bottom = [], [], [], []
    for y in range(y0, h):
        r = _runs(white[y])
        if len(r) == 2 and all(band[0] <= b - a <= band[1] for a, b in r) and r[1][0] - r[0][1] > 200:
            left.append((y, r[0][1]))
            right.append((y, r[1][0]))
    for x in range(w):
        r = _runs(white[y0:, x])
        if len(r) == 2 and all(band[0] <= b - a <= band[1] for a, b in r) and r[1][0] - r[0][1] > 200:
            top.append((x, r[0][1] + y0))
            bottom.append((x, r[1][0] + y0))
    if min(map(len, (left, right, top, bottom))) < 50:
        raise ValueError("could not find the photo frame")
    lv, rv = _fit(*zip(*left)), _fit(*zip(*right))   # x = m*y + c
    th, bh = _fit(*zip(*top)), _fit(*zip(*bottom))   # y = m*x + c

    def meet(v, hz):
        y = (hz[0] * v[1] + hz[1]) / (1 - hz[0] * v[0])
        return v[0] * y + v[1], y

    quad = [meet(lv, th), meet(rv, th), meet(rv, bh), meet(lv, bh)]
    cx, cy = np.mean(quad, 0)
    quad = [(x + pad * np.sign(x - cx), y + pad * np.sign(y - cy)) for x, y in quad]
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).polygon(quad, fill=255)
    return np.asarray(m) > 0


def recolor(img, ink="navy"):
    """img: the 1080x1920 cover (PIL RGB). Returns the recolored cover."""
    p = np.asarray(img.convert("RGB"), float)
    u, a, res = _decompose(p)
    white = p.min(-1) > 225
    photo = _photo_mask(white)
    # the corner badge overlaps the photo's corner: its play mark is coral too
    near_white = np.asarray(Image.fromarray((white * 255).astype(np.uint8)).filter(ImageFilter.BoxBlur(20)), float) > 153
    w = np.clip((14 - res) / 8, 0, 1) * (~photo | near_white)
    new = u[..., None] * (INKS[ink] * (1 - a[..., None]) + WHITE * a[..., None])
    out = p * (1 - w[..., None]) + new * w[..., None]
    return Image.fromarray(np.clip(out, 0, 255).round().astype(np.uint8))
