# Coding Rules

## Purpose

Consistent engineering across AI Company apps.

## Rules

1. Prefer clarity over cleverness  
2. Do not redesign UI unless the sprint says so  
3. Developer automation lives under `scripts/` — not in app screens  
4. Never hardcode secrets — use `.env` (see `.env.example`)  
5. React Native: use static `require()` for images — never dynamic paths  
6. Match existing file style; no drive-by refactors  
7. TypeScript strictness: no `any` without justification  

## Related

- [`docs/engineering/12_Development_Rules.md`](../../docs/engineering/12_Development_Rules.md)
