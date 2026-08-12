# Lesson — PNG Bytes Named `.jpg`

| Field | Value |
| --- | --- |
| **Date** | 2026-07-14 |
| **Project** | HANKKI |
| **Severity** | Medium |

## Problem

Batch 01 “hero JPGs” are PNG magic bytes with a `.jpg` extension (~24 MB). Validators flagged format mismatch.

## Cause

Placeholders / exports saved without true JPEG encoding; extension chosen for convention only.

## Solution

IMG-2 validation warns on format mismatch. New generation must write real JPEG. Plan a re-encode optimize pass for Batch 01.

## Future prevention

- Validate magic headers in `hero:validate`  
- Rejection of mock/tiny files in approval  
- Asset Rules require real JPEG bytes
