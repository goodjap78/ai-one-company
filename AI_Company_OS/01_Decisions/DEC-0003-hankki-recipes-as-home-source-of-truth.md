# Decision — HANKKI_RECIPES Is Home Catalog Source of Truth

| Field | Value |
| --- | --- |
| **Date** | 2026-07-14 |
| **Project** | HANKKI |
| **Status** | Accepted |
| **Authors** | AI Company |

## Decision

Home recommendation catalog must use **`HANKKI_RECIPES`** (IDs `001`–`050`, batches 01–05). `core_*`, `gold_*` library, and master JSON remain secondary / legacy until explicitly cut over.

## Why

- Cleanup analysis found four overlapping catalogs
- Home already wires `goldMealCatalog` ← `HANKKI_RECIPES`
- Parallel sources create ID / image / search confusion

## Expected impact

- Clear ownership for new meal content
- Safer cleanup / archive of legacy MD and eventual catalog consolidation

## Related files

- `apps/todays-menu/data/recipes/hankkiRecipes.ts`
- `apps/todays-menu/services/recommendation/goldMealCatalog.ts`
- `AI_Company_OS/06_Lessons_Learned/LESSON-0001-multiple-recipe-catalogs.md`
- `apps/todays-menu/generated/project-cleanup-report.md`

## Alternatives considered

- Keep gold MD / core as co-equal catalogs — rejected for Home path

## Follow-ups

- [ ] Migrate search / detail fallbacks off `core_*` / master JSON
- [ ] Archive `content/gold-meals/` authoring MD after cutover notes
