import { mergeAttributes, Node } from "@tiptap/core";
import { nanoid } from "nanoid";
import { Plugin, PluginKey } from "prosemirror-state";

export interface BlockImageOptions {
  HTMLAttributes: Record<string, any>;
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

        console.log("Updating image:", options);

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

        console.log("Deleting image:", options);

        if (dispatch) {
          tr.delete(nodePos, nodePos + 1);
          dispatch(tr);
        }

        return true;
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("blockImageHandler"),
        props: {
          handleDOMEvents: {
            drop(view, event) {
              if (!event.dataTransfer?.files.length) {
                return false;
              }

              const file = event.dataTransfer.files[0];
              if (!file.type.startsWith("image/")) {
                return false;
              }

              event.preventDefault();
              console.log("Image dropped:", file);
              // Here you would typically handle the file upload
              // For now, we just log it as per requirements

              return true;
            },
          },
        },
      }),
    ];
  },
});
