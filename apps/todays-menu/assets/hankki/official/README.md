# Official HANKKI mascot

## Slot (ready)

Place the **owner-confirmed final** HANKKI character here as:

`mascot.png`

## Until the final file arrives

- `HAS_OFFICIAL_HANKKI_MASCOT` stays `false` in `constants/hankkiMascot.ts`
- Home header hides the mascot (title only) — no empty wrong character
- Do **not** copy `happy.png`, meal photos, or random PNGs into `mascot.png`

## After the owner provides the final PNG

1. Save as `assets/hankki/official/mascot.png`
2. Set `HAS_OFFICIAL_HANKKI_MASCOT = true`
3. Wire `HANKKI_CHARACTER_IMAGE = require('../assets/hankki/official/mascot.png')`

Home uses this file **only** left of `오늘 뭐 먹지?` — never inside the food hero.
