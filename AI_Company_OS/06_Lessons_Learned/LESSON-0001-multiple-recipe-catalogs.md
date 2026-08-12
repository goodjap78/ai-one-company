# Lesson — Multiple Overlapping Recipe Catalogs

| Field | Value |
| --- | --- |
| **Date** | 2026-07-14 |
| **Project** | HANKKI |
| **Severity** | High |

## Problem

Four parallel meal systems coexisted: `HANKKI_RECIPES`, `CORE_RECIPES`, gold library, master JSON — plus markdown mirrors.

## Cause

Organic growth across sprints without a permanent “source of truth” Decision for Home.

## Solution

Declare `HANKKI_RECIPES` as Home SoT (DEC-0003). Keep others as secondary until cutover. Capture cleanup classification report.

## Future prevention

- No new catalog without a Decision  
- Factory / Home docs always name the SoT explicitly  
- Knowledge OS Decisions for catalog ownership
