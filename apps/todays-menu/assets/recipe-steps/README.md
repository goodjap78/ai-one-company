# Recipe step images (Sprint R3)

Place step photos here and register them in
`services/images/recipeStepImageAssets.ts` with a static `require()`.

Expected keys for 김치찌개 (003):

- kimchi_stew_step_01.jpg — 돼지고기 볶기
- kimchi_stew_step_02.jpg — 김치 함께 볶기
- kimchi_stew_step_03.jpg — 물과 양념 넣고 끓이기
- kimchi_stew_step_04.jpg — 두부와 채소 넣고 마무리

Do not use dynamic `require()`. Missing files must not be registered.
Do not show a placeholder image box when a key is unresolved.
