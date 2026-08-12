# Decision — Establish AI Company Knowledge OS

| Field | Value |
| --- | --- |
| **Date** | 2026-07-14 |
| **Project** | Company |
| **Status** | Accepted |
| **Authors** | AI Company |

## Decision

Create top-level `AI_Company_OS/` as the official Knowledge OS for every current and future project.

## Why

- Important decisions, engines, and lessons were trapped in chat threads and scattered `docs/`
- New projects need a shared operating system, not only product Bibles
- Templates force consistent capture (Date / Why / Owner / Status)

## Expected impact

- Faster onboarding
- Less rediscovery of past architecture
- Clear parking lot for ideas that must not interrupt sprints

## Related files

- `AI_Company_OS/README.md`
- `AI_Company_OS/Knowledge_Index.md`
- `docs/` (legacy deep docs — link, do not abandon blindly)

## Alternatives considered

- Expand only `docs/` — rejected: mixed product depth with company OS; harder to browse by role
- Notion-only — rejected: knowledge must live next to code for engineers

## Follow-ups

- [ ] Migrate high-value ADRs into Decisions with cross-links
- [ ] After each sprint, file one Lesson or Best Practice
