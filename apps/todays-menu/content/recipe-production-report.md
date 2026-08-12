# HANKKI Recipe Production Report

> Sprint RF-6 · generated 2026-07-14T05:32:02.662Z

## Summary

| Metric | Value |
| --- | ---: |
| Current Recipe Count | **100** |
| Target | 100 |
| Validation | **PASS** |
| Issues | 0 |
| Hero JPGs on disk | 10 |
| Missing Hero Images | 90 |
| Missing Ingredient Images | 54 |
| Missing Step Images | 402 |
| Registered meal asset keys | 24 |
| Ready for Image Factory | **YES** |

## Validation Result

All production checks passed (ids, names, heroImageKeys, fields, steps, decision metadata).

Duplicate checks: ids, names, heroImageKeys — **none**.

## Missing Hero Images

Dish-specific JPG missing under `assets/meals/` (**90**).
Batch 01 (10) present; 011–100 use category fallbacks in `recipeImageMap` until Image Factory.

Regenerate full list anytime:

```bash
npm run recipes:production-report
```

## Missing Ingredient Images

Unique iconKeys without `assets/ingredients/{key}.png`: **54**

## Missing Step Images

Unique step imageKeys without `assets/recipe-steps/{key}.jpg`: **402**

## Batches

| Batch | IDs | Status |
| --- | --- | --- |
| 01 | 001–010 | Live + heroes on disk |
| 02–05 | 011–050 | Live + category fallbacks |
| 06–10 | 051–100 | **RF-6 promoted to production** + cuisine fallbacks |

## Ready for Image Factory

**YES** — catalog fields are production-valid.

Next: `npm run image-factory:prepare` then `hero:queue` for keys 011–100.
Do not bulk-approve mock images into registry.
