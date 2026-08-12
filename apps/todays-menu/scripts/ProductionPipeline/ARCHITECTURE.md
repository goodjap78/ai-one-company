# HANKKI Production Pipeline (AUTO-1)

Developer automation only. **Does not** redesign UI, Home, Recipe Detail, or the recommendation engine. **Does not** generate real AI images.

## Goal

Adding one recipe should mean: validate catalog → prepare hero prompts/queues → prepare ingredient/step queues → sync registries for files that already exist → validate → ready.

```
Recipe Name
  → Generate Recipe (catalog validate)
  → Generate Hero Prompt
  → Generate Hero Image Queue
  → Generate Ingredient List / Queue
  → Generate Step Image Queue
  → Register Assets (on-disk only)
  → Validation
  → Ready
```

## Modules (`scripts/ProductionPipeline/`)

| Module | Role |
| --- | --- |
| `modules/recipeGenerator.ts` | Validate / count `HANKKI_RECIPES` |
| `modules/heroPromptGenerator.ts` | Write hero prompts + IMG-1 manifest |
| `modules/heroQueueGenerator.ts` | Build `image-queue.json` + review HTML |
| `modules/ingredientQueueGenerator.ts` | Unique ingredient icon queue |
| `modules/stepQueueGenerator.ts` | All step image queue |
| `modules/registryUpdater.ts` | Sync static `require()` registries for disk files |
| `modules/validationEngine.ts` | Duplicates, missing assets, broken refs |
| `modules/dashboard.ts` | `production-dashboard.md` + `production-report.md` |

## Commands

```bash
npm run pipeline:recipe
npm run pipeline:hero
npm run pipeline:ingredients
npm run pipeline:steps
npm run pipeline:validate
```

## Outputs

Under `generated/production-pipeline/` (gitignored):

- `production-dashboard.md`
- `production-report.md`
- `ingredient-queue.json`
- `step-queue.json`
- `pipeline-state.json`

Hero artifacts remain under `generated/image-factory/` (existing Image Factory paths).

## Reuses

- Recipes: `data/recipes/hankkiRecipes.ts`, `validateHankkiProduction.ts`
- Heroes: `scripts/image-factory/*`
- Ingredients/steps: `scripts/recipe-assets/*`
- Registries: `services/images/*ImageAssets.ts`

## Production readiness

| Layer | Status |
| --- | --- |
| Pipeline orchestration | Ready (AUTO-1) |
| Catalog / schema validation | Via `pipeline:recipe` / `pipeline:validate` |
| Hero AI generation | Not in AUTO-1 — use `hero:generate` + provider separately |
| Asset completeness | Progress reported; many assets may still be missing |
