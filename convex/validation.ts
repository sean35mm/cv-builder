import { SECTION_IDS } from '../lib/profile/domain';

const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])?$/;
const SECTION_ID_SET = new Set<string>(SECTION_IDS);

export function requiredText(
  value: string,
  field: string,
  max: number
): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > max) {
    throw new Error(`${field} must be between 1 and ${max} characters`);
  }
  return normalized;
}

export function optionalText(
  value: string | undefined,
  field: string,
  max: number
): string | undefined {
  if (value === undefined) return undefined;
  const normalized = value.trim();
  if (normalized.length > max) {
    throw new Error(`${field} must be ${max} characters or fewer`);
  }
  return normalized || undefined;
}

export function normalizeEmail(value: string, field = 'Email'): string {
  const email = requiredText(value, field, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(`${field} is invalid`);
  }
  return email;
}

export function normalizeUsername(value: string): string {
  const username = value.trim().toLowerCase();
  if (!USERNAME_PATTERN.test(username)) {
    throw new Error(
      'Username must be 3-30 lowercase letters, numbers, underscores, or hyphens'
    );
  }
  return username;
}

export function boundedArray<T>(values: T[], field: string, max: number): T[] {
  if (values.length > max) {
    throw new Error(`${field} cannot contain more than ${max} items`);
  }
  return values;
}

export function normalizeSectionsOrder(
  values?: string[]
): string[] | undefined {
  if (values === undefined) return undefined;
  boundedArray(values, 'Section order', SECTION_IDS.length);
  if (
    new Set(values).size !== values.length ||
    values.some((value) => !SECTION_ID_SET.has(value))
  ) {
    throw new Error('Section order contains invalid or duplicate sections');
  }
  return values;
}

export function normalizeSectionsVisibility(
  values: Record<string, boolean>
): Record<string, boolean> {
  const entries = Object.entries(values);
  if (
    entries.length > SECTION_IDS.length ||
    entries.some(([section]) => !SECTION_ID_SET.has(section))
  ) {
    throw new Error('Section visibility contains invalid sections');
  }
  return Object.fromEntries(entries);
}

export function validateRating(value?: number): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error('Rating must be an integer between 1 and 5');
  }
  return value;
}

export function validateReportingDays(value?: number): number {
  const days = value ?? 30;
  if (![7, 30, 90].includes(days)) {
    throw new Error('Reporting period must be 7, 30, or 90 days');
  }
  return days;
}
