
import { badRequest } from './errors.js';

export function toISOString(
  value: Date | null | undefined,
): string | null {
  if (value == null) {
    return null;
  }

  if (Number.isNaN(value.getTime())) {
    throw badRequest('The provided date is invalid.');
  }

  return value.toISOString();
}

export function parseDate(
  value: string,
  field = 'Date',
): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw badRequest(`${field} must be a valid date.`);
  }

  return date;
}

export function isValidDate(value: Date): boolean {
  return !Number.isNaN(value.getTime());
}
