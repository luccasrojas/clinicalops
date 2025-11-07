'use client';

import { useEffect, useMemo } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import type { JsonValue } from '../types/editor';
import { jsonToTiptapDoc } from '../lib/json-to-tiptap';
import { tiptapToStructuredJson } from '../lib/tiptap-to-json';
import { CustomDocument, CustomParagraph } from '../lib/prosemirror-extensions';
import { EditorToolbar } from './editor-toolbar';
import { cn } from '@/lib/utils';
import styles from '../styles/editor.module.css';

type TiptapEditorProps = {
  value: JsonValue;
  onChange?: (value: JsonValue) => void;
  readOnly?: boolean;
  className?: string;
  placeholder?: string;
};

export function TiptapEditor({
  value,
  onChange,
  readOnly = false,
  className,
  placeholder = 'Empieza a documentar la historia clínica...',
}: TiptapEditorProps) {
  const memoContent = useMemo(() => jsonToTiptapDoc(value), [value]);

  const editor = useEditor(
    {
      extensions: [
        CustomDocument,
        CustomParagraph,
        StarterKit.configure({
          document: false,
          paragraph: false,
        }),
        Placeholder.configure({
          placeholder,
        }),
      ],
      editable: !readOnly,
      content: memoContent,
      onUpdate: ({ editor: instance }) => {
        if (!onChange) return;
        const structured = tiptapToStructuredJson(instance.getJSON());
        onChange(structured);
      },
    },
    [memoContent, readOnly, placeholder]
  );

  useEffect(() => {
    if (!editor) return;
    const currentJSON = editor.getJSON();
    const nextJSON = memoContent;
    if (JSON.stringify(currentJSON) === JSON.stringify(nextJSON)) {
      return;
    }
    editor.commands.setContent(nextJSON, false, { preserveWhitespace: true });
  }, [editor, memoContent]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn(styles.editorWrapper, className)}>
      {!readOnly && <EditorToolbar editor={editor} />}
      <div className="editor-content">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
