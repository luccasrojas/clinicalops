export type JsonPrimitive = string | number | boolean | null;

export interface JsonRecord {
  [key: string]: JsonValue;
}

export type JsonValue = JsonPrimitive | JsonValue[] | JsonRecord;

export type EditorNodeType = 'heading' | 'value' | 'list';

export type EditorDataType = 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array';

export type EditorMode = 'edit' | 'view' | 'readonly';
