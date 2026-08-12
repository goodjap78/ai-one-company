import path from 'node:path';

/** App root = apps/todays-menu */
export const APP_ROOT = path.resolve(__dirname, '../..');

export const PATHS = {
  appRoot: APP_ROOT,
  hankkiRecipes: path.join(APP_ROOT, 'data/recipes/hankkiRecipes.ts'),
  ingredientAliases: path.join(APP_ROOT, 'data/ingredients/ingredientAliases.ts'),
  ingredientAssetsDir: path.join(APP_ROOT, 'assets/ingredients'),
  stepAssetsDir: path.join(APP_ROOT, 'assets/recipe-steps'),
  mealAssetsDir: path.join(APP_ROOT, 'assets/meals'),
  ingredientRegistry: path.join(APP_ROOT, 'services/images/ingredientImageAssets.ts'),
  stepRegistry: path.join(APP_ROOT, 'services/images/recipeStepImageAssets.ts'),
  generatedRoot: path.join(APP_ROOT, 'generated/recipe-assets'),
} as const;

export const INGREDIENT_IMAGE = {
  extension: 'png' as const,
  width: 1024,
  height: 1024,
};

export const STEP_IMAGE = {
  extension: 'jpg' as const,
  width: 1280,
  height: 720,
};

/** Env vars — never hard-code API keys. */
export function getProviderEnv(): {
  provider: string | undefined;
  apiKey: string | undefined;
} {
  return {
    provider: process.env.IMAGE_PROVIDER?.trim() || undefined,
    apiKey: process.env.IMAGE_API_KEY?.trim() || undefined,
  };
}

export const DISABLED_PROVIDER_MESSAGE =
  '이미지 생성 제공자가 연결되지 않았습니다.\n프롬프트와 파일 구조 준비는 완료되었습니다.';

export const ASSET_KEY_PATTERN = /^[a-z][a-z0-9_]*$/;
