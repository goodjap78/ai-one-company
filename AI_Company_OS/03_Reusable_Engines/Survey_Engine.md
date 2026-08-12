# Engine — Survey Engine

| Field | Value |
| --- | --- |
| **Version** | 0.1.0 |
| **Status** | Active (HANKKI lightweight) |
| **Primary path** | `apps/todays-menu/components/surveys/` |

## Purpose

Capture waitlist / coming-soon interest without building full product surfaces (e.g. dine-out).

## Architecture

- `ComingSoonSurveyModal` + `useComingSoonSurvey`
- Copy constants for survey prompts
- Local persistence patterns via app storage services

## Flow

```
coming-soon surface → survey modal → store response → thank-you
```

## Reusable projects

| Project | How used |
| --- | --- |
| HANKKI | Dine-out / delivery coming soon |
| Future apps | Demand validation before build |

## Version History

| Version | Date | Notes |
| --- | --- | --- |
| 0.1.0 | 2026 | In-app coming-soon surveys |
