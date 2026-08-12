# Engine — Recipe Factory

| Field | Value |
| --- | --- |
| **Version** | 0.1.0 |
| **Status** | Active |
| **Primary path** | `apps/todays-menu/scripts/recipe-factory/` + `data/recipes/` |

## Purpose

Scale HANKKI recipes through master templates, batch inputs, validation, and pipeline scaffolding toward a large MAIN meal catalog.

## Architecture

- `createHankkiRecipe` / `createHankkiRecipeBatch` master template
- Live batches `01`–`05` → `HANKKI_RECIPES`
- Pipeline drafts `051`–`100` for tooling only (not Home until promoted)
- Validators: `validate:hankki-recipes`, `recipes:validate`, `recipes:pipeline`

## Flow

```
batch inputs → master template → HANKKI_RECIPES
pipeline specs → scaffold drafts → reports / manifests
```

## Reusable projects

| Project | How used |
| --- | --- |
| HANKKI | Production meal DB |
| Future content apps | Adapt template + validation pattern |

## Version History

| Version | Date | Notes |
| --- | --- | --- |
| 0.1.0 | 2026-07 | RF / R7 / R8 series in todays-menu |

## Commands / entrypoints

```bash
npm run validate:hankki-recipes
npm run recipes:validate
npm run recipes:pipeline
npm run recipes:decision
```

## Related docs

- [DEC-0003](../01_Decisions/DEC-0003-hankki-recipes-as-home-source-of-truth.md)
- [`docs/HANKKI_CONTENT_STANDARD.md`](../../docs/HANKKI_CONTENT_STANDARD.md)
