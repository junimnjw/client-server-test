import { AppError } from '../app-error';

export class InternalError extends AppError {
  constructor(
    message: string,
    errorCode: string,
    userMessageKey: string,
    userMessageArgs?: Record<string, string>,
    correlationId?: string,
    cause?: unknown
  ) {
    super(message, 'internal', errorCode, userMessageKey, userMessageArgs, correlationId, cause);
  }
}
