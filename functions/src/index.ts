/**
 * IntelliShop Cloud Functions (2nd gen) — entry point.
 *
 * DEPLOYMENT IS AN OWNER CHECKPOINT. Nothing here is deployed by CI. Before the first deploy:
 *  - Blaze plan and the target project (dev/staging/prod) approved by the owner;
 *  - secrets created in Secret Manager by the owner (never in Git, chat or EAS):
 *      AI_PROVIDER_API_KEY, REVENUECAT_SECRET_KEY, REVENUECAT_WEBHOOK_AUTH;
 *  - App Check: the Firebase JS SDK cannot use Apple App Attest by itself. Enforcement stays
 *    OFF (param ENFORCE_APP_CHECK=false) until a native App Check provider is added and tested
 *    (decision recorded in docs/IMPLEMENTATION_PACKAGE_REPORT.md).
 */
import { setGlobalOptions } from 'firebase-functions/v2';
import { HttpsError, onCall, onRequest, type CallableRequest } from 'firebase-functions/v2/https';
import { defineBoolean, defineInt, defineSecret, defineString } from 'firebase-functions/params';

import { authAdmin, clock, files, ids, log, sha256, store } from './adapters/admin';
import * as account from './handlers/account';
import * as entitlements from './handlers/entitlements';
import * as recipes from './handlers/generateRecipes';
import { HandlerError, type CallerContext } from './ports';
import { createAnthropicProvider } from './providers/anthropic';

setGlobalOptions({ region: 'europe-west2', maxInstances: 10 });

const AI_PROVIDER_API_KEY = defineSecret('AI_PROVIDER_API_KEY');
const REVENUECAT_SECRET_KEY = defineSecret('REVENUECAT_SECRET_KEY');
const REVENUECAT_WEBHOOK_AUTH = defineSecret('REVENUECAT_WEBHOOK_AUTH');

const ENFORCE_APP_CHECK = defineBoolean('ENFORCE_APP_CHECK', { default: false });
const AI_MODEL = defineString('AI_MODEL', { default: 'claude-haiku-5-5' });
const AI_PAUSED = defineBoolean('AI_PAUSED', { default: true }); // stays paused until the owner enables AI
const AI_MONTHLY_BUDGET_USD = defineInt('AI_MONTHLY_BUDGET_USD', { default: 20 });
const AI_ALLOW_NUTRITION = defineBoolean('AI_ALLOW_NUTRITION', { default: false }); // decision FS-D1
const RC_PRODUCT_MAP = defineString('RC_PRODUCT_MAP', { default: '{}' }); // JSON: { "<productId>": "standard" | "premium" }

function caller(req: CallableRequest): CallerContext {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Please sign in again.');
  const token = req.auth.token as { email_verified?: boolean; auth_time?: number };
  return { uid: req.auth.uid, emailVerified: token.email_verified === true, authTime: Number(token.auth_time ?? 0) };
}

async function run<T>(name: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof HandlerError) throw new HttpsError(e.code, e.message, { reason: e.reason, ...e.details });
    if (e instanceof HttpsError) throw e;
    log.error('function_failed', { name, error: (e as Error)?.name ?? 'Error' });
    throw new HttpsError('internal', 'Something went wrong.');
  }
}

const callable = { enforceAppCheck: ENFORCE_APP_CHECK, timeoutSeconds: 60, memory: '256MiB' as const };

export const deleteAccount = onCall({ ...callable, secrets: [REVENUECAT_SECRET_KEY] }, (req) =>
  run('deleteAccount', () =>
    account.deleteAccount(caller(req), req.data, {
      store,
      auth: authAdmin,
      files,
      clock,
      hash: sha256,
      logger: log,
      deleteSubscriber: REVENUECAT_SECRET_KEY.value()
        ? async (uid) => {
            const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(uid)}`, {
              method: 'DELETE',
              headers: { authorization: `Bearer ${REVENUECAT_SECRET_KEY.value()}` },
            });
            if (!res.ok && res.status !== 404) throw new Error(`RevenueCat delete failed: ${res.status}`);
          }
        : null,
    })
  )
);

export const exportUserData = onCall(callable, (req) => run('exportUserData', () => account.exportUserData(caller(req), { store, clock })));
export const setAiConsent = onCall(callable, (req) => run('setAiConsent', () => account.setAiConsent(caller(req), req.data, { store, clock })));
export const setDietaryPreferences = onCall(callable, (req) => run('setDietaryPreferences', () => account.setDietaryPreferences(caller(req), req.data, { store, clock })));

export const generateRecipes = onCall({ ...callable, timeoutSeconds: 75, secrets: [AI_PROVIDER_API_KEY] }, (req) =>
  run('generateRecipes', () => {
    const config: recipes.RecipeConfig = {
      allowNutrition: AI_ALLOW_NUTRITION.value(),
      paused: AI_PAUSED.value(),
      monthlyBudgetUsd: AI_MONTHLY_BUDGET_USD.value(),
      // Provisional unit prices for the provisional model; update from the provider's price list.
      costPerMTokUsd: { input: 0.1, output: 0.5 },
      cacheTtlMs: 30 * 60 * 1000,
      timeoutMs: 45_000,
      maxOutputTokens: 6000,
      recipeCount: 3,
    };
    const provider = createAnthropicProvider({ apiKey: () => AI_PROVIDER_API_KEY.value(), model: AI_MODEL.value() });
    return recipes.generateRecipes(caller(req), req.data, { store, provider, clock, ids, hash: sha256, logger: log, config });
  })
);

function entitlementDeps(): entitlements.EntitlementDeps {
  let products: entitlements.ProductMap = {};
  try {
    products = JSON.parse(RC_PRODUCT_MAP.value()) as entitlements.ProductMap;
  } catch {
    products = {};
  }
  return {
    store,
    clock,
    logger: log,
    products,
    fetchSubscriber: async (uid) => {
      const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(uid)}`, {
        headers: { authorization: `Bearer ${REVENUECAT_SECRET_KEY.value()}` },
      });
      if (!res.ok) throw new Error(`RevenueCat fetch failed: ${res.status}`);
      return res.json();
    },
  };
}

export const syncEntitlements = onCall({ ...callable, secrets: [REVENUECAT_SECRET_KEY] }, (req) => run('syncEntitlements', () => entitlements.syncEntitlements(caller(req), entitlementDeps())));

export const revenueCatWebhook = onRequest({ secrets: [REVENUECAT_SECRET_KEY, REVENUECAT_WEBHOOK_AUTH], timeoutSeconds: 30 }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }
  try {
    const result = await entitlements.handleRevenueCatWebhook({ authorization: req.get('authorization') }, req.body, REVENUECAT_WEBHOOK_AUTH.value(), entitlementDeps());
    res.status(200).json(result);
  } catch (e) {
    if (e instanceof HandlerError && e.code === 'unauthenticated') {
      res.status(401).end();
      return;
    }
    log.error('webhook_failed', { error: (e as Error)?.name ?? 'Error' });
    // Non-2xx makes RevenueCat retry later.
    res.status(500).end();
  }
});
