# Lesson — Asset Key Naming Drift (RF-2A vs heroImageKey)

| Field | Value |
| --- | --- |
| **Date** | 2026-07-14 |
| **Project** | HANKKI |
| **Severity** | Medium |

## Problem

Batch 02 “required filenames” (e.g. `soondubu_stew.jpg`) diverged from recipe `heroImageKey` (`sundubu_jjigae`).

## Cause

Asset sprint list authored independently of recipe data with a “do not change recipe” comment — creating two truths.

## Solution

Image Factory / IMG-2 use **`heroImageKey` as the only filename stem**. Treat RF-2A list as obsolete debt.

## Future prevention

- Naming Rules: one key  
- Any rename requires Decision + dual-write period  
- Queue built from recipe data, not parallel spreadsheets
