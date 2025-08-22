import { logInfo } from '../logger';
import { ErrorBehavior } from './error-handler';

// UX designer defined error severity and user experience settings
// You can modify this file to change the error message and behavior.

export const ERROR_CONFIG: Record<string, ErrorBehavior> = {
  // SDK & Tools related errors
  E_SDK_NOT_INSTALLED: {
    message: 'Tizen SDK is not installed. You need to install the SDK.',
    severity: 'error',
    actions: [
      {
        label: 'Install SDK',
        action: async () => {
          // Execute SDK installation command
          logInfo('Starting SDK installation');
        },
      },
      {
        label: 'View Installation Guide',
        action: () => {
          // Show installation guide
          logInfo('Showing installation guide');
        },
      },
    ],
  },

  E_TOOL_MISSING: {
    message: 'Required tool is not installed: {toolName}',
    severity: 'warning',
    actions: [
      {
        label: 'Install Tool',
        action: async () => {
          logInfo('Starting tool installation');
        },
      },
    ],
  },

  E_UPDATE_CHECK_FAILED: {
    message:
      'Failed to check for available updates. Please check your network connection.',
    severity: 'warning',
    actions: [
      {
        label: 'Retry Check',
        action: () => Promise.resolve(),
      },
      {
        label: 'Check Network',
        action: () => {
          logInfo('Checking network connection');
        },
      },
    ],
    autoRetry: true,
    retryDelay: 3000,
  },

  E_UPDATE_INSTALL_FAILED: {
    message: 'SDK update installation failed. Please try again or install manually.',
    severity: 'error',
    actions: [
      {
        label: 'Retry Installation',
        action: () => Promise.resolve(),
      },
      {
        label: 'Manual Install Guide',
        action: () => {
          logInfo('Showing manual installation guide');
        },
      },
      {
        label: 'View Error Details',
        action: () => {
          logInfo('Showing detailed error information');
        },
      },
    ],
  },

  E_UPDATE_NOT_AVAILABLE: {
    message: 'No updates are currently available.',
    severity: 'info',
    actions: [
      {
        label: 'Check Again Later',
        action: () => {
          logInfo('Setting reminder to check updates later');
        },
      },
    ],
  },

  E_SDK_INIT_FAILED: {
    message: 'SDK initialization failed. Please check your SDK installation.',
    severity: 'error',
    actions: [
      {
        label: 'Retry Initialization',
        action: () => Promise.resolve(),
      },
      {
        label: 'Reinstall SDK',
        action: async () => {
          logInfo('Starting SDK reinstallation');
        },
      },
      {
        label: 'Check Requirements',
        action: () => {
          logInfo('Checking system requirements');
        },
      },
    ],
  },

  // Network & Connection related errors
  E_NETWORK_TIMEOUT: {
    message: 'Server connection timed out. Please check your network status.',
    severity: 'warning',
    actions: [
      {
        label: 'Retry',
        action: () => Promise.resolve(),
      },
      {
        label: 'Check Network Settings',
        action: () => {
          logInfo('Checking network settings');
        },
      },
    ],
    autoRetry: true,
    retryDelay: 5000,
  },

  E_CONNECTION_REFUSED: {
    message: 'Cannot connect to server. Please check if the server is running.',
    severity: 'error',
    actions: [
      {
        label: 'Restart Server',
        action: async () => {
          logInfo('Restarting server');
        },
      },
      {
        label: 'Check Connection Status',
        action: () => {
          logInfo('Checking connection status');
        },
      },
    ],
  },

  // Permission related errors
  E_PERMISSION_DENIED: {
    message: 'Insufficient permissions. Please run with administrator privileges.',
    severity: 'error',
    actions: [
      {
        label: 'Restart as Administrator',
        action: () => {
          logInfo('Guidance for administrator privileges restart');
        },
      },
      {
        label: 'Check Permission Settings',
        action: () => {
          logInfo('Checking permission settings');
        },
      },
    ],
  },

  // File System related errors
  E_DISK_SPACE_FULL: {
    message: 'Insufficient disk space. Please clean up unnecessary files.',
    severity: 'error',
    actions: [
      {
        label: 'Disk Cleanup',
        action: () => {
          logInfo('Running disk cleanup tool');
        },
      },
      {
        label: 'Change Installation Path',
        action: () => {
          logInfo('Changing installation path');
        },
      },
    ],
  },

  E_FILE_NOT_FOUND: {
    message: 'Required file not found: {fileName}',
    severity: 'error',
    actions: [
      {
        label: 'Check File Path',
        action: () => {
          logInfo('Checking file path');
        },
      },
      {
        label: 'Reinstall',
        action: async () => {
          logInfo('Starting reinstallation');
        },
      },
    ],
  },

  // Process & Execution related errors
  E_PROCESS_ALREADY_RUNNING: {
    message: 'A process is already running.',
    severity: 'warning',
    actions: [
      {
        label: 'Terminate Existing Process',
        action: async () => {
          logInfo('Terminating existing process');
        },
      },
      {
        label: 'Start New Process',
        action: async () => {
          logInfo('Starting new process');
        },
      },
    ],
  },

  E_EXECUTION_TIMEOUT: {
    message: 'Operation timed out. Please try again.',
    severity: 'warning',
    actions: [
      {
        label: 'Retry',
        action: () => Promise.resolve(),
      },
      {
        label: 'Change Timeout Settings',
        action: () => {
          logInfo('Changing timeout settings');
        },
      },
    ],
    autoRetry: true,
    retryDelay: 3000,
  },

  // Generic errors
  E_INTERNAL_ERROR: {
    message: 'Internal error occurred. Please check logs if the problem persists.',
    severity: 'error',
    actions: [
      {
        label: 'View Logs',
        action: () => {
          logInfo('Checking logs');
        },
      },
      {
        label: 'Report Issue',
        action: () => {
          logInfo('Reporting issue');
        },
      },
    ],
  },

  E_VALIDATION_ERROR: {
    message: 'Invalid input value: {fieldName}',
    severity: 'warning',
    actions: [
      {
        label: 'Check Input Value',
        action: () => {
          logInfo('Checking input value');
        },
      },
    ],
  },

  E_NOT_IMPLEMENTED: {
    message: 'This feature is not yet implemented.',
    severity: 'info',
    actions: [
      {
        label: 'Request Feature',
        action: () => {
          logInfo('Requesting feature');
        },
      },
    ],
  },
};

// Variable descriptions for error message templates
export const ERROR_MESSAGE_VARIABLES = {
  '{toolName}': 'Name of the required tool',
  '{fileName}': 'Name of the file that could not be found',
  '{fieldName}': 'Name of the field that failed validation',
  '{errorDetails}': 'Detailed information about the error',
  '{retryCount}': 'Number of retry attempts',
  '{maxRetries}': 'Maximum number of retries',
};

// Default settings for error severity
export const SEVERITY_DEFAULTS = {
  info: {
    showDuration: 3000,
    canDismiss: true,
  },
  warning: {
    showDuration: 5000,
    canDismiss: true,
  },
  error: {
    showDuration: 0, // 사용자가 직접 닫을 때까지
    canDismiss: false,
  },
};
