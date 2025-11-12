/**
 * Clinical Text Extension (Paragraph)
 *
 * Texto editable para historias clínicas:
 * - Siempre editable (representa el contenido del doctor)
 * - Mantiene nivel jerárquico para indentación
 * - Enter crea otro paragraph del mismo nivel
 * - Backspace/Delete previenen unión con headings
 */

import { Paragraph } from '@tiptap/extension-paragraph';
import { TextSelection } from '@tiptap/pm/state';
import { canJoinWithPrevious, canJoinWithNext } from '../utils/node-helper.util';

export const ClinicalText = Paragraph.extend({
  name: 'paragraph',

  addAttributes() {
    return {
      // Nivel jerárquico (para indentación y transformación JSON)
      level: {
        default: 1,
        parseHTML: (element) => {
          const level = element.getAttribute('data-level');
          return level ? parseInt(level, 10) : 1;
        },
        renderHTML: (attributes) => {
          return {
            'data-level': attributes.level,
          };
        },
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      /**
       * Enter en paragraph:
       * - Crea otro paragraph del mismo nivel
       * - Mantiene la jerarquía
       */
      Enter: ({ editor }) => {
        const { state } = editor;
        const { $from } = state.selection;

        if ($from.parent.type.name === 'paragraph') {
          const { tr } = state;
          const currentLevel = $from.parent.attrs.level || 1;

          // Posición después del paragraph actual
          const pos = $from.after();

          // Crear nuevo paragraph con el mismo nivel
          const newParagraph = state.schema.nodes.paragraph.create({
            level: currentLevel,
          });

          // Insertar paragraph
          tr.insert(pos, newParagraph);

          // Posicionar cursor al inicio
          tr.setSelection(TextSelection.create(tr.doc, pos + 1));

          // Dispatch transaction
          editor.view.dispatch(tr);

          return true; // Prevenir comportamiento por defecto
        }

        return false;
      },

      /**
       * Backspace en paragraph:
       * - Prevenir unión con heading anterior
       * - Permitir unión con otros paragraphs
       */
      Backspace: ({ editor }) => {
        const { state } = editor;
        const { $from, empty } = state.selection;

        if ($from.parent.type.name === 'paragraph' && empty) {
          // Si estamos al inicio del paragraph
          if ($from.parentOffset === 0) {
            // Verificar si podemos unir con el nodo anterior
            if (!canJoinWithPrevious(state, $from)) {
              return true; // Bloquear unión
            }
          }
        }

        return false; // Comportamiento por defecto
      },

      /**
       * Delete en paragraph:
       * - Prevenir unión con heading siguiente
       * - Permitir unión con otros paragraphs
       */
      Delete: ({ editor }) => {
        const { state } = editor;
        const { $from, empty } = state.selection;

        if ($from.parent.type.name === 'paragraph' && empty) {
          // Si estamos al final del paragraph
          if ($from.parentOffset === $from.parent.content.size) {
            // Verificar si podemos unir con el nodo siguiente
            if (!canJoinWithNext(state, $from)) {
              return true; // Bloquear unión
            }
          }
        }

        return false; // Comportamiento por defecto
      },
    };
  },
});
