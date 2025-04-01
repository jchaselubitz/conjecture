import { mergeAttributes, Node } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";

export interface CitationOptions {
 HTMLAttributes: Record<string, any>;
 onDelete?: (citationId: string) => Promise<void>;
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

export const Citation = Node.create<CitationOptions>({
 name: "citation",

 addOptions() {
  return {
   HTMLAttributes: {},
   onDelete: undefined,
  };
 },

 inline: true,
 group: "inline",
 atom: true,
 selectable: true,
 draggable: true,
 whitespace: "pre",

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
  const plugins = [
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
   new Plugin({
    key: new PluginKey("citationDeletion"),
    appendTransaction: (transactions, oldState, newState) => {
     // Skip if no changes
     if (!transactions.some((tr) => tr.docChanged)) return null;

     // Find deleted citation nodes
     const deletedCitations = new Set<string>();
     const existingCitations = new Set<string>();

     // First, collect all citations in the new state
     newState.doc.descendants((newNode) => {
      if (newNode.type.name === this.name) {
       existingCitations.add(newNode.attrs.citationId);
      }
      return true; // Continue traversing
     });

     // Then check old state for citations that no longer exist
     oldState.doc.descendants((node) => {
      if (node.type.name === this.name) {
       const citationId = node.attrs.citationId;
       if (!existingCitations.has(citationId)) {
        deletedCitations.add(citationId);
       }
      }
      return true; // Continue traversing
     });

     // Call onDelete for each deleted citation
     if (deletedCitations.size > 0 && this.options.onDelete) {
      deletedCitations.forEach((citationId) => {
       this.options.onDelete?.(citationId);
      });
     }

     return null;
    },
   }),
  ];

  return plugins;
 },
});
