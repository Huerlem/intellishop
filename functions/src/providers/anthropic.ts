/**
 * Anthropic Messages API adapter (provisional provider, AI_ARCHITECTURE.md §6.3).
 *
 * Structured output is obtained by forcing a single tool whose input schema is the recipe JSON
 * schema (tool_choice = that tool); the tool input is then re-validated by
 * shared/ai/recipeSchema.ts. The API key comes from Secret Manager (defineSecret) and is only
 * ever used here, on the server.
 *
 * STATUS: not activated. No key is configured; no request has been made. Enabling it requires
 * the owner to create a key in a new account/project, store it in Secret Manager and approve
 * deployment (checkpoint). Before activation, re-verify request/response fields against the
 * current Anthropic API documentation and run the evaluation set (FT-12).
 */
import { ProviderError, type AiProvider, type ProviderRequest, type ProviderResponse } from '../ports';

export type AnthropicOptions = {
  apiKey: () => string;
  model: string; // e.g. 'claude-haiku-5-5' (provisional; quality-gated)
  baseUrl?: string;
  fetchImpl?: typeof fetch;
};

const TOOL_NAME = 'return_recipes';

export function createAnthropicProvider(opts: AnthropicOptions): AiProvider {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const url = `${opts.baseUrl ?? 'https://api.anthropic.com'}/v1/messages`;
  return {
    name: 'anthropic',
    async generate(req: ProviderRequest): Promise<ProviderResponse> {
      const key = opts.apiKey();
      if (!key) throw new ProviderError('auth', 'AI provider key is not configured');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), req.timeoutMs);
      let res: Response;
      try {
        res = await fetchImpl(url, {
          method: 'POST',
          signal: controller.signal,
          headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({
            model: opts.model,
            max_tokens: req.maxOutputTokens,
            system: req.system,
            messages: [{ role: 'user', content: req.user }],
            tools: [{ name: TOOL_NAME, description: 'Return the recipe suggestions.', input_schema: req.schema }],
            tool_choice: { type: 'tool', name: TOOL_NAME },
          }),
        });
      } catch (e) {
        if ((e as Error)?.name === 'AbortError') throw new ProviderError('timeout', 'AI provider timed out');
        throw new ProviderError('unavailable', 'AI provider unreachable');
      } finally {
        clearTimeout(timer);
      }
      if (res.status === 401 || res.status === 403) throw new ProviderError('auth', `AI provider rejected credentials (${res.status})`);
      if (res.status === 429) throw new ProviderError('rate_limited', 'AI provider rate limit');
      if (res.status >= 500 || res.status === 529) throw new ProviderError('unavailable', `AI provider error ${res.status}`);
      if (!res.ok) throw new ProviderError('bad_response', `AI provider status ${res.status}`);

      type AnthropicBody = {
        model?: string;
        stop_reason?: string | null;
        content?: { type: string; name?: string; input?: unknown }[];
        usage?: { input_tokens?: number; output_tokens?: number };
      };
      let body: AnthropicBody;
      try {
        const decoded: unknown = await res.json();
        if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) {
          throw new ProviderError('bad_response', 'AI provider returned an invalid object');
        }
        const record = decoded as Record<string, unknown>;
        if (record.content !== undefined && !Array.isArray(record.content)) {
          throw new ProviderError('bad_response', 'AI provider returned invalid content');
        }
        body = decoded as AnthropicBody;
      } catch {
        throw new ProviderError('bad_response', 'AI provider returned invalid JSON');
      }
      if (body.stop_reason === 'refusal') throw new ProviderError('refused', 'AI provider refused');
      if (body.stop_reason === 'max_tokens') throw new ProviderError('truncated', 'AI output truncated');
      const tool = body.content?.find((c) => c.type === 'tool_use' && c.name === TOOL_NAME);
      if (!tool) throw new ProviderError('bad_response', 'AI provider returned no structured output');
      return {
        json: tool.input,
        model: body.model ?? opts.model,
        stopReason: body.stop_reason ?? null,
        usage: { inputTokens: body.usage?.input_tokens ?? 0, outputTokens: body.usage?.output_tokens ?? 0 },
      };
    },
  };
}
