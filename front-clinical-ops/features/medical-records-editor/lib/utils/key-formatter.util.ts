/**
 * Key Formatter Utility
 *
 * Transforma keys entre formato JSON y formato de display:
 * - JSON: snake_case (ej: "datos_personales")
 * - Display: Title Case (ej: "Datos Personales")
 */

/**
 * Formatea una key de JSON a formato de display
 *
 * @example
 * formatKey("datos_personales") // "Datos Personales"
 * formatKey("motivo_consulta") // "Motivo Consulta"
 * formatKey("antecedentes_medicos_familiares") // "Antecedentes Médicos Familiares"
 *
 * @param key - Key en formato snake_case
 * @returns Key formateada en Title Case
 */
export function formatKey(key: string): string {
  if (!key || typeof key !== 'string') {
    return '';
  }

  return key
    .split('_')
    .map((word) => {
      if (word.length === 0) return '';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Des-formatea una key de display a formato JSON
 *
 * @example
 * unformatKey("Datos Personales") // "datos_personales"
 * unformatKey("Motivo De Consulta") // "motivo_de_consulta"
 * unformatKey("Diagnostico Médico del Paciente") // "diagnostico_medico_del_paciente"
 *
 * @param text - Texto en Title Case o cualquier formato
 * @returns Key en formato snake_case
 */
export function unformatKey(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .toLowerCase()
    .trim()
    .normalize('NFD') // Normalizar caracteres Unicode
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9\s]/g, '') // Remover caracteres especiales
    .replace(/\s+/g, '_') // Espacios → underscores
    .replace(/_+/g, '_') // Múltiples underscores → uno solo
    .replace(/^_|_$/g, ''); // Remover underscores al inicio/fin
}

/**
 * Valida si una key está en formato JSON válido
 *
 * @param key - Key a validar
 * @returns true si es válida (solo lowercase, números, underscores)
 */
export function isValidJsonKey(key: string): boolean {
  if (!key || typeof key !== 'string') {
    return false;
  }

  // Solo permite letras minúsculas, números y underscores
  // No puede empezar con número
  const validPattern = /^[a-z][a-z0-9_]*$/;
  return validPattern.test(key);
}

/**
 * Genera una key única agregando un sufijo numérico
 *
 * @param baseKey - Key base
 * @param existingKeys - Set de keys que ya existen
 * @returns Key única
 */
export function generateUniqueKey(
  baseKey: string,
  existingKeys: Set<string>
): string {
  if (!existingKeys.has(baseKey)) {
    return baseKey;
  }

  let counter = 1;
  let uniqueKey = `${baseKey}_${counter}`;

  while (existingKeys.has(uniqueKey)) {
    counter++;
    uniqueKey = `${baseKey}_${counter}`;
  }

  return uniqueKey;
}
