import { AppError } from '../app-error';

export class PermissionError extends AppError {
  constructor(
    message: string,
    errorCode: string,
    userMessageKey: string,
    userMessageArgs?: Record<string, string>,
    correlationId?: string,
    cause?: unknown
  ) {
    super(message, 'permission', errorCode, userMessageKey, userMessageArgs, correlationId, cause);
  }
}
