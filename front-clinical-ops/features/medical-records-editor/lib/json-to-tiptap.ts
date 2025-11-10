/**
 * JSON to TipTap Document Transformation
 *
 * PLAN ORIGINAL - Convierte JSON estructurado en documento TipTap simple
 * con headings (JSON keys) y paragraphs (valores) con niveles jerárquicos
 */

import type { JSONContent } from '@tiptap/react';
import type { JsonValue } from '../types/editor';
import { formatKey } from './prosemirror-extensions';

/**
 * Main transformation function: JSON → TipTap Document
 */
export function jsonToTiptapDoc(data: JsonValue): JSONContent {
  // Handle invalid or empty data
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    console.warn('[jsonToTiptapDoc] Invalid data received:', typeof data, data);
    // Return empty document instead of throwing
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [],
        },
      ],
    };
  }

  const content = objectToTiptapNodes(data as Record<string, JsonValue>, 1);

  // Ensure we always have at least one paragraph
  if (!content || content.length === 0) {
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [],
        },
      ],
    };
  }

  return {
    type: 'doc',
    content,
  };
}

/**
 * Recursively converts an object to TipTap nodes
 */
function objectToTiptapNodes(
  obj: Record<string, JsonValue>,
  level: number
): JSONContent[] {
  const nodes: JSONContent[] = [];

  for (const [key, value] of Object.entries(obj)) {
    // Add heading for the key
    const formattedKey = formatKey(key);

    // Only add heading if formatted key has content
    if (formattedKey && formattedKey.trim()) {
      nodes.push({
        type: 'heading',
        attrs: {
          level: Math.min(level, 3), // H1-H3 max
          jsonKey: key, // ← CRITICAL: Store original JSON key for reverse transformation
          isNew: false, // ← Mark as original heading (non-editable)
        },
        content: [{ type: 'text', text: formattedKey }],
      });
    }

    // Process the value based on its type
    nodes.push(...valueToTiptapNodes(value, level + 1, key));
  }

  return nodes;
}

/**
 * Converts a value to TipTap nodes based on its type
 */
function valueToTiptapNodes(
  value: JsonValue,
  level: number,
  key?: string
): JSONContent[] {
  // Null or undefined
  if (value === null || value === undefined) {
    return [
      {
        type: 'paragraph',
        attrs: { level },
        content: [], // Empty paragraph instead of empty text node
      },
    ];
  }

  // String
  if (typeof value === 'string') {
    // Only create text node if string has content
    const trimmedValue = value.trim();
    return [
      {
        type: 'paragraph',
        attrs: { level },
        content: trimmedValue ? [{ type: 'text', text: trimmedValue }] : [],
      },
    ];
  }

  // Number or Boolean
  if (typeof value === 'number' || typeof value === 'boolean') {
    return [
      {
        type: 'paragraph',
        attrs: { level },
        content: [{ type: 'text', text: String(value) }],
      },
    ];
  }

  // Array
  if (Array.isArray(value)) {
    const nodes: JSONContent[] = [];

    value.forEach((item, index) => {
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        // Array of objects - each object as sub-section
        nodes.push(...objectToTiptapNodes({ [`${index + 1}`]: item }, level));
      } else {
        // Array of primitives - bullet list style
        nodes.push({
          type: 'paragraph',
          attrs: { level },
          content: [{ type: 'text', text: `• ${String(item)}` }],
        });
      }
    });

    return nodes;
  }

  // Nested Object
  if (typeof value === 'object') {
    return objectToTiptapNodes(value as Record<string, JsonValue>, level);
  }

  // Fallback
  return [
    {
      type: 'paragraph',
      attrs: { level },
      content: [{ type: 'text', text: String(value) }],
    },
  ];
}
