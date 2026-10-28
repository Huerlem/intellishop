/**
 * Versions of the legal documents the app currently presents. They must match the front
 * matter of docs/legal/*.md (checked by __tests__/legal.versions.test.ts).
 * A MAJOR change of the Terms version triggers re-acceptance (L4-03).
 */
export const CURRENT_TERMS_VERSION = '0.2.0-draft';
export const CURRENT_PRIVACY_VERSION = '0.2.0-draft';

export function majorOf(version: string | null | undefined): number {
  const m = /^(\d+)\./.exec(version ?? '');
  return m ? Number(m[1]) : -1;
}

/** True when the user must accept the current Terms (never accepted, or a new major version). */
export function needsTermsAcceptance(accepted: string | null | undefined): boolean {
  if (!accepted) return true;
  return majorOf(accepted) < majorOf(CURRENT_TERMS_VERSION);
}

/**
 * Consent text versions (L3-01 AI, L3-03 dietary). Changing what is sent, the purpose or the AI
 * provider requires a new version, which asks the user again.
 */
export const AI_CONSENT_VERSION = '1.0.0';
export const DIETARY_CONSENT_VERSION = '1.0.0';

/**
 * AI provider named on the consent screen (Apple Guideline 5.1.2(i)). The server adapter is
 * Anthropic's Messages API (functions/src/providers/anthropic.ts). [OWNER TO CONFIRM before
 * release: provider contract and data terms — LEGAL_RELEASE_GATE B-L05.] Changing the provider
 * requires a new AI_CONSENT_VERSION.
 */
export const AI_PROVIDER_DISPLAY_NAME = 'Anthropic (Claude)';
