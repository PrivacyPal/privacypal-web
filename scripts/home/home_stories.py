#!/usr/bin/env python3
"""Homepage customer stories: the web files behind the 3-up under the logo
marquee (index.html, .tm-*) and its video modal (assets/home/stories.js).

For each story it writes into assets/testimonials/:
  <slug>.mp4               the full video for the modal: 720x1280 H.264 + AAC,
                           faststart, so it starts before it has downloaded.
                           A story told in several reels is joined into one
                           video, reel after reel; the script prints each
                           reel's start time for the card's data-chapters
  <slug>-poster.jpg        its first frame, the modal poster (720x1280)
  <slug>-preview.mp4       the silent hover loop on the card: a 4:5 window of
                           the video, 576x720, a few seconds where they speak
  <slug>-cover-{480,960}   the cover art cropped to the card's 4:5, WebP and
                           progressive JPEG

The cover art and reels are 1080x1920 (9:16). The 4:5 crops start below the
top band, where the October covers carry the retired PrivacyPal mark, so the
cards show only the headline and the speaker.

Usage (from the repo root):
  python3 scripts/home/home_stories.py                    every story
  python3 scripts/home/home_stories.py jordan-serlin      some stories only
  python3 scripts/home/home_stories.py --only video       some files only (video,
                                                          poster, preview, cover)
  python3 scripts/home/home_stories.py --src ~/Desktop/testimonials --out /some/dir
Sources: one folder per person under --src (default ~/Desktop/testimonials).
"""
import argparse
import json
import os
import subprocess
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# cover_y / preview_y: top of the 1080x1350 (4:5) window in the 1080x1920 frame.
# The preview windows keep the burned-in captions above the card's Watch pill.
STORIES = {
    "keyonna-taylor": {
        "dir": "Keyonna Taylor",
        # (file, chapter title): played in this order as one video
        "videos": [
            ("Reel 1 Don’t Even Think About It 9x16.mp4", "Don’t even think about it"),
            ("Reel 2 Assurances Alone 9x16.mp4", "Assurances alone"),
            ("Reel 3 Scale It 9x16.mp4", "Scale it"),
        ],
        "cover": "Cover 2 Assurances Alone.jpg",
        "cover_y": 340,
        "preview": (0.4, 7.0),   # "AI allows us to work faster. However, the manual input..."
        "preview_y": 420,
    },
    "vivek-laungani": {
        "dir": "Vivek Laungani ",  # the source folder name ends in a space
        "videos": [
            ("Reel 1 The Easiest Answer 9x16.mp4", "The easiest answer"),
            ("Reel 2 Hours Every Week 9x16.mp4", "Hours every week"),
            ("Reel 3 Believe It 9x16.mp4", "Believe it"),
        ],
        "cover": "Cover 1 The Easiest Answer.jpg",
        "cover_y": 340,
        "preview": (0.0, 7.0),   # "Just being able to, for example, dump your client's data into ChatGPT"
        "preview_y": 250,
    },
    "jordan-serlin": {
        "dir": "Jordan Serlin",
        "videos": [("Jordan Serlin Testimonial Full 9x16.mp4", "Full testimonial")],
        "cover": "Cover Full Testimonial.jpg",
        "cover_y": 340,
        "preview": (9.0, 7.5),   # "PrivacyPal actually just saved me tens of thousands of dollars"
        "preview_y": 380,
    },
}


def ffmpeg(*args):
    cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *args]
    subprocess.run(cmd, check=True)


def video_duration(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=duration",
                        "-of", "csv=p=0", path], check=True, capture_output=True, text=True)
    return float(r.stdout.strip())


def build(slug, src, out, only):
    s = STORIES[slug]
    folder = os.path.join(src, s["dir"])
    videos = [os.path.join(folder, f) for f, _ in s["videos"]]
    video = videos[0]
    cover = os.path.join(folder, s["cover"])
    for p in (*videos, cover):
        if not os.path.isfile(p):
            sys.exit(f"missing source: {p}")
    base = os.path.join(out, slug)

    # 1. the full video for the modal; several reels are joined in order, each
    #    reel's sound padded or trimmed to its picture so they never drift
    if "video" in only:
        n = len(videos)
        durs = [video_duration(v) for v in videos]
        parts = []
        for i, d in enumerate(durs):
            parts.append(f"[{i}:v]setpts=PTS-STARTPTS,fps=30,scale=720:1280:flags=lanczos,setsar=1[v{i}];"
                         f"[{i}:a]aresample=48000,apad,atrim=0:{d:.3f},asetpts=PTS-STARTPTS[a{i}]")
        graph = ";".join(parts) + ";" + "".join(f"[v{i}][a{i}]" for i in range(n)) + f"concat=n={n}:v=1:a=1[v][a]"
        args = []
        for v in videos:
            args += ["-i", v]
        ffmpeg(*args, "-filter_complex", graph, "-map", "[v]", "-map", "[a]",
               "-c:v", "libx264", "-preset", "slow", "-crf", "22", "-profile:v", "high", "-level", "4.0",
               "-pix_fmt", "yuv420p", "-g", "60",
               "-c:a", "aac", "-b:a", "128k", "-ac", "2", "-ar", "48000",
               "-movflags", "+faststart", base + ".mp4")
        if n > 1:
            t, chapters = 0.0, []
            for (_, title), d in zip(s["videos"], durs):
                chapters.append({"t": round(t, 2), "title": title})
                t += d
            print(f"  data-chapters='{json.dumps(chapters, ensure_ascii=False)}'  total {t:.2f}s")

    # 2. its first frame, the poster
    if "poster" in only:
        ffmpeg("-i", video, "-frames:v", "1", "-vf", "scale=720:1280:flags=lanczos", "-q:v", "3", base + "-poster.jpg")

    # 3. the silent 4:5 hover loop, from the first reel
    start, dur = s["preview"]
    if "preview" in only:
        ffmpeg("-ss", str(start), "-i", video, "-t", str(dur), "-an",
               "-vf", f"crop=1080:1350:0:{s['preview_y']},scale=576:720:flags=lanczos,fps=30",
               "-c:v", "libx264", "-preset", "slow", "-crf", "25", "-profile:v", "high",
               "-pix_fmt", "yuv420p", "-g", "30", "-movflags", "+faststart", base + "-preview.mp4")

    # 4. the cover art on the card's 4:5
    if "cover" in only:
        img = Image.open(cover).convert("RGB")
        if img.size != (1080, 1920):
            img = img.resize((1080, 1920), Image.LANCZOS)
        y = s["cover_y"]
        crop = img.crop((0, y, 1080, y + 1350))
        for w in (960, 480):
            im = crop.resize((w, w * 5 // 4), Image.LANCZOS)
            im.save(f"{base}-cover-{w}.webp", "WEBP", quality=82, method=6)
            im.save(f"{base}-cover-{w}.jpg", "JPEG", quality=84, optimize=True, progressive=True)

    for f in sorted(os.listdir(out)):
        if f.startswith(slug):
            print(f"  {f:34s} {os.path.getsize(os.path.join(out, f)) / 1024:8.0f} KB")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("slugs", nargs="*", help="any of: " + ", ".join(STORIES))
    ap.add_argument("--src", default=os.path.expanduser("~/Desktop/testimonials"))
    ap.add_argument("--out", default=os.path.join(ROOT, "assets", "testimonials"))
    ap.add_argument("--only", default="video,poster,preview,cover", help="comma list of: video, poster, preview, cover")
    a = ap.parse_args()
    only = set(x.strip() for x in a.only.split(",") if x.strip())
    bad = [x for x in a.slugs if x not in STORIES]
    if bad:
        ap.error("unknown story: " + ", ".join(bad))
    os.makedirs(a.out, exist_ok=True)
    for slug in a.slugs or STORIES:
        print(slug)
        build(slug, a.src, a.out, only)


if __name__ == "__main__":
    main()
