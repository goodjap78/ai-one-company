# Decision — HANKKI Hero Image Production Pipeline

| Field | Value |
| --- | --- |
| **Date** | 2026-07-14 |
| **Project** | HANKKI (`apps/todays-menu`) |
| **Status** | Accepted |
| **Authors** | AI Company |

## Decision

Ship hero food images via a two-layer developer pipeline: **IMG-1 Hero Image Factory** (manifest + prompts) and **IMG-2 AI Image Production Engine** (queue → generate → review → approve → registry). UI / Home / Recipe Detail / recommendation logic stay untouched.

## Why

- 40/50 production recipes lack dedicated heroes
- Manual generation loses prompts, keys, and approval history
- Engine core is portable for other AI Company apps

## Expected impact

- Repeatable production without redesigning UI
- Approval gate prevents unreviewed assets in `assets/meals/`
- Provider can switch via `IMAGE_PROVIDER` / `IMAGE_API_KEY`

## Related files

- `apps/todays-menu/scripts/image-factory/`
- `apps/todays-menu/scripts/image-factory/engine/`
- `AI_Company_OS/03_Reusable_Engines/AI_Image_Production_Engine.md`
- `apps/todays-menu/generated/image-factory/`

## Alternatives considered

- Generate directly into `assets/meals/` without review — rejected (production safety)
- One-off ChatGPT downloads — rejected (no queue / registry / validation)

## Follow-ups

- [ ] Configure real provider when budget / keys ready
- [ ] Re-encode Batch 01 PNG-bytes-named-jpg (LESSON-0002)
- [ ] Align RF-2A filenames to `heroImageKey` (LESSON-0003)
