export type JsonPrimitive = string | number | boolean | null;

export type JsonValue = JsonPrimitive | JsonValue[] | JsonRecord;

export type JsonRecord = Record<string, JsonValue>;

export type EditorNodeType = 'heading' | 'value' | 'list';

export type EditorDataType = 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array';
