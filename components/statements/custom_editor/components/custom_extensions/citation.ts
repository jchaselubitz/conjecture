import { mergeAttributes, Node } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";

export interface CitationOptions {
 HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
 interface Commands<ReturnType> {
  citation: {
   /**
    * Insert citation node
    */
   insertCitation: (options?: {
    id: string;
   }) => ReturnType;
   /**
    * Update citation node
    */
   updateCitation: (options: {
    citationId: string;
   }) => ReturnType;
   /**
    * Delete citation by ID
    */
   deleteCitation: (options: { citationId: string }) => ReturnType;
  };
 }
}

// Helper function to get citation number
// export const getCitationNumber = (doc: any, targetId: string): number => {
//  let count = 1;
//  let found = false;

//  doc.descendants((node: any, _pos: number) => {
//   if (node.type.name === "citation") {
//    if (node.attrs.citationId === targetId) {
//     found = true;
//     return false;
//    }
//    if (!found) count++;
//   }
//   return true;
//  });

//  return count;
// };

export const Citation = Node.create<CitationOptions>({
 name: "citation",

 addOptions() {
  return {
   HTMLAttributes: {},
  };
 },

 inline: true,
 group: "inline",
 atom: true,

 addAttributes() {
  return {
   citationId: {
    default: null,
    parseHTML: (element) => element.getAttribute("data-citation-id"),
    renderHTML: (attributes) => {
     return {
      "data-citation-id": attributes.citationId,
     };
    },
   },
  };
 },

 parseHTML() {
  return [
   {
    tag: "sup[data-type='citation']",
    getAttrs: (node) => {
     if (typeof node === "string") return {};
     const element = node as HTMLElement;
     return {
      citationId: element.getAttribute("data-citation-id"),
     };
    },
   },
  ];
 },

 renderHTML({ HTMLAttributes, node }) {
  return [
   "sup",
   mergeAttributes(
    this.options.HTMLAttributes,
    HTMLAttributes,
    {
     "data-type": "citation",
     class: "citation-reference",
     style: "cursor: pointer;",
     "data-citation-id": node.attrs.citationId,
    },
   ),
   "[•]",
  ];
 },

 addCommands() {
  return {
   insertCitation: (options = { id: "" }) => ({ chain, commands }) => {
    const citationId = options.id;
    return commands.insertContent({
     type: this.name,
     attrs: {
      citationId,
     },
    });
   },

   updateCitation: (options) => ({ tr, state, dispatch }) => {
    const { doc } = state;
    let nodePos = -1;

    doc.descendants((node, pos) => {
     if (
      node.type.name === this.name &&
      node.attrs.citationId === options.citationId
     ) {
      nodePos = pos;
      return false;
     }
     return true;
    });

    if (nodePos === -1) {
     console.warn(
      `No citation node found with ID: ${options.citationId}`,
     );
     return false;
    }

    if (dispatch) {
     const currentNode = doc.nodeAt(nodePos);
     if (!currentNode) return false;

     tr.setNodeMarkup(nodePos, undefined, {
      ...currentNode.attrs,
      ...options,
     });
     dispatch(tr);
    }

    return true;
   },

   deleteCitation: (options) => ({ tr, state, dispatch }) => {
    if (!dispatch) return false;
    const { doc } = state;
    let nodePos = -1;

    doc.descendants((node, pos) => {
     if (
      node.type.name === this.name &&
      node.attrs.citationId === options.citationId
     ) {
      nodePos = pos;
      return false;
     }
     return true;
    });

    if (nodePos === -1) {
     return false;
    }

    tr.delete(nodePos, nodePos + doc.nodeAt(nodePos)!.nodeSize);
    dispatch(tr);
    return true;
   },
  };
 },

 addKeyboardShortcuts() {
  return {
   "Mod-Shift-c": () => this.editor.commands.insertCitation(),
  };
 },

 addProseMirrorPlugins() {
  return [
   new Plugin({
    key: new PluginKey("citationProcessor"),
    view(editorView) {
     const updateCitationNumbers = () => {
      const citations = editorView.dom.querySelectorAll(
       "sup.citation-reference",
      );
      let count = 1;
      citations.forEach((citation: Element) => {
       citation.textContent = `[${count}]`;
       count++;
      });
     };

     // Initial update
     setTimeout(updateCitationNumbers, 0);

     return {
      update(view, prevState) {
       // Update citation numbers if the document has changed
       if (!view.state.doc.eq(prevState.doc)) {
        setTimeout(updateCitationNumbers, 0);
       }
      },
     };
    },
   }),
  ];
 },
});
