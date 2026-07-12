export function createResponse<T>(data: T, meta?: any) {
  return {
    success: true,
    data,
    meta,
    error: null,
  };
}

export function createErrorResponse(message: string, details?: any) {
  return {
    success: false,
    data: null,
    error: {
      message,
      details,
    },
  };
}
