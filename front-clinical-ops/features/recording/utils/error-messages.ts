/**
 * Spanish error messages dictionary with actionable instructions
 * Requirements: 6.5
 */

import { ErrorCategory } from './error-recovery';

export interface ErrorMessage {
  title: string;
  message: string;
  instructions: string[];
  helpLink?: string;
  browserSpecific?: boolean;
}

/**
 * Detects the user's browser for providing specific instructions
 */
export function detectBrowser(): 'chrome' | 'firefox' | 'safari' | 'edge' | 'unknown' {
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
export function getBrowserPermissionInstructions(): string[] {
  const browser = detectBrowser();
  
  const instructions: Record<string, string[]> = {
    chrome: [
      'Haz clic en el ícono de candado (🔒) en la barra de direcciones',
      'Busca "Micrófono" en los permisos del sitio',
      'Selecciona "Permitir" para el micrófono',
      'Recarga la página y vuelve a intentar grabar',
    ],
    
    firefox: [
      'Haz clic en el ícono de información (ℹ️) en la barra de direcciones',
      'Ve a "Permisos" y busca "Usar el micrófono"',
      'Desmarca "Usar configuración predeterminada" y selecciona "Permitir"',
      'Recarga la página y vuelve a intentar grabar',
    ],
    
    safari: [
      'Ve a Safari > Preferencias > Sitios web',
      'Selecciona "Micrófono" en la barra lateral',
      'Encuentra este sitio web y selecciona "Permitir"',
      'Recarga la página y vuelve a intentar grabar',
    ],
    
    edge: [
      'Haz clic en el ícono de candado (🔒) en la barra de direcciones',
      'Busca "Micrófono" en los permisos del sitio',
      'Selecciona "Permitir" para el micrófono',
      'Recarga la página y vuelve a intentar grabar',
    ],
    
    unknown: [
      'Busca el ícono de permisos en la barra de direcciones (generalmente un candado 🔒)',
      'Encuentra la configuración de "Micrófono" o "Permisos"',
      'Selecciona "Permitir" para el micrófono',
      'Recarga la página y vuelve a intentar grabar',
    ],
  };
  
  return instructions[browser];
}

/**
 * Comprehensive error messages dictionary
 */
export const ERROR_MESSAGES: Record<ErrorCategory, ErrorMessage> = {
  // Network errors
  [ErrorCategory.NETWORK_ERROR]: {
    title: 'Error de conexión',
    message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
    instructions: [
      'Verifica que estés conectado a internet',
      'Intenta recargar la página',
      'Si el problema persiste, la grabación se guardará localmente y se subirá automáticamente cuando recuperes la conexión',
    ],
  },
  
  [ErrorCategory.NETWORK_TIMEOUT]: {
    title: 'Tiempo de espera agotado',
    message: 'La conexión está tardando demasiado. Puede que tu internet esté lento.',
    instructions: [
      'Verifica la velocidad de tu conexión a internet',
      'Intenta acercarte al router WiFi si usas conexión inalámbrica',
      'La grabación se guardará localmente y se subirá cuando la conexión mejore',
    ],
  },
  
  [ErrorCategory.SERVER_ERROR]: {
    title: 'Error del servidor',
    message: 'El servidor está experimentando problemas temporales.',
    instructions: [
      'Espera unos momentos e intenta nuevamente',
      'El sistema reintentará automáticamente',
      'Tu grabación está guardada localmente y no se perderá',
    ],
  },
  
  // Storage errors
  [ErrorCategory.QUOTA_EXCEEDED]: {
    title: 'Almacenamiento lleno',
    message: 'No hay suficiente espacio disponible en tu navegador para guardar la grabación.',
    instructions: [
      'Ve a "Gestionar grabaciones" en el menú',
      'Elimina grabaciones antiguas que ya estén sincronizadas',
      'Libera al menos 100 MB de espacio para continuar',
      'Las grabaciones sincronizadas pueden eliminarse de forma segura',
    ],
    helpLink: '/dashboard/grabacion/gestionar',
  },
  
  [ErrorCategory.STORAGE_ERROR]: {
    title: 'Error de almacenamiento',
    message: 'Ocurrió un error al guardar la grabación en el almacenamiento local.',
    instructions: [
      'Verifica que tu navegador tenga permisos de almacenamiento',
      'Intenta cerrar otras pestañas que puedan estar usando mucho almacenamiento',
      'Si el problema persiste, intenta reiniciar tu navegador',
    ],
  },
  
  // Recording errors
  [ErrorCategory.PERMISSION_DENIED]: {
    title: 'Acceso al micrófono denegado',
    message: 'Necesitamos acceso al micrófono para grabar la consulta.',
    instructions: getBrowserPermissionInstructions(),
    browserSpecific: true,
  },
  
  [ErrorCategory.DEVICE_NOT_FOUND]: {
    title: 'Micrófono no encontrado',
    message: 'No se detectó ningún micrófono conectado a tu dispositivo.',
    instructions: [
      'Verifica que tu micrófono esté conectado correctamente',
      'Si usas un micrófono externo, asegúrate de que esté enchufado',
      'Revisa la configuración de audio de tu sistema operativo',
      'Intenta reiniciar tu navegador',
      'Prueba el micrófono en otra aplicación para verificar que funcione',
    ],
  },
  
  [ErrorCategory.RECORDING_ERROR]: {
    title: 'Error durante la grabación',
    message: 'Ocurrió un error técnico durante la grabación.',
    instructions: [
      'Intenta grabar nuevamente',
      'Cierra otras aplicaciones que puedan estar usando el micrófono (Zoom, Teams, etc.)',
      'Reinicia tu navegador si el problema persiste',
      'Verifica que tu micrófono funcione correctamente en otras aplicaciones',
    ],
  },
  
  [ErrorCategory.NOT_SUPPORTED]: {
    title: 'Navegador no compatible',
    message: 'Tu navegador no soporta la grabación de audio o está desactualizado.',
    instructions: [
      'Actualiza tu navegador a la última versión',
      'O usa un navegador moderno: Chrome (v47+), Firefox (v25+), Safari (v14.1+) o Edge',
      'Asegúrate de estar usando HTTPS (no HTTP)',
      'Verifica que las funciones de medios estén habilitadas en tu navegador',
    ],
  },
  
  // Upload errors
  [ErrorCategory.UPLOAD_FAILED]: {
    title: 'Error al subir grabación',
    message: 'No se pudo subir la grabación al servidor.',
    instructions: [
      'El sistema reintentará automáticamente',
      'Verifica tu conexión a internet',
      'Tu grabación está guardada localmente y no se perderá',
      'Puedes intentar subir manualmente desde "Gestionar grabaciones"',
    ],
    helpLink: '/dashboard/grabacion/gestionar',
  },
  
  [ErrorCategory.PRESIGNED_URL_ERROR]: {
    title: 'Error de configuración',
    message: 'No se pudo generar la URL de subida.',
    instructions: [
      'El sistema reintentará automáticamente',
      'Si el problema persiste, contacta al soporte técnico',
      'Tu grabación está guardada localmente',
    ],
  },
  
  // Unknown errors
  [ErrorCategory.UNKNOWN]: {
    title: 'Error inesperado',
    message: 'Ocurrió un error inesperado.',
    instructions: [
      'Intenta realizar la acción nuevamente',
      'Reinicia tu navegador si el problema persiste',
      'Si continúa el error, contacta al soporte técnico',
      'Incluye el mensaje de error completo al reportar el problema',
    ],
  },
};

/**
 * Get error message for a specific error category
 */
export function getErrorMessage(category: ErrorCategory): ErrorMessage {
  return ERROR_MESSAGES[category];
}

/**
 * Format error message for display
 */
export function formatErrorMessage(category: ErrorCategory): string {
  const errorMsg = ERROR_MESSAGES[category];
  const instructions = errorMsg.instructions.map((inst, i) => `${i + 1}. ${inst}`).join('\n');
  
  return `${errorMsg.title}\n\n${errorMsg.message}\n\n${instructions}`;
}

/**
 * Get short error notification message
 */
export function getShortErrorMessage(category: ErrorCategory): string {
  const errorMsg = ERROR_MESSAGES[category];
  return `${errorMsg.title}: ${errorMsg.message}`;
}

/**
 * Check if error has help link
 */
export function hasHelpLink(category: ErrorCategory): boolean {
  return !!ERROR_MESSAGES[category].helpLink;
}

/**
 * Get help link for error
 */
export function getHelpLink(category: ErrorCategory): string | undefined {
  return ERROR_MESSAGES[category].helpLink;
}
