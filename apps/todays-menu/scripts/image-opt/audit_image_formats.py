#!/usr/bin/env python3
"""
HANKKI Image Optimization Sprint #1 — format audit.
Scan assets/meals + assets/recipe-steps for MIME, dimensions, size, alpha, hashes.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

from PIL import Image

APP_ROOT = Path(__file__).resolve().parents[2]
MEALS = APP_ROOT / "assets" / "meals"
STEPS = APP_ROOT / "assets" / "recipe-steps"
MEAL_REG = APP_ROOT / "services" / "images" / "mealImageAssets.ts"
STEP_REG = APP_ROOT / "services" / "images" / "recipeStepImageAssets.ts"
OUT = APP_ROOT / "scripts" / "reports" / "image-format-audit.json"

HERO_W, HERO_H = 1344, 768
STEP_W, STEP_H = 1024, 1024


def magic_kind(path: Path) -> str:
    head = path.read_bytes()[:16]
    if head.startswith(b"\xff\xd8\xff"):
        return "jpeg"
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return "webp"
    return "unknown"


def parse_require_keys(src: str) -> set[str]:
    keys: set[str] = set()
    for quoted, bare in re.findall(
        r"^\s*(?:'([^']+)'|([a-zA-Z0-9_]+))\s*:\s*require\(", src, re.M
    ):
        keys.add(quoted or bare)
    return keys


def key_from_name(name: str) -> str:
    return Path(name).stem


def inspect_file(path: Path, folder: str, registry: set[str]) -> dict:
    key = key_from_name(path.name)
    size = path.stat().st_size
    kind = magic_kind(path)
    ext = path.suffix.lower()
    width = height = None
    has_alpha = False
    err = None
    try:
        with Image.open(path) as im:
            width, height = im.size
            has_alpha = im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)
            # force load for truncated files
            im.load()
    except Exception as e:  # noqa: BLE001
        err = str(e)

    sha = hashlib.sha256(path.read_bytes()).hexdigest()
    refs = 1 if key in registry else 0

    labels: list[str] = []
    if kind == "jpeg" and ext in (".jpg", ".jpeg"):
        labels.append("VALID_JPEG")
    elif kind == "png" and ext in (".jpg", ".jpeg"):
        labels.append("PNG_AS_JPG")
    elif kind != "jpeg" and ext in (".jpg", ".jpeg"):
        labels.append("REVIEW_REQUIRED")
    elif kind == "png" and ext == ".png":
        labels.append("VALID_PNG" if folder == "meals" else "REVIEW_REQUIRED")

    if width and height:
        if folder == "meals" and (width, height) != (HERO_W, HERO_H) and not path.name.startswith("category_"):
            # category_* and legacy may differ; flag non-category hankki meals
            if key != "hankki-default" and not key.startswith("gold_") and not key.startswith("category_"):
                labels.append("WRONG_DIMENSION")
        if folder == "steps" and (width, height) != (STEP_W, STEP_H):
            labels.append("WRONG_DIMENSION")

    # oversized heuristic: > 800KB for meals, > 400KB for steps after we expect JPEG
    if folder == "meals" and size > 800_000 and not path.name.startswith("category_"):
        labels.append("OVERSIZED")
    if folder == "steps" and size > 400_000:
        labels.append("OVERSIZED")

    if refs == 0 and not path.name.startswith("category_") and key != "hankki-default":
        labels.append("UNUSED")

    if err:
        labels.append("REVIEW_REQUIRED")

    return {
        "path": str(path.relative_to(APP_ROOT)).replace("\\", "/"),
        "folder": folder,
        "key": key,
        "extension": ext,
        "magic": kind,
        "width": width,
        "height": height,
        "bytes": size,
        "hasAlpha": has_alpha,
        "sha256": sha,
        "registryRefs": refs,
        "labels": labels,
        "error": err,
    }


def main() -> int:
    meal_reg = parse_require_keys(MEAL_REG.read_text(encoding="utf-8"))
    step_reg = parse_require_keys(STEP_REG.read_text(encoding="utf-8"))

    rows: list[dict] = []
    for p in sorted(MEALS.iterdir()):
        if p.is_file() and p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}:
            rows.append(inspect_file(p, "meals", meal_reg))
    for p in sorted(STEPS.iterdir()):
        if p.is_file() and p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}:
            rows.append(inspect_file(p, "steps", step_reg))

    by_hash: dict[str, list[str]] = defaultdict(list)
    for r in rows:
        by_hash[r["sha256"]].append(r["path"])
    duplicates = {h: paths for h, paths in by_hash.items() if len(paths) > 1}
    for r in rows:
        if r["sha256"] in duplicates:
            if "DUPLICATE_HASH" not in r["labels"]:
                r["labels"].append("DUPLICATE_HASH")

    def count_label(label: str) -> int:
        return sum(1 for r in rows if label in r["labels"])

    meals_bytes = sum(r["bytes"] for r in rows if r["folder"] == "meals")
    steps_bytes = sum(r["bytes"] for r in rows if r["folder"] == "steps")

    summary = {
        "totalFiles": len(rows),
        "mealsFiles": sum(1 for r in rows if r["folder"] == "meals"),
        "stepsFiles": sum(1 for r in rows if r["folder"] == "steps"),
        "mealsBytes": meals_bytes,
        "stepsBytes": steps_bytes,
        "VALID_JPEG": count_label("VALID_JPEG"),
        "PNG_AS_JPG": count_label("PNG_AS_JPG"),
        "WRONG_DIMENSION": count_label("WRONG_DIMENSION"),
        "OVERSIZED": count_label("OVERSIZED"),
        "UNUSED": count_label("UNUSED"),
        "DUPLICATE_HASH": len(duplicates),
        "DUPLICATE_FILE_GROUPS": len(duplicates),
        "duplicateGroups": [
            {"sha256": h, "paths": paths, "count": len(paths)}
            for h, paths in sorted(duplicates.items(), key=lambda x: -len(x[1]))
        ],
        "pngAsJpgSamples": [r["path"] for r in rows if "PNG_AS_JPG" in r["labels"]][:30],
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"summary": summary, "files": rows}, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))
    print(f"\nWrote {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
