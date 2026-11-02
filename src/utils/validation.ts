
import type { FastifyError, FastifyInstance } from 'fastify';

interface ValidationIssue {
  instancePath: string;
  keyword: string;
  message?: string;
  params?: Record<string, unknown>;
}

function humanizeField(field: string): string {
  return field
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .toLowerCase();
}

function getFieldPath(issue: ValidationIssue): string {
  const path = issue.instancePath
    .replace(/^\//, '')
    .replace(/\//g, '.');

  if (path) {
    return path;
  }

  const missingProperty = issue.params?.missingProperty;

  return typeof missingProperty === 'string'
    ? missingProperty
    : 'general';
}

function getValidationMessage(issue: ValidationIssue): string {
  const field = humanizeField(getFieldPath(issue));
  const limit = issue.params?.limit;

  switch (issue.keyword) {
    case 'required':
      return `The ${field} field is required.`;

    case 'minLength':
      return `The ${field} must be at least ${limit} characters.`;

    case 'maxLength':
      return `The ${field} may not be greater than ${limit} characters.`;

    case 'format':
      if (issue.params?.format === 'email') {
        return `The ${field} must be a valid email address.`;
      }

      return `The ${field} format is invalid.`;

    case 'pattern':
      if (field === 'otp') {
        return 'The OTP must contain exactly 6 digits.';
      }

      return `The ${field} format is invalid.`;

    case 'additionalProperties':
      return 'The request contains an unsupported field.';

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

export function formatValidationErrors(
  error: FastifyError,
): Record<string, string[]> {
  const issues = (
    error as FastifyError & {
      validation?: ValidationIssue[];
    }
  ).validation;

  const errors: Record<string, string[]> = {};

  for (const issue of issues ?? []) {
    const field = getFieldPath(issue);
    const message = getValidationMessage(issue);

    errors[field] ??= [];

    if (!errors[field].includes(message)) {
      errors[field].push(message);
    }
  }

  return errors;
}

export function registerValidationHandler(
  app: FastifyInstance,
): void {
  app.setErrorHandler((error: any, request, reply) => {
    if (error.validation) {
      return reply.code(400).send({
        success: false,
        message: 'The given data was invalid.',
        errors: formatValidationErrors(error),
        request_id: request.id,
      });
    }

    // Error lain tetap diteruskan ke handler global aplikasi.
    throw error;
  });
}
