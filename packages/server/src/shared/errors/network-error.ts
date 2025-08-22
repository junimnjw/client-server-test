import { AppError } from '../app-error';

export class NetworkError extends AppError {
  constructor(
    message: string,
    errorCode: string,
    userMessageKey: string,
    userMessageArgs?: Record<string, string>,
    correlationId?: string,
    cause?: unknown
  ) {
    super(message, 'network', errorCode, userMessageKey, userMessageArgs, correlationId, cause);
  }
}
