/**
 * AI recipe result (Figma clarification C5 — "design needed"; built from Card, Badge, Alert).
 * Shows only server-validated fields. Ingredient status is computed on the server from the
 * user's real Pantry/list (never trusted from the model); safety warnings are always visible.
 */
import { View } from 'react-native';

import type { IngredientStatus, Recipe } from '@/shared/ai/recipeTypes';
import { Alert, AppText, Badge, Button, Card, type BadgeTone } from '@/src/ui';

const STATUS: Record<IngredientStatus, { label: string; tone: BadgeTone }> = {
  available: { label: 'In Pantry', tone: 'success' },
  fromList: { label: 'On your list', tone: 'info' },
  partial: { label: 'Need more', tone: 'warning' },
  missing: { label: 'Missing', tone: 'neutral' },
};

type Props = { recipe: Recipe; saved: boolean; onSave: () => void; onAddMissing?: () => void; busy?: boolean };

export function RecipeCard({ recipe, saved, onSave, onAddMissing, busy }: Props) {
  const missing = recipe.ingredients.filter((i) => i.status === 'missing' || i.status === 'partial');
  return (
    <Card testID={`recipe-${recipe.id}`}>
      <AppText variant="h3">{recipe.title}</AppText>
      <AppText variant="bodySmall" tone="secondary">
        {recipe.description}
      </AppText>
      <AppText variant="caption" tone="muted">
        Serves {recipe.servings} · Prep {recipe.prepMinutes} min · Cook {recipe.cookMinutes} min · {recipe.difficulty}
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
        <Badge label="AI-generated" tone="rationale" />
        {recipe.readyToCook ? <Badge label="Ready to cook" tone="success" /> : <Badge label={`${missing.length} to buy`} tone="warning" />}
      </View>
      {recipe.reason ? (
        <AppText variant="caption" tone="intelligence">
          Why this recipe: {recipe.reason}
        </AppText>
      ) : null}
      {recipe.allergenWarnings.length ? <Alert tone="warning" title="Check allergens" detail={recipe.allergenWarnings.join(' ')} style={{ marginTop: 8 }} /> : null}

      <AppText variant="label" style={{ marginTop: 8 }}>
        Ingredients
      </AppText>
      {recipe.ingredients.map((ing, i) => (
        <View key={`${ing.name}-${i}`} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 4 }}>
          <View style={{ flex: 1 }}>
            <AppText variant="bodySmall">
              {ing.quantity != null ? `${ing.quantity} ${ing.unit} ` : ''}
              {ing.name}
            </AppText>
            {ing.safety === 'check' ? (
              <AppText variant="caption" tone="warning">
                Check: {ing.safetyReasons.join(', ')}
              </AppText>
            ) : null}
          </View>
          <Badge label={STATUS[ing.status].label} tone={STATUS[ing.status].tone} />
        </View>
      ))}

      <AppText variant="label" style={{ marginTop: 8 }}>
        Method
      </AppText>
      {recipe.steps.map((s) => (
        <AppText key={s.order} variant="bodySmall">
          {s.order}. {s.text}
        </AppText>
      ))}
      {recipe.equipment.length ? (
        <AppText variant="caption" tone="muted">
          Equipment: {recipe.equipment.join(', ')}
        </AppText>
      ) : null}
      {recipe.nutritionEstimate ? (
        <AppText variant="caption" tone="muted">
          Estimated per serving (not verified): {recipe.nutritionEstimate.perServing.kcal} kcal · protein {recipe.nutritionEstimate.perServing.proteinG} g · carbs {recipe.nutritionEstimate.perServing.carbsG} g · fat {recipe.nutritionEstimate.perServing.fatG} g
        </AppText>
      ) : null}
      <AppText variant="caption" tone="muted" style={{ marginTop: 8 }}>
        AI suggestions can be wrong. Check ingredients, allergens, cooking times and that food is cooked through.
      </AppText>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <Button title={saved ? 'Saved' : 'Save'} variant="secondary" compact disabled={saved} loading={busy} onPress={onSave} style={{ flex: 1 }} accessibilityLabel={saved ? `${recipe.title} saved` : `Save ${recipe.title}`} />
        {onAddMissing && missing.length ? <Button title="Add missing to list" variant="tertiary" compact onPress={onAddMissing} style={{ flex: 1 }} /> : null}
      </View>
    </Card>
  );
}
