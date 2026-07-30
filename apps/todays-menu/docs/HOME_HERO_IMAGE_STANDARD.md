# Home Hero Image Display Standard

**Scope:** Home recommendation card hero only (`TodayMealCard` → `HomeHeroFocalImage`).  
Recipe detail, favorites, and cooking screens use `MealImageView` unchanged.

**Runtime constants:** `apps/todays-menu/constants/homeHeroDisplay.ts`  
**Focal overrides:** `apps/todays-menu/data/recipes/homeHeroFocalOverrides.ts`  
**Audit script:** `npm run audit:home-hero`

---

## Container (fixed)

| Token | Value |
| --- | ---: |
| Aspect ratio | **1.6** (width ÷ height) |
| Min height | 188 px |
| Max height | 220 px |
| Border radius | `ds.radius.image` |
| Resize mode | `cover` with focal anchor |

Bottom ~22% is reserved for Seed mascot + cream tip card.  
Top ~18% is reserved for badge + menu title overlay.

---

## Source asset spec (generation)

Align with `AI_Company_OS/10_Assets/Prompt_Libraries/Food_Hero_Photography.md` v1.1:

| Rule | Target |
| --- | --- |
| Pixel size | **1344 × 768** (16:9) |
| Aspect ratio | 1.75–1.8 (16:9) |
| Food frame fill | **88–92%** of frame |
| Food visual center | **42–48%** from top of image |
| Top safe margin | ≥ 8% clear (title overlay) |
| Bottom safe margin | ≥ 12% clear (mascot / tip) |
| Plate bottom | Must not touch image bottom edge |
| Camera | Same close-up angle, consistent scale |
| Forbidden in image | Text, logo, people, hands, chopsticks |

---

## On-screen focal system

Default focal point: `{ x: 0.5, y: 0.46 }`  
Focal scale: **1.28** (extra crop room for repositioning)

Only recipes flagged `UI_ADJUST` in the audit get per-id overrides.  
Do not hand-tune all 100 menus.

### Grades (audit output)

| Grade | Meaning |
| --- | --- |
| **PASS** | Default focal is enough |
| **UI_ADJUST** | Add `homeHeroFocalOverrides` entry |
| **REGENERATE** | Re-shoot in Image Factory (tiny food, wrong aspect, missing file) |

Re-run audit after asset or override changes:

```bash
npm run audit:home-hero
```

Report: `generated/home-hero-audit/audit-report.json`
