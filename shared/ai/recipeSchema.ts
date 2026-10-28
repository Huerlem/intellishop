/**
 * Strict, dependency-free validator for the AI recipe response (AI_ARCHITECTURE.md §7).
 *
 * - Unknown fields are rejected anywhere, so the model cannot add prices, stock,
 *   availability, temperatures or storage times (FOOD_SAFETY_TECHNICAL_SPEC.md §3.2).
 * - Ranges and lengths are checked here (provider-side schemas cannot express them).
 * - `nutritionEstimate` is accepted only when the caller enables it (decision FS-D1);
 *   otherwise it is rejected as an unknown field.
 */
import type { ModelRecipe, ModelRecipeResult } from './recipeTypes';

export type SchemaIssue = { path: string; message: string };
export type ValidationResult<T> = { ok: true; value: T } | { ok: false; issues: SchemaIssue[] };

export const RECIPE_LIMITS = {
  recipes: { min: 1, max: 5 },
  title: 80,
  description: 240,
  reason: 240,
  notes: 300,
  ingredients: { min: 1, max: 30 },
  ingredientName: 60,
  unit: 20,
  steps: { min: 1, max: 20 },
  stepText: 400,
  equipment: 10,
  equipmentName: 40,
  dietaryTags: 8,
  servings: { min: 1, max: 12 },
  minutes: { min: 0, max: 720 },
  quantity: { min: 0, max: 100000 },
} as const;

type Ctx = { issues: SchemaIssue[] };

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function keys(ctx: Ctx, path: string, value: Record<string, unknown>, required: string[], optional: string[] = []) {
  const allowed = new Set([...required, ...optional]);
  for (const k of Object.keys(value)) if (!allowed.has(k)) ctx.issues.push({ path: `${path}.${k}`, message: 'unexpected field' });
  for (const k of required) if (!(k in value)) ctx.issues.push({ path: `${path}.${k}`, message: 'missing' });
}

function str(ctx: Ctx, path: string, v: unknown, max: number, allowEmpty = false): string {
  if (typeof v !== 'string') {
    ctx.issues.push({ path, message: 'must be a string' });
    return '';
  }
  const t = v.trim();
  if (!allowEmpty && !t) ctx.issues.push({ path, message: 'must not be empty' });
  if (t.length > max) ctx.issues.push({ path, message: `longer than ${max} characters` });
  return t;
}

function int(ctx: Ctx, path: string, v: unknown, min: number, max: number): number {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) {
    ctx.issues.push({ path, message: `must be an integer ${min}–${max}` });
    return min;
  }
  return v;
}

function num(ctx: Ctx, path: string, v: unknown, min: number, max: number): number {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) {
    ctx.issues.push({ path, message: `must be a number ${min}–${max}` });
    return min;
  }
  return v;
}

function arr(ctx: Ctx, path: string, v: unknown, min: number, max: number): unknown[] {
  if (!Array.isArray(v)) {
    ctx.issues.push({ path, message: 'must be an array' });
    return [];
  }
  if (v.length < min || v.length > max) ctx.issues.push({ path, message: `must have ${min}–${max} entries` });
  return v.slice(0, max);
}

function recipe(ctx: Ctx, path: string, v: unknown, allowNutrition: boolean): ModelRecipe | null {
  if (!isObject(v)) {
    ctx.issues.push({ path, message: 'must be an object' });
    return null;
  }
  keys(
    ctx,
    path,
    v,
    ['title', 'description', 'servings', 'prepMinutes', 'cookMinutes', 'difficulty', 'ingredients', 'steps', 'equipment', 'reason', 'usesSoonExpiring', 'dietaryTags'],
    allowNutrition ? ['nutritionEstimate'] : []
  );
  const L = RECIPE_LIMITS;
  const difficulty = v.difficulty;
  if (difficulty !== 'easy' && difficulty !== 'medium' && difficulty !== 'hard') ctx.issues.push({ path: `${path}.difficulty`, message: 'must be easy, medium or hard' });

  const ingredients = arr(ctx, `${path}.ingredients`, v.ingredients, L.ingredients.min, L.ingredients.max).map((ing, i) => {
    const p = `${path}.ingredients[${i}]`;
    if (!isObject(ing)) {
      ctx.issues.push({ path: p, message: 'must be an object' });
      return { name: '', quantity: null, unit: '', sourceRef: null };
    }
    keys(ctx, p, ing, ['name', 'quantity', 'unit', 'sourceRef']);
    const quantity = ing.quantity === null ? null : num(ctx, `${p}.quantity`, ing.quantity, L.quantity.min, L.quantity.max);
    const sourceRef = ing.sourceRef === null ? null : str(ctx, `${p}.sourceRef`, ing.sourceRef, 8);
    if (sourceRef !== null && !/^[plm]\d{1,3}$/.test(sourceRef)) ctx.issues.push({ path: `${p}.sourceRef`, message: 'invalid reference' });
    return { name: str(ctx, `${p}.name`, ing.name, L.ingredientName), quantity, unit: str(ctx, `${p}.unit`, ing.unit, L.unit, true), sourceRef };
  });

  const steps = arr(ctx, `${path}.steps`, v.steps, L.steps.min, L.steps.max).map((s, i) => {
    const p = `${path}.steps[${i}]`;
    if (!isObject(s)) {
      ctx.issues.push({ path: p, message: 'must be an object' });
      return { order: i + 1, text: '' };
    }
    keys(ctx, p, s, ['order', 'text']);
    return { order: int(ctx, `${p}.order`, s.order, 1, L.steps.max), text: str(ctx, `${p}.text`, s.text, L.stepText) };
  });
  steps.forEach((s, i) => {
    if (s.order !== i + 1) ctx.issues.push({ path: `${path}.steps[${i}].order`, message: 'steps must be numbered 1..n in order' });
  });

  const stringList = (field: 'equipment' | 'usesSoonExpiring' | 'dietaryTags', max: number, itemMax: number) =>
    arr(ctx, `${path}.${field}`, v[field], 0, max).map((x, i) => str(ctx, `${path}.${field}[${i}]`, x, itemMax));

  let nutritionEstimate: ModelRecipe['nutritionEstimate'];
  if (allowNutrition && v.nutritionEstimate !== undefined) {
    const n = v.nutritionEstimate;
    const p = `${path}.nutritionEstimate`;
    if (!isObject(n) || !isObject(n.perServing) || n.isEstimate !== true) {
      ctx.issues.push({ path: p, message: 'must be { perServing, isEstimate: true }' });
    } else {
      keys(ctx, p, n, ['perServing', 'isEstimate']);
      keys(ctx, `${p}.perServing`, n.perServing, ['kcal', 'proteinG', 'carbsG', 'fatG']);
      const ps = n.perServing;
      nutritionEstimate = {
        perServing: {
          kcal: num(ctx, `${p}.perServing.kcal`, ps.kcal, 0, 5000),
          proteinG: num(ctx, `${p}.perServing.proteinG`, ps.proteinG, 0, 500),
          carbsG: num(ctx, `${p}.perServing.carbsG`, ps.carbsG, 0, 1000),
          fatG: num(ctx, `${p}.perServing.fatG`, ps.fatG, 0, 500),
        },
        isEstimate: true,
      };
    }
  }

  return {
    title: str(ctx, `${path}.title`, v.title, L.title),
    description: str(ctx, `${path}.description`, v.description, L.description),
    servings: int(ctx, `${path}.servings`, v.servings, L.servings.min, L.servings.max),
    prepMinutes: int(ctx, `${path}.prepMinutes`, v.prepMinutes, L.minutes.min, L.minutes.max),
    cookMinutes: int(ctx, `${path}.cookMinutes`, v.cookMinutes, L.minutes.min, L.minutes.max),
    difficulty: (difficulty as ModelRecipe['difficulty']) ?? 'easy',
    ingredients,
    steps,
    equipment: stringList('equipment', L.equipment, L.equipmentName),
    reason: str(ctx, `${path}.reason`, v.reason, L.reason),
    usesSoonExpiring: stringList('usesSoonExpiring', L.ingredients.max, 8),
    dietaryTags: stringList('dietaryTags', L.dietaryTags, 30),
    ...(nutritionEstimate ? { nutritionEstimate } : {}),
  };
}

export function validateRecipeResult(raw: unknown, options: { allowNutrition?: boolean } = {}): ValidationResult<ModelRecipeResult> {
  const ctx: Ctx = { issues: [] };
  if (!isObject(raw)) return { ok: false, issues: [{ path: '$', message: 'must be an object' }] };
  keys(ctx, '$', raw, ['recipes'], ['notes']);
  const recipes = arr(ctx, '$.recipes', raw.recipes, RECIPE_LIMITS.recipes.min, RECIPE_LIMITS.recipes.max)
    .map((r, i) => recipe(ctx, `$.recipes[${i}]`, r, options.allowNutrition === true))
    .filter((r): r is ModelRecipe => r !== null);
  const notes = raw.notes === undefined ? undefined : str(ctx, '$.notes', raw.notes, RECIPE_LIMITS.notes, true);
  if (ctx.issues.length) return { ok: false, issues: ctx.issues };
  return { ok: true, value: notes === undefined ? { recipes } : { recipes, notes } };
}

/** JSON Schema sent to the provider for constrained decoding (no numeric bounds: checked above). */
export function recipeJsonSchema(allowNutrition: boolean): Record<string, unknown> {
  const ingredient = {
    type: 'object',
    additionalProperties: false,
    required: ['name', 'quantity', 'unit', 'sourceRef'],
    properties: {
      name: { type: 'string' },
      quantity: { type: ['number', 'null'] },
      unit: { type: 'string' },
      sourceRef: { type: ['string', 'null'] },
    },
  };
  const recipeProps: Record<string, unknown> = {
    title: { type: 'string' },
    description: { type: 'string' },
    servings: { type: 'integer' },
    prepMinutes: { type: 'integer' },
    cookMinutes: { type: 'integer' },
    difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
    ingredients: { type: 'array', items: ingredient },
    steps: {
      type: 'array',
      items: { type: 'object', additionalProperties: false, required: ['order', 'text'], properties: { order: { type: 'integer' }, text: { type: 'string' } } },
    },
    equipment: { type: 'array', items: { type: 'string' } },
    reason: { type: 'string' },
    usesSoonExpiring: { type: 'array', items: { type: 'string' } },
    dietaryTags: { type: 'array', items: { type: 'string' } },
  };
  const required = Object.keys(recipeProps);
  if (allowNutrition) {
    recipeProps.nutritionEstimate = {
      type: 'object',
      additionalProperties: false,
      required: ['perServing', 'isEstimate'],
      properties: {
        perServing: {
          type: 'object',
          additionalProperties: false,
          required: ['kcal', 'proteinG', 'carbsG', 'fatG'],
          properties: { kcal: { type: 'number' }, proteinG: { type: 'number' }, carbsG: { type: 'number' }, fatG: { type: 'number' } },
        },
        isEstimate: { type: 'boolean', const: true },
      },
    };
  }
  return {
    type: 'object',
    additionalProperties: false,
    required: ['recipes'],
    properties: {
      recipes: { type: 'array', items: { type: 'object', additionalProperties: false, required, properties: recipeProps } },
      notes: { type: 'string' },
    },
  };
}
