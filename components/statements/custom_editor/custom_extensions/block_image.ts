import { mergeAttributes, Node } from '@tiptap/core';
import { nanoid } from 'nanoid';
import { Plugin, PluginKey } from 'prosemirror-state';
import { toast } from 'sonner';

import { handleImageChange } from './helpers/helpersImageExtension';

export interface BlockImageOptions {
  HTMLAttributes: Record<string, any>;
  userId: string | null;
  statementId: string | null;
  editMode: boolean | null;
  onDelete?: (imageUrl: string) => Promise<void>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    blockImage: {
      insertBlockImage: (options: {
        imageId: string;
        src: string;
        alt?: string;
        caption?: string;
        width?: number;
        height?: number;
      }) => ReturnType;
      updateBlockImage: (options: {
        imageId: string;
        src?: string;
        alt?: string;
        width?: number;
        height?: number;
        caption?: string;
      }) => ReturnType;
      deleteBlockImage: (options: { imageId: string }) => ReturnType;
    };
  }
}

export const BlockImage = Node.create<BlockImageOptions>({
  name: 'blockImage',

  addOptions() {
    return {
      HTMLAttributes: {},
      userId: null,
      statementId: null,
      editMode: null,
      draggable: false
    };
  },

  group: 'block',
  draggable() {
    return this.options.editMode ?? false;
  },
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: element => element.getAttribute('src'),
        renderHTML: attributes => ({
          src: attributes.src
        })
      },
      alt: {
        default: '',
        parseHTML: element => element.getAttribute('alt'),
        renderHTML: attributes => ({
          alt: attributes.alt
        })
      },
      caption: {
        default: '',
        parseHTML: () => null,
        renderHTML: () => ({})
      },
      imageId: {
        default: null,
        parseHTML: element => element.getAttribute('data-image-id'),
        renderHTML: attributes => ({
          'data-image-id': attributes.imageId || nanoid()
        })
      },
      width: {
        default: null,
        parseHTML: element => element.getAttribute('width'),
        renderHTML: attributes => (attributes.width ? { width: attributes.width } : {})
      },
      height: {
        default: null,
        parseHTML: element => element.getAttribute('height'),
        renderHTML: attributes => (attributes.height ? { height: attributes.height } : {})
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-block-image-container="true"]',
        getAttrs: domNode => {
          const element = domNode as HTMLElement;
          const img = element.querySelector('img[data-type="block-image"]');
          const captionDiv = element.querySelector(
            // ".caption",
            '.text-xs.text-center.text-muted-foreground'
          );

          if (!img) {
            return false;
          }

          const caption = captionDiv ? captionDiv.textContent || '' : '';

          return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt'),
            imageId: img.getAttribute('data-image-id'),
            width: img.getAttribute('width'),
            height: img.getAttribute('height'),
            caption: caption
          };
        }
      }
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const containerAttrs = {
      class: 'flex flex-col items-center gap-1',
      'data-block-image-container': 'true'
    };

    const imgAttrs = mergeAttributes(
      this.options.HTMLAttributes,
      HTMLAttributes,
      {
        'data-type': 'block-image',
        'data-image-id': node.attrs.imageId,
        src: node.attrs.src,
        alt: node.attrs.alt
      },
      node.attrs.width ? { width: node.attrs.width } : {},
      node.attrs.height ? { height: node.attrs.height } : {}
    );

    delete imgAttrs.caption;

    const elements: [string, any, ...any[]] = ['div', containerAttrs, ['img', imgAttrs]];

    if (node.attrs.caption) {
      elements.push([
        'div',
        {
          class: 'mb-8 text-xs text-center text-muted-foreground'
          // class: "caption",
        },
        node.attrs.caption
      ]);
    }

    return elements;
  },

  addCommands() {
    return {
      insertBlockImage:
        options =>
        ({ chain, commands }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: {
                ...options
              }
            })
            .run();
        },
      updateBlockImage:
        options =>
        ({ tr, state, dispatch }) => {
          let nodePos = -1;

          state.doc.descendants((node, pos) => {
            if (node.type.name === this.name && node.attrs.imageId === options.imageId) {
              nodePos = pos;
              return false;
            }
            return true;
          });

          if (nodePos === -1) {
            return false;
          }

          if (dispatch) {
            tr.setNodeMarkup(nodePos, undefined, {
              ...state.doc.nodeAt(nodePos)?.attrs,
              ...options
            });
            dispatch(tr);
          }

          return true;
        },
      deleteBlockImage:
        options =>
        ({ tr, state, dispatch }) => {
          let nodePos = -1;
          state.doc.descendants((node, pos) => {
            if (node.type.name === this.name && node.attrs.imageId === options.imageId) {
              nodePos = pos;
              return false;
            }
            return true;
          });

          if (nodePos === -1) {
            return false;
          }

          if (dispatch) {
            tr.delete(nodePos, nodePos + 1);
            dispatch(tr);
          }

          return true;
        }
    };
  },

  addProseMirrorPlugins() {
    const userId = this.options.userId;
    const statementId = this.options.statementId;
    const editMode = this.options.editMode;
    const editor = this.editor;
    return [
      new Plugin({
        key: new PluginKey('blockImageHandler'),
        props: {
          handleDOMEvents: {
            drop(view, event) {
              if (!editMode || !userId || !statementId) return false;

              const variable = event.dataTransfer?.getData('variable');
              if (variable) {
                const position = view.posAtCoords({
                  top: event.clientY,
                  left: event.clientX
                });

                if (!position) {
                  return false;
                }

                editor?.commands.insertContentAt(position.pos, {
                  type: 'mention',
                  attrs: {
                    id: variable,
                    label: variable
                  }
                });
                return true;
              }

              if (event.dataTransfer?.files.length) {
                const file = event.dataTransfer.files[0];
                if (!file.type.startsWith('image/')) {
                  return false;
                }

                event.preventDefault();

                const position = view.posAtCoords({
                  top: event.clientY,
                  left: event.clientX
                });

                if (!position) {
                  return false;
                }

                const imageId = nanoid();

                handleImageChange({
                  file,
                  userId,
                  statementId,
                  imageData: {
                    id: imageId,
                    alt: file.name,
                    caption: '',
                    src: '',
                    statementId: ''
                  }
                })
                  .then(newImage => {
                    if (newImage) {
                      editor
                        ?.chain()
                        .focus()
                        .insertBlockImage({
                          src: newImage.imageUrl,
                          alt: file.name,
                          imageId: newImage.imageId,
                          caption: ''
                        })
                        .run();
                    }
                  })
                  .catch(error => {
                    console.error('Failed to upload image:', error);
                    toast.error('Failed to upload image');
                  });

                return true;
              }

              return false;
            }
          }
        }
      }),
      new Plugin({
        key: new PluginKey('blockImageDeletion'),
        props: {
          handleKeyDown: (view, event) => {
            if (event.key === 'Delete' || event.key === 'Backspace') {
              const { selection } = view.state;
              if (selection.empty) return false;
              const fragment = selection.content().content;
              const deletedImages = new Set<string>();
              fragment.descendants(node => {
                if (node.type.name === this.name) {
                  deletedImages.add(node.attrs.imageId);
                }
                return true;
              });

              if (deletedImages.size > 0) {
                this.editor.storage.blockImageDeletion = {
                  pendingDeletions: deletedImages
                };
              }
            }
            return false;
          }
        },
        appendTransaction: (transactions, oldState, newState) => {
          const view = this.editor.view;
          const isEditModeTransitioning =
            view?.dom.closest('[data-edit-transitioning="true"]') !== null;
          if (isEditModeTransitioning) return null;
          const pendingDeletions = this.editor.storage.blockImageDeletion?.pendingDeletions;
          if (!pendingDeletions || pendingDeletions.size === 0) return null;

          const existingImages = new Set<string>();
          newState.doc.descendants(node => {
            if (node.type.name === this.name) {
              existingImages.add(node.attrs.imageId);
            }
            return true;
          });
          const confirmedDeletions = new Set<string>();
          pendingDeletions.forEach((imageId: string) => {
            if (!existingImages.has(imageId)) {
              confirmedDeletions.add(imageId);
            }
          });
          if (confirmedDeletions.size > 0 && this.options.onDelete) {
            confirmedDeletions.forEach(imageId => {
              this.options.onDelete?.(imageId);
            });
          }
          this.editor.storage.blockImageDeletion = {
            pendingDeletions: new Set()
          };

          return null;
        }
      })
    ];
  }
});
