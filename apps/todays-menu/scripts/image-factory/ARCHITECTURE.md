# Image Production Engine — Architecture (IMG-2 / IMG-2A)

```
hero-images.json
  → hero:queue → image-queue.json
  → hero:generate (OpenAI | Mock)
       → review/{key}/candidate.jpg
       → assets/meals/{key}.jpg   (openai; never overwrite unless --force)
       → review/index.html
  → hero:review → refresh index.html
  → hero:approve → promote + mealImageAssets.ts (alphabetical require)
  → hero:validate
```

## Providers (`.env`)

| IMAGE_PROVIDER | Behavior |
| --- | --- |
| `mock` | Placeholder image → review only (use `--write-assets` to also write meals/) |
| `openai` | DALL·E 3 via `IMAGE_API_KEY` → review + assets |
| *(unset)* | Disabled dry-run |

Never commit API keys.

## Publish rule

Files may land under `assets/meals/` during generate, but the app registry
(`mealImageAssets.ts`) updates **only on approve** — images are not published
to the running app until then.
