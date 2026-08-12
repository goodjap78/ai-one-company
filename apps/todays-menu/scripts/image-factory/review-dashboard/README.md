# HANKKI Image Review Dashboard (REVIEW-1)

Internal admin tool only. **Not** part of the consumer Expo app.

## Launch

```bash
cd apps/todays-menu
npm run hero:dashboard
```

Open: [http://127.0.0.1:4710](http://127.0.0.1:4710)

Optional port:

```bash
set HANKKI_REVIEW_DASHBOARD_PORT=4711
npm run hero:dashboard
```

## Capabilities

- Cards for every recipe with a hero in the review folder (ID, name, preview, date, prompt version, resolution, est. cost)
- **Approve** → copy selected history version → `assets/meals/` → registry refresh → mark Approved
- **Regenerate** → one new hero via official prompt → `review/history/{id}-v{n}.jpg` (never deletes prior versions)
- **Reject** → mark Rejected, keep history, hide from default approval queue
- **Comparison mode** → pick Version A / B side-by-side, approve one
- **Quality score** → ★1–5 and/or 0–100 points

## Data

| Path | Purpose |
|------|---------|
| `generated/image-factory/review/*.jpg` | Current flat candidates |
| `generated/image-factory/review/history/{id}-v{n}.jpg` | Version history (never auto-deleted) |
| `generated/image-factory/review/dashboard-state.json` | Scores, status, selected version |

Does not modify consumer UI, navigation, or recipe catalog.
