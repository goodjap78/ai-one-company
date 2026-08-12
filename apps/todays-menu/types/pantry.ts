/**
 * Sprint 45 — Pantry Intelligence Engine (not inventory UI).
 *
 * MVP: ingredient names only — Egg, Onion, Kimchi, Tofu.
 * Pipeline: Pantry → Ingredient Matching → HMIE → Meal Planning → Smart Grocery
 */

export type PantryItem = {
  id: string;
  name: string;
  /** IIE canonical name — same as Ingredient.canonicalName. */
  normalizedName: string;
  /** Ingredient icon registry key — fridge raid matching uses this. */
  iconKey: string;
  updatedAt: string;
};

/** Future: Quantity, Freshness, Receipt Scan, Camera, IoT Refrigerator. */
export type PantryExtensions = {
  quantity?: Record<string, unknown>;
  freshness?: Record<string, unknown>;
  receiptScan?: Record<string, unknown>;
  camera?: Record<string, unknown>;
  iotRefrigerator?: Record<string, unknown>;
};

export type PantryStore = {
  version: 2;
  items: PantryItem[];
  updatedAt: string;
  extensions: PantryExtensions;
};

export type PantryMatchResult = {
  matchedCount: number;
  requiredCount: number;
  overlapRatio: number;
  matchedNames: string[];
};

export type PantryMatchIndex = Record<string, PantryMatchResult>;

/** Read model for HMIE and Smart Grocery. */
export type PantrySnapshot = {
  version: 2;
  items: PantryItem[];
  /** Normalized ingredient names for presence checks. */
  ingredientNames: string[];
  /** Unique fridge-match keys derived from pantry items (iconKey-based). */
  matchKeys: string[];
  updatedAt: string;
  extensions: PantryExtensions;
};

export type RegisterPantryInput = {
  name: string;
  iconKey?: string;
};
