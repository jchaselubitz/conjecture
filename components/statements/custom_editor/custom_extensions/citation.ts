import { mergeAttributes, Node } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";
import { createCitationMarker } from "./citation_marker";

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
 focusable: true,

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
     id: `citation-${node.attrs.citationId}`,
     "data-type": "citation",
     class: "citation-reference",
     "data-citation-id": node.attrs.citationId,
    },
   ),
   createCitationMarker(0),
  ];
 },

 addCommands() {
  return {
   insertCitation: (options = { id: "" }) => ({ tr, dispatch, state }) => {
    const citationId = options.id;
    if (!citationId) {
     console.error("Attempted to insert citation without an ID.");
     return false;
    }
    const node = this.type.create({ citationId });
    tr.replaceSelectionWith(node);

    if (dispatch) {
     dispatch(tr);
    }
    return true;
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
      // Instead of directly manipulating DOM, collect citations and their positions
      const doc = editorView.state.doc;
      let count = 1;

      doc.descendants((node, pos) => {
       if (node.type.name === "citation") {
        const dom = editorView.nodeDOM(pos) as HTMLElement | null;
        if (dom) {
         const span = dom.querySelector(".citation-number");
         if (span) {
          span.textContent = `${count}`;
          count++;
         }
        }
       }
       return true;
      });
     };

     // Initial update using requestAnimationFrame instead of setTimeout
     requestAnimationFrame(updateCitationNumbers);

     return {
      update(view, prevState) {
       // Only update if document content changed
       if (!view.state.doc.eq(prevState.doc)) {
        requestAnimationFrame(updateCitationNumbers);
       }
      },
     };
    },
   }),
   new Plugin({
    key: new PluginKey("citationDeletion"),
    props: {
     handleKeyDown: (view, event) => {
      // Process only intentional deletion keypresses
      if (event.key === "Delete" || event.key === "Backspace") {
       const { selection } = view.state;
       if (selection.empty) return false;
       const fragment = selection.content().content;
       const deletedCitations = new Set<string>();
       fragment.descendants((node) => {
        if (node.type.name === this.name) {
         deletedCitations.add(node.attrs.citationId);
        }
        return true;
       });

       if (deletedCitations.size > 0) {
        this.editor.storage.citationDeletion = {
         pendingDeletions: deletedCitations,
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
     const pendingDeletions = this.editor.storage.citationDeletion
      ?.pendingDeletions;
     if (!pendingDeletions || pendingDeletions.size === 0) return null;

     const existingCitations = new Set<string>();
     newState.doc.descendants((node) => {
      if (node.type.name === this.name) {
       existingCitations.add(node.attrs.citationId);
      }
      return true;
     });
     const confirmedDeletions = new Set<string>();
     pendingDeletions.forEach((citationId: string) => {
      if (!existingCitations.has(citationId)) {
       confirmedDeletions.add(citationId);
      }
     });

     if (confirmedDeletions.size > 0 && this.options.onDelete) {
      confirmedDeletions.forEach((citationId) => {
       this.options.onDelete?.(citationId);
      });
     }

     this.editor.storage.citationDeletion = {
      pendingDeletions: new Set(),
     };

     return null;
    },
   }),
  ];

  return plugins;
 },
});
