
export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
  error: {
    code: string;
    details?: unknown;
  };
  request_id?: string;
}

export function successResponse<T>(
  message: string,
  data: T,
): ApiSuccess<T> {
  return {
    success: true,
    message,
    data,
  };
}

export function paginatedResponse<T>(
  message: string,
  data: T[],
  page: number,
  limit: number,
  total: number,
): ApiSuccess<T[]> {
  return {
    success: true,
    message,
    data,
    meta: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
}

export function errorResponse(
  message: string,
  code: string,
  requestId?: string,
  details?: unknown,
): ApiError {
  return {
    success: false,
    message,
    error: {
      code,
      ...(details === undefined ? {} : { details }),
    },
    ...(requestId ? { request_id: requestId } : {}),
  };
}
