/**
 * JSON Transformer Service
 *
 * Maneja transformaciones bidireccionales entre:
 * - JSON jerárquico anidado ↔ Documento Tiptap
 *
 * Estructura JSON soportada:
 * {
 *   "titulo": "texto",
 *   "titulo2": {
 *     "subtitulo": "texto",
 *     "subtitulo2": {
 *       "subsubtitulo": "texto"
 *     }
 *   }
 * }
 */

import type { JSONContent } from '@tiptap/react';
import { formatKey, unformatKey } from '../lib/utils/key-formatter.util';

export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export interface JsonObject {
  [key: string]: JsonValue;
}
export type JsonArray = JsonValue[];

export interface TiptapNode extends JSONContent {
  type: string;
  attrs?: Record<string, any>;
  content?: TiptapNode[];
}

/**
 * Servicio principal de transformación
 */
export class JsonTransformerService {
  /**
   * Convierte JSON jerárquico a documento Tiptap
   *
   * @param json - Objeto JSON con estructura anidada
   * @returns Documento Tiptap con headings y paragraphs
   */
  jsonToTiptap(json: JsonObject): JSONContent {
    if (!json || typeof json !== 'object' || Array.isArray(json)) {
      console.warn('[JsonTransformer] Invalid JSON received:', json);
      return this.createEmptyDocument();
    }

    const content = this.transformObjectToNodes(json, 1);

    if (!content || content.length === 0) {
      return this.createEmptyDocument();
    }

    return {
      type: 'doc',
      content,
    };
  }

  /**
   * Convierte documento Tiptap a JSON jerárquico
   *
   * @param tiptapDoc - Documento Tiptap
   * @returns JSON con estructura anidada
   */
  tiptapToJson(tiptapDoc: JSONContent): JsonObject {
    if (!tiptapDoc.content || tiptapDoc.content.length === 0) {
      return {};
    }

    const result: JsonObject = {};
    const stack: Array<{ obj: any; level: number; key: string | null }> = [
      { obj: result, level: 0, key: null },
    ];

    let currentKey: string | null = null;
    let pendingText: string[] = [];

    for (const node of tiptapDoc.content) {
      if (node.type === 'heading') {
        // Guardar texto pendiente antes de procesar nuevo heading
        if (currentKey && pendingText.length > 0) {
          this.assignTextToKey(stack, currentKey, pendingText.join('\n'));
          pendingText = [];
        }

        const level = node.attrs?.level ?? 1;
        const jsonKey = node.attrs?.jsonKey || unformatKey(this.extractText(node));

        // Ajustar stack al nivel correcto
        while (stack.length > 1 && stack[stack.length - 1].level >= level) {
          stack.pop();
        }

        const parent = stack[stack.length - 1].obj;
        currentKey = jsonKey;

        // Crear placeholder en el padre
        if (!parent[jsonKey]) {
          parent[jsonKey] = {};
        }

        // Agregar al stack
        stack.push({
          obj: parent[jsonKey],
          level,
          key: jsonKey
        });

      } else if (node.type === 'paragraph') {
        const text = this.extractText(node);
        if (text.trim()) {
          pendingText.push(text.trim());
        }
      }
    }

    // Guardar último texto pendiente
    if (currentKey && pendingText.length > 0) {
      this.assignTextToKey(stack, currentKey, pendingText.join('\n'));
    }

    // Limpiar objetos vacíos
    return this.cleanupEmptyObjects(result);
  }

  /**
   * Transforma un objeto a nodos Tiptap recursivamente
   */
  private transformObjectToNodes(
    obj: JsonObject,
    level: number,
    parentPath: string = ''
  ): TiptapNode[] {
    const nodes: TiptapNode[] = [];

    for (const [key, value] of Object.entries(obj)) {
      const currentLevel = Math.min(level, 3); // Max H3
      const currentPath = parentPath ? `${parentPath}.${key}` : key;

      // 1. Crear heading para la key
      nodes.push({
        type: 'heading',
        attrs: {
          level: currentLevel,
          jsonKey: key,
          isNew: false, // Marca como original (no editable)
          parentPath: currentPath,
        },
        content: [{ type: 'text', text: formatKey(key) }],
      });

      // 2. Procesar el valor
      if (value === null || value === undefined) {
        // Valor vacío → Paragraph vacío
        nodes.push({
          type: 'paragraph',
          attrs: { level: currentLevel },
          content: [],
        });
      } else if (typeof value === 'string') {
        // String → Paragraph con texto
        nodes.push({
          type: 'paragraph',
          attrs: { level: currentLevel },
          content: value.trim() ? [{ type: 'text', text: value.trim() }] : [],
        });
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        // Number/Boolean → Paragraph con string
        nodes.push({
          type: 'paragraph',
          attrs: { level: currentLevel },
          content: [{ type: 'text', text: String(value) }],
        });
      } else if (Array.isArray(value)) {
        // Array → Múltiples paragraphs
        for (const item of value) {
          if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
            // Array de objetos → Recursión
            nodes.push(...this.transformObjectToNodes(item as JsonObject, level + 1, currentPath));
          } else {
            // Array de primitivos → Paragraph con bullet
            nodes.push({
              type: 'paragraph',
              attrs: { level: currentLevel },
              content: [{ type: 'text', text: `• ${String(item)}` }],
            });
          }
        }
      } else if (typeof value === 'object') {
        // Objeto anidado → Recursión
        nodes.push(...this.transformObjectToNodes(value as JsonObject, level + 1, currentPath));
      }
    }

    return nodes;
  }

  /**
   * Asigna texto a una key en el stack
   */
  private assignTextToKey(
    stack: Array<{ obj: any; level: number; key: string | null }>,
    key: string,
    text: string
  ) {
    if (stack.length < 2) return;

    const current = stack[stack.length - 1];
    const parent = stack[stack.length - 2];

    // Si el objeto actual está vacío, reemplazar con string
    if (Object.keys(current.obj).length === 0) {
      parent.obj[key] = text;
      stack.pop(); // Remover del stack
    } else {
      // Si ya tiene sub-objetos, no podemos agregar texto directo
      // Esto es una limitación del formato JSON anidado
      // Opción: Agregar un campo especial "_content" o ignorar
      console.warn(`[JsonTransformer] Cannot add text to object with children: ${key}`);
    }
  }

  /**
   * Extrae texto plano de un nodo Tiptap
   */
  private extractText(node: TiptapNode): string {
    if (!node.content) return '';

    return node.content
      .filter((n) => n.type === 'text')
      .map((n) => n.text || '')
      .join('');
  }

  /**
   * Limpia objetos vacíos del resultado
   */
  private cleanupEmptyObjects(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.cleanupEmptyObjects(item));
    }

    const result: JsonObject = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const cleaned = this.cleanupEmptyObjects(value);

        // Solo incluir si no está vacío
        if (Object.keys(cleaned).length > 0) {
          result[key] = cleaned;
        }
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Crea un documento vacío válido
   */
  private createEmptyDocument(): JSONContent {
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { level: 1 },
          content: [],
        },
      ],
    };
  }
}
