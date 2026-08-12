export type CheckVerdict = 'PASS' | 'FAIL';

export type RecipeValidationRow = {
  id: string;
  name: string;
  verdict: CheckVerdict;
  failures: string[];
};

export type CompatibilityCheck = {
  name: string;
  verdict: CheckVerdict;
  detail: string;
};

export type AssetScanResult = {
  missingHeroes: string[];
  missingIngredients: string[];
  missingSteps: string[];
  filenameMismatches: string[];
  brokenRegistryKeys: string[];
  fallbackAssetsUsed: string[];
};
