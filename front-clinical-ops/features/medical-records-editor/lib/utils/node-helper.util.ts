/**
 * Node Helper Utility
 *
 * Helpers para trabajar con nodos de ProseMirror/Tiptap
 */

import type { Node as ProseMirrorNode, ResolvedPos } from '@tiptap/pm/model';
import type { EditorState } from '@tiptap/pm/state';

/**
 * Verifica si un nodo es un heading original (no editable)
 */
export function isOriginalHeading(node: ProseMirrorNode): boolean {
  return node.type.name === 'heading' && node.attrs.isNew === false;
}

/**
 * Verifica si un nodo es un heading nuevo (editable)
 */
export function isNewHeading(node: ProseMirrorNode): boolean {
  return node.type.name === 'heading' && node.attrs.isNew === true;
}

/**
 * Verifica si un nodo es un paragraph
 */
export function isParagraph(node: ProseMirrorNode): boolean {
  return node.type.name === 'paragraph';
}

/**
 * Obtiene el nivel jerárquico de un nodo
 */
export function getNodeLevel(node: ProseMirrorNode): number {
  if (node.type.name === 'heading') {
    return node.attrs.level ?? 1;
  }
  if (node.type.name === 'paragraph') {
    return node.attrs.level ?? 1;
  }
  return 1;
}

/**
 * Verifica si una posición está al inicio de un nodo
 */
export function isAtNodeStart($pos: ResolvedPos): boolean {
  return $pos.parentOffset === 0;
}

/**
 * Verifica si una posición está al final de un nodo
 */
export function isAtNodeEnd($pos: ResolvedPos): boolean {
  return $pos.parentOffset === $pos.parent.content.size;
}

/**
 * Obtiene el nodo anterior a una posición
 */
export function getNodeBefore(state: EditorState, pos: number): ProseMirrorNode | null {
  try {
    const $pos = state.doc.resolve(pos);
    const index = $pos.index();

    if (index > 0) {
      return $pos.parent.child(index - 1);
    }

    // Si no hay nodo anterior en el padre, buscar en el nivel superior
    if ($pos.depth > 0) {
      const $before = state.doc.resolve($pos.before());
      return getNodeBefore(state, $before.pos);
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Obtiene el nodo siguiente a una posición
 */
export function getNodeAfter(state: EditorState, pos: number): ProseMirrorNode | null {
  try {
    const $pos = state.doc.resolve(pos);
    const index = $pos.index();

    if (index < $pos.parent.childCount - 1) {
      return $pos.parent.child(index + 1);
    }

    // Si no hay nodo siguiente en el padre, buscar en el nivel superior
    if ($pos.depth > 0) {
      const $after = state.doc.resolve($pos.after());
      return getNodeAfter(state, $after.pos);
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Verifica si se puede unir un nodo con el anterior
 * (usado para prevenir unión de paragraphs con headings)
 */
export function canJoinWithPrevious(state: EditorState, $pos: ResolvedPos): boolean {
  if (!isAtNodeStart($pos)) {
    return true; // No estamos al inicio, join normal
  }

  try {
    const nodeBefore = getNodeBefore(state, $pos.pos - 1);

    // No permitir unir si el nodo anterior es un heading
    if (nodeBefore && nodeBefore.type.name === 'heading') {
      return false;
    }

    return true;
  } catch {
    return true;
  }
}

/**
 * Verifica si se puede unir un nodo con el siguiente
 * (usado para prevenir unión de headings con paragraphs)
 */
export function canJoinWithNext(state: EditorState, $pos: ResolvedPos): boolean {
  if (!isAtNodeEnd($pos)) {
    return true; // No estamos al final, delete normal
  }

  try {
    const nodeAfter = getNodeAfter(state, $pos.pos + 1);

    // No permitir unir si el nodo siguiente es un heading
    if (nodeAfter && nodeAfter.type.name === 'heading') {
      return false;
    }

    return true;
  } catch {
    return true;
  }
}

/**
 * Extrae el texto plano de un nodo
 */
export function extractNodeText(node: ProseMirrorNode): string {
  let text = '';

  node.descendants((child) => {
    if (child.isText) {
      text += child.text || '';
    }
  });

  return text;
}

/**
 * Calcula la indentación CSS basada en el nivel
 */
export function calculateIndentation(level: number): string {
  const baseIndent = 1.25; // rem
  const increment = 2; // rem por nivel

  return `${baseIndent + (level - 1) * increment}rem`;
}

/**
 * Obtiene el color del borde según el nivel
 */
export function getLevelBorderColor(level: number, isDark = false): string {
  if (isDark) {
    const darkColors = [
      'transparent',
      'rgb(30 58 138)',   // Blue-900
      'rgb(29 78 216)',   // Blue-800
      'rgb(37 99 235)',   // Blue-700
    ];
    return darkColors[Math.min(level - 1, darkColors.length - 1)];
  }

  const lightColors = [
    'transparent',
    'rgb(219 234 254)', // Blue-100
    'rgb(191 219 254)', // Blue-200
    'rgb(147 197 253)', // Blue-300
  ];

  return lightColors[Math.min(level - 1, lightColors.length - 1)];
}
