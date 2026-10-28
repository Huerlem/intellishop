---
title: Food Safety & Allergens
slug: food-safety
version: 0.2.0-draft
status: DRAFT — not published
effective: "[OWNER TO CONFIRM: effective date]"
last_updated: 2026-10-28
---

# Food Safety, Allergens & Nutrition

> **Draft for owner review — not published.** The allergen and recipe protections described here are **[PENDING IMPLEMENTATION: L3-03, L3-04, L3-05; tests FT-01…FT-12]**. This page must match what the app actually does (see `docs/compliance/FOOD_SAFETY_TECHNICAL_SPEC.md`). If the two ever differ, the app's behaviour must be fixed before this page is published.

**If someone has a severe allergic reaction (anaphylaxis), call 999 immediately.** For urgent medical advice that is not an emergency, contact NHS 111.

## 1. The short version

- IntelliShop can **help** you avoid ingredients you are allergic to. It **cannot guarantee** that any recipe or product is free from an allergen.
- **Always read the label** of every product you use, every time. Manufacturers change recipes.
- AI recipes can contain mistakes. **Read the whole recipe** before you cook, and use your own judgement.
- IntelliShop does **not** give medical or dietetic advice. If you have a medical condition or a medically prescribed diet, follow the advice of your doctor or dietitian.

## 2. What IntelliShop does to help

If you choose to save your allergies or dietary preferences, and you give your permission, the app:

1. **Uses a fixed list of the 14 allergens** identified by the UK Food Standards Agency:
   - cereals containing gluten
   - crustaceans
   - eggs
   - fish
   - peanuts
   - soybeans
   - milk
   - nuts (such as almonds, hazelnuts, walnuts, cashews, pecans, Brazil nuts, pistachios and macadamias)
   - celery
   - mustard
   - sesame
   - sulphur dioxide and sulphites
   - lupin
   - molluscs

   You can also add other ingredients to avoid.
2. **Checks every ingredient in an AI recipe** against those allergens and against a list of common ingredients that contain them. For example, butter, cream, cheese, ghee and whey are checked as milk.
3. **Discards** any AI recipe that includes an ingredient matching one of your allergens or diets. You never see that recipe.
4. **Marks uncertain ingredients** with **"Check this ingredient"**. Examples are stock, sauces, pastes and pesto, which often contain allergens depending on the brand.
5. **Shows a warning on every AI recipe** that it is AI-generated and that you must check labels.
6. **Never** labels a recipe "allergen-free", "safe for" or similar. It removes such wording from AI results.
7. **Asks you to review** before adding a recipe's ingredients to your shopping list. If you marked an allergy as severe, it asks you to confirm that you will check the labels.
8. **Does not put "use by" items past their date** into recipe suggestions by default.

If you have **not** saved any allergies, AI recipes do not take allergies into account, and the app says so on every recipe.

## 3. What IntelliShop cannot do

The app works from the **names** of ingredients. It cannot know:

- what is in a **specific product or brand**, or whether the recipe has changed;
- whether a product **"may contain"** an allergen, for example because of cross-contamination in a factory or kitchen;
- whether your kitchen, utensils or other foods could **cross-contaminate** a dish;
- whether an item name typed in a list or pantry has been **misspelt or abbreviated** in a way our checks do not recognise;
- the **severity** of anyone's allergy, or whether a small amount could cause a reaction;
- whether a recipe suits a **medical condition** (for example coeliac disease, diabetes, kidney disease, pregnancy) or a **medically supervised diet**.

## 4. Your responsibilities

When using IntelliShop, please:

- read product labels, including "may contain" statements, before buying, cooking and serving;
- check the full ingredient list and method of any recipe before you start;
- tell anyone you cook for which ingredients you used, and ask about their allergies;
- keep allergy and medical information up to date in the app if you use those features;
- seek professional medical advice for allergies, intolerances and medical diets.

## 5. Cooking and storing food safely

IntelliShop does **not** generate cooking temperatures, cooking times for safety, or storage times. The AI is not allowed to supply them. Where the app shows general food-safety advice, it uses fixed text based on Food Standards Agency (FSA) guidance:

- Cook food until it is **steaming hot throughout**. Poultry, pork, burgers, sausages and rolled joints must be cooked **all the way through**, with no pink meat and juices running clear. The FSA explains that the centre should reach **70 °C for 2 minutes** or an equivalent.
- Reheat food **only once**, until steaming hot throughout.
- Keep your fridge at **0–5 °C**.
- Cool leftovers and refrigerate them within **one to two hours**. Eat them within **48 hours** or freeze them.
- **Defrost** food in the fridge, use it within 24 hours, and make sure it is fully defrosted before cooking.
- Do not eat food after its **"use by"** date. "Best before" dates are about quality, not safety.
- Always follow the **cooking and storage instructions on product packaging**.

Sources: FSA, *Cooking your food* and *How to chill, freeze and defrost food safely* (GOV.UK, accessed 28 October 2026). Advice applies to England, Wales and Northern Ireland. Food Standards Scotland publishes equivalent advice for Scotland.

## 6. Nutrition information

**[OWNER TO CONFIRM: decision FS-D1 — choose one]**

- **Option A (recommended for launch):** IntelliShop does **not** show nutrition values (such as calories, protein, carbohydrate or fat) for AI recipes, because the AI cannot measure them reliably.
- **Option B:** Some AI recipes show nutrition values labelled **"AI estimate — not verified"**. These are rough estimates, not measurements, and they vary with the products and portion sizes you use. Do not rely on them for medical, weight-management or dietary needs. They are hidden if you have marked any allergy as severe.

## 7. Pantry expiry dates

Expiry dates in your Pantry are dates **you** enter. IntelliShop uses them to remind you which food to use soon. It does not check the dates against the actual product. Always check the date printed on the packaging.

## 8. Telling us about a problem

If you find an AI recipe that included an ingredient you had asked to avoid, or a warning that was missing or wrong, please tell us at **[OWNER TO CONFIRM: support email]** or with **Report** on the recipe ([PENDING IMPLEMENTATION]). We treat these reports as a priority and use them to improve our checks.
