#!/usr/bin/env python3
"""
Normalize meal/step assets to true JPEG at locked dimensions.

Backup: assets/_backup/image-opt-sprint1/
Child heroes (baby_/toddler_/elementary_ + child-hero-keys.json): 1344×768
Steps: 1024×1024
Other PNG-as-JPG: JPEG encode, keep pixel size
Already-valid JPEG at target + under size budget: skip
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageOps

APP_ROOT = Path(__file__).resolve().parents[2]
MEALS = APP_ROOT / "assets" / "meals"
STEPS = APP_ROOT / "assets" / "recipe-steps"
BACKUP = APP_ROOT / "assets" / "_backup" / "image-opt-sprint1"
KEYS_JSON = APP_ROOT / "scripts" / "reports" / "child-hero-keys.json"
REPORT = APP_ROOT / "scripts" / "reports" / "image-opt-normalize-log.json"

HERO_SIZE = (1344, 768)
STEP_SIZE = (1024, 1024)
HERO_SKIP_MAX = 220_000
STEP_SKIP_MAX = 120_000


def is_jpeg(path: Path) -> bool:
    return path.read_bytes()[:3] == b"\xff\xd8\xff"


def is_png(path: Path) -> bool:
    return path.read_bytes()[:8] == b"\x89PNG\r\n\x1a\n"


def to_rgb(im: Image.Image) -> Image.Image:
    im = ImageOps.exif_transpose(im)
    if im.mode in ("RGBA", "LA"):
        bg = Image.new("RGB", im.size, (255, 255, 255))
        bg.paste(im.convert("RGBA"), mask=im.split()[-1])
        return bg
    if im.mode == "P":
        rgba = im.convert("RGBA")
        bg = Image.new("RGB", rgba.size, (255, 255, 255))
        bg.paste(rgba, mask=rgba.split()[-1])
        return bg
    return im.convert("RGB")


def fit_cover(im: Image.Image, tw: int, th: int) -> Image.Image:
    sw, sh = im.size
    scale = max(tw / sw, th / sh)
    nw, nh = max(1, int(round(sw * scale))), max(1, int(round(sh * scale)))
    resized = im.resize((nw, nh), Image.Resampling.LANCZOS)
    left = max(0, (nw - tw) // 2)
    top = max(0, (nh - th) // 2)
    return resized.crop((left, top, left + tw, top + th))


def child_hero_keys() -> set[str]:
    keys: set[str] = set()
    if KEYS_JSON.exists():
        keys.update(json.loads(KEYS_JSON.read_text(encoding="utf-8")))
    for p in MEALS.glob("*.jpg"):
        if p.stem.startswith(("baby_", "toddler_", "elementary_")):
            keys.add(p.stem)
    return keys


def backup(path: Path) -> None:
    rel = path.relative_to(APP_ROOT / "assets")
    dest = BACKUP / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    if not dest.exists():
        shutil.copy2(path, dest)


def write_jpeg(im: Image.Image, dest: Path, quality: int) -> int:
    tmp = dest.with_suffix(".opt-tmp.jpg")
    im.save(tmp, format="JPEG", quality=quality, optimize=True, progressive=True)
    tmp.replace(dest)
    return dest.stat().st_size


def normalize_one(
    path: Path,
    *,
    target: tuple[int, int] | None,
    quality: int,
    skip_max: int,
) -> dict:
    before = path.stat().st_size
    rel = str(path.relative_to(APP_ROOT)).replace("\\", "/")
    jpeg = is_jpeg(path)
    png = is_png(path)

    with Image.open(path) as im:
        w, h = im.size
        rgb = to_rgb(im)

    at_target = target is None or (w, h) == target
    if jpeg and at_target and before <= skip_max:
        return {
            "path": rel,
            "action": "skip_ok",
            "before": before,
            "after": before,
            "width": w,
            "height": h,
        }

    backup(path)
    out = fit_cover(rgb, *target) if target else rgb
    after = write_jpeg(out, path, quality)
    return {
        "path": rel,
        "action": "normalized",
        "before": before,
        "after": after,
        "width": out.width,
        "height": out.height,
        "wasPngAsJpg": png or not jpeg,
        "resized": bool(target) and not at_target,
        "quality": quality,
        "saved": before - after,
    }


def load_keys_file(path: Path | None) -> set[str] | None:
    if path is None:
        return None
    if not path.exists():
        return set()
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, list):
        return {str(k) for k in data}
    return set()


def normalize_scoped_hero(path: Path, *, quality: int, dry_run: bool) -> dict:
    rel = str(path.relative_to(APP_ROOT)).replace("\\", "/")
    if dry_run:
        return {"path": rel, "action": "would_child_hero", "before": path.stat().st_size}
    return normalize_one(
        path,
        target=HERO_SIZE,
        quality=quality,
        skip_max=HERO_SKIP_MAX,
    )


def normalize_scoped_step(path: Path, *, quality: int, dry_run: bool) -> dict:
    rel = str(path.relative_to(APP_ROOT)).replace("\\", "/")
    if dry_run:
        return {"path": rel, "action": "would_step", "before": path.stat().st_size}
    return normalize_one(
        path,
        target=STEP_SIZE,
        quality=quality,
        skip_max=STEP_SKIP_MAX,
    )


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--hero-quality", type=int, default=85)
    ap.add_argument("--step-quality", type=int, default=80)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--hero-keys-file", type=Path, default=None)
    ap.add_argument("--step-keys-file", type=Path, default=None)
    args = ap.parse_args()

    hero_filter = load_keys_file(args.hero_keys_file)
    step_filter = load_keys_file(args.step_keys_file)
    scoped = hero_filter is not None or step_filter is not None

    children = child_hero_keys()
    log: list[dict] = []

    if scoped and hero_filter is not None:
        for key in sorted(hero_filter):
            path = MEALS / f"{key}.jpg"
            if not path.exists():
                log.append({"path": f"assets/meals/{key}.jpg", "action": "missing"})
                continue
            log.append(
                normalize_scoped_hero(
                    path,
                    quality=args.hero_quality,
                    dry_run=args.dry_run,
                )
            )
    else:
        for path in sorted(MEALS.iterdir()):
            if path.suffix.lower() not in {".jpg", ".jpeg"}:
                continue
            if path.stem.startswith("category_"):
                continue

            key = path.stem
            is_child = key in children
            png_or_bad = is_png(path) or not is_jpeg(path)

            if is_child:
                if args.dry_run:
                    log.append({"path": path.name, "action": "would_child_hero"})
                    continue
                log.append(
                    normalize_one(
                        path,
                        target=HERO_SIZE,
                        quality=args.hero_quality,
                        skip_max=HERO_SKIP_MAX,
                    )
                )
                continue

            if png_or_bad:
                if args.dry_run:
                    log.append({"path": path.name, "action": "would_png_to_jpeg"})
                    continue
                log.append(
                    normalize_one(
                        path,
                        target=None,
                        quality=args.hero_quality,
                        skip_max=HERO_SKIP_MAX,
                    )
                )
                continue

            # Valid non-child JPEG: only recompress if very large
            before = path.stat().st_size
            if before > 500_000:
                if args.dry_run:
                    log.append({"path": path.name, "action": "would_recompress_large"})
                    continue
                log.append(
                    normalize_one(
                        path,
                        target=None,
                        quality=args.hero_quality,
                        skip_max=HERO_SKIP_MAX,
                    )
                )
            else:
                log.append(
                    {
                        "path": str(path.relative_to(APP_ROOT)).replace("\\", "/"),
                        "action": "skip_non_child_ok",
                        "before": before,
                        "after": before,
                    }
                )

    if scoped and step_filter is not None:
        for key in sorted(step_filter):
            path = STEPS / f"{key}.jpg"
            if not path.exists():
                log.append({"path": f"assets/recipe-steps/{key}.jpg", "action": "missing"})
                continue
            log.append(
                normalize_scoped_step(
                    path,
                    quality=args.step_quality,
                    dry_run=args.dry_run,
                )
            )
    elif not scoped:
        for path in sorted(STEPS.glob("*.jpg")):
            if args.dry_run:
                log.append({"path": path.name, "action": "would_step"})
                continue
            log.append(
                normalize_one(
                    path,
                    target=STEP_SIZE,
                    quality=args.step_quality,
                    skip_max=STEP_SKIP_MAX,
                )
            )

    REPORT.parent.mkdir(parents=True, exist_ok=True)
    changed = [r for r in log if r.get("action") == "normalized"]
    summary = {
        "heroQuality": args.hero_quality,
        "stepQuality": args.step_quality,
        "childHeroKeys": len(children),
        "entries": len(log),
        "normalized": len(changed),
        "bytesSaved": sum(r.get("saved", 0) for r in changed),
        "backupRoot": str(BACKUP.relative_to(APP_ROOT)).replace("\\", "/"),
    }
    REPORT.write_text(json.dumps({"summary": summary, "log": log}, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
