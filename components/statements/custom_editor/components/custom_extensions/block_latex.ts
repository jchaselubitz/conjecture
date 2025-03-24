import { mergeAttributes, Node } from "@tiptap/core";
import { nanoid } from "nanoid";
import { Plugin, PluginKey } from "prosemirror-state";
import { processLatex } from "../helpers";

export interface BlockLatexOptions {
 HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
 interface Commands<ReturnType> {
  blockLatex: {
   insertLatex: (
    options: { content: string; displayMode?: boolean },
   ) => ReturnType;
   updateLatex: (options: { latexId: string; content: string }) => ReturnType;
  };
 }
}

export const BlockLatex = Node.create<BlockLatexOptions>({
 name: "blockLatex",

 addOptions() {
  return {
   HTMLAttributes: {},
  };
 },

 group: "block",
 content: "text*",
 marks: "",
 inline: false,
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
   displayMode: {
    default: true,
    parseHTML: (element) =>
     element.getAttribute("data-display-mode") === "true",
    renderHTML: (attributes) => {
     return {
      "data-display-mode": attributes.displayMode ? "true" : "false",
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
    tag: 'div[data-type="latex-block"]',
    getAttrs: (node) => {
     if (typeof node === "string") return {};
     const element = node as HTMLElement;
     return {
      latex: element.getAttribute("data-latex"),
      displayMode: element.getAttribute("data-display-mode") === "true",
      latexId: element.getAttribute("data-id"),
     };
    },
   },
  ];
 },

 renderHTML({ HTMLAttributes, node }) {
  // Create a unique ID if one doesn't exist
  if (!HTMLAttributes.latexId) {
   HTMLAttributes.latexId = nanoid();
  }

  return [
   "div",
   mergeAttributes(
    this.options.HTMLAttributes,
    HTMLAttributes,
    {
     "data-type": "latex-block",
     "data-latex": node.attrs.latex,
     "data-display-mode": "true",
     "data-id": HTMLAttributes.latexId,
     class: "latex-block",
    },
   ),
   // This placeholder will be replaced with rendered LaTeX in the editor
   node.attrs.latex || "Click to edit LaTeX",
  ];
 },

 addCommands() {
  return {
   insertLatex: (options) => ({ chain, commands }) => {
    const latexId = nanoid();

    // Insert the content
    const success = commands.insertContent({
     type: this.name,
     attrs: {
      latex: options.content,
      displayMode: options.displayMode !== undefined
       ? options.displayMode
       : true,
      latexId,
     },
    });

    // Return success boolean to satisfy Command type
    return success;
   },
   updateLatex: (options) => ({ tr, state, dispatch }) => {
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
     return false;
    }

    // Update the node
    if (dispatch) {
     tr.setNodeMarkup(nodePos, undefined, {
      ...doc.nodeAt(nodePos)?.attrs,
      latex: options.content,
     });
     dispatch(tr);
    }

    return true;
   },
  };
 },

 addProseMirrorPlugins() {
  return [
   new Plugin({
    key: new PluginKey("blockLatexProcessor"),
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
        if (node.type.name === "blockLatex") {
         hasCurrentLatex = true;
         return false;
        }
        return true;
       });

       prevState.doc.descendants((node) => {
        if (node.type.name === "blockLatex") {
         hasPrevLatex = true;
         return false;
        }
        return true;
       });

       const hasLatexChanges = view.state.doc.eq(prevState.doc) === false &&
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
