# Naming Rules

## Recipes (HANKKI)

| Kind | Pattern | Example |
| --- | --- | --- |
| Production ID | zero-padded 3 digits | `001`, `050` |
| `heroImageKey` | `^[a-z][a-z0-9_]*$` | `kimchi_stew` |
| Hero file | `{heroImageKey}.jpg` | `kimchi_stew.jpg` |
| Step key | `{heroImageKey}_step_0N` | `jaeyuk_step_01` |

**Source of truth for filenames:** `heroImageKey` — do not invent parallel RF lists without a Decision.

## Documents (Knowledge OS)

| Kind | Pattern |
| --- | --- |
| Decision | `DEC-0001-kebab-title.md` |
| Lesson | `LESSON-0001-kebab-title.md` |
| Idea | `IDEA-0001-kebab-title.md` |
| Meeting | `YYYY-MM-DD-kebab-topic.md` |

## Code

- Components: `PascalCase.tsx`  
- Hooks: `useThing.ts`  
- Constants copy: `*Copy.ts`
