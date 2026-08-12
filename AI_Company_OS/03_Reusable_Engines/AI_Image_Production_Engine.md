# Engine — AI Image Production Engine

| Field | Value |
| --- | --- |
| **Version** | 0.1.0 |
| **Status** | Active |
| **Primary path** | `apps/todays-menu/scripts/image-factory/` |

## Purpose

Produce meal **hero images** with queue, pluggable providers, review/approval, registry updates, and validation — without touching app UI.

## Architecture

| Layer | Path | Notes |
| --- | --- | --- |
| Portable engine | `scripts/image-factory/engine/` | No Expo imports; copy to other apps |
| Providers | `engine/providers/` | Disabled / Mock / OpenAI |
| HANKKI adapter | queue, review, registry, CLI | App paths & `mealImageAssets.ts` |

Env: `IMAGE_PROVIDER`, `IMAGE_API_KEY` (never hardcode).

## Flow

```
hero-images.json
  → hero:queue → image-queue.json
  → hero:generate → review/{key}/candidate.jpg
  → hero:approve → assets/meals/{key}.jpg + registry
  → hero:validate → dashboard.md
```

Statuses: `queued` → `processing` → `completed` → `approved` | `rejected` (or `failed`).

## Reusable projects

| Project | How used |
| --- | --- |
| HANKKI | Hero meals production |
| Future apps | Copy `engine/` + adapt registry writer |

## Version History

| Version | Date | Notes |
| --- | --- | --- |
| 0.1.0 | 2026-07-14 | IMG-1 factory + IMG-2 engine prepared |
| 0.2.0 | 2026-07-14 | IMG-2A — provider connected; `hero:review` HTML; assets on generate (openai); registry on approve |

## Commands / entrypoints

```bash
cd apps/todays-menu
# .env: IMAGE_PROVIDER=openai|mock  IMAGE_API_KEY=...
npm run hero:queue
npm run hero:generate -- --limit=1 --id=011
npm run hero:review
npm run hero:approve -- --id=011 --decision=approve
npm run hero:validate
```

## Related docs

- [DEC-0002](../01_Decisions/DEC-0002-hankki-hero-image-production-pipeline.md)
- `scripts/image-factory/ARCHITECTURE.md`
- `scripts/image-factory/engine/README.md`
