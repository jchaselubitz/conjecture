import { mergeAttributes, Node } from "@tiptap/core";
import { nanoid } from "nanoid";
import { Plugin, PluginKey } from "prosemirror-state";
import { handleImageChange } from "./helpers/helpersImageExtension";
import { toast } from "sonner";

export interface BlockImageOptions {
  HTMLAttributes: Record<string, any>;
  userId: string | null;
  statementId: string | null;
  editMode: boolean | null;
  onDelete?: (imageUrl: string) => Promise<void>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    blockImage: {
      insertBlockImage: (options: {
        imageId: string;
        src: string;
        alt?: string;
        width?: number;
        height?: number;
      }) => ReturnType;
      updateBlockImage: (options: {
        imageId: string;
        src?: string;
        alt?: string;
        width?: number;
        height?: number;
      }) => ReturnType;
      deleteBlockImage: (options: { imageId: string }) => ReturnType;
    };
  }
}

export const BlockImage = Node.create<BlockImageOptions>({
  name: "blockImage",

  addOptions() {
    return {
      HTMLAttributes: {},
      userId: null,
      statementId: null,
      editMode: null,
    };
  },

  group: "block",
  draggable: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) => element.getAttribute("src"),
        renderHTML: (attributes) => ({
          src: attributes.src,
        }),
      },
      alt: {
        default: "",
        parseHTML: (element) => element.getAttribute("alt"),
        renderHTML: (attributes) => ({
          alt: attributes.alt,
        }),
      },
      imageId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-image-id"),
        renderHTML: (attributes) => ({
          "data-image-id": attributes.imageId || nanoid(),
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[data-type="block-image"]',
        getAttrs: (node) => {
          if (typeof node === "string") return {};
          const element = node as HTMLElement;
          return {
            src: element.getAttribute("src"),
            alt: element.getAttribute("alt"),
            width: element.getAttribute("width"),
            height: element.getAttribute("height"),
            imageId: element.getAttribute("data-image-id"),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      "img",
      mergeAttributes(
        this.options.HTMLAttributes,
        HTMLAttributes,
        {
          "data-type": "block-image",
          "data-image-id": node.attrs.imageId,
        },
        node.attrs.width ? { width: node.attrs.width } : {},
        node.attrs.height ? { height: node.attrs.height } : {},
      ),
    ];
  },

  addCommands() {
    return {
      insertBlockImage: (options) => ({ chain, commands }) => {
        return chain()
          .insertContent({
            type: this.name,
            attrs: {
              ...options,
            },
          })
          .run();
      },
      updateBlockImage: (options) => ({ tr, state, dispatch }) => {
        let nodePos = -1;

        state.doc.descendants((node, pos) => {
          if (
            node.type.name === this.name &&
            node.attrs.imageId === options.imageId
          ) {
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
            ...options,
          });
          dispatch(tr);
        }

        return true;
      },
      deleteBlockImage: (options) => ({ tr, state, dispatch }) => {
        let nodePos = -1;
        state.doc.descendants((node, pos) => {
          if (
            node.type.name === this.name &&
            node.attrs.imageId === options.imageId
          ) {
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
      },
    };
  },

  addProseMirrorPlugins() {
    const userId = this.options.userId;
    const statementId = this.options.statementId;
    const editMode = this.options.editMode;
    const editor = this.editor;
    return [
      new Plugin({
        key: new PluginKey("blockImageHandler"),
        props: {
          handleDOMEvents: {
            drop(view, event) {
              if (!editMode || !userId || !statementId) return false;

              const variable = event.dataTransfer?.getData("variable");
              if (variable) {
                const position = view.posAtCoords({
                  top: event.clientY,
                  left: event.clientX,
                });

                if (!position) {
                  return false;
                }

                editor?.commands.insertContentAt(position.pos, {
                  type: "mention",
                  attrs: {
                    id: variable,
                    label: variable,
                  },
                });
                return true;
              }

              if (event.dataTransfer?.files.length) {
                const file = event.dataTransfer.files[0];
                if (!file.type.startsWith("image/")) {
                  return false;
                }

                event.preventDefault();

                const position = view.posAtCoords({
                  top: event.clientY,
                  left: event.clientX,
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
                  },
                })
                  .then((newImage) => {
                    if (newImage) {
                      editor
                        ?.chain()
                        .focus()
                        .insertBlockImage({
                          src: newImage.imageUrl,
                          alt: file.name,
                          imageId: newImage.imageId,
                        })
                        .run();
                    }
                  })
                  .catch((error) => {
                    console.error("Failed to upload image:", error);
                    toast.error("Failed to upload image");
                  });

                return true;
              }

              return false;
            },
          },
        },
      }),
      new Plugin({
        key: new PluginKey("blockImageDeletion"),
        props: {
          handleKeyDown: (view, event) => {
            // Process only intentional deletion keypresses
            if (event.key === "Delete" || event.key === "Backspace") {
              const { selection } = view.state;
              if (selection.empty) return false;
              const fragment = selection.content().content;
              const deletedImages = new Set<string>();
              fragment.descendants((node) => {
                if (node.type.name === this.name) {
                  deletedImages.add(node.attrs.imageId);
                }
                return true;
              });

              if (deletedImages.size > 0) {
                this.editor.storage.blockImageDeletion = {
                  pendingDeletions: deletedImages,
                };
              }
            }
            return false;
          },
        },
        appendTransaction: (transactions, oldState, newState) => {
          // Skip if editor is remounting or we're not in edit mode
          const view = this.editor.view;
          const isEditModeTransitioning =
            view?.dom.closest('[data-edit-transitioning="true"]') != null;
          if (isEditModeTransitioning) return null;
          const pendingDeletions = this.editor.storage.blockImageDeletion
            ?.pendingDeletions;
          if (!pendingDeletions || pendingDeletions.size === 0) return null;

          const existingImages = new Set<string>();
          newState.doc.descendants((node) => {
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
            confirmedDeletions.forEach((imageId) => {
              this.options.onDelete?.(imageId);
            });
          }
          this.editor.storage.blockImageDeletion = {
            pendingDeletions: new Set(),
          };

          return null;
        },
      }),
    ];
  },
});
