/**
 * Clinical Heading Extension
 *
 * Headings para historias clínicas con protección de editabilidad:
 * - H1, H2, H3 representan la jerarquía (título, subtítulo, sub-subtítulo)
 * - Headings originales (isNew = false) son NO editables
 * - Headings nuevos (isNew = true) son editables
 * - Enter en heading crea paragraph del nivel apropiado
 * - No se puede unir con paragraphs
 */

import { Heading } from '@tiptap/extension-heading';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { TextSelection } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import type { Editor } from '@tiptap/react';
import { isOriginalHeading, canJoinWithNext } from '../utils/node-helper.util';

export const ClinicalHeading = Heading.extend({
  name: 'heading',

  addAttributes() {
    return {
      // Nivel del heading (1 = H1, 2 = H2, 3 = H3)
      level: {
        default: 1,
        parseHTML: (element: HTMLElement) => {
          const level = element.getAttribute('data-level');
          return level ? parseInt(level, 10) : 1;
        },
        renderHTML: (attributes: Record<string, any>) => {
          return {
            'data-level': attributes.level,
          };
        },
      },

      // Key JSON original (para transformación inversa)
      jsonKey: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-json-key'),
        renderHTML: (attributes: Record<string, any>) => {
          return attributes.jsonKey
            ? { 'data-json-key': attributes.jsonKey }
            : {};
        },
      },

      // Marca si es un heading nuevo (editable) o original (no editable)
      isNew: {
        default: false,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-is-new') === 'true',
        renderHTML: (attributes: Record<string, any>) => {
          return attributes.isNew ? { 'data-is-new': 'true' } : {};
        },
      },

      // Path jerárquico (para debugging y navegación)
      parentPath: {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-parent-path') || '',
        renderHTML: (attributes: Record<string, any>) => {
          return attributes.parentPath
            ? { 'data-parent-path': attributes.parentPath }
            : {};
        },
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      /**
       * Backspace en heading:
       * - Si es original (isNew = false): BLOQUEAR
       * - Si es nuevo (isNew = true): permitir
       * - Prevenir unión con nodo anterior si es heading
       */
      Backspace: ({ editor }: { editor: Editor }) => {
        const { state } = editor;
        const { $from, empty } = state.selection;

        // Si estamos dentro de un heading
        if ($from.parent.type.name === 'heading') {
          // Bloquear si es heading original
          if (isOriginalHeading($from.parent)) {
            return true; // Bloquear
          }

          // Permitir edición en headings nuevos
          return false;
        }

        return false;
      },

      /**
       * Delete en heading:
       * - Si es original (isNew = false): BLOQUEAR
       * - Si es nuevo (isNew = true): permitir
       * - Prevenir unión con nodo siguiente si es heading
       */
      Delete: ({ editor }: { editor: Editor }) => {
        const { state } = editor;
        const { $from, empty } = state.selection;

        // Si estamos dentro de un heading
        if ($from.parent.type.name === 'heading') {
          // Bloquear si es heading original
          if (isOriginalHeading($from.parent)) {
            return true; // Bloquear
          }

          // Prevenir unión con nodo siguiente
          if (!canJoinWithNext(state, $from)) {
            return true;
          }
        }

        return false;
      },

      /**
       * Enter en heading:
       * - Crea un paragraph del mismo nivel jerárquico
       * - Posiciona el cursor al inicio del nuevo paragraph
       */
      Enter: ({ editor }: { editor: Editor }) => {
        const { state } = editor;
        const { $from } = state.selection;

        if ($from.parent.type.name === 'heading') {
          const { tr } = state;
          const level = $from.parent.attrs.level;

          // Posición después del heading
          const pos = $from.after();

          // Crear paragraph con el mismo nivel
          const paragraph = state.schema.nodes.paragraph.create({
            level,
          });

          // Insertar paragraph
          tr.insert(pos, paragraph);

          // Posicionar cursor al inicio del nuevo paragraph
          tr.setSelection(TextSelection.create(tr.doc, pos + 1));

          // Dispatch transaction
          editor.view.dispatch(tr);

          return true; // Prevenir comportamiento por defecto
        }

        return false;
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('clinicalHeadingProtection'),

        props: {
          /**
           * Bloquear input de texto en headings originales
           */
          handleTextInput: (
            view: EditorView,
            from: number,
            to: number,
            text: string
          ) => {
            const { state } = view;
            const $pos = state.doc.resolve(from);

            if ($pos.parent.type.name === 'heading') {
              // Bloquear si es heading original
              if (isOriginalHeading($pos.parent)) {
                return true; // Bloquear input
              }
            }

            return false; // Permitir input
          },

          /**
           * Bloquear clicks en headings originales
           * (Prevenir que el usuario pueda poner el cursor ahí)
           */
          handleClick: (view: EditorView, pos: number, event: MouseEvent) => {
            const { state } = view;
            const $pos = state.doc.resolve(pos);

            if ($pos.parent.type.name === 'heading') {
              // Bloquear si es heading original
              if (isOriginalHeading($pos.parent)) {
                event.preventDefault();
                return true; // Bloquear click
              }
            }

            return false; // Permitir click
          },
        },
      }),
    ];
  },
});
