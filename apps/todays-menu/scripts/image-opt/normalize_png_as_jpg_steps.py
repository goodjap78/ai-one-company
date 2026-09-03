#!/usr/bin/env python3
"""
Normalize ONLY PNG-as-JPG files under assets/recipe-steps.

- Skips files that already have JPEG magic bytes (FF D8 FF).
- Target: 1024×1024 RGB JPEG @ q80 (matches CHILD_STEP_IMAGE_SPEC).
- Does not touch meals/ or valid step JPEGs.
"""
from __future__ import annotations

import json
import sys
from datetime import date
from pathlib import Path

# Reuse locked normalization helpers from sprint 1.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from normalize_assets import (  # noqa: E402
    STEP_SIZE,
    STEPS,
    is_jpeg,
    is_png,
    normalize_one,
)

APP_ROOT = Path(__file__).resolve().parents[2]
REPORT = APP_ROOT / "scripts" / "reports" / "png-as-jpg-steps-normalize-pre-9-1.json"
STEP_QUALITY = 80


def list_png_as_jpg_steps() -> list[Path]:
    found: list[Path] = []
    for path in sorted(STEPS.glob("*.jpg")):
        if is_png(path) or not is_jpeg(path):
            found.append(path)
    return found


def audit_steps() -> dict:
    total = 0
    png_as_jpg = 0
    total_bytes = 0
    for path in STEPS.glob("*.jpg"):
        total += 1
        total_bytes += path.stat().st_size
        if is_png(path) or not is_jpeg(path):
            png_as_jpg += 1
    return {"total": total, "pngAsJpg": png_as_jpg, "totalBytes": total_bytes}


def main() -> int:
    dry_run = "--dry-run" in sys.argv
    before_audit = audit_steps()
    targets = list_png_as_jpg_steps()

    print(f"step_files={before_audit['total']} png_as_jpg={before_audit['pngAsJpg']} targets={len(targets)}")

    if dry_run:
        for path in targets:
            print(f"  would normalize: {path.name} ({path.stat().st_size} bytes)")
        return 0

    log: list[dict] = []
    before_sum = 0
    after_sum = 0

    for path in targets:
        entry = normalize_one(
            path,
            target=STEP_SIZE,
            quality=STEP_QUALITY,
            skip_max=0,  # force encode for PNG-as-JPG only list
        )
        log.append(entry)
        before_sum += entry.get("before", 0)
        after_sum += entry.get("after", 0)

    after_audit = audit_steps()
    avg_before = before_sum / len(targets) if targets else 0
    avg_after = after_sum / len(targets) if targets else 0

    report = {
        "sprint": "HANKKI_FINAL_PRE_9_1_CLEANUP",
        "date": date.today().isoformat(),
        "stepQuality": STEP_QUALITY,
        "targetSize": list(STEP_SIZE),
        "before": {
            "stepFiles": before_audit["total"],
            "pngAsJpg": before_audit["pngAsJpg"],
            "stepBytes": before_audit["totalBytes"],
            "normalizedCount": len(targets),
            "normalizedBytes": before_sum,
            "averageNormalizedBytes": round(avg_before),
        },
        "after": {
            "stepFiles": after_audit["total"],
            "pngAsJpg": after_audit["pngAsJpg"],
            "stepBytes": after_audit["totalBytes"],
            "normalizedBytes": after_sum,
            "averageNormalizedBytes": round(avg_after),
        },
        "saved": {
            "normalizedBytes": before_sum - after_sum,
            "normalizedMB": round((before_sum - after_sum) / (1024 * 1024), 2),
            "stepFolderMB": round((before_audit["totalBytes"] - after_audit["totalBytes"]) / (1024 * 1024), 2),
        },
        "entries": log,
    }

    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report["before"], indent=2))
    print(json.dumps(report["after"], indent=2))
    print(json.dumps(report["saved"], indent=2))
    print(f"report={REPORT.relative_to(APP_ROOT)}")

    if after_audit["pngAsJpg"] != 0:
        print(f"ERROR: png_as_jpg remaining {after_audit['pngAsJpg']}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
