import {
  Mark,
  markInputRule,
  markPasteRule,
  mergeAttributes,
} from "@tiptap/core";
import { nanoid } from "nanoid";
import { Plugin, PluginKey } from "prosemirror-state";
import { processLatex } from "./extensionHelpers";

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
      /**
       * Delete LaTeX mark by ID
       */
      deleteInlineLatex: (options: { latexId: string }) => ReturnType;
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
    return [
      "span",
      mergeAttributes(
        {
          "data-type": "inline-latex",
          class: "inline-latex",
          "data-latex": HTMLAttributes.latex,
          "data-id": HTMLAttributes.latexId,
          style: "display: inline-block; vertical-align: middle;",
        },
        this.options.HTMLAttributes,
        HTMLAttributes,
      ),
      0,
    ];
  },

  addCommands() {
    return {
      setInlineLatex: (options = {}) => ({ commands, editor, tr }) => {
        const { selection } = editor.state;

        const latexId = options.latexId || nanoid();
        if (selection.empty) {
          const content = options.content || this.options.defaultContent || "";
          if (content) {
            const spacedContent = content.trim();
            console.log("spacedContent", spacedContent + "&nbsp;");
            editor.commands.insertContent(spacedContent + "HI");
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
            const spacedContent = content.trim();
            editor.commands.insertContent(spacedContent + "&nbsp;");
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
      deleteInlineLatex: (options) => ({ tr, state, dispatch }) => {
        if (!dispatch) return false;
        const { doc } = state;
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
                //also remove the text within the mark
                tr.delete(pos, pos + node.nodeSize);
                tr.removeMark(pos, pos + node.nodeSize, mark.type);
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

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("inlineLatexProcessor"),
        view(editorView) {
          const processLatexInView = () => {
            processLatex(editorView.dom);
          };

          // Process on init
          processLatexInView();

          return {
            update(view, prevState) {
              // Process on content changes that affect LaTeX
              let hasCurrentLatex = false;
              let hasPrevLatex = false;

              view.state.doc.descendants((node) => {
                if (
                  node.marks.some((mark) => mark.type.name === "inlineLatex")
                ) {
                  hasCurrentLatex = true;
                  return false;
                }
                return true;
              });

              prevState.doc.descendants((node) => {
                if (
                  node.marks.some((mark) => mark.type.name === "inlineLatex")
                ) {
                  hasPrevLatex = true;
                  return false;
                }
                return true;
              });

              const hasLatexChanges =
                view.state.doc.eq(prevState.doc) === false &&
                (hasCurrentLatex || hasPrevLatex);

              if (hasLatexChanges) {
                processLatexInView();
              }
            },
            destroy() {
              // Clean up if needed
            },
          };
        },
      }),
    ];
  },
});
