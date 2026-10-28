import { handleRevenueCatWebhook, mapRevenueCatSubscriber, recomputeEntitlement, safeEqual, type EntitlementDeps } from '@/functions/src/handlers/entitlements';
import { createAnthropicProvider } from '@/functions/src/providers/anthropic';
import { captureLogger, createMemoryServerStore } from '../../test-utils/memoryServerStore';

const NOW = Date.UTC(2026, 9, 28, 12);
const iso = (ms: number) => new Date(ms).toISOString();
const DAY = 86400000;
const products = { 'intellishop.standard.monthly': 'standard', 'intellishop.premium.monthly': 'premium' } as const;

/** Fixture in the shape of RevenueCat REST v1 GET /subscribers/{id} (to re-verify before M6). */
const subscriber = (subs: Record<string, Record<string, unknown>>) => ({ subscriber: { subscriptions: subs } });

describe('RevenueCat subscriber → store subscriptions', () => {
  it('maps active, cancelled-but-active, grace, billing retry, expired and refunded', () => {
    const m = (s: Record<string, unknown>) => mapRevenueCatSubscriber(subscriber({ 'intellishop.premium.monthly': { store: 'app_store', ...s } }), products, NOW)[0].status;
    expect(m({ expires_date: iso(NOW + DAY) })).toBe('active');
    expect(m({ expires_date: iso(NOW + DAY), unsubscribe_detected_at: iso(NOW - DAY) })).toBe('cancelled_active');
    expect(m({ expires_date: iso(NOW - DAY), grace_period_expires_date: iso(NOW + DAY) })).toBe('in_grace_period');
    expect(m({ expires_date: iso(NOW - DAY), billing_issues_detected_at: iso(NOW - DAY) })).toBe('in_billing_retry');
    expect(m({ expires_date: iso(NOW - DAY) })).toBe('expired');
    expect(m({ expires_date: iso(NOW + DAY), refunded_at: iso(NOW) })).toBe('refunded');
  });

  it('ignores unknown products and non-App Store purchases', () => {
    expect(mapRevenueCatSubscriber(subscriber({ 'other.product': { store: 'app_store', expires_date: iso(NOW + DAY) } }), products, NOW)).toEqual([]);
    expect(mapRevenueCatSubscriber(subscriber({ 'intellishop.premium.monthly': { store: 'play_store', expires_date: iso(NOW + DAY) } }), products, NOW)).toEqual([]);
    expect(mapRevenueCatSubscriber(null, products, NOW)).toEqual([]);
  });
});

describe('entitlement recompute and webhook', () => {
  const deps = (body: unknown): EntitlementDeps & { store: ReturnType<typeof createMemoryServerStore> } => ({
    store: createMemoryServerStore({ 'usage/u1': { introCreditsConsumed: 2 } }),
    clock: { now: () => NOW },
    logger: captureLogger(),
    products,
    fetchSubscriber: async () => body,
  });

  it('writes the plan from the REST API and never touches AI credits', async () => {
    const d = deps(subscriber({ 'intellishop.premium.monthly': { store: 'app_store', expires_date: iso(NOW + DAY) } }));
    const e = await recomputeEntitlement('u1', d);
    expect(e.plan).toBe('premium');
    expect(await d.store.get('entitlements/u1')).toEqual({ plan: 'premium', status: 'active', expiresAt: NOW + DAY, updatedAt: NOW });
    expect(await d.store.get('usage/u1')).toEqual({ introCreditsConsumed: 2 });
  });

  it('webhook requires the shared authorisation value (constant-time compare)', async () => {
    const d = deps(subscriber({}));
    await expect(handleRevenueCatWebhook({ authorization: 'wrong' }, { event: { app_user_id: 'u1' } }, 'Bearer s3cret', d)).rejects.toMatchObject({ reason: 'WEBHOOK_AUTH' });
    await expect(handleRevenueCatWebhook({}, {}, '', d)).rejects.toMatchObject({ reason: 'WEBHOOK_AUTH' });
    await expect(handleRevenueCatWebhook({ authorization: 'Bearer s3cret' }, { event: { app_user_id: 'u1', type: 'RENEWAL' } }, 'Bearer s3cret', d)).resolves.toEqual({ ok: true, ignored: false });
    await expect(handleRevenueCatWebhook({ authorization: 'Bearer s3cret' }, { event: { app_user_id: '$RCAnonymousID:abc' } }, 'Bearer s3cret', d)).resolves.toEqual({ ok: true, ignored: true });
    expect(safeEqual('abc', 'abd')).toBe(false);
  });
});

describe('Anthropic adapter (fake fetch; no network, no key)', () => {
  const okBody = {
    model: 'claude-haiku-5-5',
    stop_reason: 'tool_use',
    content: [{ type: 'tool_use', name: 'return_recipes', input: { recipes: [] } }],
    usage: { input_tokens: 12, output_tokens: 34 },
  };
  const fake = (status: number, body: unknown) => jest.fn(async () => ({ status, ok: status >= 200 && status < 300, json: async () => body }) as unknown as Response);
  const req = { system: 's', user: 'u', schema: { type: 'object' }, maxOutputTokens: 100, timeoutMs: 1000 };

  it('sends a forced tool call and returns the tool input with usage', async () => {
    const f = fake(200, okBody);
    const p = createAnthropicProvider({ apiKey: () => 'test-key', model: 'claude-haiku-5-5', fetchImpl: f as unknown as typeof fetch });
    await expect(p.generate(req)).resolves.toEqual({ json: { recipes: [] }, model: 'claude-haiku-5-5', stopReason: 'tool_use', usage: { inputTokens: 12, outputTokens: 34 } });
    const [, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    const sent = JSON.parse(String(init.body));
    expect(sent.tool_choice).toEqual({ type: 'tool', name: 'return_recipes' });
    expect((init.headers as Record<string, string>)['x-api-key']).toBe('test-key');
  });

  it('maps errors: missing key, 429, 5xx, refusal, truncation, no tool block', async () => {
    const mk = (status: number, body: unknown, key = 'k') => createAnthropicProvider({ apiKey: () => key, model: 'm', fetchImpl: fake(status, body) as unknown as typeof fetch });
    await expect(mk(200, okBody, '').generate(req)).rejects.toMatchObject({ kind: 'auth' });
    await expect(mk(429, {}).generate(req)).rejects.toMatchObject({ kind: 'rate_limited' });
    await expect(mk(529, {}).generate(req)).rejects.toMatchObject({ kind: 'unavailable' });
    await expect(mk(200, { ...okBody, stop_reason: 'refusal' }).generate(req)).rejects.toMatchObject({ kind: 'refused' });
    await expect(mk(200, { ...okBody, stop_reason: 'max_tokens' }).generate(req)).rejects.toMatchObject({ kind: 'truncated' });
    await expect(mk(200, { ...okBody, content: [{ type: 'text' }] }).generate(req)).rejects.toMatchObject({ kind: 'bad_response' });
  });

  it('times out with AbortController', async () => {
    const hanging = jest.fn((_url: string, init: RequestInit) => new Promise((_, reject) => init.signal?.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })))));
    const p = createAnthropicProvider({ apiKey: () => 'k', model: 'm', fetchImpl: hanging as unknown as typeof fetch });
    await expect(p.generate({ ...req, timeoutMs: 20 })).rejects.toMatchObject({ kind: 'timeout' });
  });
});
