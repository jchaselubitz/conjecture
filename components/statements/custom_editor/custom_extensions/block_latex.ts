import { mergeAttributes, Node } from '@tiptap/core';
import { nanoid } from 'nanoid';
import { Plugin, PluginKey } from 'prosemirror-state';

import { processLatex } from './helpers/helpersLatexExtension';

export interface BlockLatexOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    blockLatex: {
      insertBlockLatex: (options: { content: string }) => ReturnType;
      updateBlockLatex: (options: { latexId: string; content: string }) => ReturnType;
      deleteBlockLatex: (options: { latexId: string }) => ReturnType;
    };
  }
}

export const BlockLatex = Node.create<BlockLatexOptions>({
  name: 'blockLatex',

  addOptions() {
    return {
      HTMLAttributes: {}
    };
  },

  group: 'block',
  content: 'text*',
  marks: '',
  inline: false,
  atom: true,

  addAttributes() {
    return {
      latex: {
        default: '',
        parseHTML: element => element.getAttribute('data-latex'),
        renderHTML: attributes => {
          return {
            'data-latex': attributes.latex
          };
        }
      },
      displayMode: {
        default: true,
        parseHTML: element => element.getAttribute('data-display-mode') === 'true',
        renderHTML: attributes => {
          return {
            'data-display-mode': attributes.displayMode ? 'true' : 'false'
          };
        }
      },
      latexId: {
        default: null,
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => {
          return {
            'data-id': attributes.latexId || nanoid()
          };
        }
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="latex-block"]',
        getAttrs: node => {
          if (typeof node === 'string') return {};
          const element = node as HTMLElement;
          return {
            latex: element.getAttribute('data-latex'),
            displayMode: element.getAttribute('data-display-mode') === 'true',
            latexId: element.getAttribute('data-id')
          };
        }
      }
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'latex-block',
        'data-latex': node.attrs.latex,
        'data-display-mode': node.attrs.displayMode ? 'true' : 'false',
        'data-id': node.attrs.latexId,
        class: 'latex-block'
      }),
      // This placeholder will be replaced with rendered LaTeX in the editor
      node.attrs.latex || 'Click to edit LaTeX'
    ];
  },

  addCommands() {
    return {
      insertBlockLatex:
        options =>
        ({ chain, commands }) => {
          const latexId = nanoid();
          const success = commands.insertContent({
            type: this.name,
            attrs: {
              latex: options.content,
              displayMode: true,
              latexId
            }
          });
          return success;
        },
      updateBlockLatex:
        options =>
        ({ tr, state, dispatch }) => {
          // Find the node with the given ID
          const { doc } = state;
          let nodePos = -1;

          doc.descendants((node, pos) => {
            if (node.type.name === this.name && node.attrs.latexId === options.latexId) {
              nodePos = pos;
              return false;
            }
            return true;
          });

          if (nodePos === -1) {
            console.warn(`No block LaTeX node found with ID: ${options.latexId}`);
            return false;
          }

          // Update the node with new content
          if (dispatch) {
            const currentNode = doc.nodeAt(nodePos);
            if (!currentNode) return false;

            tr.setNodeMarkup(nodePos, undefined, {
              ...currentNode.attrs,
              latex: options.content,
              displayMode: true
            });
            dispatch(tr);
          }

          return true;
        },
      deleteBlockLatex:
        options =>
        ({ tr, state, dispatch }) => {
          if (!dispatch) return false;
          const { doc } = state;
          let nodePos = -1;

          doc.descendants((node, pos) => {
            if (node.type.name === 'blockLatex' && node.attrs.latexId === options.latexId) {
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
        }
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('blockLatexProcessor'),
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

              view.state.doc.descendants(node => {
                if (node.type.name === 'blockLatex') {
                  hasCurrentLatex = true;
                  return false;
                }
                return true;
              });

              prevState.doc.descendants(node => {
                if (node.type.name === 'blockLatex') {
                  hasPrevLatex = true;
                  return false;
                }
                return true;
              });

              const hasLatexChanges =
                view.state.doc.eq(prevState.doc) === false && (hasCurrentLatex || hasPrevLatex);

              if (hasLatexChanges) {
                processLatexInView();
              }
            },
            destroy() {
              // Clean up if needed
            }
          };
        }
      })
    ];
  }
});
