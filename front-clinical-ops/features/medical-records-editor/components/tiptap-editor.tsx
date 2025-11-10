'use client';

/**
 * TipTap Clinical Notes Editor Component
 *
 * PLAN ORIGINAL - Editor simple con headings editables + paragraphs jerárquicos
 */

import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { cn } from '@/lib/utils';

import type { JsonValue, EditorMode } from '../types/editor';
import {
  CustomDocument,
  CustomParagraph,
  CustomHeading,
} from '../lib/prosemirror-extensions';
import { jsonToTiptapDoc } from '../lib/json-to-tiptap';
import { tiptapToStructuredJson } from '../lib/tiptap-to-json';
import { FloatingBlockToolbar } from './floating-block-toolbar';

interface TiptapEditorProps {
  value: JsonValue;
  onChange?: (value: JsonValue) => void;
  mode?: EditorMode;
  className?: string;
  placeholder?: string;
  readOnly?: boolean;
}

export function TiptapEditor({
  value,
  onChange,
  mode = 'edit',
  className,
  placeholder = 'Agrega contenido clínico...',
  readOnly = false,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      CustomDocument,
      CustomHeading, // Headings con jsonKey attribute (EDITABLES)
      StarterKit.configure({
        document: false, // Use CustomDocument instead
        paragraph: false, // Use CustomParagraph instead
        heading: false, // Use CustomHeading instead
      }),
      CustomParagraph, // Paragraphs con level attribute (indentación)
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return 'Título de la sección';
          }
          return placeholder;
        },
      }),
    ],
    editorProps: {
      attributes: {
        spellcheck: 'false',
        autocorrect: 'off',
        autocapitalize: 'off',
      },
    },
    content: value ? jsonToTiptapDoc(value) : undefined,
    editable: mode === 'edit' && !readOnly,
    immediatelyRender: false, // Prevent SSR hydration issues
    onUpdate: ({ editor }) => {
      if (mode !== 'edit' || !onChange || readOnly) return;

      const tiptapJson = editor.getJSON();
      const transformed = tiptapToStructuredJson(tiptapJson);
      onChange(transformed);
    },
  });

  // Update editor content when value changes externally
  // BUT: Don't update if user is actively editing (has focus)
  useEffect(() => {
    if (!editor || !value) return;

    // If editor has focus, user is actively editing - don't update from props
    // This prevents cursor jumping when typing
    if (editor.isFocused) {
      return;
    }

    try {
      const currentContent = editor.getJSON();
      const newContent = jsonToTiptapDoc(value);

      // Only update if content actually changed (avoid infinite loops)
      if (JSON.stringify(currentContent) !== JSON.stringify(newContent)) {
        editor.commands.setContent(newContent, { emitUpdate: false });
      }
    } catch (error) {
      console.error('[TiptapEditor] Error setting content:', error);
      console.error('[TiptapEditor] Invalid value:', value);
      // Set empty content on error
      editor.commands.setContent(
        {
          type: 'doc',
          content: [{ type: 'paragraph', content: [] }],
        },
        { emitUpdate: false },
      );
    }
  }, [editor, value]);

  // Auto-focus editor on mount
  useEffect(() => {
    if (!editor || mode !== 'edit') return;

    setTimeout(() => {
      editor.commands.focus('start');
    }, 0);
  }, [editor, mode]);

  if (!editor) {
    return null;
  }

  return (
    <div className="relative">
      <div
        className={cn(
          'clinical-note-tiptap-editor',
          mode === 'readonly' && 'readonly-mode',
          className
        )}
      >
        <EditorContent editor={editor} className="editor-content" />
      </div>
      {mode === 'edit' && !readOnly && <FloatingBlockToolbar editor={editor} />}
    </div>
  );
}
