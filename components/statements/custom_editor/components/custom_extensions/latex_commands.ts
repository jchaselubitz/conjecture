import { Extension } from "@tiptap/core";
import { nanoid } from "nanoid";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    latexCommands: {
      insertLatex: (
        attrs: { content: string; displayMode?: boolean },
      ) => ReturnType;
      updateLatex: (
        attrs: { latexId: string; content: string; displayMode?: boolean },
      ) => ReturnType;
    };
  }
}

export const LatexCommands = Extension.create({
  name: "latexCommands",

  addCommands() {
    return {
      insertLatex: (attrs) => ({ chain, editor }) => {
        const latexId = nanoid();

        // Use the appropriate extension based on display mode
        if (attrs.displayMode) {
          // Use BlockLatex's implementation for block mode
          return editor.commands.insertContent({
            type: "blockLatex",
            attrs: {
              latex: attrs.content,
              displayMode: true,
              latexId,
            },
          });
        } else {
          // For inline LaTeX, don't use chain to avoid the error
          return editor.commands.setInlineLatex({
            content: attrs.content,
            latexId,
          });
        }
      },
      updateLatex: (attrs: {
        latexId: string;
        content: string;
        displayMode?: boolean;
      }) =>
      ({ editor, state, dispatch, tr }) => {
        const { schema, doc } = state;

        // Try to find a node with the given ID
        let found = false;
        const nodeType = attrs.displayMode !== false
          ? schema.nodes.blockLatex
          : null;

        // If it's a mark, we need a different approach
        const markType = attrs.displayMode === false
          ? schema.marks.inlineLatex
          : null;

        if (nodeType) {
          // Handle block LaTeX update
          let nodePos = -1;

          doc.descendants((node: any, pos: number) => {
            if (
              node.type === nodeType &&
              node.attrs.latexId === attrs.latexId
            ) {
              nodePos = pos;
              found = true;
              return false;
            }
            return true;
          });

          if (found && dispatch) {
            tr.setNodeMarkup(nodePos, nodeType, {
              ...doc.nodeAt(nodePos)?.attrs,
              latex: attrs.content,
            });
            dispatch(tr);
          }
        } else if (markType) {
          // Handle inline LaTeX update
          doc.nodesBetween(
            0,
            doc.content.size,
            (node: any, pos: number) => {
              if (found) return false;

              const marks = node.marks.filter(
                (m: any) =>
                  m.type === markType &&
                  m.attrs.latexId === attrs.latexId,
              );

              if (marks.length > 0 && dispatch) {
                const mark = marks[0];
                const start = pos;
                const end = pos + node.nodeSize;

                tr.removeMark(start, end, markType);
                tr.addMark(
                  start,
                  end,
                  markType.create({
                    ...mark.attrs,
                    latex: attrs.content,
                  }),
                );

                found = true;
                dispatch(tr);
                return false;
              }

              return true;
            },
          );
        }

        return found;
      },
    };
  },
});
