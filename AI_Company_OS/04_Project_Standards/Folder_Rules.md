# Folder Rules

## Monorepo (company)

| Path | Role |
| --- | --- |
| `apps/` | Shipable products (e.g. `todays-menu` = HANKKI) |
| `packages/` | Shared libraries (reserved) |
| `docs/` | Deep product / engineering docs |
| `AI_Company_OS/` | Knowledge OS (this system) |
| `scripts/` (repo) | Cross-cutting automation if any |

## HANKKI app (`apps/todays-menu`)

| Path | Role |
| --- | --- |
| `app/` | Expo Router screens only |
| `components/` | UI by feature |
| `data/recipes/` | Production + pipeline recipe DB |
| `services/` | Business logic |
| `scripts/` | Dev factories / engines |
| `generated/` | Gitignored outputs — regenerable |
| `assets/` | Bundled binaries |

## Rule

New long-lived knowledge → `AI_Company_OS/`.  
New deep HANKKI product specs may still land in `docs/` with an Index link.
