export abstract class AppError extends Error {
    protected readonly _type: 'validation' | 'network' | 'permission' | 'not_found' | 'internal' | 'timeout' | 'conflict';
    protected readonly _errorCode: string; // e.g., 'E-EM-01'
    public readonly userMessageKey: string; // i18n key for user-friendly message
    public readonly userMessageArgs?: Record<string, string>; // i18n arguments
    public readonly correlationId?: string; // for tracking requests
    public readonly cause?: unknown;

    // Getters for abstract properties
    public get type(): 'validation' | 'network' | 'permission' | 'not_found' | 'internal' | 'timeout' | 'conflict' {
        return this._type;
    }

    public get errorCode(): string {
        return this._errorCode;
    }
  
    constructor(
      message: string, 
      type: AppError['type'],
      errorCode: string,
      userMessageKey: string,
      userMessageArgs?: Record<string, string>,
      correlationId?: string,
      cause?: unknown
    ) {
      super(message);
      this.name = new.target.name;
      this._type = type;
      this._errorCode = errorCode;
      this.userMessageKey = userMessageKey;
      this.userMessageArgs = userMessageArgs;
      this.correlationId = correlationId;
      this.cause = cause;
  
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      }
    }

    // Convert to ApiError format for API responses
    toApiError(): import('./error-types').ApiError {
      return {
        code: this.errorCode,
        type: this.type,
        userMessageKey: this.userMessageKey,
        userMessageArgs: this.userMessageArgs,
        correlationId: this.correlationId,
        timestamp: new Date().toISOString()
      };
    }
  }
  