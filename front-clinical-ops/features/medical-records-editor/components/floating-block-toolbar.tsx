'use client';

import { Editor } from '@tiptap/react';
import { Type, Heading1, Heading2, Heading3 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface FloatingBlockToolbarProps {
  editor: Editor;
}

export function FloatingBlockToolbar({ editor }: FloatingBlockToolbarProps) {
  const [hasSelection, setHasSelection] = useState(false);

  // Check if there's a text selection
  useEffect(() => {
    const updateSelection = () => {
      const { from, to } = editor.state.selection;
      setHasSelection(from !== to);
    };

    editor.on('selectionUpdate', updateSelection);
    updateSelection();

    return () => {
      editor.off('selectionUpdate', updateSelection);
    };
  }, [editor]);

  const convertTo = (type: 'h1' | 'h2' | 'h3' | 'paragraph') => {
    if (!hasSelection) return;

    const { from, to } = editor.state.selection;

    if (type === 'paragraph') {
      editor.chain().focus().setParagraph().run();
    } else {
      const level = type === 'h1' ? 1 : type === 'h2' ? 2 : 3;
      // Mark as new heading (user-created, editable)
      editor.chain().focus().setHeading({ level }).updateAttributes('heading', { isNew: true }).run();
    }
  };

  if (!hasSelection) {
    return null; // Hide toolbar when no selection
  }

  return (
    <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50">
      <div className="flex flex-col gap-2 bg-white rounded-lg shadow-xl p-2 border border-gray-200">
        <div className="text-xs text-gray-500 px-2 py-1 border-b border-gray-200">
          Convertir a:
        </div>
        <button
          onClick={() => convertTo('h1')}
          className="w-10 h-10 rounded-md bg-purple-50 text-purple-600 hover:bg-purple-100 transition-all flex items-center justify-center"
          title="Convertir a Título Principal (H1)"
        >
          <Heading1 className="w-5 h-5" />
        </button>
        <button
          onClick={() => convertTo('h2')}
          className="w-10 h-10 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all flex items-center justify-center"
          title="Convertir a Subtítulo (H2)"
        >
          <Heading2 className="w-5 h-5" />
        </button>
        <button
          onClick={() => convertTo('h3')}
          className="w-10 h-10 rounded-md bg-cyan-50 text-cyan-600 hover:bg-cyan-100 transition-all flex items-center justify-center"
          title="Convertir a Subtítulo (H3)"
        >
          <Heading3 className="w-5 h-5" />
        </button>
        <button
          onClick={() => convertTo('paragraph')}
          className="w-10 h-10 rounded-md bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all flex items-center justify-center"
          title="Convertir a Párrafo"
        >
          <Type className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
