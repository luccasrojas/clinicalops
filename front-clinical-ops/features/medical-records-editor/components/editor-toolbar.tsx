import type { Editor } from '@tiptap/react';
import { Bold, Italic, RotateCcw, RotateCw } from 'lucide-react';

type EditorToolbarProps = {
  editor: Editor | null;
};

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null;

  const buttons = [
    {
      label: 'Negrita',
      icon: Bold,
      isActive: editor.isActive('bold'),
      onClick: () => editor.chain().focus().toggleBold().run(),
      disabled: !editor.can().chain().focus().toggleBold().run(),
    },
    {
      label: 'Cursiva',
      icon: Italic,
      isActive: editor.isActive('italic'),
      onClick: () => editor.chain().focus().toggleItalic().run(),
      disabled: !editor.can().chain().focus().toggleItalic().run(),
    },
    {
      label: 'Deshacer',
      icon: RotateCcw,
      isActive: false,
      onClick: () => editor.chain().focus().undo().run(),
      disabled: !editor.can().chain().focus().undo().run(),
    },
    {
      label: 'Rehacer',
      icon: RotateCw,
      isActive: false,
      onClick: () => editor.chain().focus().redo().run(),
      disabled: !editor.can().chain().focus().redo().run(),
    },
  ];

  return (
    <div className="editor-toolbar">
      {buttons.map(({ icon: Icon, label, isActive, onClick, disabled }) => (
        <button
          key={label}
          type="button"
          aria-label={label}
          className={isActive ? 'is-active' : undefined}
          onClick={onClick}
          disabled={disabled}
        >
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
