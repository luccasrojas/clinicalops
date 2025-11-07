import type { JSONContent } from '@tiptap/react';
import type { JsonValue } from '../types/editor';

type PathSegment = string | number;

const parsePath = (path?: string): PathSegment[] => {
  if (!path) return [];
  return path
    .split('.')
    .filter(Boolean)
    .map((segment) =>
      /^\d+$/.test(segment) ? Number(segment) : segment
    );
};

const getTextFromNode = (node: JSONContent): string => {
  if (!node.content) {
    return node.text ?? '';
  }
  return node.content.map(getTextFromNode).join('');
};

const normaliseListValue = (text: string) => text.replace(/^•\s*/, '').trim();

const parsePrimitive = (
  text: string,
  dataType: string | undefined
): JsonValue => {
  const trimmed = text.trim();
  switch (dataType) {
    case 'number':
      return Number(trimmed.replace(',', '.')) || 0;
    case 'boolean':
      return ['true', 'sí', 'si'].includes(trimmed.toLowerCase());
    case 'null':
      if (!trimmed || trimmed.toLowerCase() === 'no registrado') {
        return null;
      }
      return trimmed;
    default:
      return trimmed;
  }
};

const extractValueFromParagraph = (
  node: JSONContent
): { value: JsonValue; dataType?: string } | null => {
  const attrs = node.attrs ?? {};
  const dataType = attrs.dataType as string | undefined;
  const nodeType = attrs.nodeType as string | undefined;

  if (nodeType === 'heading') {
    return null;
  }

  const text = getTextFromNode(node);

  if (attrs.isListItem || nodeType === 'list') {
    return {
      value: parsePrimitive(normaliseListValue(text), dataType),
      dataType,
    };
  }

  const colonIndex = text.indexOf(':');
  const rawValue =
    colonIndex >= 0 ? text.slice(colonIndex + 1).trim() : text.trim();

  return {
    value: parsePrimitive(rawValue, dataType),
    dataType,
  };
};

const setValue = (
  root: JsonValue,
  path: PathSegment[],
  value: JsonValue
): JsonValue => {
  if (!path.length) {
    return value;
  }

  const [head, ...tail] = path;

  if (typeof head === 'number') {
    const baseArray = Array.isArray(root) ? [...root] : [];
    baseArray[head] = setValue(baseArray[head], tail, value);
    return baseArray;
  }

  const baseObject =
    root && typeof root === 'object' && !Array.isArray(root)
      ? { ...(root as Record<string, JsonValue>) }
      : {};

  baseObject[head] = tail.length
    ? setValue(baseObject[head], tail, value)
    : value;

  return baseObject;
};

const getValueAtPath = (root: JsonValue, path: PathSegment[]) => {
  return path.reduce<JsonValue | undefined>((acc, segment) => {
    if (acc === undefined || acc === null) return undefined;
    if (typeof segment === 'number') {
      return Array.isArray(acc) ? acc[segment] : undefined;
    }
    if (typeof acc === 'object' && !Array.isArray(acc)) {
      return (acc as Record<string, JsonValue>)[segment];
    }
    return undefined;
  }, root);
};

export const tiptapToStructuredJson = (doc: JSONContent): JsonValue => {
  const paragraphs = doc.content ?? [];
  let result: JsonValue = {};

  paragraphs.forEach((node) => {
    if (node.type !== 'clinicalParagraph' && node.type !== 'paragraph') {
      return;
    }

    const attrs = node.attrs ?? {};
    const path = parsePath(attrs.path as string | undefined);
    if (!path.length) return;

    if (attrs.nodeType === 'heading') {
      const existing = getValueAtPath(result, path);
      if (existing === undefined) {
        const seed =
          attrs.dataType === 'array'
            ? []
            : attrs.dataType === 'object'
              ? {}
              : {};
        result = setValue(result, path, seed);
      }
      return;
    }

    const parsed = extractValueFromParagraph(node);
    if (!parsed) return;

    result = setValue(result, path, parsed.value);
  });

  return result;
};
