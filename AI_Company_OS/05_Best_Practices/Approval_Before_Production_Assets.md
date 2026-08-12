# Best Practice — Approval Before Production Assets

## Workflow

```
generate → review/candidate → human approve → assets/ + registry
```

## Why it works

- Prevents accidental shipping of mock / wrong / unsafe images  
- Keeps `--force` rare and intentional  

## Example

IMG-2 `hero:approve` promotes only after review; generate never writes production directly.
