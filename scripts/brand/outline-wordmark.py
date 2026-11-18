"""Outline shaped text (HarfBuzz, GPOS kerning) from a static TTF to one SVG path.
Usage: outline.py <font.ttf> <text> <tracking_em> <out.json>
Output coordinates: font units, baseline at y=0, y down (SVG), x from 0.
"""
import json, sys
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

font_path, text, tracking, out = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4]
f = TTFont(font_path)
upm = f["head"].unitsPerEm
gs = f.getGlyphSet()
order = f.getGlyphOrder()
os2 = f["OS/2"]

blob = hb.Blob.from_file_path(font_path)
face = hb.Face(blob)
font = hb.Font(face)
buf = hb.Buffer()
buf.add_str(text)
buf.guess_segment_properties()
hb.shape(font, buf, {"kern": True, "liga": False})

pen = SVGPathPen(gs)
bpen = BoundsPen(gs)
x = 0
n = len(buf.glyph_infos)
for i, (info, pos) in enumerate(zip(buf.glyph_infos, buf.glyph_positions)):
    g = order[info.codepoint]
    t = (1, 0, 0, -1, x + pos.x_offset, -pos.y_offset)
    gs[g].draw(TransformPen(pen, t))
    gs[g].draw(TransformPen(bpen, t))
    x += pos.x_advance + (tracking * upm if i + 1 < n else 0)

xmin, ymin, xmax, ymax = bpen.bounds
json.dump({"d": pen.getCommands(), "advance": x, "bounds": [xmin, ymin, xmax, ymax],
           "capHeight": os2.sCapHeight, "xHeight": os2.sxHeight, "upm": upm}, open(out, "w"))
print(f"advance {x:.0f} bounds {[round(v) for v in bpen.bounds]} cap {os2.sCapHeight} xh {os2.sxHeight} upm {upm}")
