'use client';

/**
 * Clinical Notes Editor Component
 *
 * Editor profesional de historias clínicas con:
 * - Jerarquía visual clara (H1, H2, H3 + texto)
 * - Protección de headings originales (no editables)
 * - Texto siempre editable
 * - Transformación JSON bidireccional
 * - UX optimizada para doctores
 */

import { useEffect, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { cn } from '@/lib/utils';

import type { EditorMode } from '../types/editor';
import {
  ClinicalDocument,
  ClinicalHeading,
  ClinicalText,
} from '../lib/tiptap-extensions';
import { JsonTransformerService } from '../services/json-transformer.service';
import type { JsonObject } from '../services/json-transformer.service';
import { FloatingBlockToolbar } from './floating-block-toolbar';

interface TiptapEditorProps {
  value: JsonObject;
  onChange?: (value: JsonObject) => void;
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
  placeholder = 'Escribe el contenido clínico aquí...',
  readOnly = false,
}: TiptapEditorProps) {
  // Instancia del transformer service (singleton)
  const transformer = useMemo(() => new JsonTransformerService(), []);

  // Configuración del editor
  const editor = useEditor({
    extensions: [
      // Extensions custom
      ClinicalDocument,
      ClinicalHeading,
      ClinicalText,

      // StarterKit (sin document, paragraph, heading)
      StarterKit.configure({
        document: false, // Usamos ClinicalDocument
        paragraph: false, // Usamos ClinicalText
        heading: false, // Usamos ClinicalHeading

        // Desactivar features no necesarias
        strike: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        // bold, italic, hardBreak, history usan configuración por defecto (habilitados)
      }),

      // Placeholder
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return 'Título de sección...';
          }
          return placeholder;
        },
      }),
    ],

    // Props del editor
    editorProps: {
      attributes: {
        spellcheck: 'false',
        autocorrect: 'off',
        autocapitalize: 'off',
        class: 'focus:outline-none',
      },
    },

    // Contenido inicial
    content: value ? transformer.jsonToTiptap(value) : undefined,

    // Editabilidad
    editable: mode === 'edit' && !readOnly,

    // SSR
    immediatelyRender: false,

    // Callback cuando el contenido cambia
    onUpdate: ({ editor }) => {
      if (mode !== 'edit' || !onChange || readOnly) return;

      try {
        const tiptapDoc = editor.getJSON();
        const jsonData = transformer.tiptapToJson(tiptapDoc);
        onChange(jsonData);
      } catch (error) {
        console.error('[ClinicalEditor] Error transforming content:', error);
      }
    },
  });

  // Sincronizar cambios externos (cuando value cambia desde fuera)
  useEffect(() => {
    if (!editor || !value) return;

    // No actualizar si el usuario está escribiendo
    if (editor.isFocused) {
      return;
    }

    try {
      const currentDoc = editor.getJSON();
      const newDoc = transformer.jsonToTiptap(value);

      // Solo actualizar si el contenido realmente cambió
      const currentStr = JSON.stringify(currentDoc);
      const newStr = JSON.stringify(newDoc);

      if (currentStr !== newStr) {
        editor.commands.setContent(newDoc, { emitUpdate: false });
      }
    } catch (error) {
      console.error('[ClinicalEditor] Error syncing external changes:', error);
    }
  }, [editor, value, transformer]);

  // Auto-focus al montar (solo en modo edición)
  useEffect(() => {
    if (!editor || mode !== 'edit' || readOnly) return;

    const timer = setTimeout(() => {
      editor.commands.focus('start');
    }, 100);

    return () => clearTimeout(timer);
  }, [editor, mode, readOnly]);

  // Loading state
  if (!editor) {
    return (
      <div
        className={cn(
          'clinical-note-tiptap-editor',
          'flex items-center justify-center',
          className
        )}
      >
        <div className="text-gray-400 text-sm">Cargando editor...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div
        className={cn(
          'clinical-note-tiptap-editor',
          mode === 'readonly' && 'readonly-mode',
          className
        )}
      >
        <EditorContent editor={editor} className="editor-content" />
      </div>

      {/* Toolbar flotante (solo en modo edición) */}
      {mode === 'edit' && !readOnly && <FloatingBlockToolbar editor={editor} />}
    </div>
  );
}
