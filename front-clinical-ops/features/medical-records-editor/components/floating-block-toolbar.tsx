'use client';

/**
 * Floating Block Toolbar
 *
 * Toolbar flotante para convertir texto seleccionado a diferentes formatos:
 * - H1, H2, H3 (marcados como nuevos, editables)
 * - Paragraph
 *
 * Solo aparece cuando hay texto seleccionado
 */

import { Editor } from '@tiptap/react';
import { Type, Heading1, Heading2, Heading3 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface FloatingBlockToolbarProps {
  editor: Editor;
}

export function FloatingBlockToolbar({ editor }: FloatingBlockToolbarProps) {
  const [hasSelection, setHasSelection] = useState(false);

  // Actualizar estado de selección
  useEffect(() => {
    const updateSelection = () => {
      const { from, to } = editor.state.selection;
      const hasText = from !== to;

      // Solo mostrar si hay selección de texto (no solo cursor)
      setHasSelection(hasText);
    };

    // Subscribirse a cambios de selección
    editor.on('selectionUpdate', updateSelection);
    editor.on('update', updateSelection);

    // Estado inicial
    updateSelection();

    return () => {
      editor.off('selectionUpdate', updateSelection);
      editor.off('update', updateSelection);
    };
  }, [editor]);

  /**
   * Convierte el texto seleccionado al tipo especificado
   */
  const convertTo = (type: 'h1' | 'h2' | 'h3' | 'paragraph') => {
    if (!hasSelection) return;

    // Obtener el nivel actual del nodo para mantener jerarquía
    const { $from } = editor.state.selection;
    const currentLevel = $from.parent.attrs?.level || 1;

    if (type === 'paragraph') {
      // Convertir a paragraph manteniendo el nivel
      editor
        .chain()
        .focus()
        .setParagraph()
        .updateAttributes('paragraph', { level: currentLevel })
        .run();
    } else {
      // Convertir a heading
      const level = type === 'h1' ? 1 : type === 'h2' ? 2 : 3;

      // IMPORTANTE: Marcar como nuevo (isNew = true) para que sea editable
      editor
        .chain()
        .focus()
        .setHeading({ level })
        .updateAttributes('heading', {
          isNew: true, // Marca como editable
          jsonKey: null, // No tiene jsonKey (es nuevo)
          parentPath: '',
        })
        .run();
    }
  };

  // No mostrar toolbar si no hay selección
  if (!hasSelection) {
    return null;
  }

  return (
    <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 animate-in fade-in slide-in-from-right-4 duration-200">
      <div className="flex flex-col gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-2 border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 border-b border-gray-200 dark:border-gray-700 font-medium">
          Convertir a:
        </div>

        {/* H1 Button */}
        <button
          onClick={() => convertTo('h1')}
          className="w-10 h-10 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all flex items-center justify-center group"
          title="Convertir a Título Principal (H1) - Editable"
        >
          <Heading1 className="w-5 h-5" />
        </button>

        {/* H2 Button */}
        <button
          onClick={() => convertTo('h2')}
          className="w-10 h-10 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all flex items-center justify-center group"
          title="Convertir a Subtítulo (H2) - Editable"
        >
          <Heading2 className="w-5 h-5" />
        </button>

        {/* H3 Button */}
        <button
          onClick={() => convertTo('h3')}
          className="w-10 h-10 rounded-md bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 transition-all flex items-center justify-center group"
          title="Convertir a Sub-Subtítulo (H3) - Editable"
        >
          <Heading3 className="w-5 h-5" />
        </button>

        {/* Paragraph Button */}
        <button
          onClick={() => convertTo('paragraph')}
          className="w-10 h-10 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all flex items-center justify-center group"
          title="Convertir a Párrafo"
        >
          <Type className="w-5 h-5" />
        </button>

        {/* Help text */}
        <div className="text-[10px] text-gray-400 dark:text-gray-500 px-1 text-center">
          ✎ Nuevos headings son editables
        </div>
      </div>
    </div>
  );
}
