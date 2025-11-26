/**
 * Recording error types and Spanish error messages with browser-specific instructions.
 * Requirements: 6.1, 6.4
 */

export enum RecordingErrorType {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  DEVICE_NOT_FOUND = 'DEVICE_NOT_FOUND',
  RECORDING_ERROR = 'RECORDING_ERROR',
  UNKNOWN = 'UNKNOWN',
}

export interface RecordingError {
  type: RecordingErrorType;
  message: string;
  instructions: string;
  originalError?: Error;
}

/**
 * Detects the user's browser for providing specific instructions
 */
function detectBrowser(): 'chrome' | 'firefox' | 'safari' | 'edge' | 'unknown' {
  if (typeof window === 'undefined') return 'unknown';
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('edg/')) return 'edge';
  if (userAgent.includes('chrome') && !userAgent.includes('edg/')) return 'chrome';
  if (userAgent.includes('firefox')) return 'firefox';
  if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'safari';
  
  return 'unknown';
}

/**
 * Gets browser-specific instructions for granting microphone permissions
 */
function getBrowserPermissionInstructions(): string {
  const browser = detectBrowser();
  
  const instructions: Record<string, string> = {
    chrome: `
Para Chrome:
1. Haz clic en el ícono de candado o información (🔒) en la barra de direcciones
2. Busca "Micrófono" en los permisos del sitio
3. Selecciona "Permitir" para el micrófono
4. Recarga la página y vuelve a intentar grabar
    `.trim(),
    
    firefox: `
Para Firefox:
1. Haz clic en el ícono de información (ℹ️) en la barra de direcciones
2. Ve a "Permisos" y busca "Usar el micrófono"
3. Desmarca "Usar configuración predeterminada" y selecciona "Permitir"
4. Recarga la página y vuelve a intentar grabar
    `.trim(),
    
    safari: `
Para Safari:
1. Ve a Safari > Preferencias > Sitios web
2. Selecciona "Micrófono" en la barra lateral
3. Encuentra este sitio web y selecciona "Permitir"
4. Recarga la página y vuelve a intentar grabar
    `.trim(),
    
    edge: `
Para Edge:
1. Haz clic en el ícono de candado (🔒) en la barra de direcciones
2. Busca "Micrófono" en los permisos del sitio
3. Selecciona "Permitir" para el micrófono
4. Recarga la página y vuelve a intentar grabar
    `.trim(),
    
    unknown: `
Para permitir el acceso al micrófono:
1. Busca el ícono de permisos en la barra de direcciones (generalmente un candado 🔒)
2. Encuentra la configuración de "Micrófono" o "Permisos"
3. Selecciona "Permitir" para el micrófono
4. Recarga la página y vuelve a intentar grabar
    `.trim(),
  };
  
  return instructions[browser];
}

/**
 * Parses a native error and returns a structured RecordingError with Spanish messages
 */
export function parseRecordingError(error: unknown): RecordingError {
  if (!(error instanceof Error)) {
    return {
      type: RecordingErrorType.UNKNOWN,
      message: 'Ocurrió un error desconocido durante la grabación',
      instructions: 'Por favor, intenta nuevamente. Si el problema persiste, contacta al soporte técnico.',
      originalError: undefined,
    };
  }

  const errorName = error.name.toLowerCase();
  const errorMessage = error.message.toLowerCase();

  // Permission denied errors
  if (
    errorName === 'notallowederror' ||
    errorName === 'permissiondeniederror' ||
    errorMessage.includes('permission denied') ||
    errorMessage.includes('permission dismissed')
  ) {
    return {
      type: RecordingErrorType.PERMISSION_DENIED,
      message: 'Acceso al micrófono denegado',
      instructions: `Necesitamos acceso al micrófono para grabar la consulta.\n\n${getBrowserPermissionInstructions()}`,
      originalError: error,
    };
  }

  // Device not found errors
  if (
    errorName === 'notfounderror' ||
    errorMessage.includes('requested device not found') ||
    errorMessage.includes('no device found')
  ) {
    return {
      type: RecordingErrorType.DEVICE_NOT_FOUND,
      message: 'No se encontró ningún micrófono',
      instructions: `
No se detectó ningún micrófono conectado a tu dispositivo.

Por favor:
1. Verifica que tu micrófono esté conectado correctamente
2. Si usas un micrófono externo, asegúrate de que esté enchufado
3. Revisa la configuración de audio de tu sistema operativo
4. Intenta reiniciar tu navegador
      `.trim(),
      originalError: error,
    };
  }

  // Not supported errors
  if (
    errorName === 'notsupportederror' ||
    errorMessage.includes('not supported') ||
    errorMessage.includes('mediarecorder')
  ) {
    return {
      type: RecordingErrorType.NOT_SUPPORTED,
      message: 'Tu navegador no soporta grabación de audio',
      instructions: `
La grabación de audio no está disponible en tu navegador actual.

Por favor:
1. Actualiza tu navegador a la última versión
2. O usa un navegador moderno como Chrome, Firefox, Safari o Edge
3. Asegúrate de que tu navegador tenga habilitadas las funciones de medios
      `.trim(),
      originalError: error,
    };
  }

  // Generic recording errors
  if (
    errorName === 'invalidstateerror' ||
    errorMessage.includes('recording') ||
    errorMessage.includes('mediarecorder')
  ) {
    return {
      type: RecordingErrorType.RECORDING_ERROR,
      message: 'Error durante la grabación',
      instructions: `
Ocurrió un error técnico durante la grabación.

Por favor:
1. Intenta grabar nuevamente
2. Cierra otras aplicaciones que puedan estar usando el micrófono
3. Reinicia tu navegador si el problema persiste
4. Verifica que tu micrófono funcione correctamente en otras aplicaciones
      `.trim(),
      originalError: error,
    };
  }

  // Unknown error
  return {
    type: RecordingErrorType.UNKNOWN,
    message: `Error inesperado: ${error.message}`,
    instructions: `
Ocurrió un error inesperado durante la grabación.

Por favor:
1. Intenta grabar nuevamente
2. Reinicia tu navegador
3. Si el problema persiste, contacta al soporte técnico con este mensaje de error: "${error.message}"
    `.trim(),
    originalError: error,
  };
}

/**
 * Checks if MediaRecorder is supported in the current browser
 */
export function isMediaRecorderSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'MediaRecorder' in window &&
    'mediaDevices' in navigator &&
    'getUserMedia' in navigator.mediaDevices
  );
}

/**
 * Gets a user-friendly message for MediaRecorder not being supported
 */
export function getNotSupportedError(): RecordingError {
  return {
    type: RecordingErrorType.NOT_SUPPORTED,
    message: 'Tu navegador no soporta grabación de audio',
    instructions: `
La grabación de audio no está disponible en tu navegador actual.

Por favor:
1. Actualiza tu navegador a la última versión
2. O usa un navegador moderno como Chrome (versión 47+), Firefox (versión 25+), Safari (versión 14.1+) o Edge
3. Asegúrate de estar usando HTTPS (no HTTP) ya que los navegadores requieren conexión segura para acceder al micrófono
    `.trim(),
  };
}
