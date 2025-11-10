/**
 * TipTap Document to JSON Transformation
 *
 * PLAN ORIGINAL - Convierte TipTap doc de vuelta a JSON estructurado
 * con SOPORTE PARA TÍTULOS EDITABLES:
 * - "Diagnostico Medico" → diagnostico_medico
 * - "Diagnostico Medico De Paciente" → diagnostico_medico_de_paciente
 */

import type { JSONContent } from '@tiptap/react';
import type { JsonValue } from '../types/editor';
import { unformatKey } from './prosemirror-extensions';

type Obj = Record<string, any>;

/**
 * Main transformation function: TipTap Document → JSON
 *
 * IMPORTANTE: Los headings ahora son EDITABLES!
 * Si el usuario edita "Datos Personales" a "Datos Personales Del Paciente",
 * el JSON key se convierte en "datos_personales_del_paciente"
 */
export function tiptapToStructuredJson(tiptapDoc: JSONContent): JsonValue {
  if (!tiptapDoc.content) {
    return {};
  }

  const result: Obj = {};
  const stack: Array<{ obj: Obj; level: number }> = [{ obj: result, level: 0 }];

  // Track duplicate keys to avoid overwriting
  const keyCounters = new WeakMap<Obj, Record<string, number>>();

  let currentKey: string | null = null;
  let currentTextOwner: Obj | null = null;

  for (const node of tiptapDoc.content) {
    if (node.type === 'heading') {
      // Heading = key in JSON
      const headingLevel = node.attrs?.level ?? 1;
      const editedText = extractText(node);

      // TÍTULOS EDITABLES: Use jsonKey if available, otherwise convert edited text
      const originalKey = node.attrs?.jsonKey;
      const jsonKey = originalKey || unformatKey(editedText);

      // Adjust stack to correct level
      while (
        stack.length > 1 &&
        stack[stack.length - 1].level >= headingLevel
      ) {
        stack.pop();
      }

      const currentObj = stack[stack.length - 1].obj;

      // Initialize key counter for this object if needed
      if (!keyCounters.has(currentObj)) {
        keyCounters.set(currentObj, {});
      }
      const counters = keyCounters.get(currentObj)!;

      // Handle duplicate keys by appending numbers
      let finalKey = jsonKey;
      if (counters[jsonKey] !== undefined) {
        counters[jsonKey]++;
        finalKey = `${jsonKey}${counters[jsonKey]}`;
      } else {
        counters[jsonKey] = 0;
      }

      currentKey = finalKey;
      currentObj[finalKey] = { _text: '' };
      currentTextOwner = currentObj[finalKey];

      stack.push({ obj: currentObj[finalKey], level: headingLevel });
    } else if (node.type === 'paragraph') {
      // Paragraph = value in JSON
      const text = extractText(node);

      if (currentTextOwner && '_text' in currentTextOwner) {
        // Append to current text owner
        if (currentTextOwner._text) {
          currentTextOwner._text += '\n' + text;
        } else {
          currentTextOwner._text = text;
        }
      }
    }
  }

  // Collapse the structure: { _text: "value" } → "value"
  return collapse(result);
}

/**
 * Extracts plain text from a TipTap node
 */
function extractText(node: JSONContent): string {
  if (!node.content) {
    return '';
  }
  return node.content
    .filter((n) => n.type === 'text')
    .map((n) => n.text || '')
    .join('');
}

/**
 * Collapses the intermediate structure to final JSON
 *
 * Converts:
 * - { _text: "value" } → "value"
 * - { _text: "value", key: {...} } → { key: {...} } (removes _text if there are other keys)
 * - Preserves nested objects
 */
function collapse(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(collapse);
  }

  const keys = Object.keys(obj);

  // If only _text exists, return its value
  if (keys.length === 1 && keys[0] === '_text') {
    return typeof obj._text === 'string' && obj._text.trim().length > 0
      ? obj._text.trim()
      : '';
  }

  // If _text exists along with other keys, remove _text and collapse children
  const out: Obj = {};

  // First, add _text if it has content and is the only key besides others
  if (
    typeof obj._text === 'string' &&
    obj._text.trim().length > 0 &&
    keys.length === 1
  ) {
    return obj._text.trim();
  }

  // Then, add all other keys (recursively collapsed)
  for (const k of keys) {
    if (k === '_text') continue;
    out[k] = collapse(obj[k]);
  }

  // If the result is empty after removing _text, check if we should return the text
  if (Object.keys(out).length === 0 && typeof obj._text === 'string') {
    return obj._text.trim() || '';
  }

  return out;
}
