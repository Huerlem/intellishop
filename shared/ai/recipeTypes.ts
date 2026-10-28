import type { CanonicalUnit } from '../domain/units';

export type RecipeMode = 'pantry' | 'list' | 'both';

/** One normalised ingredient sent to the model, with a short stable reference. */
export type IngredientInput = {
  ref: string; // p1 (pantry), l1 (list), m1 (merged pantry+list)
  name: string;
  normalizedName: string;
  quantity: number | null;
  unit: CanonicalUnit | null;
  source: 'pantry' | 'list' | 'merged';
  pantryQuantity: { amount: number; unit: CanonicalUnit } | null;
  listQuantity: { amount: number; unit: CanonicalUnit } | null;
  expiresInDays: number | null;
};

export type IngredientStatus = 'available' | 'fromList' | 'partial' | 'missing';

/** As returned by the model, before server reclassification. */
export type ModelIngredient = {
  name: string;
  quantity: number | null;
  unit: string;
  sourceRef: string | null;
};

export type ModelRecipe = {
  title: string;
  description: string;
  servings: number;
  prepMinutes: number;
  cookMinutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
  ingredients: ModelIngredient[];
  steps: { order: number; text: string }[];
  equipment: string[];
  reason: string;
  usesSoonExpiring: string[];
  dietaryTags: string[];
  nutritionEstimate?: { perServing: { kcal: number; proteinG: number; carbsG: number; fatG: number }; isEstimate: true };
};

export type ModelRecipeResult = { recipes: ModelRecipe[]; notes?: string };

export type ReclassifiedIngredient = ModelIngredient & {
  status: IngredientStatus;
  shortfall?: { amount: number; unit: CanonicalUnit };
  safety: 'ok' | 'check';
  safetyReasons: string[];
};

/** What the app receives: server-assigned fields only, never trusted from the model. */
export type Recipe = Omit<ModelRecipe, 'ingredients' | 'nutritionEstimate'> & {
  id: string;
  ingredients: ReclassifiedIngredient[];
  allergenWarnings: string[];
  readyToCook: boolean;
  nutritionEstimate?: ModelRecipe['nutritionEstimate'];
  generatedAt: number;
  mode: RecipeMode;
  model: string;
  promptVersion: string;
  lexiconVersion: string;
};
