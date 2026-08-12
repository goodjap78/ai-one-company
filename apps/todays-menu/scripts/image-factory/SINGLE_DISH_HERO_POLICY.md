# HANKKI Single-Dish Hero Policy

> Policy for future hero generation. **Does not require regenerating existing recipe_001–0140 heroes.**

## Single-menu Hero (default)

Applies to: main dishes, soups, rice bowls, side dishes (banchan), jeon, and any hero where **one menu item** is the subject.

- **One visual subject** — the named dish only.
- **No meal spread** — no rice bowl, soup bowl, other banchan, utensils, drinks, napkins, or unrelated props unless the named dish itself contains them (e.g. minimal 고명 on the same plate).
- **Unified framing** — consistent food centroid, fill ratio, and camera angle across the catalog so home hero cards do not “jump” when recommendations change.
- **One plate / one bowl** — only the vessel that holds the named dish.

## Convenience-store combo (exception)

Applies to: 편의점 꿀조합 and similar **multi-item combo** heroes.

- Multiple components are allowed when they are the **actual combo items**.
- Still forbid unrelated foods, extra table setting, utensils, and decorative props not part of the combo.

## Side dish (banchan) — Style v2.1

See `sideDishHeroHints.ts` and Sprint 50-B scope (`recipe_0141`–`recipe_0160`).

- Isolated plated side dish on warm cream / light neutral background.
- **Tight framing:** plated food ~86–92% of frame; minimal empty background; close camera; full plate visible.
- Food centroid target: X 50%, Y 44–47%.

## Approval

- Review candidates live in `generated/image-factory/review/` until `hero:approve`.
- Never auto-approve production heroes.
- Backup production before overwrite (`hero:approve --force` / `hero:rollback`).

## CROP_SAFE_FOOD_RULE (v1 — 2026-08-12)

Future food hero generation must survive **Home Hero**, **Recipe Detail Hero**, **recommendation card**, and **thumbnail** crops from a **single asset**.

- Primary food subject must stay near image center (target centroid X 50%, Y 44–48%).
- Important food mass must fit inside a **center 60–70% safe-zone** — not touching top/bottom/left/right edges.
- Avoid placing the primary dish near frame edges; minimize plate/bowl clipping on landscape hero crop.
- Generated assets must survive both landscape hero crop and card/thumbnail crop without losing the dish identity.
- Plated dishes should prefer **centered composition**.
- For suitable dishes (omelette, jeon, pasta on plate, etc.), prefer **top-down or 70–90° high-angle** so the full plate reads clearly.
- Prioritize **food visibility** over empty background — but keep margins inside the safe-zone.
- Do **not** force top-down on every menu; keep natural angles when they remain crop-safe.
- No rice/kimchi/side spreads unless the named dish is a combo exception.

Reference replacement: `omelette.jpg` (recipe `059`) — crop-safe centered top-down omelette on cream wood.
