import type { JSONContent } from '@tiptap/react';
import type { JsonValue } from '../types/editor';

type PathSegment = string | number;

const isRecord = (value: JsonValue): value is Record<string, JsonValue> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isPrimitive = (
  value: JsonValue
): value is string | number | boolean | null => {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null
  );
};

const formatKey = (key: string) => {
  return key
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getValueType = (value: JsonValue) => {
  if (Array.isArray(value)) return 'array';
  if (isRecord(value)) return 'object';
  if (value === null) return 'null';
  return typeof value;
};

const formatPrimitiveValue = (value: JsonValue) => {
  if (value === null) return 'No registrado';
  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No';
  }
  return String(value);
};

const pathToString = (segments: PathSegment[]) =>
  segments.map(String).join('.');

const createHeadingParagraph = ({
  label,
  path,
  level,
  dataType,
}: {
  label: string;
  path: PathSegment[];
  level: number;
  dataType: 'object' | 'array';
}): JSONContent => ({
  type: 'clinicalParagraph',
  attrs: {
    level,
    path: pathToString(path),
    dataType,
    nodeType: 'heading',
  },
  content: [
    {
      type: 'text',
      text: label,
    },
  ],
});

const createValueParagraph = ({
  label,
  value,
  path,
  level,
}: {
  label: string;
  value: JsonValue;
  path: PathSegment[];
  level: number;
}): JSONContent => ({
  type: 'clinicalParagraph',
  attrs: {
    level,
    path: pathToString(path),
    dataType: getValueType(value),
    nodeType: 'value',
  },
  content: [
    {
      type: 'text',
      marks: [{ type: 'bold' }],
      text: `${label}: `,
    },
    {
      type: 'text',
      text: formatPrimitiveValue(value),
    },
  ],
});

const createListParagraph = ({
  value,
  path,
  level,
}: {
  value: JsonValue;
  path: PathSegment[];
  level: number;
}): JSONContent => ({
  type: 'clinicalParagraph',
  attrs: {
    level,
    path: pathToString(path),
    dataType: getValueType(value),
    nodeType: 'list',
    isListItem: true,
  },
  content: [
    {
      type: 'text',
      text: formatPrimitiveValue(value),
    },
  ],
});

const buildFromArray = (
  items: JsonValue[],
  path: PathSegment[],
  level: number
): JSONContent[] => {
  const nodes: JSONContent[] = [];

  items.forEach((item, index) => {
    const itemPath = [...path, String(index)];
    if (isPrimitive(item)) {
      nodes.push(
        createListParagraph({
          value: item,
          path: itemPath,
          level,
        })
      );
    } else if (Array.isArray(item)) {
      nodes.push(
        createHeadingParagraph({
          label: `Elemento ${index + 1}`,
          path: itemPath,
          level,
          dataType: 'array',
        })
      );
      nodes.push(...buildFromArray(item, itemPath, level + 1));
    } else if (isRecord(item)) {
      nodes.push(
        createHeadingParagraph({
          label: `Elemento ${index + 1}`,
          path: itemPath,
          level,
          dataType: 'object',
        })
      );
      nodes.push(...buildFromRecord(item, itemPath, level + 1));
    }
  });

  return nodes;
};

const buildFromRecord = (
  record: Record<string, JsonValue>,
  path: PathSegment[],
  level: number
): JSONContent[] => {
  const nodes: JSONContent[] = [];

  for (const [key, value] of Object.entries(record)) {
    const label = formatKey(key);
    const childPath = [...path, key];

    if (isPrimitive(value)) {
      nodes.push(
        createValueParagraph({
          label,
          value,
          path: childPath,
          level,
        })
      );
    } else if (Array.isArray(value)) {
      nodes.push(
        createHeadingParagraph({
          label,
          path: childPath,
          level,
          dataType: 'array',
        })
      );
      nodes.push(...buildFromArray(value, childPath, level + 1));
    } else if (isRecord(value)) {
      nodes.push(
        createHeadingParagraph({
          label,
          path: childPath,
          level,
          dataType: 'object',
        })
      );
      nodes.push(...buildFromRecord(value, childPath, level + 1));
    }
  }

  return nodes;
};

export const jsonToTiptapDoc = (value: JsonValue): JSONContent => {
  const content = (isRecord(value)
    ? buildFromRecord(value, [], 0)
    : buildFromRecord({ dato: value }, [], 0)).filter(Boolean);

  if (content.length === 0) {
    content.push({
      type: 'clinicalParagraph',
      attrs: {
        level: 0,
        path: 'nota',
        dataType: 'string',
        nodeType: 'value',
      },
      content: [
        {
          type: 'text',
          marks: [{ type: 'bold' }],
          text: 'Nota: ',
        },
        {
          type: 'text',
          text: 'Sin información',
        },
      ],
    });
  }

  return {
    type: 'doc',
    content,
  };
};
