'use client';

/**
 * Floating Block Toolbar
 *
 * Experiencia basada en bloques al estilo Notion. Cuando el usuario coloca el
 * cursor dentro de un heading o paragraph mostramos acciones para insertar o
 * eliminar bloques sin necesidad de seleccionar texto ni cambiar tipos desde un
 * select clásico.
 */

import { Editor } from '@tiptap/react';
import type { JSONContent } from '@tiptap/react';
import { useEffect, useMemo, useState } from 'react';
import { Heading2, Heading3, Trash2, Type } from 'lucide-react';

type BlockKind = 'paragraph' | 'h2' | 'h3';

type ActiveBlock = {
  type: 'heading' | 'paragraph';
  level: number;
  pos: number;
  nodeSize: number;
  isNewHeading: boolean;
};

interface FloatingBlockToolbarProps {
  editor: Editor;
}

export function FloatingBlockToolbar({ editor }: FloatingBlockToolbarProps) {
  const [activeBlock, setActiveBlock] = useState<ActiveBlock | null>(null);

  const updateActiveBlock = useMemo(
    () => () => {
      const { state } = editor;
      const { $from } = state.selection;
      const parent = $from.node($from.depth);

      if (!parent || !['heading', 'paragraph'].includes(parent.type.name)) {
        setActiveBlock(null);
        return;
      }

      const blockPos = $from.before($from.depth);

      setActiveBlock({
        type: parent.type.name as 'heading' | 'paragraph',
        level: parent.attrs?.level ?? 1,
        pos: blockPos,
        nodeSize: parent.nodeSize,
        isNewHeading: parent.attrs?.isNew ?? false,
      });
    },
    [editor]
  );

  useEffect(() => {
    const clearActiveBlock = () => setActiveBlock(null);
    let animationFrame: number | null = null;

    const scheduleUpdate = () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      animationFrame = requestAnimationFrame(() => {
        updateActiveBlock();
        animationFrame = null;
      });
    };

    editor.on('selectionUpdate', scheduleUpdate);
    editor.on('update', scheduleUpdate);
    editor.on('focus', scheduleUpdate);
    editor.on('blur', clearActiveBlock);

    scheduleUpdate();

    return () => {
      editor.off('selectionUpdate', scheduleUpdate);
      editor.off('update', scheduleUpdate);
      editor.off('focus', scheduleUpdate);
      editor.off('blur', clearActiveBlock);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [editor, updateActiveBlock]);

  const createTemporaryKey = () => {
    if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
      return `new_block_${globalThis.crypto.randomUUID()}`;
    }
    return `new_block_${Date.now()}`;
  };

  const insertBlock = (kind: BlockKind) => {
    if (!activeBlock) return;

    const insertPos = activeBlock.pos + activeBlock.nodeSize;
    const nodes: JSONContent[] = [];
    const focusPosition = insertPos + 1;

    if (kind === 'paragraph') {
      nodes.push({
        type: 'paragraph',
        attrs: { level: activeBlock.level },
        content: [],
      });
    } else {
      const headingLevel = kind === 'h2' ? 2 : 3;

      nodes.push({
        type: 'heading',
        attrs: {
          level: headingLevel,
          isNew: true,
          jsonKey: createTemporaryKey(),
          parentPath: '',
        },
        content: [],
      });

      nodes.push({
        type: 'paragraph',
        attrs: { level: headingLevel },
        content: [],
      });
    }

    editor
      .chain()
      .focus()
      .insertContentAt(insertPos, nodes.length === 1 ? nodes[0] : nodes)
      .setTextSelection({ from: focusPosition, to: focusPosition })
      .run();
  };

  const deleteCurrentBlock = () => {
    if (!activeBlock) return;

    const { type, pos, nodeSize } = activeBlock;
    const { state } = editor;

    if (type === 'heading') {
      let end = pos + nodeSize;
      let nextPos = end;
      const { doc } = state;

      while (nextPos < doc.nodeSize - 2) {
        const resolved = doc.resolve(nextPos);
        const nextNode = resolved.nodeAfter;
        if (!nextNode) break;
        if (nextNode.type.name === 'heading') break;
        end += nextNode.nodeSize;
        nextPos += nextNode.nodeSize;
      }

      editor.chain().focus().deleteRange({ from: pos, to: end }).run();
      return;
    }

    editor.chain().focus().deleteRange({ from: pos, to: pos + nodeSize }).run();
  };

  const canDelete =
    activeBlock &&
    (activeBlock.type === 'paragraph' ||
      (activeBlock.type === 'heading' && activeBlock.isNewHeading));

  if (!activeBlock) {
    return null;
  }

  return (
    <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 animate-in fade-in slide-in-from-right-4 duration-200">
      <div className="flex flex-col gap-2 bg-white dark:bg-gray-900 rounded-xl shadow-xl p-3 border border-gray-200 dark:border-gray-800 w-48">
        <div className="text-xs text-gray-500 dark:text-gray-400 px-1 font-medium uppercase tracking-wide">
          Bloques
        </div>

        <button
          onClick={() => insertBlock('paragraph')}
          className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-[#E6F9F7] dark:hover:bg-[#00BBA7]/20 transition"
          title="Insertar un bloque de texto al mismo nivel"
        >
          <Type className="w-4 h-4" />
          Texto
        </button>

        <button
          onClick={() => insertBlock('h2')}
          className="flex items-center gap-2 rounded-lg border border-[#CCF3EF] text-[#00BBA7] px-3 py-2 text-sm hover:bg-[#E6F9F7] transition dark:border-[#00BBA7]/40 dark:text-[#33D9C6] dark:hover:bg-[#00BBA7]/20"
          title="Crear un subtítulo (H2) con un párrafo vacío debajo"
        >
          <Heading2 className="w-4 h-4" />
          Subtítulo
        </button>

        <button
          onClick={() => insertBlock('h3')}
          className="flex items-center gap-2 rounded-lg border border-[#CCF3EF] text-[#00BBA7] px-3 py-2 text-sm hover:bg-[#E6F9F7] transition dark:border-[#00BBA7]/40 dark:text-[#33D9C6] dark:hover:bg-[#00BBA7]/20"
          title="Crear una subsección (H3) dentro del bloque actual"
        >
          <Heading3 className="w-4 h-4" />
          Subsección
        </button>

        <button
          onClick={deleteCurrentBlock}
          disabled={!canDelete}
          className="flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-900 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          title={
            canDelete
              ? 'Eliminar este bloque'
              : 'Solo puedes eliminar párrafos y encabezados creados por ti'
          }
        >
          <Trash2 className="w-4 h-4" />
          Eliminar bloque
        </button>
      </div>
    </div>
  );
}
