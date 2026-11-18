"""Assemble a multi-size .ico from pre-rendered PNGs (smallest first, output last).
Usage: make-ico.py 16.png 32.png 48.png out.ico
"""
import sys
from PIL import Image

*pngs, out = sys.argv[1:]
imgs = [Image.open(p).convert("RGBA") for p in pngs]
imgs.sort(key=lambda i: i.size[0])
largest = imgs[-1]
largest.save(out, format="ICO", sizes=[i.size for i in imgs], append_images=imgs[:-1])
print("wrote", out, [i.size for i in imgs])
