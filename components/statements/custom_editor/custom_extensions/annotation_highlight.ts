import { Mark, mergeAttributes } from '@tiptap/core';

import { generateColorFromString } from './helpers/helpersAnnotationExtension';

export interface AnnotationHighlightOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    annotationHighlight: {
      /**
       * Set an annotation highlight mark
       */
      setAnnotationHighlight: (attributes: {
        annotationId: string;
        isAuthor: boolean;
        userId: string;
        createdAt?: string | null;
        tag?: string | null;
      }) => ReturnType;
      /**
       * Toggle an annotation highlight mark
       */
      toggleAnnotationHighlight: (attributes: {
        annotationId: string;
        isAuthor: boolean;
        userId: string;
        createdAt?: string | null;
        tag?: string | null;
      }) => ReturnType;
      /**
       * Unset an annotation highlight mark
       */
      unsetAnnotationHighlight: () => ReturnType;
      /**
       * Delete a specific annotation highlight by ID
       */
      deleteAnnotationHighlight: (annotationId: string) => ReturnType;
    };
  }
}

export const AnnotationHighlight = Mark.create<AnnotationHighlightOptions>({
  name: 'annotationHighlight',

  addOptions() {
    return {
      HTMLAttributes: {}
    };
  },

  // Prevent marks with the same annotationId from being duplicated
  excludes: '',

  // Allow annotations to overlap with other marks
  spanning: true,

  // Inclusive: false means the mark won't extend when typing at boundaries
  inclusive: false,

  addAttributes() {
    return {
      annotationId: {
        default: null,
        parseHTML: element => element.getAttribute('data-annotation-id'),
        renderHTML: attributes => {
          if (!attributes.annotationId) {
            return {};
          }
          return {
            'data-annotation-id': attributes.annotationId
          };
        }
      },
      isAuthor: {
        default: false,
        parseHTML: element => element.getAttribute('data-is-author') === 'true',
        renderHTML: attributes => {
          return { 'data-is-author': attributes.isAuthor };
        }
      },
      userId: {
        default: null,
        parseHTML: element => element.getAttribute('data-user-id'),
        renderHTML: attributes => {
          if (!attributes.userId) {
            return {};
          }
          let colors = generateColorFromString(attributes.userId);

          if (attributes.isAuthor) {
            colors = {
              backgroundColor: `hsla(230, 30%, 75%, 0.4)`,
              hoverBackgroundColor: `hsla(230, 30%, 55%, 0.45)`,
              borderColor: `hsl(230, 30%, 55%)`
            };
          }

          return {
            'data-user-id': attributes.userId,
            style: `
              --bg-color: ${colors.backgroundColor};
              --hover-bg-color: ${colors.hoverBackgroundColor};
              --border-color: ${colors.borderColor};
            `
          };
        }
      },
      tag: {
        default: null,
        parseHTML: element => element.getAttribute('data-tag'),
        renderHTML: attributes => {
          if (!attributes.tag) {
            return {};
          }
          return {
            'data-tag': attributes.tag
          };
        }
      },
      createdAt: {
        default: null,
        parseHTML: element => element.getAttribute('data-created-at'),
        renderHTML: attributes => {
          if (!attributes.createdAt) {
            return {};
          }
          return {
            'data-created-at': attributes.createdAt
          };
        }
      }
      // Note: 'selected' state is now handled via direct DOM class manipulation
      // instead of being part of the mark attributes. This eliminates the need
      // to reapply marks when selection changes.
    };
  },

  parseHTML() {
    return [
      {
        tag: 'mark.annotation'
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'mark',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { class: 'annotation' }),
      0
    ];
  },

  // Add comparison logic to prevent duplicate marks with the same annotationId
  onUpdate() {
    // This hook can be used to clean up duplicates if they somehow get created
    const { editor } = this;
    if (!editor) return;

    // Track seen annotation IDs at each position to detect duplicates
    const seenMarks = new Map<string, Set<string>>();

    editor.state.doc.descendants((node, pos) => {
      if (!node.isText) return;

      const annotationMarks = node.marks.filter(mark => mark.type.name === 'annotationHighlight');

      if (annotationMarks.length > 1) {
        // Multiple annotation marks on the same text node
        const ids = annotationMarks.map(m => m.attrs.annotationId);
        const uniqueIds = new Set(ids);

        // If there are duplicate IDs, we have a problem
        if (uniqueIds.size < ids.length) {
          console.warn(
            `Duplicate annotation marks detected at position ${pos}:`,
            ids.filter((id, index) => ids.indexOf(id) !== index)
          );
        }
      }
    });
  },

  addCommands() {
    return {
      setAnnotationHighlight:
        attributes =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes);
        },
      toggleAnnotationHighlight:
        attributes =>
        ({ commands }) => {
          return commands.toggleMark(this.name, attributes);
        },
      unsetAnnotationHighlight:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
      deleteAnnotationHighlight:
        annotationId =>
        ({ tr, state }) => {
          let hasChanged = false;

          // Iterate through the document to find and remove matching marks
          state.doc.descendants((node, pos) => {
            const marks = node.marks.filter(
              mark => mark.type.name === this.name && mark.attrs.annotationId === annotationId
            );
            if (marks.length > 0) {
              tr.removeMark(pos, pos + node.nodeSize, state.schema.marks[this.name]);
              hasChanged = true;
            }

            return true;
          });

          return hasChanged;
        }
    };
  }
});
