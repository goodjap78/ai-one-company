# Ingredient Image Asset Checklist (Sprint R5-1)

Scan source: `apps/todays-menu/data/recipes/hankkiRecipes.ts` (10 HANKKI recipes)  
Asset folder: `apps/todays-menu/assets/ingredients/`  
Naming: lowercase English, underscore only, PNG, transparent background preferred  
Status values: `exists` | `missing` | `filename mismatch`

> Scan date: 2026-07-13  
> On-disk PNGs: **none** (folder contains `README.md` only)  
> Do not generate placeholders. Do not rename files automatically.

## Summary

| Metric | Count |
| --- | ---: |
| Total unique `iconKey` | 38 |
| Existing images | 0 |
| Missing images | 38 |
| Filename mismatch | 0 |

## File naming rule

```
{iconKey}.png
```

Examples: `pork.png`, `green_onion.png`, `soy_sauce.png`, `sesame_oil.png`, `curry_powder.png`

---

## meat

| iconKey | 이름 | 파일명 | 상태 | 사용 레시피 |
| --- | --- | --- | --- | --- |
| pork | 돼지고기 | pork.png | missing | 제육볶음, 김치찌개, 카레라이스, 돈까스 |
| beef | 소고기 | beef.png | missing | 비빔밥, 불고기 |
| chicken | 닭고기 | chicken.png | missing | 닭갈비 |

> Note: `pork` is also used for `돼지 등심` (돈까스). One icon covers both.

## vegetables

| iconKey | 이름 | 파일명 | 상태 | 사용 레시피 |
| --- | --- | --- | --- | --- |
| onion | 양파 | onion.png | missing | 제육볶음, 계란볶음밥, 김치찌개, 된장찌개, 불고기, 카레라이스, 닭갈비 |
| green_onion | 대파 | green_onion.png | missing | 제육볶음, 계란볶음밥, 김치찌개, 된장찌개, 불고기, 김치볶음밥, 닭갈비 |
| carrot | 당근 | carrot.png | missing | 제육볶음, 계란볶음밥, 비빔밥, 불고기, 카레라이스 |
| zucchini | 애호박 | zucchini.png | missing | 김치찌개, 된장찌개, 비빔밥 |
| green_chili | 청양고추 | green_chili.png | missing | 김치찌개, 된장찌개 |
| mushroom | 버섯 | mushroom.png | missing | 김치찌개, 된장찌개, 비빔밥, 불고기 |
| potato | 감자 | potato.png | missing | 된장찌개, 카레라이스 |
| spinach | 시금치 | spinach.png | missing | 비빔밥 |
| bean_sprout | 콩나물 | bean_sprout.png | missing | 비빔밥 |
| cabbage | 양배추 | cabbage.png | missing | 돈까스, 닭갈비 |
| sweet_potato | 고구마 | sweet_potato.png | missing | 닭갈비 |
| perilla | 깻잎 | perilla.png | missing | 닭갈비 |
| seaweed | 김가루 | seaweed.png | missing | 김치볶음밥 |

## grains

| iconKey | 이름 | 파일명 | 상태 | 사용 레시피 |
| --- | --- | --- | --- | --- |
| rice | 밥 | rice.png | missing | 계란볶음밥, 비빔밥, 김치볶음밥, 카레라이스 |
| rice_cake | 떡 | rice_cake.png | missing | 닭갈비 |
| flour | 밀가루 | flour.png | missing | 돈까스 |
| bread_crumbs | 빵가루 | bread_crumbs.png | missing | 돈까스 |

## dairy

| iconKey | 이름 | 파일명 | 상태 | 사용 레시피 |
| --- | --- | --- | --- | --- |
| — | — | — | — | *(none in current 10 recipes)* |

## sauces

| iconKey | 이름 | 파일명 | 상태 | 사용 레시피 |
| --- | --- | --- | --- | --- |
| soy_sauce | 간장 | soy_sauce.png | missing | 제육볶음, 계란볶음밥, 김치찌개, 된장찌개, 비빔밥, 불고기, 김치볶음밥, 닭갈비 |
| gochujang | 고추장 | gochujang.png | missing | 제육볶음, 비빔밥, 김치볶음밥, 닭갈비 |
| doenjang | 된장 | doenjang.png | missing | 김치찌개, 된장찌개 |
| sesame_oil | 참기름 | sesame_oil.png | missing | 제육볶음, 계란볶음밥, 김치찌개, 비빔밥, 불고기, 김치볶음밥, 닭갈비 |
| tonkatsu_sauce | 돈까스소스 | tonkatsu_sauce.png | missing | 돈까스 |

> Note: `soy_sauce` is also used for `국간장` (김치찌개, 된장찌개). One icon covers both.

## seasonings

| iconKey | 이름 | 파일명 | 상태 | 사용 레시피 |
| --- | --- | --- | --- | --- |
| gochugaru | 고춧가루 | gochugaru.png | missing | 제육볶음, 김치찌개, 된장찌개, 닭갈비 |
| garlic | 다진마늘 | garlic.png | missing | 제육볶음, 김치찌개, 된장찌개, 비빔밥, 불고기, 닭갈비 |
| sugar | 설탕 | sugar.png | missing | 제육볶음, 비빔밥, 불고기, 김치볶음밥, 닭갈비 |
| salt | 소금 | salt.png | missing | 계란볶음밥, 카레라이스, 돈까스 |
| pepper | 후추 | pepper.png | missing | 불고기, 돈까스 |
| curry_powder | 카레가루 | curry_powder.png | missing | 카레라이스 |
| cooking_oil | 식용유 | cooking_oil.png | missing | 계란볶음밥, 김치볶음밥, 카레라이스, 돈까스 |

## processed food

| iconKey | 이름 | 파일명 | 상태 | 사용 레시피 |
| --- | --- | --- | --- | --- |
| ham | 햄 | ham.png | missing | 계란볶음밥, 김치볶음밥 |
| kimchi | 김치 | kimchi.png | missing | 김치찌개, 김치볶음밥 |
| tofu | 두부 | tofu.png | missing | 김치찌개, 된장찌개 |

## others

| iconKey | 이름 | 파일명 | 상태 | 사용 레시피 |
| --- | --- | --- | --- | --- |
| egg | 계란 | egg.png | missing | 계란볶음밥, 비빔밥, 김치볶음밥, 돈까스 |
| pear | 배즙 | pear.png | missing | 불고기 |
| water | 물 | water.png | missing | 카레라이스 |

---

## Full flat list (A–Z)

| iconKey | 이름 | 파일명 | 상태 | 사용 레시피 |
| --- | --- | --- | --- | --- |
| bean_sprout | 콩나물 | bean_sprout.png | missing | 비빔밥 |
| beef | 소고기 | beef.png | missing | 비빔밥, 불고기 |
| bread_crumbs | 빵가루 | bread_crumbs.png | missing | 돈까스 |
| cabbage | 양배추 | cabbage.png | missing | 돈까스, 닭갈비 |
| carrot | 당근 | carrot.png | missing | 제육볶음, 계란볶음밥, 비빔밥, 불고기, 카레라이스 |
| chicken | 닭고기 | chicken.png | missing | 닭갈비 |
| cooking_oil | 식용유 | cooking_oil.png | missing | 계란볶음밥, 김치볶음밥, 카레라이스, 돈까스 |
| curry_powder | 카레가루 | curry_powder.png | missing | 카레라이스 |
| doenjang | 된장 | doenjang.png | missing | 김치찌개, 된장찌개 |
| egg | 계란 | egg.png | missing | 계란볶음밥, 비빔밥, 김치볶음밥, 돈까스 |
| flour | 밀가루 | flour.png | missing | 돈까스 |
| garlic | 다진마늘 | garlic.png | missing | 제육볶음, 김치찌개, 된장찌개, 비빔밥, 불고기, 닭갈비 |
| gochugaru | 고춧가루 | gochugaru.png | missing | 제육볶음, 김치찌개, 된장찌개, 닭갈비 |
| gochujang | 고추장 | gochujang.png | missing | 제육볶음, 비빔밥, 김치볶음밥, 닭갈비 |
| green_chili | 청양고추 | green_chili.png | missing | 김치찌개, 된장찌개 |
| green_onion | 대파 | green_onion.png | missing | 제육볶음, 계란볶음밥, 김치찌개, 된장찌개, 불고기, 김치볶음밥, 닭갈비 |
| ham | 햄 | ham.png | missing | 계란볶음밥, 김치볶음밥 |
| kimchi | 김치 | kimchi.png | missing | 김치찌개, 김치볶음밥 |
| mushroom | 버섯 | mushroom.png | missing | 김치찌개, 된장찌개, 비빔밥, 불고기 |
| onion | 양파 | onion.png | missing | 제육볶음, 계란볶음밥, 김치찌개, 된장찌개, 불고기, 카레라이스, 닭갈비 |
| pear | 배즙 | pear.png | missing | 불고기 |
| pepper | 후추 | pepper.png | missing | 불고기, 돈까스 |
| perilla | 깻잎 | perilla.png | missing | 닭갈비 |
| pork | 돼지고기 | pork.png | missing | 제육볶음, 김치찌개, 카레라이스, 돈까스 |
| potato | 감자 | potato.png | missing | 된장찌개, 카레라이스 |
| rice | 밥 | rice.png | missing | 계란볶음밥, 비빔밥, 김치볶음밥, 카레라이스 |
| rice_cake | 떡 | rice_cake.png | missing | 닭갈비 |
| salt | 소금 | salt.png | missing | 계란볶음밥, 카레라이스, 돈까스 |
| seaweed | 김가루 | seaweed.png | missing | 김치볶음밥 |
| sesame_oil | 참기름 | sesame_oil.png | missing | 제육볶음, 계란볶음밥, 김치찌개, 비빔밥, 불고기, 김치볶음밥, 닭갈비 |
| soy_sauce | 간장 | soy_sauce.png | missing | 제육볶음, 계란볶음밥, 김치찌개, 된장찌개, 비빔밥, 불고기, 김치볶음밥, 닭갈비 |
| spinach | 시금치 | spinach.png | missing | 비빔밥 |
| sugar | 설탕 | sugar.png | missing | 제육볶음, 비빔밥, 불고기, 김치볶음밥, 닭갈비 |
| sweet_potato | 고구마 | sweet_potato.png | missing | 닭갈비 |
| tofu | 두부 | tofu.png | missing | 김치찌개, 된장찌개 |
| tonkatsu_sauce | 돈까스소스 | tonkatsu_sauce.png | missing | 돈까스 |
| water | 물 | water.png | missing | 카레라이스 |
| zucchini | 애호박 | zucchini.png | missing | 김치찌개, 된장찌개, 비빔밥 |

---

## Next step (manual)

1. Add PNGs under `apps/todays-menu/assets/ingredients/` using the filenames above.
2. Register each file with a static `require()` in `apps/todays-menu/services/images/ingredientImageAssets.ts`.
3. Re-run this checklist scan and flip status from `missing` → `exists`.
