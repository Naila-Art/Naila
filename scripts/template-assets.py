#!/usr/bin/env python3
"""Turn one generated opening video into a sellable template's web assets.

    python3 scripts/template-assets.py design-001 alhambra [--name "Alhambra"] [--category wedding]

Reads   gflow-test/batch/out/<design>/video.mp4   (Google Flow, 720x1280, ~6s, H.264 + AAC)
        gflow-test/batch/manifest.json            (palette, handoff, name)
Writes  public/templates/<slug>/opening.mp4       web encode, faststart, ~2 MB, keeps the sound
        public/templates/<slug>/start.jpg         first frame: the threshold (closed doors)
        public/templates/<slug>/end.jpg           last frame: the scene behind the letter
        public/templates/<slug>/end-blur.jpg      small blurred last frame: desktop backdrop
Prints  a src/lib/templates.ts entry to paste and then tune (scene placement by eye on end.jpg).
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BATCH = ROOT / "gflow-test" / "batch"


def ff(*args: str) -> None:
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *args], check=True)


def probe(path: Path) -> dict:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,codec_name,width,height",
         "-show_entries", "format=duration", "-of", "json", str(path)],
        check=True, capture_output=True, text=True).stdout
    return json.loads(out)


def mix(hex_a: str, hex_b: str, k: float) -> str:
    a = [int(hex_a[i:i + 2], 16) for i in (1, 3, 5)]
    b = [int(hex_b[i:i + 2], 16) for i in (1, 3, 5)]
    return "#" + "".join(f"{round(x * (1 - k) + y * k):02x}" for x, y in zip(a, b))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("design", help="manifest id, e.g. design-001")
    ap.add_argument("slug", help="template id / folder, e.g. alhambra")
    ap.add_argument("--name")
    ap.add_argument("--category", default="wedding", choices=["wedding", "engagement", "katb_kitab"])
    ap.add_argument("--video", help="override source video path")
    a = ap.parse_args()

    src = Path(a.video) if a.video else BATCH / "out" / a.design / "video.mp4"
    if not src.exists():
        sys.exit(f"missing {src}")
    manifest = {d["id"]: d for d in json.loads((BATCH / "manifest.json").read_text())}
    meta = manifest.get(a.design, {})

    info = probe(src)
    v = next(s for s in info["streams"] if s["codec_type"] == "video")
    if (v["width"], v["height"]) != (720, 1280):
        print(f"warning: source is {v['width']}x{v['height']}, expected 720x1280", file=sys.stderr)
    has_audio = any(s["codec_type"] == "audio" for s in info["streams"])

    out = ROOT / "public" / "templates" / a.slug
    out.mkdir(parents=True, exist_ok=True)

    # Web encode: H.264 High, yuv420p (Safari), moov atom first so it starts before fully loaded.
    audio = ["-c:a", "aac", "-b:a", "96k"] if has_audio else ["-an"]
    ff("-i", str(src), "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p",
       "-crf", "23", "-preset", "slow", "-maxrate", "3M", "-bufsize", "6M",
       *audio, "-movflags", "+faststart", str(out / "opening.mp4"))
    # mjpeg needs full-range yuvj420p; -sseof -0.3 + -update 1 grabs the true last frame.
    ff("-i", str(src), "-frames:v", "1", "-vf", "format=yuvj420p", "-q:v", "3", str(out / "start.jpg"))
    ff("-sseof", "-0.3", "-i", str(src), "-update", "1", "-vf", "format=yuvj420p", "-q:v", "3", str(out / "end.jpg"))
    ff("-i", str(out / "end.jpg"), "-vf", "scale=360:640,gblur=sigma=24,format=yuvj420p", "-q:v", "8",
       str(out / "end-blur.jpg"))

    for f in ("opening.mp4", "start.jpg", "end.jpg", "end-blur.jpg"):
        print(f"  {f:14} {(out / f).stat().st_size / 1024:8.0f} KB")
    if not has_audio:
        print("warning: the video has no sound; the doors will open silently", file=sys.stderr)

    # Suggested entry. palette order in the manifest is [background, accent, seal, surface].
    pal = [p.lower() for p in meta.get("palette", [])] + ["#1e2d3b", "#c89b54", "#8c583a", "#f2e6d0"][len(meta.get("palette", [])):]
    handoff = float(str(meta.get("handoff", "4.0s")).rstrip("s") or 4)
    entry = f"""  {{
    id: "{a.slug}",
    name: "{a.name or meta.get('design_name', a.slug.title())}",
    category: "{a.category}",
    family: "doors",
    videoUrl: "/templates/{a.slug}/opening.mp4",
    posterUrl: "/templates/{a.slug}/start.jpg",
    endPosterUrl: "/templates/{a.slug}/end.jpg",
    ambientUrl: "/templates/{a.slug}/end-blur.jpg",
    revealAtMs: {int(handoff * 1000) - 400},
    scene: {{ skyTop: 19, skyWidth: 58, reflectionTop: null }}, // TUNE on end.jpg
    theme: {{
      background: "{pal[0]}",
      surface: "{pal[3]}",
      text: "{mix(pal[2], '#000000', 0.62)}",
      accent: "{pal[1]}",
      seal: "{pal[2]}",
    }},
  }},"""
    print("\n// src/lib/templates.ts — paste into the templates list, then tune `scene` and `revealAtMs`:")
    print(entry)
    print("\n// src/lib/templates.ts — TEMPLATE_EDITORIAL_META (storefront card). Write the Arabic natively, not translated word for word:")
    print(f"""  "{a.slug}": {{
    nameAr: "TODO",
    eyebrowEn: "{ {'wedding': 'Wedding invitation', 'engagement': 'Engagement invitation', 'katb_kitab': 'Katb kitab & wedding'}[a.category] }",
    eyebrowAr: "{ {'wedding': 'دعوة زفاف', 'engagement': 'دعوة خطوبة', 'katb_kitab': 'كتب كتاب وزفاف'}[a.category] }",
    taglineEn: {json.dumps(meta.get('vibe', 'TODO'), ensure_ascii=False)},
    taglineAr: "TODO",
    cardFrame: "{pal[0]}",
  }},""")


if __name__ == "__main__":
    main()
