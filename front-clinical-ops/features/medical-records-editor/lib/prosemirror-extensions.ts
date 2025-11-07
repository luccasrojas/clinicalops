import { Document } from '@tiptap/extension-document';
import { Paragraph } from '@tiptap/extension-paragraph';
import { mergeAttributes } from '@tiptap/core';

export const CustomDocument = Document.extend({
  content: 'block+',
});

export const CustomParagraph = Paragraph.extend({
  name: 'clinicalParagraph',

  addAttributes() {
    return {
      level: {
        default: 0,
        parseHTML: (element) => Number(element.getAttribute('data-level')) || 0,
        renderHTML: (attributes) => ({
          'data-level': attributes.level,
        }),
      },
      path: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-path') || '',
        renderHTML: (attributes) =>
          attributes.path
            ? {
                'data-path': attributes.path,
              }
            : {},
      },
      dataType: {
        default: 'string',
        parseHTML: (element) => element.getAttribute('data-type') || 'string',
        renderHTML: (attributes) => ({
          'data-type': attributes.dataType || 'string',
        }),
      },
      nodeType: {
        default: 'value',
        parseHTML: (element) => element.getAttribute('data-node-type') || 'value',
        renderHTML: (attributes) => ({
          'data-node-type': attributes.nodeType || 'value',
        }),
      },
      isListItem: {
        default: false,
        parseHTML: (element) => element.hasAttribute('data-list-item'),
        renderHTML: (attributes) =>
          attributes.isListItem
            ? {
                'data-list-item': 'true',
              }
            : {},
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const attrs = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes);
    const level = Number(attrs['data-level']) || 0;
    const nodeType = attrs['data-node-type'] as string;
    const isListItem = attrs['data-list-item'] === 'true';

    const classNames = ['clinical-paragraph', `p-level-${level}`];

    if (nodeType === 'heading') {
      classNames.push('p-heading');
    }

    if (isListItem) {
      classNames.push('p-list');
    }

    return [
      'p',
      {
        ...attrs,
        class: [...new Set([attrs.class, ...classNames])].filter(Boolean).join(' '),
      },
      0,
    ];
  },
});
