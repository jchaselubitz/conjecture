import { Mark, mergeAttributes } from "@tiptap/core";
import { generateColorFromString } from "./helpersAnnotationExtension";

export interface AnnotationHighlightOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
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
  name: "annotationHighlight",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      annotationId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-annotation-id"),
        renderHTML: (attributes) => {
          if (!attributes.annotationId) {
            return {};
          }
          return {
            "data-annotation-id": attributes.annotationId,
          };
        },
      },
      isAuthor: {
        default: false,
        parseHTML: (element) =>
          element.getAttribute("data-is-author") === "true",
        renderHTML: (attributes) => {
          return { "data-is-author": attributes.isAuthor };
        },
      },
      userId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-user-id"),
        renderHTML: (attributes) => {
          if (!attributes.userId) {
            return {};
          }

          const colors = generateColorFromString(attributes.userId);

          return {
            "data-user-id": attributes.userId,
            style: `
              --bg-color: ${colors.backgroundColor};
              --hover-bg-color: ${colors.hoverBackgroundColor};
              --border-color: ${colors.borderColor};
            `,
          };
        },
      },
      tag: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-tag"),
        renderHTML: (attributes) => {
          if (!attributes.tag) {
            return {};
          }
          return {
            "data-tag": attributes.tag,
          };
        },
      },
      createdAt: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-created-at"),
        renderHTML: (attributes) => {
          if (!attributes.createdAt) {
            return {};
          }
          return {
            "data-created-at": attributes.createdAt,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "mark.annotation",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "mark",
      mergeAttributes(
        this.options.HTMLAttributes,
        HTMLAttributes,
        { class: "annotation" },
      ),
      0,
    ];
  },

  addCommands() {
    return {
      setAnnotationHighlight: (attributes) => ({ commands }) => {
        return commands.setMark(this.name, attributes);
      },
      toggleAnnotationHighlight: (attributes) => ({ commands }) => {
        return commands.toggleMark(this.name, attributes);
      },
      unsetAnnotationHighlight: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
      deleteAnnotationHighlight: (annotationId) => ({ tr, state }) => {
        let hasChanged = false;

        // Iterate through the document to find and remove matching marks
        state.doc.descendants((node, pos) => {
          const marks = node.marks.filter((mark) =>
            mark.type.name === this.name &&
            mark.attrs.annotationId === annotationId
          );

          if (marks.length > 0) {
            tr.removeMark(
              pos,
              pos + node.nodeSize,
              state.schema.marks[this.name],
            );
            hasChanged = true;
          }

          return true;
        });

        return hasChanged;
      },
    };
  },
});
