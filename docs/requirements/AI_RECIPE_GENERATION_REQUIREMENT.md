# INTELLISHOP — CRITICAL AI RECIPE GENERATION REQUIREMENT

This is a mandatory clarification of IntelliShop's original product purpose.

**Recipe suggestions must be generated dynamically by real AI using the user's actual shopping lists, pantry inventory, or both.**

IntelliShop must NOT use a predefined recipe catalogue, hardcoded JSON recipes, local arrays of example dishes, or static mock data as a substitute for AI generation.

## 1. Recipe generation sources

Implement three modes:

**A — Cook With What I Have**

Use the authenticated user's current pantry inventory.

- Identify available ingredients and quantities.
- Prioritise ingredients approaching expiry.
- Suggest recipes that maximise existing ingredient usage.
- Clearly distinguish recipes that can be prepared immediately from those requiring additional ingredients.

**B — Recipes From My Shopping List**

Use the user's selected shopping list.

- Generate recipe ideas based on planned purchases.
- Take quantities and units into account.
- Explain which shopping-list items each recipe would use.
- Identify additional ingredients needed.

**C — Pantry + Shopping List**

Combine both datasets.

- Deduplicate matching products and normalise units where possible.
- Prefer ingredients already owned.
- Identify missing ingredients.
- Recommend dishes that minimise additional expenditure and food waste.

## 2. AI generation requirements

Use a supported generative AI model through a secure server-side API.

Each request must use current, authorised user data and relevant preferences, including:

- Ingredients and quantities
- Dietary requirements and allergies
- Cuisine preferences
- Cooking time
- Difficulty
- Serving size
- Available equipment, when specified
- Expiry information
- Budget constraints, when available

The AI must produce genuinely contextual recipe proposals, not merely select entries from a stored collection.

## 3. Structured recipe output

Return validated structured data containing:

- Recipe ID
- Recipe title
- Short description
- Ingredients with quantities and units
- Ingredients already available
- Ingredients expected from the shopping list
- Missing ingredients
- Preparation steps
- Estimated preparation and cooking times
- Servings
- Dietary and allergen warnings
- Reason for recommendation
- Optional nutritional estimates, clearly labelled as estimates

Validate AI responses before displaying them.

Never guarantee that AI-generated recipes are allergen-free or medically suitable.

## 4. User actions

Users must be able to:

- Generate recipes from Pantry
- Generate recipes from a selected Shopping List
- Generate recipes using both
- Regenerate suggestions
- Apply filters
- View full cooking instructions
- Adjust servings
- Save a favourite recipe
- Add only missing ingredients to a shopping list
- Review proposed list changes before applying them

Saving a generated recipe as a favourite is allowed.

Loading a fixed library of predefined dishes as the primary recommendation engine is NOT allowed.

## 5. Original codebase audit

Inspect and evaluate the existing files:

- `services/geminiService.js`
- `services/recipeApiService.js`
- `services/smartShoppingService.js`
- `app/(auth)/RecipeSuggestionScreen.jsx`
- `app/(auth)/recipe/[id].jsx`
- Existing recipe-related components and data files

Identify every hardcoded recipe, mock response, fallback array, inactive API call and insecure credential reference.

Replace static production behaviour with verified dynamic generation while preserving reusable UI and business logic.

Mocks may exist exclusively in isolated development fixtures and automated tests. They must never be misrepresented as live AI output.

## 6. Security and cost

Never expose AI API secrets through React Native, `EXPO_PUBLIC_` variables or committed source files.

Implement authentication, server-side inference, rate limiting, per-user usage limits, timeouts, response validation and cost monitoring.

Audit the old Gemini integration and do not reuse potentially compromised credentials.

## 7. Acceptance tests

Demonstrate the following scenarios using actual application data:

**Scenario 1:** Pantry contains eggs, milk, flour and bananas. AI generates relevant recipes from those ingredients.

**Scenario 2:** Shopping list contains salmon, broccoli and potatoes. AI generates recipes relevant to that planned purchase.

**Scenario 3:** Pantry contains eggs and milk; shopping list contains flour and bananas. AI combines the available and planned ingredients correctly.

**Scenario 4:** The user selects a recipe requiring an additional ingredient. That ingredient is added only after confirmation.

**Scenario 5:** A pantry item is removed or its quantity changes. New suggestions reflect the updated inventory.

**Scenario 6:** The AI provider is unavailable. Display a clear error and retry option. Do not silently fall back to fake recipes.

All test cases must have documented, reproducible results.

**Definition of Done:** The recipe feature is complete only when a user can generate personalised recipes from their real shopping and pantry data, inspect the cooking instructions, and add missing ingredients to a list through a working, validated end-to-end flow.