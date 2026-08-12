# Prompt Pack — Food Hero Photography

**Version:** 1.1 · **Status:** Official HANKKI Hero Image Style v1.1  
**Sprint:** IMG-3.6 · **Used by:** Gemini Hero Image Factory (`buildHeroPrompt.ts`)

This is the shared official style for **every future HANKKI hero image**.  
Runtime source of truth: `apps/todays-menu/scripts/image-factory/engine/buildHeroPrompt.ts` (`HANKKI_HERO_STYLE_VERSION = v1.1`).

---

## Composition

- Main dish occupies **88–92%** of the frame.
- Tight mobile-app crop.
- Main dish is the only visual focus.
- Very little or no empty table space.
- Maximum one very small side dish.
- Camera close to the food.
- Dish centered and fully visible.
- Designed for a small mobile hero card.
- Horizontal 16:9.

## Lighting (official standard)

- Bright soft natural daylight.
- Bright and airy exposure.
- High-key food photography.
- Warm and clean lighting.
- Lift shadows slightly.
- Food should look fresh and vibrant.
- Optimized for mobile screens.
- Avoid dark restaurant mood.
- Avoid underexposure.
- Preserve realistic colors.
- Avoid washed-out whites.

## Food styling

- Restaurant-quality Korean food.
- Ultra realistic food photography.
- Steam naturally visible.
- Light wooden table.
- Maximum **one** very small side dish.
- One bowl of rice allowed.

## Never include

- People
- Hands
- Chopsticks
- Text
- Logo
- Watermark
- Decorative clutter
- Glossy 3D / obvious AI look

---

## Template

```
Ultra realistic close-up food photograph of {DishName} ({heroImageKey}).
Finished dish fills most of the frame — restaurant-quality Korean food, main dish as the clear visual focus.
HANKKI Official Hero Style v1.1. Shot requirements: {HERO_SHOT_REQUIREMENTS}.
Food must look real, fresh, and edible — not glossy 3D or synthetic AI art.
```

## Runtime locations (HANKKI)

| Role | Path |
| --- | --- |
| Shared prompt builder | `apps/todays-menu/scripts/image-factory/engine/buildHeroPrompt.ts` |
| Per-recipe prompt files | `apps/todays-menu/generated/image-factory/prompts/` |
| This pack | `AI_Company_OS/10_Assets/Prompt_Libraries/Food_Hero_Photography.md` |
