import { mergeAttributes, Node } from "@tiptap/core";
import { nanoid } from "nanoid";

export interface PopoverLatexOptions {
 HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
 interface Commands<ReturnType> {
  popoverLatex: {
   /**
    * Insert a LaTeX node
    */
   insertLatex: (
    options: { content: string; displayMode?: boolean },
   ) => ReturnType;
   /**
    * Update a LaTeX node
    */
   updateLatex: (options: { id: string; content: string }) => ReturnType;
  };
 }
}

export const PopoverLatex = Node.create<PopoverLatexOptions>({
 name: "popoverLatex",

 addOptions() {
  return {
   HTMLAttributes: {},
  };
 },

 group() {
  return "inline";
 },

 content: "text*",
 marks: "",
 inline: true,
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
   id: {
    default: null,
    parseHTML: (element) => element.getAttribute("data-id"),
    renderHTML: (attributes) => {
     return {
      "data-id": attributes.id || nanoid(),
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
      id: element.getAttribute("data-id"),
     };
    },
   },
   {
    tag: 'span[data-type="latex"]',
    getAttrs: (node) => {
     if (typeof node === "string") return {};
     const element = node as HTMLElement;
     return {
      latex: element.getAttribute("data-latex"),
      displayMode: false,
      id: element.getAttribute("data-id"),
     };
    },
   },
  ];
 },

 renderHTML({ HTMLAttributes, node }) {
  // Create a unique ID if one doesn't exist
  if (!HTMLAttributes.id) {
   HTMLAttributes.id = nanoid();
  }

  // Return the HTML structure for the LaTeX node
  const tag = node.attrs.displayMode ? "div" : "span";

  // Use consistent class names that match what HTMLTextAnnotator processes
  // HTMLTextAnnotator looks for .latex-block and .inline-latex
  const classNames = node.attrs.displayMode ? "latex-block" : "inline-latex";

  // For inline LaTeX, add additional styling to ensure it stays inline
  const inlineStyle = !node.attrs.displayMode
   ? { style: "display: inline-block; vertical-align: middle;" }
   : {};

  return [
   tag,
   mergeAttributes(
    this.options.HTMLAttributes,
    HTMLAttributes,
    inlineStyle,
    {
     "data-type": node.attrs.displayMode ? "latex-block" : "latex",
     "data-latex": node.attrs.latex,
     "data-display-mode": node.attrs.displayMode ? "true" : "false",
     "data-id": HTMLAttributes.id,
     class: classNames,
    },
   ),
   // This placeholder will be replaced with rendered LaTeX in the editor
   node.attrs.latex || "Click to edit LaTeX",
  ];
 },

 addCommands() {
  return {
   insertLatex: (options) => ({ commands }) => {
    const id = nanoid();
    return commands.insertContent({
     type: this.name,
     attrs: {
      latex: options.content,
      displayMode: options.displayMode !== undefined
       ? options.displayMode
       : true,
      id,
     },
    });
   },
   updateLatex: (options) => ({ tr, state, dispatch }) => {
    // Find the node with the given ID
    const { doc } = state;
    let nodePos = -1;

    doc.descendants((node, pos) => {
     if (
      node.type.name === this.name &&
      node.attrs.id === options.id
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
});
