#!/usr/bin/env python3
"""Turn one generated opening video into a sellable template's web assets.

    python3 scripts/template-assets.py design-001 alhambra [--name "Alhambra"] [--category wedding]

Reads   gflow-test/batch/out/<design>/video.mp4   (Google Flow, 720x1280, ~6s, H.264 + AAC)
        gflow-test/batch/manifest.json            (palette, handoff, name)
Writes  public/templates/[<category>/<style>/]<slug>/opening.mp4  (--folder wedding/coastal)       web encode, faststart, ~2 MB, keeps the sound
        public/templates/<slug>/start.jpg         first frame: the threshold (closed doors)
        public/templates/<slug>/end.jpg           last frame: the scene behind the letter
        public/templates/<slug>/end-blur.jpg      small blurred last frame: desktop backdrop
Prints  a src/lib/templates.ts entry to paste and then tune (scene placement by eye on end.jpg).

Many designs at once:
    python3 scripts/template-assets.py --batch designs.tsv --json-dir <dir>
    (tab-separated rows: design  slug  category  [end-frame]  [folder]) — runs them ONE AT A TIME.

Memory safety: a video encode takes several GB at peak. Never fan this script out with
shell background jobs (`&`): in a non-interactive zsh, `jobs -r` reports 0, so a
"max N jobs" loop starts every job at once — 50 parallel encodes exhausted a 24 GB Mac.
Every run takes an exclusive lock, so parallel invocations queue instead of piling up,
and x264 is capped at 4 threads.
"""
import argparse
import fcntl
import json
import subprocess
import tempfile
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BATCH = ROOT / "gflow-test" / "batch"


def take_lock():
    """Block until no other template-assets run is encoding. Held until the process exits."""
    f = open(Path(tempfile.gettempdir()) / "naila-template-assets.lock", "w")
    fcntl.flock(f, fcntl.LOCK_EX)
    return f


def run_batch(tsv: str, json_dir) -> None:
    rows = [r.split("\t") for r in Path(tsv).read_text().splitlines() if r.strip() and not r.startswith("#")]
    failed = []
    for i, row in enumerate(rows, 1):
        design, slug, category, *rest = [c.strip() for c in row]
        cmd = [sys.executable, __file__, design, slug, "--category", category]
        if len(rest) > 1 and rest[1]:
            cmd += ["--folder", rest[1]]
        if rest and rest[0]:
            cmd += ["--end-frame", rest[0]]
        if json_dir:
            cmd += ["--json", str(Path(json_dir) / f"{slug}.json")]
        print(f"[{i}/{len(rows)}] {design} -> {slug}", flush=True)
        if subprocess.run(cmd, stdout=subprocess.DEVNULL).returncode != 0:
            failed.append(slug)
    print("failed: " + (", ".join(failed) if failed else "none"))
    sys.exit(1 if failed else 0)


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
    ap.add_argument("design", nargs="?", help="manifest id, e.g. design-001")
    ap.add_argument("slug", nargs="?", help="template id / folder, e.g. alhambra")
    ap.add_argument("--batch", help="TSV of rows to run one at a time: design, slug, category, [end-frame]")
    ap.add_argument("--json-dir", help="with --batch: write each entry's JSON here")
    ap.add_argument("--name")
    ap.add_argument("--category", default="wedding", choices=["wedding", "engagement", "katb_kitab"])
    ap.add_argument("--video", help="override source video path")
    ap.add_argument("--end-frame", type=int,
                    help="keep frames [0, N) only. Some Flow renders cross-fade back to the start frame "
                         "in their last half-second; cut before that so the last frame is the opened scene")
    ap.add_argument("--json", help="also write the entry as JSON to this path")
    ap.add_argument("--folder", default="",
                    help="category/style folder under public/templates, e.g. wedding/coastal "
                         "(the storefront taxonomy; see the TAXONOMY table in catalog_a.py)")
    a = ap.parse_args()
    if a.batch:
        run_batch(a.batch, a.json_dir)
    if not (a.design and a.slug):
        ap.error("design and slug are required (or use --batch)")
    _lock = take_lock()  # noqa: F841 — released when the process exits

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

    fps = 24.0
    trim = ["-t", f"{a.end_frame / fps:.4f}"] if a.end_frame else []
    afade = f",afade=t=out:st={a.end_frame / fps - 0.3:.3f}:d=0.3" if a.end_frame else ""

    rel = "/".join(x for x in (a.folder.strip("/"), a.slug) if x)
    out = ROOT / "public" / "templates" / rel
    out.mkdir(parents=True, exist_ok=True)

    # Web encode: H.264 High, yuv420p (Safari), moov atom first so it starts before fully loaded.
    audio = (["-af", "anull" + afade] if afade else []) + ["-c:a", "aac", "-b:a", "96k"] if has_audio else ["-an"]
    ff("-i", str(src), *trim, "-c:v", "libx264", "-threads", "4", "-profile:v", "high", "-pix_fmt", "yuv420p",
       "-crf", "23", "-preset", "slow", "-maxrate", "3M", "-bufsize", "6M",
       *audio, "-movflags", "+faststart", str(out / "opening.mp4"))
    # mjpeg needs full-range yuvj420p; -sseof -0.3 + -update 1 grabs the true last frame.
    ff("-i", str(src), "-frames:v", "1", "-vf", "format=yuvj420p", "-q:v", "3", str(out / "start.jpg"))
    if a.end_frame:
        ff("-i", str(src), "-vf", f"select=eq(n\\,{a.end_frame - 1}),format=yuvj420p", "-frames:v", "1",
           "-q:v", "3", str(out / "end.jpg"))
    else:
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
    videoUrl: "/templates/{rel}/opening.mp4",
    posterUrl: "/templates/{rel}/start.jpg",
    endPosterUrl: "/templates/{rel}/end.jpg",
    ambientUrl: "/templates/{rel}/end-blur.jpg",
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
    if a.json:
        Path(a.json).write_text(json.dumps({
            "id": a.slug, "design": a.design, "name": a.name or meta.get("design_name", a.slug.title()),
            "category": a.category, "revealAtMs": int(handoff * 1000) - 400, "vibe": meta.get("vibe", ""),
            "theme": {"background": pal[0], "surface": pal[3], "text": mix(pal[2], "#000000", 0.62),
                      "accent": pal[1], "seal": pal[2]},
        }, ensure_ascii=False, indent=1))
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
