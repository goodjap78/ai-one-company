#!/usr/bin/env python3
"""
Quality ladder sample: encode representative images at q90/q85/q80.
Writes previews under scripts/reports/image-opt-quality-samples/
"""
from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageOps

APP_ROOT = Path(__file__).resolve().parents[2]
OUT = APP_ROOT / "scripts" / "reports" / "image-opt-quality-samples"
MEALS = APP_ROOT / "assets" / "meals"
STEPS = APP_ROOT / "assets" / "recipe-steps"

HERO_SAMPLES = [
    "baby_rice_thin_porridge.jpg",
    "baby_beef_zucchini_porridge.jpg",
    "toddler_tuna_veg_fried_rice.jpg",
    "elementary_tuna_mayo_rice_ball.jpg",
]
STEP_SAMPLES = [
    "baby_rice_thin_porridge_step_01.jpg",
    "baby_rice_thin_porridge_step_02.jpg",
    "baby_rice_thin_porridge_step_03.jpg",
]
QUALITIES = (90, 85, 80)


def to_rgb(im: Image.Image) -> Image.Image:
    im = ImageOps.exif_transpose(im)
    if im.mode in ("RGBA", "LA"):
        bg = Image.new("RGB", im.size, (255, 255, 255))
        alpha = im.split()[-1]
        bg.paste(im.convert("RGBA"), mask=alpha)
        return bg
    if im.mode == "P":
        im = im.convert("RGBA")
        bg = Image.new("RGB", im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[-1] if "A" in im.getbands() else None)
        return bg
    return im.convert("RGB")


def fit_cover(im: Image.Image, tw: int, th: int) -> Image.Image:
    """Center-cover resize without distorting aspect (no content invent)."""
    sw, sh = im.size
    scale = max(tw / sw, th / sh)
    nw, nh = max(1, int(round(sw * scale))), max(1, int(round(sh * scale)))
    resized = im.resize((nw, nh), Image.Resampling.LANCZOS)
    left = max(0, (nw - tw) // 2)
    top = max(0, (nh - th) // 2)
    return resized.crop((left, top, left + tw, top + th))


def encode_variants(src: Path, target_size: tuple[int, int], prefix: str) -> list[dict]:
    rows = []
    with Image.open(src) as im:
        rgb = to_rgb(im)
        fitted = fit_cover(rgb, *target_size)
        for q in QUALITIES:
            out = OUT / f"{prefix}_q{q}.jpg"
            fitted.save(out, format="JPEG", quality=q, optimize=True, progressive=True)
            rows.append(
                {
                    "source": src.name,
                    "quality": q,
                    "bytes": out.stat().st_size,
                    "width": fitted.width,
                    "height": fitted.height,
                    "out": str(out.relative_to(APP_ROOT)).replace("\\", "/"),
                }
            )
    return rows


def main() -> int:
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True, exist_ok=True)
    results: list[dict] = []
    for name in HERO_SAMPLES:
        src = MEALS / name
        if src.exists():
            results.extend(encode_variants(src, (1344, 768), f"hero_{src.stem}"))
    for name in STEP_SAMPLES:
        src = STEPS / name
        if src.exists():
            results.extend(encode_variants(src, (1024, 1024), f"step_{src.stem}"))

    # Aggregate avg bytes by quality for hero vs step
    def avg(kind: str, q: int) -> float:
        vals = [r["bytes"] for r in results if r["out"].split("/")[-1].startswith(kind) and r["quality"] == q]
        return sum(vals) / len(vals) if vals else 0

    summary = {
        "heroAvgBytes": {f"q{q}": int(avg("hero_", q)) for q in QUALITIES},
        "stepAvgBytes": {f"q{q}": int(avg("step_", q)) for q in QUALITIES},
        "recommendation": {
            "heroQuality": 85,
            "stepQuality": 80,
            "rationale": (
                "q85 typically ~25-40% smaller than q90 with minimal banding on food photos; "
                "step images display ~100x100 so q80 remains texture-readable while saving more."
            ),
        },
        "samples": results,
    }
    (OUT / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary["heroAvgBytes"], indent=2))
    print(json.dumps(summary["stepAvgBytes"], indent=2))
    print("recommendation", summary["recommendation"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
