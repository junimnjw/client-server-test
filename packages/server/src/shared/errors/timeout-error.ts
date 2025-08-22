import { AppError } from '../app-error';

export class TimeoutError extends AppError {
  constructor(
    message: string,
    errorCode: string,
    userMessageKey: string,
    userMessageArgs?: Record<string, string>,
    correlationId?: string,
    cause?: unknown
  ) {
    super(message, 'timeout', errorCode, userMessageKey, userMessageArgs, correlationId, cause);
  }
}
