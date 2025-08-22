import { Request, Response, NextFunction } from 'express';
import { AppError } from './app-error';
import { createApiError, ErrorCodes } from './error-types';

// Common error handler middleware
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Generate correlation ID for request tracking
  const correlationId = req.headers['x-correlation-id'] as string || 
                      req.headers['x-request-id'] as string || 
                      `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  let apiError: ReturnType<typeof createApiError>;

  if (error instanceof AppError) {
    // Handle custom AppError instances
    apiError = createApiError(
      error.errorCode as any, // Type assertion for now
      error.type,
      error.userMessageKey,
      error.userMessageArgs,
      correlationId
    );
  } else {
    // Handle generic errors
    console.error('Unhandled error:', error);
    apiError = createApiError(
      ErrorCodes.INTERNAL_ERROR,
      'internal',
      'error.internal.server_error',
      undefined,
      correlationId
    );
  }

  // Set appropriate HTTP status code based on error type
  const statusCode = getStatusCodeForErrorType(apiError.type);
  
  res.status(statusCode).json({
    error: apiError
  });
}

// Helper function to determine HTTP status code based on error type
function getStatusCodeForErrorType(errorType: string): number {
  switch (errorType) {
    case 'validation':
      return 400;
    case 'permission':
      return 403;
    case 'not_found':
      return 404;
    case 'conflict':
      return 409;
    case 'timeout':
      return 408;
    case 'network':
      return 503;
    case 'internal':
    default:
      return 500;
  }
}

// Async error wrapper for route handlers
export function asyncErrorHandler<T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<void>
) {
  return (req: T, res: U, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
