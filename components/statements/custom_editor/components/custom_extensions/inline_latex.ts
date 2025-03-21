import {
  Mark,
  markInputRule,
  markPasteRule,
  mergeAttributes,
} from "@tiptap/core";
import { nanoid } from "nanoid";

export interface InlineLatexOptions {
  /**
   * HTML attributes to add to the inline LaTeX wrapper element
   * @default {}
   */
  HTMLAttributes: Record<string, any>;

  /**
   * Custom renderer function for inline LaTeX content
   * This allows for integration with libraries like KaTeX or MathJax
   * @default undefined
   */
  renderer?: (latex: string) => string | HTMLElement;

  /**
   * Default LaTeX content to insert when creating a new inline LaTeX
   * @default ""
   */
  defaultContent?: string;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    inlineLatex: {
      /**
       * Toggle inline LaTeX mark
       */
      toggleInlineLatex: (
        options?: { content?: string; latexId?: string },
      ) => ReturnType;
      /**
       * Set inline LaTeX mark
       */
      setInlineLatex: (
        options?: { content?: string; latexId?: string },
      ) => ReturnType;
      /**
       * Unset inline LaTeX mark
       */
      unsetInlineLatex: () => ReturnType;
      /**
       * Update inline LaTeX mark
       */
      updateInlineLatex: (
        options: { latexId: string; content: string },
      ) => ReturnType;
    };
  }
}

/**
 * Matches inline LaTeX with $ as delimiters
 */
export const inlineInputRegex = /(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g;

/**
 * This extension allows for inline LaTeX expressions.
 */
export const InlineLatex = Mark.create<InlineLatexOptions>({
  name: "inlineLatex",

  addOptions() {
    return {
      HTMLAttributes: {},
      renderer: undefined,
      defaultContent: "\\alpha + \\beta = \\gamma",
    };
  },

  // Let other marks overwrite this one
  excludes: "",

  inclusive: true,

  addAttributes() {
    return {
      latex: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-latex"),
        renderHTML: (attributes) => {
          return {
            "data-latex": attributes.latex,
          };
        },
      },
      latexId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-id"),
        renderHTML: (attributes) => {
          return {
            "data-id": attributes.latexId || nanoid(),
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-type='inline-latex']",
        getAttrs: (node) => {
          if (typeof node === "string") return {};
          const element = node as HTMLElement;
          return {
            latex: element.getAttribute("data-latex"),
            latexId: element.getAttribute("data-id"),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // Create a unique ID if one doesn't exist
    if (!HTMLAttributes.latexId) {
      HTMLAttributes.latexId = nanoid();
    }

    // For marks, we don't have direct access to content
    // The content will be rendered by editor processing later
    return [
      "span",
      mergeAttributes(
        {
          "data-type": "inline-latex",
          "class": "inline-latex",
          "data-id": HTMLAttributes.latexId,
          "data-latex": HTMLAttributes.latex,
        },
        this.options.HTMLAttributes,
        HTMLAttributes,
      ),
      0, // Position marker for content
    ];
  },

  addCommands() {
    return {
      setInlineLatex: (options = {}) => ({ commands, editor, tr }) => {
        const { selection } = editor.state;
        const latexId = options.latexId || nanoid();

        // If there's no selection, insert default content
        if (selection.empty) {
          const content = options.content || this.options.defaultContent || "";
          if (content) {
            editor.commands.insertContent(content);
          }
        }

        return commands.setMark(this.name, { latexId, latex: options.content });
      },
      toggleInlineLatex: (options = {}) => ({ commands, editor }) => {
        const { selection } = editor.state;
        const isActive = editor.isActive(this.name);
        const latexId = options.latexId || nanoid();

        // If there's no selection and mark is not active, insert default content
        if (selection.empty && !isActive) {
          const content = options.content || this.options.defaultContent || "";
          if (content) {
            editor.commands.insertContent(content);
          }
        }

        return commands.toggleMark(this.name, {
          latexId,
          latex: options.content,
        });
      },
      unsetInlineLatex: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
      updateInlineLatex: (options) => ({ tr, state, dispatch }) => {
        // Find the mark with the given ID and update it
        const { doc, selection } = state;
        let found = false;

        doc.nodesBetween(0, doc.content.size, (node, pos) => {
          if (found) return false;

          // Check if this node has our mark
          node.marks.forEach((mark) => {
            if (
              mark.type.name === this.name &&
              mark.attrs.latexId === options.latexId
            ) {
              found = true;
              if (dispatch) {
                // Replace the mark with updated content
                const start = pos;
                const end = pos + node.nodeSize;

                tr.removeMark(start, end, mark.type);
                tr.addMark(
                  start,
                  end,
                  mark.type.create({
                    ...mark.attrs,
                    latex: options.content,
                  }),
                );
                dispatch(tr);
              }
              return false;
            }
          });

          return true;
        });

        return found;
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-i": () => this.editor.commands.toggleInlineLatex(),
      // Allow removing inline LaTeX with backspace when cursor is at start of LaTeX content
      Backspace: ({ editor }) => {
        if (!editor.isActive(this.name)) {
          return false;
        }

        const { selection } = editor.state;
        if (!selection.empty) {
          return false;
        }

        // Check if we're at the beginning of a text node with LaTeX mark
        const { $head } = selection;
        if ($head.parentOffset === 0) {
          // Remove the LaTeX mark from this point forward
          return editor.chain().extendMarkRange(this.name).unsetMark(this.name)
            .run();
        }

        return false;
      },
    };
  },

  addInputRules() {
    return [
      markInputRule({
        find: inlineInputRegex,
        type: this.type,
      }),
    ];
  },

  addPasteRules() {
    return [
      markPasteRule({
        find: inlineInputRegex,
        type: this.type,
      }),
    ];
  },
});
