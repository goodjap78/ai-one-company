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
