/**
 * Clinical Document Extension
 *
 * Define la estructura del documento clínico:
 * - Secuencias de heading + paragraphs opcionales
 * - Permite estructura jerárquica anidada
 */

import { Document } from '@tiptap/extension-document';

export const ClinicalDocument = Document.extend({
  name: 'doc',

  /**
   * Define qué contenido puede tener el documento
   * Patrón: (heading paragraph*)+
   * Significa: uno o más grupos de (heading seguido de cero o más paragraphs)
   */
  content: '(heading paragraph*)+',
});
