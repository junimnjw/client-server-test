import { AppError } from '../app-error';

export class ConflictError extends AppError {
  constructor(
    message: string,
    errorCode: string,
    userMessageKey: string,
    userMessageArgs?: Record<string, string>,
    correlationId?: string,
    cause?: unknown
  ) {
    super(message, 'conflict', errorCode, userMessageKey, userMessageArgs, correlationId, cause);
  }
}
