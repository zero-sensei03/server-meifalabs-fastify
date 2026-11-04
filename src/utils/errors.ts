
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function notFound(message = 'Data not found'): AppError {
  return new AppError(404, 'NOT_FOUND', message);
}

export function conflict(message = 'Data already exists or is in use'): AppError {
  return new AppError(409, 'CONFLICT', message);
}

export function badRequest(message = 'Invalid request'): AppError {
  return new AppError(400, 'BAD_REQUEST', message);
}

export function unauthorized(message = 'Authentication is required'): AppError {
  return new AppError(401, 'UNAUTHORIZED', message);
}

export function forbidden(message = 'Access denied'): AppError {
  return new AppError(403, 'FORBIDDEN', message);
}