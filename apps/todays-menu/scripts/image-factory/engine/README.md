# Image Production Engine (reusable)

Sprint IMG-2 core. **No app UI / Expo imports.**

## Providers

| IMAGE_PROVIDER | Behavior |
| --- | --- |
| *(unset)* | Disabled — prepares queue only |
| `mock` | Tiny JPEG placeholder (pipeline tests) |
| `openai` | DALL·E 3 via `IMAGE_API_KEY` |

Never commit API keys. Read from `.env`.

## Portability

Copy this `engine/` folder into another project, or later extract to `packages/image-engine`.
Inject project paths at the CLI layer (queue, review, assets).
