/** Input parsing for editors (pure; tested in __tests__/ui/presenters.test.ts). */
import { MAX_QUANTITY } from '@/shared/domain/units';

/** Parses "2", "1.5", "0,5" → number; null when invalid. `allowZero` for Pantry ("run out"). */
export function parseQuantity(raw: string, allowZero = false): number | null {
  const s = raw.trim().replace(',', '.');
  if (!/^\d{1,6}(\.\d{1,3})?$/.test(s)) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n > MAX_QUANTITY) return null;
  if (n === 0 && !allowZero) return null;
  return n;
}

/** Parses a UK date "DD/MM/YYYY" (or D/M/YY) to local-midnight epoch ms; null when invalid. */
export function parseUkDate(raw: string): number | null {
  const m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/.exec(raw.trim());
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  if (year < 2000 || year > 2100) return null;
  return d.getTime();
}

export function formatUkDate(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Local midnight `days` from now. */
export function daysFromNow(days: number, now = Date.now()): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(raw: string): string | null {
  if (!raw.trim()) return 'Enter your email address.';
  return EMAIL_PATTERN.test(raw.trim()) ? null : 'Enter a valid email address.';
}

/** Minimum 8 characters (NCSC guidance favours length over composition rules). */
export function validateNewPassword(raw: string): string | null {
  if (raw.length < 8) return 'Use at least 8 characters.';
  if (raw.length > 128) return 'Use 128 characters or fewer.';
  return null;
}
