#!/usr/bin/env python3
"""Probe hero/step image metadata for new-recipe-preparation pipeline."""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image

APP_ROOT = Path(__file__).resolve().parents[2]
MEALS = APP_ROOT / "assets" / "meals"
STEPS = APP_ROOT / "assets" / "recipe-steps"


def magic_kind(head: bytes) -> str:
    if head[:3] == b"\xff\xd8\xff":
        return "jpeg"
    if head[:8] == b"\x89PNG\r\n\x1a\n":
        return "png"
    return "other"


def main() -> int:
    items = json.loads(sys.stdin.read())
    out: list[dict] = []
    for item in items:
        kind = item["kind"]
        key = item["key"]
        base = MEALS if kind == "hero" else STEPS
        path = base / f"{key}.jpg"
        if not path.exists():
            out.append({"kind": kind, "key": key, "exists": False})
            continue
        head = path.read_bytes()[:16]
        with Image.open(path) as im:
            w, h = im.size
        out.append(
            {
                "kind": kind,
                "key": key,
                "exists": True,
                "magic": magic_kind(head),
                "width": w,
                "height": h,
                "bytes": path.stat().st_size,
            }
        )
    print(json.dumps(out))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
