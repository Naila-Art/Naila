#!/usr/bin/env python3
"""
Download and transcode 50 production-cleared Public Domain / CC0 ceremony tracks
from Archive.org's Musopen studio-recorded collections into public/music/*.m4a.

Runs strictly sequentially (one download + ffmpeg transcode at a time) so CPU and
memory stay bounded and Archive.org is never hammered.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "music"
TMP_DIR = Path("/tmp/naila-music-dl")
CLIP_SECONDS = 65.0
MIN_VALID_BYTES = 80_000

# (slug, collection, remote_path, seek_sec, name, name_ar, mood, default_template_id)
MANIFEST: list[tuple[str, str, str, float, str, str, str, str]] = [
    ("silk-road-serenade", "MusopenCollectionAsFlac", "Borodin_InTheSteppesOfCentralAsia/AlexanderBorodin-InTheSteppesOfCentralAsia.mp3", 0, "Silk Road Serenade · Borodin", "سيريناد طريق الحرير · بورودين", "orchestral", "alhambra"),
    ("anitra-dream", "MusopenCollectionAsFlac", "Greig_PeerGynt/EdvardGrieg-PeerGyntSuiteNo.1Op.46-03-AnitrasDream.mp3", 0, "Anitra's Dance · Grieg", "رقصة أنيترا · جريج", "orchestral", "andalus"),
    ("morning-mood", "MusopenCollectionAsFlac", "Greig_PeerGynt/EdvardGrieg-PeerGyntSuiteNo.1Op.46-01-Morning.mp3", 0, "Morning Mood · Grieg", "إشراقة الصباح · جريج", "orchestral", "glasshouse"),
    ("vltava-river", "MusopenCollectionAsFlac", "Smetana_Vltava/BedichSmetana-MVlast-Vltava.mp3", 55, "Vltava Flowing River · Smetana", "نهر فلتافا · سميتانا", "orchestral", "lakeside"),
    ("italian-sunlight", "MusopenCollectionAsFlac", "Mendelssohn_ItalianSymphony/FelixMendelssohn-SymphonyNo.4InAMajorOp.90italian-01-AllegroVivace.mp3", 0, "Italian Symphony · Mendelssohn", "السيمفونية الإيطالية · مندلسون", "orchestral", "amalfi"),
    ("italian-procession", "MusopenCollectionAsFlac", "Mendelssohn_ItalianSymphony/FelixMendelssohn-SymphonyNo.4InAMajorOp.90italian-02-AndanteConMoto.mp3", 0, "Tuscan Processional · Mendelssohn", "موكب توسكانا · مندلسون", "orchestral", "oliveto"),
    ("italian-minuet", "MusopenCollectionAsFlac", "Mendelssohn_ItalianSymphony/FelixMendelssohn-SymphonyNo.4InAMajorOp.90italian-03-ConMotoModerato.mp3", 0, "Garden Minuet · Mendelssohn", "مينويت الحديقة · مندلسون", "orchestral", "orangerie"),
    ("hebrides-sea", "MusopenCollectionAsFlac", "Mendelssohn_Hebrides/FelixMendelssohn-HebridesOvertureFingalsCave.mp3", 0, "Hebrides Sea Overture · Mendelssohn", "افتتاحية البحر · مندلسون", "orchestral", "maree"),
    ("royal-figaro", "MusopenCollectionAsFlac", "Mozart_MarriageOfFigaro/WolfgangAmadeusMozart-MarriageOfFigaro.mp3", 0, "Marriage of Figaro · Mozart", "زواج فيغارو · موتسارت", "orchestral", "grand-stage"),
    ("magic-flute", "MusopenCollectionAsFlac", "Mozart_MagicFluteOverture/WolfgangAmadeusMozart-MagicFluteOverture.mp3", 18, "Magic Flute Overture · Mozart", "الناي السحري · موتسارت", "orchestral", "ballroom"),
    ("brahms-pastorale", "MusopenCollectionAsFlac", "Brahms_SymphonyNo.2inDMajor/JohannesBrahms-SymphonyNo.2InDMajorOp.73-03-AllegrettoGraziosotake1.mp3", 0, "Pastoral Allegretto · Brahms", "باستورال · برامز", "orchestral", "chateau"),
    ("brahms-romance", "MusopenCollectionAsFlac", "Brahms_SymphonyNo.3inFMajor/JohannesBrahms-SymphonyNo.3InFMajorOp.90-03-PocoAllegretto.mp3", 0, "Symphonic Romance · Brahms", "رومانسية سيمفونية · برامز", "orchestral", "palais"),
    ("tchaikovsky-grace", "MusopenCollectionAsFlac", "Tchaikovsky_SymphonyPathetique/PyotrIlyichTchaikovsky-SymphonyNo.6InBMinorOp.74pathtique-02-AllegroConGracia.mp3", 0, "Imperial Grace Waltz · Tchaikovsky", "فالس النعومة الإمبراطوري · تشايكوفسكي", "orchestral", "concerto"),
    ("borodin-notturno", "MusopenCollectionAsFlac", "Borodin_StringQuartetNo.2inDMajor/AlexanderBorodin-StringQuartetNo.2InDMajor-03-NocturneAndante.mp3", 0, "Nocturne for Strings · Borodin", "نوكتورن الوتريات · بورودين", "strings", "arabesque"),
    ("borodin-moderato", "MusopenCollectionAsFlac", "Borodin_StringQuartetNo.2inDMajor/AlexanderBorodin-StringQuartetNo.2InDMajor-01-AllegroModerato.mp3", 0, "Velvet Strings · Borodin", "وتريات مخملية · بورودين", "strings", "dimashqi"),
    ("borodin-andante", "MusopenCollectionAsFlac", "Borodin_StringQuartetNo.1inAMajor/AlexanderBorodin-StringQuartetNo.1InAMajor-02-AndanteConMoto.mp3", 0, "Courtyard Andante · Borodin", "أندانتي الفناء · بورودين", "strings", "medina"),
    ("dvorak-romanza", "MusopenCollectionAsFlac", "Dvorak_StringQuartetNo.10inEFlatOp.51/AntonnDvorak-StringQuartetNo.10InEFlatOp.51-03-Romanza.mp3", 0, "String Romanza · Dvořák", "رومانسية وتريات · دفورجاك", "strings", "mihrab"),
    ("dvorak-american-lento", "MusopenCollectionAsFlac", "Dvorak_StringQuartetNo.12inFMajorOp.96/AntonnDvorak-StringQuartetNo.12InFMajorOp.96American-02-Lento.mp3", 0, "Twilight Lento · Dvořák", "لينتو الغسق · دفورجاك", "strings", "layal"),
    ("dvorak-american-allegro", "MusopenCollectionAsFlac", "Dvorak_StringQuartetNo.12inFMajorOp.96/AntonnDvorak-StringQuartetNo.12InFMajorOp.96American-01-AllegroMaNonTroppo.mp3", 0, "Sunlit Horizon · Dvořák", "أفق مشرق · دفورجاك", "strings", "azure"),
    ("suk-meditation", "MusopenCollectionAsFlac", "Suk_Meditation/JosefSuk-Meditation.mp3", 0, "Candlelight Meditation · Suk", "تأمل على ضوء الشموع · سوك", "strings", "sahra"),
    ("haydn-lark-adagio", "MusopenCollectionAsFlac", "Haydn_StringQuartetInDMajorOp.64/JosephHaydn-StringQuartetInDOp.645H363Lark-02-AdagioCantabile.mp3", 0, "Lark Adagio · Haydn", "أداجيو القبرة · هايدن", "strings", "chateau-aquarelle"),
    ("haydn-lark-minuet", "MusopenCollectionAsFlac", "Haydn_StringQuartetInDMajorOp.64/JosephHaydn-StringQuartetInDOp.645H363Lark-03-MenuettoAllegretto.mp3", 0, "Palace Minuet · Haydn", "مينويت القصر · هايدن", "strings", "cristal"),
    ("mozart-cantabile", "MusopenCollectionAsFlac", "Mozart_StringQuartetNo.19inCMajorK465/WolfgangAmadeusMozart-StringQuartetNo.19InCK465Dissonance-02-AndanteCantabile.mp3", 0, "Andante Cantabile · Mozart", "أندانتي كانتابيلي · موتسارت", "strings", "barakah-engagement"),
    ("mozart-quartet-minuet", "MusopenCollectionAsFlac", "Mozart_StringQuartetNo.19inCMajorK465/WolfgangAmadeusMozart-StringQuartetNo.19InCK465Dissonance-03-MinuettoAllegretto.mp3", 0, "Viennese Minuet · Mozart", "مينويت فيينا · موتسارت", "strings", "fontaine"),
    ("mozart-symphony-andante", "MusopenCollectionAsFlac", "Mozart_SymphonyNo.40inGMinor/WolfgangAmadeusMozart-SymphonyNo.40InGMinorK.550-02-Andante.mp3", 0, "Classical Andante · Mozart", "أندانتي كلاسيكي · موتسارت", "strings", "beach"),
    ("beethoven-adagio", "MusopenCollectionAsFlac", "Beethoven_StringQuartetNo.6inBFlatMajorOp.18/LudwigVanBeethoven-StringQuartetNo.6InBFlatMajorOp.18No.6-02-AdagioMaNonTroppo.mp3", 0, "Chamber Adagio · Beethoven", "أداجيو الحجرة · بيتهوفن", "strings", "rivage"),
    ("chopin-nocturne-9-2", "musopen-chopin", "Nocturne Op. 9 no. 2 in E flat major.mp3", 0, "Nocturne in E-Flat · Chopin", "نوكتورن مي بيمول · شوبان", "piano", "gardenia"),
    ("chopin-nocturne-27-2", "musopen-chopin", "NocturneOp27No2.mp3", 0, "Nocturne in D-Flat · Chopin", "نوكتورن ري بيمول · شوبان", "piano", "gardenia-couture"),
    ("chopin-nocturne-15-1", "musopen-chopin", "Nocturne Op. 15 no. 1 In F major.mp3", 0, "Nocturne in F Major · Chopin", "نوكتورن فا ماجور · شوبان", "piano", "camelia"),
    ("chopin-nocturne-32-1", "musopen-chopin", "Nocturne Op. 32 no. 1 in B major.mp3", 0, "Nocturne in B Major · Chopin", "نوكتورن سي ماجور · شوبان", "piano", "nacre"),
    ("chopin-nocturne-32-2", "musopen-chopin", "Nocturne Op. 32 no. 2 in A flat major.mp3", 0, "Nocturne in A-Flat · Chopin", "نوكتورن لا بيمول · شوبان", "piano", "lin"),
    ("chopin-nocturne-55-2", "musopen-chopin", "Nocturne Op. 55 no. 2 in E flat major.mp3", 0, "Evening Nocturne · Chopin", "نوكتورن المساء · شوبان", "piano", "minuit"),
    ("chopin-nocturne-62-2", "musopen-chopin", "Nocturne Op. 62 no. 2 in E major.mp3", 0, "Golden Nocturne · Chopin", "النوكتورن الذهبي · شوبان", "piano", "arabian-veil"),
    ("chopin-nocturne-b49", "musopen-chopin", "Nocturne B. 49 in C sharp minor 'Lento con gran espressione' (1).mp3", 0, "Lento Espressivo · Chopin", "لينتو عاطفي · شوبان", "piano", "neige"),
    ("chopin-raindrop", "musopen-chopin", "Prelude Op. 28 no. 15.mp3", 0, "Raindrop Prelude · Chopin", "بريلود قطرات المطر · شوبان", "piano", "coeur-de-perle"),
    ("chopin-prelude-13", "musopen-chopin", "Prelude Op. 28 no. 13.mp3", 0, "Prelude in F-Sharp · Chopin", "بريلود فا دييز · شوبان", "piano", "fulla"),
    ("chopin-prelude-17", "musopen-chopin", "Prelude Op. 28 no. 17.mp3", 0, "Prelude in A-Flat · Chopin", "بريلود لا بيمول · شوبان", "piano", "jasmine"),
    ("chopin-prelude-21", "musopen-chopin", "Prelude Op. 28 no. 21.mp3", 0, "Cantabile Prelude · Chopin", "بريلود كانتابيلي · شوبان", "piano", "bustan"),
    ("goldberg-aria", "MusopenCollectionAsFlac", "Bach_GoldbergVariations/JohannSebastianBach-01-GoldbergVariationsBwv.988-Aria.mp3", 0, "Goldberg Aria · Bach", "آريا غولدبرغ · باخ", "piano", "douceur"),
    ("schubert-andante-664", "MusopenCollectionAsFlac", "Schubert_SonataInAMajorD.664/FranzSchubert-SonataInAMajorD.664-02-Andante.mp3", 0, "Sonata Andante · Schubert", "أندانتي سوناتا · شوبرت", "piano", "ciel"),
    ("chopin-waltz-69-1", "musopen-chopin", "Waltz Op. 69 no. 1 in A flat major.mp3", 0, "Farewell Waltz · Chopin", "فالس لا بيمول · شوبان", "waltz", "giverny"),
    ("chopin-waltz-64-2", "musopen-chopin", "Waltz Op. 64 no. 2 in C sharp minor.mp3", 0, "Valse Romantique · Chopin", "فالس رومانسي · شوبان", "waltz", "lilas"),
    ("chopin-waltz-64-3", "musopen-chopin", "Waltz no.8 - Op.64 no.3_ Ab-major.mp3", 0, "A-Flat Salon Waltz · Chopin", "فالس الصالون · شوبان", "waltz", "magnolia"),
    ("chopin-waltz-70-1", "musopen-chopin", "Waltz Op. 70 no. 1 in G flat major.mp3", 0, "Springtime Waltz · Chopin", "فالس الربيع · شوبان", "waltz", "glycine"),
    ("chopin-waltz-70-3", "musopen-chopin", "Waltz Op. 70 no. 3 in D flat major.mp3", 0, "Velvet Waltz · Chopin", "فالس مخملي · شوبان", "waltz", "rose"),
    ("chopin-grande-valse", "musopen-chopin", "Grande Valse Brilliante Op.18 In E flat major.mp3", 0, "Grande Valse Brillante · Chopin", "الفالس الكبير اللامع · شوبان", "waltz", "jukebox"),
    ("chopin-waltz-34-3", "musopen-chopin", "WaltzOp.34No.3InFMajor.mp3", 0, "Valse Brillante in F · Chopin", "فالس فا اللامع · شوبان", "waltz", "love-passport"),
    ("chopin-flute-variations", "musopen-chopin", "Variations for flute and piano.mp3", 0, "Flute & Piano Serenade · Chopin", "سيريناد الفلوت والبيانو · شوبان", "waltz", "la-gare"),
    ("chopin-impromptu-1", "musopen-chopin", "Impromptu no. 1 - Op. 29.mp3", 0, "Impromptu in A-Flat · Chopin", "إمبرومبتو لا بيمول · شوبان", "waltz", "odyssey"),
    ("chopin-waltz-b133", "musopen-chopin", "Waltz B. 133 in E flat major.mp3", 0, "Sostenuto Waltz · Chopin", "فالس سوستينوتو · شوبان", "waltz", "pivoine"),
]


def download_file(url: str, dest: Path) -> None:
    last_err: Exception | None = None
    for attempt in range(1, 4):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "naila-music-curator/1.0"})
            with urllib.request.urlopen(req, timeout=60) as resp:
                with open(dest, "wb") as f:
                    while True:
                        chunk = resp.read(65536)
                        if not chunk:
                            break
                        f.write(chunk)
            if dest.stat().st_size > 10_000:
                return
            raise RuntimeError(f"Downloaded file too small: {dest.stat().st_size} bytes")
        except Exception as exc:  # noqa: BLE001
            last_err = exc
            if dest.exists():
                dest.unlink()
            if attempt < 3:
                time.sleep(2.0)
    raise RuntimeError(f"Failed downloading {url}: {last_err}")


def probe_duration(src: Path) -> float:
    res = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "json",
            str(src),
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    info = json.loads(res.stdout)
    return float(info["format"]["duration"])


def transcode_clip(src: Path, dest: Path, seek_sec: float) -> float:
    dur = probe_duration(src)
    safe_seek = min(seek_sec, max(0.0, dur - 20.0))
    clip_dur = min(CLIP_SECONDS, max(15.0, dur - safe_seek - 0.5))
    fade_out_start = max(2.0, clip_dur - 2.5)
    af = (
        f"silenceremove=start_periods=1:start_duration=0.1:start_threshold=-55dB,"
        f"atrim=duration={clip_dur:.2f},asetpts=PTS-STARTPTS,"
        f"loudnorm=I=-16:TP=-1.5:LRA=11,"
        f"afade=t=in:st=0:d=1.2,"
        f"afade=t=out:st={fade_out_start:.2f}:d=2.5"
    )
    tmp_out = dest.with_suffix(".tmp.m4a")
    if tmp_out.exists():
        tmp_out.unlink()
    cmd = [
        "ffmpeg",
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        *(["-ss", f"{safe_seek:.2f}"] if safe_seek > 0 else []),
        "-i",
        str(src),
        "-vn",
        "-af",
        af,
        "-c:a",
        "aac",
        "-b:a",
        "96k",
        "-ac",
        "2",
        "-ar",
        "44100",
        "-movflags",
        "+faststart",
        str(tmp_out),
    ]
    subprocess.run(cmd, check=True)
    tmp_out.replace(dest)
    return clip_dur


def write_credits() -> None:
    lines = [
        "Naila Built-in Ceremony Music Library — Commercial Public Domain / CC0 Credits",
        "==============================================================================",
        "",
        "Collections used:",
        "1. Musopen Collection (MusopenCollectionAsFlac)",
        "   Source: https://archive.org/details/MusopenCollectionAsFlac",
        "   License: Creative Commons Public Domain Mark 1.0 (no known copyright)",
        "",
        "2. Musopen Complete Chopin Collection (musopen-chopin)",
        "   Source: https://archive.org/details/musopen-chopin",
        "   License: Creative Commons Zero 1.0 Universal (CC0 1.0 Public Domain Dedication)",
        "",
        "Track Manifest (50 tracks):",
    ]
    for i, (slug, collection, remote_path, seek_sec, name, _name_ar, mood, tpl) in enumerate(MANIFEST, 1):
        lic = "CC0 1.0" if collection == "musopen-chopin" else "Public Domain Mark 1.0"
        lines.append(
            f"{i:02d}. {slug}.m4a | {name} | mood={mood} | default_template={tpl} | "
            f"seek={seek_sec}s | {collection}/{remote_path} | {lic}"
        )
    (OUT_DIR / "CREDITS.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    TMP_DIR.mkdir(parents=True, exist_ok=True)

    failures: list[tuple[str, str]] = []
    skipped = 0
    created = 0

    for idx, (slug, collection, remote_path, seek_sec, name, _name_ar, _mood, _tpl) in enumerate(MANIFEST, 1):
        dest = OUT_DIR / f"{slug}.m4a"
        if dest.exists() and dest.stat().st_size > MIN_VALID_BYTES:
            skipped += 1
            print(f"[{idx:02d}/{len(MANIFEST)}] SKIP {slug}.m4a ({dest.stat().st_size // 1024} KB)")
            continue

        encoded_path = urllib.parse.quote(remote_path, safe="/")
        url = f"https://archive.org/download/{collection}/{encoded_path}"
        tmp_mp3 = TMP_DIR / f"{slug}.mp3"

        try:
            print(f"[{idx:02d}/{len(MANIFEST)}] FETCH {slug} <- {collection} ...", flush=True)
            download_file(url, tmp_mp3)
            clip_dur = transcode_clip(tmp_mp3, dest, seek_sec)
            size_kb = dest.stat().st_size // 1024
            created += 1
            print(f"[{idx:02d}/{len(MANIFEST)}] OK {slug}.m4a ({size_kb} KB, {clip_dur:.1f}s) — {name}", flush=True)
        except Exception as exc:  # noqa: BLE001
            failures.append((slug, str(exc)))
            print(f"[{idx:02d}/{len(MANIFEST)}] FAIL {slug}: {exc}", file=sys.stderr, flush=True)
        finally:
            if tmp_mp3.exists():
                tmp_mp3.unlink()

    write_credits()
    total_mb = sum(p.stat().st_size for p in OUT_DIR.glob("*.m4a")) / (1024 * 1024)
    print(f"\nSummary: created={created}, skipped={skipped}, failed={len(failures)}, total_m4a_size={total_mb:.2f} MB")
    if failures:
        for slug, err in failures:
            print(f"  FAILED: {slug}: {err}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
