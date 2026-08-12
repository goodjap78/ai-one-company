# Sprint 62-D — Personalization v1 Production Lock

**Status:** PRODUCTION LOCKED ✅ (Sprint 62-D QA PASS — 2026-08-10)

## Locked scope (Sprint 62-C)

- `buildLightPersonalizationProfile()` — favorites + viewed history
- `scoreLightPersonalization()` — max **+8pt** similarity bonus
- Favorite / viewed **separate buckets**; viewed × **0.55** vs favorite
- **No direct bonus** for favorite or viewed recipe ids
- **Removed** legacy direct favorite **+15pt** boost
- Cold start: `isEmpty` → bonus **0**

## Priority order (do not invert)

1. Meal-time fit (metadata up to +35)
2. Base recommendation quality / penalties (`sameRecipePenalty -40`, etc.)
3. Cross-slot diversity / `sessionShownIds`
4. Light personalization (+8 max)

## Change policy

Personalization v1 changes require a **new sprint** — not drive-by edits.

## QA command

```bash
npm run test:personalization-production-qa
npm run test:recommendation-personalization
```

## Related sprints

- 62-B: Viewed recipe history
- 62-C: Light personalization implementation
- 62-D: Production QA & lock
