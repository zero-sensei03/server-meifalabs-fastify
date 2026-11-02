
import { Prisma } from '../generated/prisma/client.js';
import type { FastifyError } from 'fastify';
import { AppError } from './errors.js';

export interface MappedError {
  statusCode: number;
  code: string;
  message: string;
  errors?: Record<string, string[]>;
}

interface ValidationIssue {
  instancePath?: string;
  keyword?: string;
  message?: string;
  params?: Record<string, unknown>;
}

function isValidationError(
  error: unknown,
): error is FastifyError & { validation: ValidationIssue[] } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'validation' in error &&
    Array.isArray(error.validation)
  );
}

function getFieldPath(issue: ValidationIssue): string {
  const path = (issue.instancePath ?? '')
    .replace(/^\//, '')
    .replace(/\//g, '.');

  if (path) {
    return path;
  }

  const missingProperty = issue.params?.missingProperty;

  if (typeof missingProperty === 'string') {
    return missingProperty;
  }

  const additionalProperty = issue.params?.additionalProperty;

  if (typeof additionalProperty === 'string') {
    return additionalProperty;
  }

  return 'general';
}

function humanizeField(field: string): string {
  return field
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .toLowerCase();
}

function getValidationMessage(issue: ValidationIssue): string {
  const field = humanizeField(getFieldPath(issue));
  const params = issue.params ?? {};
  const limit = params.limit;

  switch (issue.keyword) {
    case 'required':
      return `The ${field} field is required.`;

    case 'minLength':
      return `The ${field} must be at least ${limit} characters.`;

    case 'maxLength':
      return `The ${field} may not be greater than ${limit} characters.`;

    case 'format':
      if (params.format === 'email') {
        return `The ${field} must be a valid email address.`;
      }

      return `The ${field} format is invalid.`;

    case 'pattern':
      if (field === 'otp') {
        return 'The OTP must contain exactly 6 digits.';
      }

      return `The ${field} format is invalid.`;

    case 'additionalProperties':
      return `The ${field} field is not allowed.`;

    case 'type':
      return `The ${field} must have the correct data type.`;

    case 'minimum':
      return `The ${field} must be at least ${limit}.`;

    case 'maximum':
      return `The ${field} may not be greater than ${limit}.`;

    default:
      return `The ${field} is invalid.`;
  }
}

function formatValidationErrors(
  error: FastifyError & { validation: ValidationIssue[] },
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  for (const issue of error.validation) {
    const field = getFieldPath(issue);
    const message = getValidationMessage(issue);

    errors[field] ??= [];

    if (!errors[field].includes(message)) {
      errors[field].push(message);
    }
  }

  return errors;
}

function getUniqueConstraintMessage(
  error: Prisma.PrismaClientKnownRequestError,
): string {
  const target = error.meta?.target;

  const fields = Array.isArray(target)
    ? target.map(String)
    : typeof target === 'string'
      ? [target]
      : [];

  if (fields.includes('code')) {
    return 'A record with this code already exists.';
  }

  if (fields.includes('slug')) {
    return 'A record with this URL identifier already exists.';
  }

  if (fields.includes('username')) {
    return 'This username is already taken.';
  }

  if (fields.includes('email')) {
    return 'An account with this email address already exists.';
  }

  return 'A record with the same unique value already exists.';
}

export function mapError(error: unknown): MappedError {
  // Fastify request validation errors.
  if (isValidationError(error)) {
    return {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'The given data was invalid.',
      errors: formatValidationErrors(error),
    };
  }

  // Application errors.
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
    };
  }

  // Prisma database errors.
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return {
          statusCode: 409,
          code: 'DUPLICATE_RECORD',
          message: getUniqueConstraintMessage(error),
        };

      case 'P2003':
        return {
          statusCode: 409,
          code: 'RELATED_RECORD_CONFLICT',
          message:
            'This record is related to other data and cannot be deleted or changed.',
        };

      case 'P2025':
        return {
          statusCode: 404,
          code: 'RECORD_NOT_FOUND',
          message: 'The requested record was not found.',
        };

      case 'P2014':
        return {
          statusCode: 409,
          code: 'RELATIONSHIP_CONFLICT',
          message: 'This change would violate a required relationship.',
        };

      case 'P2000':
        return {
          statusCode: 400,
          code: 'VALUE_TOO_LONG',
          message: 'One of the provided values is too long.',
        };

      case 'P2006':
        return {
          statusCode: 400,
          code: 'INVALID_VALUE',
          message: 'One of the provided values is invalid.',
        };

      case 'P2011':
      case 'P2012':
        return {
          statusCode: 400,
          code: 'REQUIRED_VALUE_MISSING',
          message: 'A required value is missing.',
        };

      case 'P2034':
        return {
          statusCode: 409,
          code: 'TRANSACTION_CONFLICT',
          message:
            'The operation conflicted with another change. Please try again.',
        };

      default:
        return {
          statusCode: 500,
          code: 'DATABASE_ERROR',
          message: 'The database operation could not be completed.',
        };
    }
  }

  // Never expose unknown internal errors to clients.
  return {
    statusCode: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred. Please try again later.',
  };
}
