
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

export function notFound(message = 'Data tidak ditemukan'): AppError {
  return new AppError(404, 'NOT_FOUND', message);
}

export function conflict(message = 'Data sudah digunakan'): AppError {
  return new AppError(409, 'CONFLICT', message);
}

export function badRequest(message = 'Permintaan tidak valid'): AppError {
  return new AppError(400, 'BAD_REQUEST', message);
}

export function unauthorized(message = 'Autentikasi diperlukan'): AppError {
  return new AppError(401, 'UNAUTHORIZED', message);
}

export function forbidden(message = 'Akses ditolak'): AppError {
  return new AppError(403, 'FORBIDDEN', message);
}
