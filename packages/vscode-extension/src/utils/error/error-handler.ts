import * as vscode from 'vscode';
import { ERROR_CONFIG } from './error-config';

// Error behavior definition interface
export interface ErrorBehavior {
  message: string;
  severity: 'info' | 'warning' | 'error';
  actions?: {
    label: string;
    action: () => Promise<void> | void;
  }[];
  autoRetry?: boolean;
  retryDelay?: number;
}

// API error interface according to error-handling.mdc rule
export interface ApiError {
  code: string; // e.g., 'E-EM-01'
  type: 'validation' | 'network' | 'permission' | 'not_found' | 'internal' | 'timeout' | 'conflict';
  userMessageKey: string; // i18n key for user-friendly message
  userMessageArgs?: Record<string, string>; // i18n arguments
  correlationId?: string; // for tracking requests
  timestamp: string;
}

// Error severity type for better type safety
export type ErrorSeverity = 'info' | 'warning' | 'error';

// Error handler that maps error codes to user behaviors
export class ErrorHandler {
  private static readonly errorBehaviors: Record<string, ErrorBehavior> = ERROR_CONFIG;

  // Cache for message display methods to avoid repeated lookups
  private static readonly messageMethods = {
    info: vscode.window.showInformationMessage,
    warning: vscode.window.showWarningMessage,
    error: vscode.window.showErrorMessage,
  } as const;

  // Default retry delay constant
  private static readonly DEFAULT_RETRY_DELAY = 3000;

  /**
   * Handle API error with defined behavior
   * @param error - API error object or generic error
   */
  static async handleApiError(error: ApiError | Error | unknown): Promise<void> {
    try {
      // Handle different error types
      if (this.isApiError(error)) {
        await this.handleDefinedError(error);
      } else if (error instanceof Error) {
        this.showGenericError(error.message);
      } else {
        this.showGenericError(String(error));
      }
    } catch (handlerError) {
      // Fallback error handling
      console.error('[ErrorHandler] Failed to handle error:', handlerError);
      this.showGenericError('Error handling failed');
    }
  }

  /**
   * Handle defined API error with configured behavior
   */
  private static async handleDefinedError(error: ApiError): Promise<void> {
    const behavior = this.errorBehaviors[error.code];

    if (!behavior) {
      this.showUndefinedError(error);
      return;
    }

    await this.executeErrorBehavior(behavior, error);
  }

  /**
   * Execute the defined error behavior
   */
  private static async executeErrorBehavior(
    behavior: ErrorBehavior,
    error: ApiError
  ): Promise<void> {
    const formattedMessage = this.formatMessage(behavior.message, error);

    if (behavior.actions?.length) {
      await this.handleActions(behavior.actions, formattedMessage);
    } else {
      this.showMessage(behavior.severity, formattedMessage);
    }

    // Schedule auto-retry if configured
    if (behavior.autoRetry) {
      this.scheduleRetry(
        error.code,
        behavior.retryDelay ?? this.DEFAULT_RETRY_DELAY
      );
    }
  }

  /**
   * Handle user actions for error resolution
   */
  private static async handleActions(
    actions: NonNullable<ErrorBehavior['actions']>,
    message: string
  ): Promise<void> {
    const actionLabels = actions.map((action) => action.label);
    const selected = await vscode.window.showErrorMessage(message, ...actionLabels);

    if (selected) {
      const action = actions.find((a) => a.label === selected);
      if (action) {
        await this.executeAction(action);
      }
    }
  }

  /**
   * Execute a single action with error handling
   */
  private static async executeAction(action: {
    label: string;
    action: () => Promise<void> | void;
  }): Promise<void> {
    try {
      await action.action();
    } catch (actionError) {
      const errorMessage =
        actionError instanceof Error ? actionError.message : String(actionError);
      vscode.window.showErrorMessage(`Action execution failed: ${errorMessage}`);
      console.error(`[ErrorHandler] Action '${action.label}' failed:`, actionError);
    }
  }

  /**
   * Format message template with error details
   */
  private static formatMessage(template: string, error: ApiError): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      // 1. First, look for the value in error.userMessageArgs (i18n arguments)
      if (error.userMessageArgs && key in error.userMessageArgs) {
        const value = error.userMessageArgs[key];
        return value !== undefined && value !== null ? String(value) : match;
      }
      
      // 2. Look for the value in the error object (code, type, etc.)
      if (Object.prototype.hasOwnProperty.call(error, key)) {
        const value = (error as unknown as Record<string, unknown>)[key];
        return value !== undefined && value !== null ? String(value) : match;
      }
      // 3. If the key is not found, keep the original template
      return match;
    });
  }

  /**
   * Show message with appropriate severity
   */
  private static showMessage(severity: ErrorSeverity, message: string): void {
    const method = this.messageMethods[severity];
    method(message);
  }

  /**
   * Schedule automatic retry with user confirmation
   */
  private static scheduleRetry(errorCode: string, delay: number): void {
    setTimeout(async () => {
      try {
        const retry = await vscode.window.showInformationMessage(
          'Would you like to retry automatically?',
          'Retry',
          'Cancel'
        );

        if (retry === 'Retry') {
          await vscode.commands.executeCommand('tizen.retryLastOperation');
        }
      } catch (retryError) {
        console.error('[ErrorHandler] Retry prompt failed:', retryError);
      }
    }, delay);
  }

  /**
   * Show undefined error message
   */
  private static showUndefinedError(error: ApiError): void {
    vscode.window.showErrorMessage(
      `Undefined Error (${error.code}): ${error.userMessageKey}`
    );
  }

  /**
   * Show generic error message
   */
  private static showGenericError(message: string): void {
    vscode.window.showErrorMessage(`Error: ${message}`);
  }

  /**
   * Type guard to check if error is an API error
   */
  private static isApiError(error: unknown): error is ApiError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'type' in error &&
      'userMessageKey' in error &&
      typeof (error as ApiError).code === 'string' &&
      typeof (error as ApiError).type === 'string' &&
      typeof (error as ApiError).userMessageKey === 'string'
    );
  }

  /**
   * Add or update error behavior (For UX Designer)
   */
  static defineErrorBehavior(errorCode: string, behavior: ErrorBehavior): void {
    this.errorBehaviors[errorCode] = behavior;
  }

  /**
   * Get all defined error behaviors (For debugging/checking)
   */
  static getErrorBehaviors(): Record<string, ErrorBehavior> {
    return { ...this.errorBehaviors };
  }

  /**
   * Check if error code has defined behavior
   */
  static hasErrorBehavior(errorCode: string): boolean {
    return errorCode in this.errorBehaviors;
  }

  /**
   * Get error behavior for specific error code
   */
  static getErrorBehavior(errorCode: string): ErrorBehavior | undefined {
    return this.errorBehaviors[errorCode];
  }

  /**
   * Handle error based on error type from error-handling.mdc
   */
  static async handleErrorByType(error: ApiError): Promise<void> {
    const behavior = this.getErrorBehaviorForType(error.type);
    if (behavior) {
      await this.executeErrorBehavior(behavior, error);
    } else {
      // Fallback to code-based behavior
      await this.handleDefinedError(error);
    }
  }

  /**
   * Get error behavior based on error type
   */
  private static getErrorBehaviorForType(errorType: ApiError['type']): ErrorBehavior | undefined {
    // Map error types to default behaviors
    const typeBehaviors: Record<ApiError['type'], Partial<ErrorBehavior>> = {
      validation: {
        severity: 'warning',
        message: 'Validation error occurred. Please check your input.',
        actions: [
          {
            label: 'Check Input',
            action: () => Promise.resolve(),
          },
        ],
      },
      network: {
        severity: 'warning',
        message: 'Network error occurred. Please check your connection.',
        actions: [
          {
            label: 'Retry',
            action: () => Promise.resolve(),
          },
        ],
        autoRetry: true,
        retryDelay: 3000,
      },
      permission: {
        severity: 'error',
        message: 'Permission denied. Please check your access rights.',
        actions: [
          {
            label: 'Check Permissions',
            action: () => Promise.resolve(),
          },
        ],
      },
      not_found: {
        severity: 'error',
        message: 'Resource not found. Please check the path or ID.',
        actions: [
          {
            label: 'Check Path',
            action: () => Promise.resolve(),
          },
        ],
      },
      internal: {
        severity: 'error',
        message: 'Internal error occurred. Please try again or contact support.',
        actions: [
          {
            label: 'Retry',
            action: () => Promise.resolve(),
          },
          {
            label: 'Report Issue',
            action: () => Promise.resolve(),
          },
        ],
      },
      timeout: {
        severity: 'warning',
        message: 'Operation timed out. Please try again.',
        actions: [
          {
            label: 'Retry',
            action: () => Promise.resolve(),
          },
        ],
        autoRetry: true,
        retryDelay: 5000,
      },
      conflict: {
        severity: 'warning',
        message: 'Conflict detected. Please resolve the conflict and try again.',
        actions: [
          {
            label: 'Resolve Conflict',
            action: () => Promise.resolve(),
          },
        ],
      },
    };

    const typeBehavior = typeBehaviors[errorType];
    if (typeBehavior) {
      return {
        message: typeBehavior.message || 'An error occurred.',
        severity: typeBehavior.severity || 'error',
        actions: typeBehavior.actions || [],
        autoRetry: typeBehavior.autoRetry || false,
        retryDelay: typeBehavior.retryDelay || this.DEFAULT_RETRY_DELAY,
      };
    }

    return undefined;
  }
}
