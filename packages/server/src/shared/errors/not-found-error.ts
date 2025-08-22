import { AppError } from '../app-error';

export class NotFoundError extends AppError {
  constructor(
    message: string,
    errorCode: string,
    userMessageKey: string,
    userMessageArgs?: Record<string, string>,
    correlationId?: string,
    cause?: unknown
  ) {
    super(message, 'not_found', errorCode, userMessageKey, userMessageArgs, correlationId, cause);
  }
}
