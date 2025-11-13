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

    // Guardar posición actual para restaurarla después
    const { from, to } = editor.state.selection;

    if (type === 'paragraph') {
      // Convertir a paragraph manteniendo el nivel
      editor
        .chain()
        .focus()
        .setParagraph()
        .updateAttributes('paragraph', { level: currentLevel })
        .setTextSelection({ from, to })
        .run();
    } else {
      // Convertir a heading
      const level = type === 'h1' ? 1 : type === 'h2' ? 2 : 3;

      // IMPORTANTE: setHeading() solo acepta { level }
      // Los atributos personalizados se establecen con updateAttributes()
      editor
        .chain()
        .focus()
        .setHeading({ level }) // Solo level aquí
        .updateAttributes('heading', {
          // Luego establecer atributos personalizados
          isNew: true, // Marca como editable
          jsonKey: null, // No tiene jsonKey (es nuevo)
          parentPath: '',
        })
        .setTextSelection({ from, to })
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
          className="w-10 h-10 rounded-md bg-[#E6F9F7] dark:bg-[#00BBA7]/30 text-[#00BBA7] dark:text-[#33D9C6] hover:bg-[#CCF3EF] dark:hover:bg-[#00BBA7]/50 transition-all flex items-center justify-center group"
          title="Convertir a Título Principal (H1) - Editable"
        >
          <Heading1 className="w-5 h-5" />
        </button>

        {/* H2 Button */}
        <button
          onClick={() => convertTo('h2')}
          className="w-10 h-10 rounded-md bg-[#E6F9F7] dark:bg-[#00BBA7]/30 text-[#00BBA7] dark:text-[#33D9C6] hover:bg-[#CCF3EF] dark:hover:bg-[#00BBA7]/50 transition-all flex items-center justify-center group"
          title="Convertir a Subtítulo (H2) - Editable"
        >
          <Heading2 className="w-5 h-5" />
        </button>

        {/* H3 Button */}
        <button
          onClick={() => convertTo('h3')}
          className="w-10 h-10 rounded-md bg-[#E6F9F7] dark:bg-[#00BBA7]/30 text-[#00BBA7] dark:text-[#33D9C6] hover:bg-[#CCF3EF] dark:hover:bg-[#00BBA7]/50 transition-all flex items-center justify-center group"
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
      </div>
    </div>
  );
}
