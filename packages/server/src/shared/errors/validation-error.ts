import { AppError } from '../app-error';

export class ValidationError extends AppError {
  constructor(
    message: string,
    errorCode: string,
    userMessageKey: string,
    userMessageArgs?: Record<string, string>,
    correlationId?: string,
    cause?: unknown
  ) {
    super(message, 'validation', errorCode, userMessageKey, userMessageArgs, correlationId, cause);
  }
}
