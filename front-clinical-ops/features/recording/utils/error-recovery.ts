/**
 * Error recovery strategies for recording feature
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { RecordingErrorType } from './recording-errors';

export type RecoveryActionType = 'retry' | 'fallback' | 'notify' | 'ignore';

export interface ErrorRecoveryStrategy {
  type: RecoveryActionType;
  maxAttempts?: number;
  backoffMs?: number;
  fallbackAction?: () => void | Promise<void>;
  userNotification?: string;
  actionable?: boolean;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Error categories for recovery strategies
 */
export enum ErrorCategory {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  SERVER_ERROR = 'SERVER_ERROR',
  
  // Storage errors
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  STORAGE_ERROR = 'STORAGE_ERROR',
  
  // Recording errors
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DEVICE_NOT_FOUND = 'DEVICE_NOT_FOUND',
  RECORDING_ERROR = 'RECORDING_ERROR',
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  
  // Upload errors
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  PRESIGNED_URL_ERROR = 'PRESIGNED_URL_ERROR',
  
  // Unknown
  UNKNOWN = 'UNKNOWN',
}

/**
 * Map of error categories to recovery strategies
 */
export const ERROR_RECOVERY_STRATEGIES: Record<ErrorCategory, ErrorRecoveryStrategy> = {
  // Network errors - retry with backoff
  [ErrorCategory.NETWORK_ERROR]: {
    type: 'retry',
    maxAttempts: 3,
    backoffMs: 1000,
    userNotification: 'Error de conexión. Reintentando automáticamente...',
    actionable: false,
    severity: 'warning',
  },
  
  [ErrorCategory.NETWORK_TIMEOUT]: {
    type: 'retry',
    maxAttempts: 2,
    backoffMs: 2000,
    userNotification: 'La conexión está tardando mucho. Reintentando...',
    actionable: false,
    severity: 'warning',
  },
  
  [ErrorCategory.SERVER_ERROR]: {
    type: 'retry',
    maxAttempts: 2,
    backoffMs: 3000,
    userNotification: 'Error del servidor. Reintentando en unos momentos...',
    actionable: false,
    severity: 'error',
  },
  
  // Storage errors - notify and provide action
  [ErrorCategory.QUOTA_EXCEEDED]: {
    type: 'notify',
    userNotification: 'Almacenamiento lleno. Elimina grabaciones antiguas para liberar espacio.',
    actionable: true,
    severity: 'error',
  },
  
  [ErrorCategory.STORAGE_ERROR]: {
    type: 'fallback',
    userNotification: 'Error al guardar localmente. Intentando guardar datos parciales...',
    actionable: false,
    severity: 'error',
  },
  
  // Recording errors - notify with instructions
  [ErrorCategory.PERMISSION_DENIED]: {
    type: 'notify',
    userNotification: 'Acceso al micrófono denegado. Revisa los permisos de tu navegador.',
    actionable: true,
    severity: 'error',
  },
  
  [ErrorCategory.DEVICE_NOT_FOUND]: {
    type: 'notify',
    userNotification: 'No se encontró ningún micrófono. Verifica que esté conectado.',
    actionable: true,
    severity: 'error',
  },
  
  [ErrorCategory.RECORDING_ERROR]: {
    type: 'fallback',
    userNotification: 'Error durante la grabación. Guardando datos parciales...',
    actionable: false,
    severity: 'error',
  },
  
  [ErrorCategory.NOT_SUPPORTED]: {
    type: 'notify',
    userNotification: 'Tu navegador no soporta grabación de audio. Actualiza tu navegador.',
    actionable: true,
    severity: 'error',
  },
  
  // Upload errors - retry or queue
  [ErrorCategory.UPLOAD_FAILED]: {
    type: 'retry',
    maxAttempts: 3,
    backoffMs: 1000,
    userNotification: 'Error al subir grabación. Se reintentará automáticamente.',
    actionable: false,
    severity: 'warning',
  },
  
  [ErrorCategory.PRESIGNED_URL_ERROR]: {
    type: 'retry',
    maxAttempts: 2,
    backoffMs: 2000,
    userNotification: 'Error al generar URL de subida. Reintentando...',
    actionable: false,
    severity: 'warning',
  },
  
  // Unknown errors
  [ErrorCategory.UNKNOWN]: {
    type: 'notify',
    userNotification: 'Ocurrió un error inesperado. Por favor, intenta nuevamente.',
    actionable: true,
    severity: 'error',
  },
};

/**
 * Categorize an error based on its properties
 */
export function categorizeError(error: unknown): ErrorCategory {
  if (!(error instanceof Error)) {
    return ErrorCategory.UNKNOWN;
  }

  const errorName = error.name.toLowerCase();
  const errorMessage = error.message.toLowerCase();

  // Network errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('connection') ||
    errorName === 'networkerror'
  ) {
    return ErrorCategory.NETWORK_ERROR;
  }

  if (
    errorMessage.includes('timeout') ||
    errorMessage.includes('timed out') ||
    errorName === 'timeouterror'
  ) {
    return ErrorCategory.NETWORK_TIMEOUT;
  }

  if (
    errorMessage.includes('500') ||
    errorMessage.includes('502') ||
    errorMessage.includes('503') ||
    errorMessage.includes('server error')
  ) {
    return ErrorCategory.SERVER_ERROR;
  }

  // Storage errors
  if (
    errorName === 'quotaexceedederror' ||
    errorMessage.includes('quota') ||
    errorMessage.includes('storage full')
  ) {
    return ErrorCategory.QUOTA_EXCEEDED;
  }

  if (
    errorMessage.includes('indexeddb') ||
    errorMessage.includes('storage') ||
    errorMessage.includes('database')
  ) {
    return ErrorCategory.STORAGE_ERROR;
  }

  // Recording errors
  if (
    errorName === 'notallowederror' ||
    errorName === 'permissiondeniederror' ||
    errorMessage.includes('permission denied')
  ) {
    return ErrorCategory.PERMISSION_DENIED;
  }

  if (
    errorName === 'notfounderror' ||
    errorMessage.includes('device not found') ||
    errorMessage.includes('no device')
  ) {
    return ErrorCategory.DEVICE_NOT_FOUND;
  }

  if (
    errorName === 'notsupportederror' ||
    errorMessage.includes('not supported')
  ) {
    return ErrorCategory.NOT_SUPPORTED;
  }

  if (
    errorMessage.includes('recording') ||
    errorMessage.includes('mediarecorder') ||
    errorName === 'invalidstateerror'
  ) {
    return ErrorCategory.RECORDING_ERROR;
  }

  // Upload errors
  if (
    errorMessage.includes('upload') ||
    errorMessage.includes('presigned url') ||
    errorMessage.includes('s3')
  ) {
    if (errorMessage.includes('presigned')) {
      return ErrorCategory.PRESIGNED_URL_ERROR;
    }
    return ErrorCategory.UPLOAD_FAILED;
  }

  return ErrorCategory.UNKNOWN;
}

/**
 * Get recovery strategy for an error
 */
export function getRecoveryStrategy(error: unknown): ErrorRecoveryStrategy {
  const category = categorizeError(error);
  return ERROR_RECOVERY_STRATEGIES[category];
}

/**
 * Calculate backoff delay for retry attempts
 */
export function calculateBackoff(
  attemptNumber: number,
  baseDelayMs: number = 1000,
  maxDelayMs: number = 10000
): number {
  // Exponential backoff: baseDelay * 2^(attempt - 1)
  const delay = baseDelayMs * Math.pow(2, attemptNumber - 1);
  return Math.min(delay, maxDelayMs);
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 1000,
    maxDelayMs = 10000,
    onRetry,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts) {
        const delay = calculateBackoff(attempt, baseDelayMs, maxDelayMs);
        onRetry?.(attempt, lastError);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Retry failed');
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const category = categorizeError(error);
  const strategy = ERROR_RECOVERY_STRATEGIES[category];
  return strategy.type === 'retry';
}

/**
 * Check if an error requires user action
 */
export function requiresUserAction(error: unknown): boolean {
  const category = categorizeError(error);
  const strategy = ERROR_RECOVERY_STRATEGIES[category];
  return strategy.actionable === true;
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: unknown): string {
  const category = categorizeError(error);
  const strategy = ERROR_RECOVERY_STRATEGIES[category];
  return strategy.userNotification || 'Ocurrió un error inesperado';
}
