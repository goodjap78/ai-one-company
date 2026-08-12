# Engine — Notification Engine

| Field | Value |
| --- | --- |
| **Version** | 0.0.1 |
| **Status** | Draft |
| **Primary path** | Partial — meal reminder settings in HANKKI My page |

## Purpose

Remind users at meal-decision moments without becoming spam.

## Architecture

Settings/copy exist (`MealReminderSettings`, reminder copy constants). Full push pipeline not extracted yet.

## Flow

```
preference → schedule → notify → open Home decision loop
```

## Reusable projects

| Project | Potential |
| --- | --- |
| HANKKI | Meal reminders |
| ShoppingBag | Deal / restock alerts |

## Version History

| Version | Date | Notes |
| --- | --- | --- |
| 0.0.1 | 2026-07-14 | Stub — extract after push provider chosen |
