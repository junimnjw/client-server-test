// Basic error types for server API responses
// API error response type definition according to error-handling.mdc
export interface ApiError {
  code: string; // e.g., 'E-EM-01'
  type: 'validation' | 'network' | 'permission' | 'not_found' | 'internal' | 'timeout' | 'conflict';
  userMessageKey: string; // i18n key for user-friendly message
  userMessageArgs?: Record<string, string>; // i18n arguments
  correlationId?: string; // for tracking requests
  timestamp: string;
}

// Common error codes following the schema
export const ErrorCodes = {
  // Network & Connection
  NETWORK_TIMEOUT: 'E_NETWORK_TIMEOUT',
  CONNECTION_REFUSED: 'E_CONNECTION_REFUSED',
  SERVER_UNREACHABLE: 'E_SERVER_UNREACHABLE',
  
  // SDK & Tools
  SDK_NOT_INSTALLED: 'E_SDK_NOT_INSTALLED',
  TOOL_MISSING: 'E_TOOL_MISSING',
  SDK_VERSION_MISMATCH: 'E_SDK_VERSION_MISMATCH',
  UPDATE_CHECK_FAILED: 'E_UPDATE_CHECK_FAILED',
  UPDATE_INSTALL_FAILED: 'E_UPDATE_INSTALL_FAILED',
  UPDATE_NOT_AVAILABLE: 'E_UPDATE_NOT_AVAILABLE',
  SDK_INIT_FAILED: 'E_SDK_INIT_FAILED',
  
  // File System
  FILE_NOT_FOUND: 'E_FILE_NOT_FOUND',
  PERMISSION_DENIED: 'E_PERMISSION_DENIED',
  DISK_SPACE_FULL: 'E_DISK_SPACE_FULL',
  PATH_EXISTS: 'E_PATH_EXISTS',
  
  // Process & Execution
  PROCESS_ALREADY_RUNNING: 'E_PROCESS_ALREADY_RUNNING',
  EXECUTION_TIMEOUT: 'E_EXECUTION_TIMEOUT',
  INVALID_COMMAND: 'E_INVALID_COMMAND',
  
  // Generic
  VALIDATION_ERROR: 'E_VALIDATION_ERROR',
  INTERNAL_ERROR: 'E_INTERNAL_ERROR',
  NOT_IMPLEMENTED: 'E_NOT_IMPLEMENTED'
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// Utility function to create standardized API errors
export function createApiError(
  code: ErrorCode, 
  type: ApiError['type'],
  userMessageKey: string,
  userMessageArgs?: Record<string, string>,
  correlationId?: string
): ApiError {
  return {
    code,
    type,
    userMessageKey,
    userMessageArgs,
    correlationId,
    timestamp: new Date().toISOString()
  };
}
