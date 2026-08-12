# HANKKI Production Report

Generated: 2026-07-28T04:06:29.794Z

## Sprint AUTO-1

Production automation engine prepared. No real AI images were generated.

## Modules last run

- **recipe:** 2026-07-14T05:41:09.386Z count=100 ok=true
- **hero:** 2026-07-14T05:41:11.593Z prompts=100 queued=89
- **ingredients:** 2026-07-14T05:41:13.729Z total=54 missing=54
- **steps:** 2026-07-14T05:41:15.929Z total=402 missing=402
- **registry:** 2026-07-28T04:06:29.792Z meals=100
- **validate:** 2026-07-28T04:06:29.792Z ok=true

## Architecture

```
Recipe Name
  → Recipe Generator (catalog validate)
  → Hero Prompt Generator
  → Hero Queue Generator
  → Ingredient Queue Generator
  → Step Queue Generator
  → Registry Updater (disk → static require)
  → Validation Engine
  → Ready
```

## Stats

```json
{
  "recipes": 100,
  "heroPresent": 100,
  "heroMissing": 0,
  "ingredientPresent": 59,
  "ingredientMissing": 0,
  "stepPresent": 0,
  "stepMissing": 402,
  "readyRecipes": 0,
  "progressPercent": 28.3
}
```

## Validation

- **ok:** true
- **recipeIssues:** 0

### Duplicate IDs

- (none)

### Duplicate names

- (none)

### Duplicate hero keys

- (none)

### Missing hero images (sample)

- (none)

### Missing ingredient icons (sample)

- (none)

### Missing step images (sample)

- avocado_toast_step_01
- avocado_toast_step_02
- avocado_toast_step_03
- avocado_toast_step_04
- bacon_fried_rice_step_01
- bacon_fried_rice_step_02
- bacon_fried_rice_step_03
- bacon_fried_rice_step_04
- beef_bulgogi_don_step_01
- beef_bulgogi_don_step_02
- beef_bulgogi_don_step_03
- beef_bulgogi_don_step_04
- bibim_guksu_step_01
- bibim_guksu_step_02
- bibim_guksu_step_03
- bibim_guksu_step_04
- bibim_naengmyeon_step_01
- bibim_naengmyeon_step_02
- bibim_naengmyeon_step_03
- bibim_naengmyeon_step_04
- bibimbap_step_01
- bibimbap_step_02
- bibimbap_step_03
- bibimbap_step_04
- bibimbap_step_05
- bossam_step_01
- bossam_step_02
- bossam_step_03
- bossam_step_04
- brown_rice_bibimbap_step_01
- brown_rice_bibimbap_step_02
- brown_rice_bibimbap_step_03
- brown_rice_bibimbap_step_04
- budae_jjigae_step_01
- budae_jjigae_step_02
- budae_jjigae_step_03
- budae_jjigae_step_04
- bugeo_guk_step_01
- bugeo_guk_step_02
- bugeo_guk_step_03
- …and 362 more

### Broken registry keys

- (none)

### Broken / soft references (sample)

- (none)

### Issue list (sample)

- (none)

## Production readiness

- **Structural pipeline:** READY (catalog + registries consistent).
- **Asset completeness:** 28.3% (0/100 fully ready).
- **AI image generation:** NOT part of AUTO-1 — use Image Factory providers separately.
