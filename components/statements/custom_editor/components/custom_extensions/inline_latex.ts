import { mergeAttributes, Node } from "@tiptap/core";
import { nanoid } from "nanoid";
import { Plugin, PluginKey } from "prosemirror-state";
import { processLatex } from "./helpers/helpersLatexExtension";

export interface InlineLatexOptions {
  /**
   * HTML attributes to add to the inline LaTeX wrapper element
   * @default {}
   */
  HTMLAttributes: Record<string, any>;

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
       * Insert inline LaTeX node
       */
      insertInlineLatex: (options?: { content?: string }) => ReturnType;
      /**
       * Update inline LaTeX node
       */
      updateInlineLatex: (
        options: { latexId: string; content: string },
      ) => ReturnType;
      /**
       * Delete LaTeX node by ID
       */
      deleteInlineLatex: (options: { latexId: string }) => ReturnType;
    };
  }
}

export const InlineLatex = Node.create<InlineLatexOptions>({
  name: "inlineLatex",

  addOptions() {
    return {
      HTMLAttributes: {},
      defaultContent: "\\alpha + \\beta = \\gamma",
    };
  },

  inline: true,
  group: "inline",
  atom: true,

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

  renderHTML({ HTMLAttributes, node }) {
    return [
      "span",
      mergeAttributes(
        this.options.HTMLAttributes,
        HTMLAttributes,
        {
          "data-type": "inline-latex",
          "data-latex": node.attrs.latex,
          "data-id": node.attrs.latexId,
          class: "inline-latex",
          style: "display: inline-block; vertical-align: middle;",
        },
      ),
      // This placeholder will be replaced with rendered LaTeX
      node.attrs.latex || "Click to edit LaTeX",
    ];
  },

  addCommands() {
    return {
      insertInlineLatex: (options = {}) => ({ chain, commands }) => {
        const latexId = nanoid();
        return commands.insertContent({
          type: this.name,
          attrs: {
            latex: options.content || this.options.defaultContent,
            latexId,
          },
        });
      },
      updateInlineLatex: (options) => ({ tr, state, dispatch }) => {
        // Find the node with the given ID
        const { doc } = state;
        let nodePos = -1;

        doc.descendants((node, pos) => {
          if (
            node.type.name === this.name &&
            node.attrs.latexId === options.latexId
          ) {
            nodePos = pos;
            return false;
          }
          return true;
        });

        if (nodePos === -1) {
          console.warn(
            `No inline LaTeX node found with ID: ${options.latexId}`,
          );
          return false;
        }

        // Update the node with new content
        if (dispatch) {
          const currentNode = doc.nodeAt(nodePos);
          if (!currentNode) return false;

          tr.setNodeMarkup(nodePos, undefined, {
            ...currentNode.attrs,
            latex: options.content,
          });
          dispatch(tr);
        }

        return true;
      },
      deleteInlineLatex: (options) => ({ tr, state, dispatch }) => {
        if (!dispatch) return false;
        const { doc } = state;
        let nodePos = -1;

        doc.descendants((node, pos) => {
          if (
            node.type.name === this.name &&
            node.attrs.latexId === options.latexId
          ) {
            nodePos = pos;
            return false;
          }
          return true;
        });

        if (nodePos === -1) {
          return false;
        }

        // Delete the node at the found position
        tr.delete(nodePos, nodePos + doc.nodeAt(nodePos)!.nodeSize);
        dispatch(tr);
        return true;
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-i": () => this.editor.commands.insertInlineLatex(),
    };
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
              // Only process if the document has actually changed
              if (!view.state.doc.eq(prevState.doc)) {
                // Check if any inline LaTeX nodes have changed
                let hasLatexContentChanged = false;

                view.state.doc.descendants((node, pos) => {
                  if (node.type.name === "inlineLatex") {
                    const prevNode = prevState.doc.nodeAt(pos);
                    if (
                      !prevNode || prevNode.type.name !== "inlineLatex" ||
                      prevNode.attrs.latex !== node.attrs.latex
                    ) {
                      hasLatexContentChanged = true;
                      return false;
                    }
                  }
                  return true;
                });

                if (hasLatexContentChanged) {
                  processLatexInView();
                }
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
