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
 * Stores the original JSON key in a data attribute for reverse transformation
 * Level 1 headings (top-level keys) are non-editable
 * Level 2+ headings (nested keys) are editable
 */
export const CustomHeading = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      jsonKey: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-json-key'),
        renderHTML: (attributes) => {
          // Always render the data attribute when jsonKey exists
          return attributes.jsonKey
            ? { 'data-json-key': attributes.jsonKey }
            : {};
        },
      },
      isTopLevel: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-top-level') === 'true',
        renderHTML: (attributes) => {
          // Always render the attribute (true or false)
          return {
            'data-top-level': attributes.isTopLevel ? 'true' : 'false',
          };
        },
      },
    };
  },

  // Override renderHTML to apply classes based on attributes
  renderHTML({ node, HTMLAttributes }) {
    const level = this.options.levels.includes(node.attrs.level)
      ? node.attrs.level
      : this.options.levels[0];

    const classes = [];

    // Add top-level class if it's a top-level heading
    if (node.attrs.isTopLevel) {
      classes.push('heading-top-level');
    }

    // Combine existing classes from HTMLAttributes with new classes
    if (HTMLAttributes.class) {
      classes.push(HTMLAttributes.class);
    }

    return [
      `h${level}`,
      {
        ...HTMLAttributes,
        class: classes.length > 0 ? classes.join(' ') : undefined,
      },
      0,
    ];
  },

  addKeyboardShortcuts() {
    return {
      // Prevent editing top-level headings
      Backspace: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;

        // Check if we're in a heading
        if ($from.parent.type.name === 'heading') {
          const node = $from.parent;
          const isTopLevel = node.attrs.isTopLevel;

          // If it's a top-level heading, prevent deletion
          if (isTopLevel) {
            return true; // Block the action
          }
        }
        return false; // Allow default behavior
      },
      Delete: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;

        if ($from.parent.type.name === 'heading') {
          const node = $from.parent;
          const isTopLevel = node.attrs.isTopLevel;

          if (isTopLevel) {
            return true; // Block the action
          }
        }
        return false;
      },
    };
  },

  addProseMirrorPlugins() {
    const { Plugin } = require('@tiptap/pm/state');

    return [
      new Plugin({
        key: new (require('@tiptap/pm/state').PluginKey)('topLevelHeadingProtection'),
        props: {
          // Prevent input in top-level headings
          handleTextInput: (view, from, to, text) => {
            const { state } = view;
            const { doc } = state;
            const $pos = doc.resolve(from);

            if ($pos.parent.type.name === 'heading' && $pos.parent.attrs.isTopLevel) {
              return true; // Block text input
            }
            return false; // Allow normal input
          },
          // Prevent clicking/selecting top-level headings
          handleClick: (view, pos, event) => {
            const { state } = view;
            const { doc } = state;
            const $pos = doc.resolve(pos);

            if ($pos.parent.type.name === 'heading' && $pos.parent.attrs.isTopLevel) {
              // Prevent selection
              event.preventDefault();
              return true;
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
