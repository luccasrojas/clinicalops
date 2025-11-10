/**
 * Custom Prosemirror Extensions for Clinical Notes Editor
 *
 * PLAN ORIGINAL - Sistema simple con headings + paragraphs con level attribute
 */

import { Document } from '@tiptap/extension-document';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Heading } from '@tiptap/extension-heading';

/**
 * CustomDocument Extension
 * Allows heading followed by any blocks
 */
export const CustomDocument = Document.extend({
  content: 'heading block*',
});

/**
 * CustomParagraph Extension
 * Adds 'level' attribute for hierarchical indentation
 */
export const CustomParagraph = Paragraph.extend({
  addAttributes() {
    return {
      level: {
        default: 1,
        parseHTML: (element) => {
          const level = element.getAttribute('data-level');
          return level ? parseInt(level, 10) : 1;
        },
        renderHTML: (attributes) => {
          if (!attributes.level) {
            return {};
          }
          return {
            'data-level': attributes.level,
            class: `p-level-${attributes.level}`,
          };
        },
      },
    };
  },
});

/**
 * CustomHeading Extension
 *
 * Uses native heading levels for semantic HTML and simple CSS targeting:
 * - Level 1 (h1) = Top-level sections (non-editable, purple styling)
 * - Level 2 (h2) = Sub-sections (editable, gray styling)
 * - Level 3 (h3) = Sub-sub-sections (editable, lighter styling)
 *
 * Stores jsonKey for reverse transformation to JSON structure
 */
export const CustomHeading = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      jsonKey: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-json-key'),
        renderHTML: (attributes) => {
          return attributes.jsonKey
            ? { 'data-json-key': attributes.jsonKey }
            : {};
        },
      },
      isNew: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-is-new') === 'true',
        renderHTML: (attributes) => {
          return attributes.isNew
            ? { 'data-is-new': 'true' }
            : {};
        },
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      // Prevent editing h1 headings only
      Backspace: ({ editor }) => {
        const { state } = editor;
        const { $from, $to, empty } = state.selection;

        // Block backspace only in h1 headings
        if ($from.parent.type.name === 'heading') {
          const level = $from.parent.attrs.level;

          // Only H1 is non-editable, h2/h3 are always editable
          if (level === 1) {
            return true; // Block
          }
        }

        // Prevent joining paragraph with heading above
        if ($from.parent.type.name === 'paragraph' && $from.parentOffset === 0 && empty) {
          const $before = state.doc.resolve($from.pos - 1);
          if ($before.parent.type.name === 'heading') {
            return true;
          }
        }

        return false;
      },
      Delete: ({ editor }) => {
        const { state } = editor;
        const { $from } = state.selection;

        if ($from.parent.type.name === 'heading') {
          const level = $from.parent.attrs.level;

          // Only block delete in h1 headings
          if (level === 1) {
            return true;
          }
        }
        return false;
      },
      // Always create paragraphs when pressing Enter in headings
      Enter: ({ editor }) => {
        const { state } = editor;
        const { $from } = state.selection;

        if ($from.parent.type.name === 'heading') {
          const { tr } = state;
          const pos = $from.after();
          tr.insert(pos, state.schema.nodes.paragraph.create());
          tr.setSelection(require('@tiptap/pm/state').TextSelection.create(tr.doc, pos + 1));
          editor.view.dispatch(tr);
          return true;
        }
        return false;
      },
    };
  },

  addProseMirrorPlugins() {
    const { Plugin } = require('@tiptap/pm/state');

    return [
      new Plugin({
        key: new (require('@tiptap/pm/state').PluginKey)('headingProtection'),
        props: {
          // Block text input only in h1 headings
          handleTextInput: (view, from, to, text) => {
            const { state } = view;
            const $pos = state.doc.resolve(from);

            if ($pos.parent.type.name === 'heading') {
              const level = $pos.parent.attrs.level;

              // Only H1 is protected, h2/h3 are always editable
              if (level === 1) {
                return true; // Block input
              }
            }
            return false;
          },
          // Prevent clicking into h1 headings only
          handleClick: (view, pos, event) => {
            const { state } = view;
            const $pos = state.doc.resolve(pos);

            if ($pos.parent.type.name === 'heading') {
              const level = $pos.parent.attrs.level;

              // Only block clicking in h1 headings
              if (level === 1) {
                event.preventDefault();
                return true;
              }
            }
            return false;
          },
        },
      }),
    ];
  },
});

/**
 * Format JSON key for display
 * "datos_personales" → "Datos Personales"
 */
export function formatKey(key: string): string {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Unformat display text back to JSON key
 * "Diagnostico Medico De Paciente" → "diagnostico_medico_de_paciente"
 */
export function unformatKey(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_') // Espacios → underscores
    .replace(/[^a-z0-9_]/g, ''); // Remove special chars
}
