# Engine — Recommendation Engine

| Field | Value |
| --- | --- |
| **Version** | 0.1.0 |
| **Status** | Active |
| **Primary path** | `apps/todays-menu/services/recommendation/` |

## Purpose

Help users **decide today's meal in ~10 seconds** — recommend a MAIN meal, not browse a feed.

## Architecture

- Catalog adapter: `goldMealCatalog` ← `HANKKI_RECIPES`
- Ranking / context: preference DNA, meal history, situation tags
- Home surfaces reasons, pairings, confidence — Decision Recipe layer (R8 tags)

Deep dive (legacy path): [`docs/engineering/ai/ai-recommendation-engine.md`](../../docs/engineering/ai/ai-recommendation-engine.md)

## Flow

```
user context + catalog → score / filter MAIN → Home card → accept → ingredients / cooking
```

## Reusable projects

| Project | How used |
| --- | --- |
| HANKKI | Core product |
| Future assistants | Context + ranked options pattern |

## Version History

| Version | Date | Notes |
| --- | --- | --- |
| 0.1.0 | 2026 | Flagship Home loop live |

## Commands / entrypoints

Runtime services only (no CLI). Enter via Home recommendation flow.

## Related docs

- [`docs/HANKKI_BIBLE.md`](../../docs/HANKKI_BIBLE.md)
- [`docs/HANKKI_MASTER_ROADMAP.md`](../../docs/HANKKI_MASTER_ROADMAP.md)
