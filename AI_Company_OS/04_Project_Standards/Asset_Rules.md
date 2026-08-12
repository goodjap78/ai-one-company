# Asset Rules

## Heroes

1. Production path: `assets/meals/{heroImageKey}.jpg`  
2. Must be real JPEG bytes (not PNG renamed — see LESSON-0002)  
3. Prefer ~16:9 for new generations (IMG-2 default 1280×720)  
4. Never overwrite without `--force`  
5. Never ship to production without **approval** (IMG-2 review queue)  
6. Register via static `require()` in `mealImageAssets.ts` + type union  

## Mascots

- Live Seed keys: `seed_*.png` only  
- Do not leave unprefixed duplicate placeholders in `assets/seed/`

## Ingredients / steps

- Placeholders OK with README until factory fills them  
- Empty registries prefer explicit comments over fake requires  

## Generated

- All under `generated/` is disposable and gitignored
