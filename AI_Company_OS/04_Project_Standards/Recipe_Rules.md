# Recipe Rules

## Source of truth

Home catalog = **`HANKKI_RECIPES`** (see DEC-0003).

## Required fields (production)

- `id`, `name`, `category`, `mealType`, `time`, `difficulty`, `serving`  
- `ingredients` with `group` + `iconKey`  
- `heroImageKey`, `image` path  
- `tags`, `situation`, `aiTags`  
- `recommendationMessages` (≥4)  
- Decision layer: `decisionTags`, 3× `recommendationReasons`, `searchTags`, `recommendationPriority`  
- Steps with `title`, `instruction`, `imageKey`, `tip`  

## Principles (product)

- MAIN meal first — never side-as-hero  
- Help decide in ~10 seconds  
- Details live in [`docs/HANKKI_CONTENT_STANDARD.md`](../../docs/HANKKI_CONTENT_STANDARD.md) & Bible
