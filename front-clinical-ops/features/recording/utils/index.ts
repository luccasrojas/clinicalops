export { 
  parseRecordingError, 
  isMediaRecorderSupported, 
  getNotSupportedError,
  RecordingErrorType 
} from './recording-errors';
export type { RecordingError } from './recording-errors';

export {
  categorizeError,
  getRecoveryStrategy,
  calculateBackoff,
  retryWithBackoff,
  isRetryableError,
  requiresUserAction,
  getUserFriendlyMessage,
  ErrorCategory,
  ERROR_RECOVERY_STRATEGIES,
} from './error-recovery';
export type { ErrorRecoveryStrategy, RecoveryActionType } from './error-recovery';

export {
  detectBrowser,
  getBrowserPermissionInstructions,
  getErrorMessage,
  formatErrorMessage,
  getShortErrorMessage,
  hasHelpLink,
  getHelpLink,
  ERROR_MESSAGES,
} from './error-messages';
export type { ErrorMessage } from './error-messages';
