#!/usr/bin/env python3
"""Post-optimization verification + size report."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from PIL import Image

APP_ROOT = Path(__file__).resolve().parents[2]
MEALS = APP_ROOT / "assets" / "meals"
STEPS = APP_ROOT / "assets" / "recipe-steps"
KEYS = json.loads((APP_ROOT / "scripts" / "reports" / "child-hero-keys.json").read_text(encoding="utf-8"))
MEAL_REG = (APP_ROOT / "services" / "images" / "mealImageAssets.ts").read_text(encoding="utf-8")
STEP_REG = (APP_ROOT / "services" / "images" / "recipeStepImageAssets.ts").read_text(encoding="utf-8")
OUT = APP_ROOT / "scripts" / "reports" / "image-opt-after-report.json"

# Baseline from pre-opt measurement (pilot after state)
MEALS_BEFORE = 344151963
STEPS_BEFORE = 56161906


def is_jpeg(p: Path) -> bool:
    return p.read_bytes()[:3] == b"\xff\xd8\xff"


def is_png(p: Path) -> bool:
    return p.read_bytes()[:8] == b"\x89PNG\r\n\x1a\n"


def reg_keys(src: str) -> set[str]:
    out: set[str] = set()
    for a, b in re.findall(r"^\s*(?:'([^']+)'|([a-zA-Z0-9_]+))\s*:\s*require\(", src, re.M):
        out.add(a or b)
    return out


def dir_bytes(d: Path) -> int:
    return sum(p.stat().st_size for p in d.iterdir() if p.is_file())


def main() -> int:
    meal_reg = reg_keys(MEAL_REG)
    step_reg = reg_keys(STEP_REG)

    png_as_jpg = 0
    wrong_hero = 0
    wrong_step = 0
    child_sizes: list[int] = []
    step_sizes: list[int] = []
    hero_missing = []
    step_missing = []

    for key in KEYS:
        p = MEALS / f"{key}.jpg"
        if not p.exists() or key not in meal_reg:
            hero_missing.append(key)
            continue
        if is_png(p) or not is_jpeg(p):
            png_as_jpg += 1
        with Image.open(p) as im:
            if im.size != (1344, 768):
                wrong_hero += 1
        child_sizes.append(p.stat().st_size)

    for p in sorted(STEPS.glob("*.jpg")):
        if p.stem not in step_reg:
            step_missing.append(p.stem)
        if is_png(p) or not is_jpeg(p):
            png_as_jpg += 1
        with Image.open(p) as im:
            if im.size != (1024, 1024):
                wrong_step += 1
        step_sizes.append(p.stat().st_size)

    meals_after = dir_bytes(MEALS)
    steps_after = dir_bytes(STEPS)
    total_before = MEALS_BEFORE + STEPS_BEFORE
    total_after = meals_after + steps_after

    def mb(n: int) -> float:
        return round(n / (1024 * 1024), 2)

    def pct(before: int, after: int) -> float:
        return round((1 - after / before) * 100, 1) if before else 0.0

    report = {
        "mealsBefore": MEALS_BEFORE,
        "mealsAfter": meals_after,
        "mealsSavedMB": round(mb(MEALS_BEFORE - meals_after), 2),
        "mealsSavedPercent": pct(MEALS_BEFORE, meals_after),
        "stepsBefore": STEPS_BEFORE,
        "stepsAfter": steps_after,
        "stepsSavedMB": round(mb(STEPS_BEFORE - steps_after), 2),
        "stepsSavedPercent": pct(STEPS_BEFORE, steps_after),
        "totalBefore": total_before,
        "totalAfter": total_after,
        "totalSavedMB": round(mb(total_before - total_after), 2),
        "totalSavedPercent": pct(total_before, total_after),
        "avgChildHeroBeforeEst": round(MEALS_BEFORE / 412),  # rough; replace with exact if logged
        "avgChildHeroAfter": int(sum(child_sizes) / len(child_sizes)) if child_sizes else 0,
        "avgStepAfter": int(sum(step_sizes) / len(step_sizes)) if step_sizes else 0,
        "childHeroCount": len(child_sizes),
        "stepCount": len(step_sizes),
        "pngAsJpgRemaining": png_as_jpg,
        "wrongHeroDims": wrong_hero,
        "wrongStepDims": wrong_step,
        "heroRuntimeMissing": hero_missing,
        "stepRegistryMissing": step_missing,
        "mealsMB": mb(meals_after),
        "stepsMB": mb(steps_after),
    }
    OUT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))
    ok = (
        png_as_jpg == 0
        and wrong_hero == 0
        and wrong_step == 0
        and not hero_missing
        and not step_missing
    )
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
