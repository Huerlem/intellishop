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
