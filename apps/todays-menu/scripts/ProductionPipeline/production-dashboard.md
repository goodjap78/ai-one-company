# HANKKI Production Dashboard

Generated: 2026-07-28T04:06:29.793Z

Sprint: **AUTO-1** — Production Pipeline (prepare only, no AI image generation)

## Progress

| Metric | Count |
| --- | ---: |
| Recipes | 100 |
| Hero images present | 100 |
| Hero images missing | 0 |
| Ingredient icons present | 59 |
| Ingredient icons missing | 0 |
| Step images present | 0 |
| Step images missing | 402 |
| Ready recipes (all assets) | 0 |
| Overall progress | 28.3% |

## Status

| Check | Result |
| --- | --- |
| Structural validation | PASS |
| Recipe schema issues | 0 |
| Duplicate IDs | 0 |
| Duplicate names | 0 |
| Duplicate hero keys | 0 |
| Broken registry keys | 0 |
| Broken / soft references | 0 |

## Ready vs Missing

- **Ready recipes:** 0 / 100
- **Missing heroes:** 0
- **Missing ingredient icons:** 0
- **Missing step images:** 402

## Commands

```bash
npm run pipeline:recipe
npm run pipeline:hero
npm run pipeline:ingredients
npm run pipeline:steps
npm run pipeline:validate
```

## Notes

- This dashboard does **not** generate real AI images.
- Use Image Factory (`hero:generate`) only after queue + provider setup.
- Missing asset counts are expected until asset production completes.
