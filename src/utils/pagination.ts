
import { badRequest } from './errors.js';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parsePositiveInteger(
  value: unknown,
  field: string,
  fallback: number,
): number {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const normalized = String(value).trim();

  if (!/^[1-9]\d*$/.test(normalized)) {
    throw badRequest(`${field} must be a positive integer.`);
  }

  const parsed = Number(normalized);

  if (!Number.isSafeInteger(parsed)) {
    throw badRequest(`${field} is outside the supported range.`);
  }

  return parsed;
}

export function parsePagination(
  query: {
    page?: unknown;
    limit?: unknown;
  },
): PaginationParams {
  const page = parsePositiveInteger(
    query.page,
    'Page',
    DEFAULT_PAGE,
  );

  const requestedLimit = parsePositiveInteger(
    query.limit,
    'Limit',
    DEFAULT_LIMIT,
  );

  const limit = Math.min(requestedLimit, MAX_LIMIT);
  const skip = (page - 1) * limit;

  if (!Number.isSafeInteger(skip)) {
    throw badRequest('The requested page is outside the supported range.');
  }

  return {
    page,
    limit,
    skip,
  };
}

export function createPaginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  return {
    page,
    limit,
    total,
    total_pages: Math.ceil(total / limit),
  };
}
