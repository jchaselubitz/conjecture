"use client";
import "./prose.css";
import "katex/dist/katex.min.css";
import CodeBlock from "@tiptap/extension-code-block";
import Gapcursor from "@tiptap/extension-gapcursor";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import {
  BubbleMenu,
  Editor,
  EditorContent,
  FloatingMenu,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import katex from "katex";
import { useCallback, useEffect, useRef, useState } from "react";

import { BlockTypeChooser } from "./text_editor/block_type_chooser";
import { PopoverLatex } from "./text_editor/custom_extensions/popover_latex";
import { LatexButton } from "./text_editor/latex-button";
import { LatexNodeEditor } from "./text_editor/latex-node-editor";
import { TextFormatMenu } from "./text_editor/text_format_menu";

declare module "@tiptap/react" {
  interface Editor {
    openLatexPopover: (options: {
      latex?: string;
      displayMode?: boolean;
      id?: string | null;
    }) => void;
  }
}

interface RichTextEditorProps {
  content: string | undefined | null;
  onChange: (content: string) => void;
  placeholder?: string;
}

// LaTeX rendering function for blocks and inline elements when viewing the content
const renderLatex = (latex: string, displayMode = false) => {
  try {
    return katex.renderToString(latex.trim(), {
      throwOnError: false,
      displayMode,
    });
  } catch (error) {
    console.error("Error rendering LaTeX:", error);
    return `<span class="latex-error">Error rendering LaTeX: ${latex}</span>`;
  }
};

// Function to render popoverLatex nodes
const renderPopoverLatexNode = (node: HTMLElement) => {
  const content = node.getAttribute("data-latex") || "";
  const displayMode = node.getAttribute("data-display-mode") === "true";

  try {
    const rendered = renderLatex(content, displayMode);

    // Create a container for the rendered LaTeX
    const renderContainer = document.createElement("div");
    renderContainer.classList.add("katex-rendered");
    if (displayMode) {
      renderContainer.classList.add("block-display");
    } else {
      renderContainer.classList.add("inline-display");
    }
    renderContainer.innerHTML = rendered;

    // Replace content with rendered LaTeX
    node.innerHTML = "";
    node.appendChild(renderContainer);
  } catch (error) {
    console.error("Error rendering LaTeX node:", error);

    // Add error display
    node.innerHTML = `<div class="latex-error">Error rendering LaTeX</div>`;
  }
};

export default function RichTextEditor({
  content,
  onChange,
  placeholder,
}: RichTextEditorProps) {
  const [latexPopoverOpen, setLatexPopoverOpen] = useState(false);
  const [currentLatex, setCurrentLatex] = useState("");
  const [isBlock, setIsBlock] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodePosition, setSelectedNodePosition] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const editorRef = useRef<Editor | null>(null);

  // Callback to open the LaTeX popover
  const openLatexPopover = useCallback(
    ({
      latex = "",
      displayMode = true,
      id = null,
      position = null,
    }: {
      latex?: string;
      displayMode?: boolean;
      id?: string | null;
      position?: { x: number; y: number; width: number; height: number } | null;
    }) => {
      setCurrentLatex(latex);
      setIsBlock(displayMode);
      setSelectedNodeId(id);
      if (position) {
        setSelectedNodePosition(position);
      }
      setLatexPopoverOpen(true);
    },
    [],
  );

  // Save LaTeX content from popover
  const handleSaveLatex = useCallback(
    (latex: string) => {
      if (!editorRef.current) return;

      if (selectedNodeId) {
        // Update existing node
        editorRef.current.commands.updateLatex({
          id: selectedNodeId,
          content: latex,
        });
      } else {
        // Insert new node
        editorRef.current.commands.insertLatex({
          content: latex,
          displayMode: isBlock,
        });
      }

      // Re-render the node after updating
      setTimeout(() => {
        const editorElement = editorRef.current?.view.dom as HTMLElement;
        if (!editorElement) return;

        const latexNodes = editorElement.querySelectorAll(
          '[data-type="latex"], [data-type="latex-block"]',
        );
        latexNodes.forEach((node) => {
          renderPopoverLatexNode(node as HTMLElement);
        });
      }, 10);
    },
    [selectedNodeId, isBlock],
  );

  // Handle delete LaTeX
  const handleDeleteLatex = useCallback(() => {
    if (!editorRef.current || !selectedNodeId) return;

    // Find the node with the given ID
    const { doc } = editorRef.current.state;
    let nodePos = -1;
    let nodeSize = 1;

    doc.descendants((node, pos) => {
      if (node.attrs && node.attrs.id === selectedNodeId) {
        nodePos = pos;
        nodeSize = node.nodeSize;
        return false;
      }
      return true;
    });

    if (nodePos !== -1) {
      // Delete the node
      editorRef.current
        .chain()
        .focus()
        .deleteRange({ from: nodePos, to: nodePos + nodeSize })
        .run();

      // Close the popover
      setLatexPopoverOpen(false);
    }
  }, [selectedNodeId]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      Typography,
      CodeBlock,
      Gapcursor,
      PopoverLatex.configure({
        HTMLAttributes: {
          class: "latex-popover-editor",
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
        emptyNodeClass: "is-node-empty",
        showOnlyWhenEditable: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
    ],
    editable: true,
    content,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none",
      },
      handleDOMEvents: {
        // Handle clicks on LaTeX nodes to edit them
        click: (view, event) => {
          const element = event.target as HTMLElement;
          const latexNode = element.closest(
            '[data-type="latex"], [data-type="latex-block"]',
          );

          if (latexNode) {
            const id = latexNode.getAttribute("data-id");
            const latex = latexNode.getAttribute("data-latex") || "";
            const displayMode =
              latexNode.getAttribute("data-display-mode") === "true";

            if (id) {
              // Store the node's position for the popover
              const rect = latexNode.getBoundingClientRect();
              setSelectedNodePosition({
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height,
              });

              // Open the LaTeX popover
              openLatexPopover({
                latex,
                displayMode,
                id,
              });

              // Prevent further handling
              event.preventDefault();
              event.stopPropagation();
              return true;
            }
          }

          return false;
        },
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Store reference to editor and extend with openLatexDialog method
  useEffect(() => {
    if (editor) {
      editorRef.current = editor;

      // Extend editor with openLatexDialog method
      editor.openLatexPopover = openLatexPopover;

      // Hook into the transaction updates to render LaTeX nodes
      editor.on("update", () => {
        // Render all LaTeX nodes after update
        setTimeout(() => {
          const editorElement = editor.view.dom as HTMLElement;
          const latexNodes = editorElement.querySelectorAll(
            '[data-type="latex"], [data-type="latex-block"]',
          );

          latexNodes.forEach((node) => {
            renderPopoverLatexNode(node as HTMLElement);
          });
        }, 0);
      });

      // Initial render of LaTeX nodes
      setTimeout(() => {
        const editorElement = editor.view.dom as HTMLElement;
        const latexNodes = editorElement.querySelectorAll(
          '[data-type="latex"], [data-type="latex-block"]',
        );

        latexNodes.forEach((node) => {
          renderPopoverLatexNode(node as HTMLElement);
        });
      }, 0);
    }
  }, [editor, openLatexPopover]);

  useEffect(() => {
    if (content && editor) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Create updated menu components with the new buttons

  if (!editor) {
    return null;
  }

  return (
    <div className="w-full rounded-lg overflow-hidden bg-background relative">
      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 100 }}
        className="overflow-hidden"
      >
        <TextFormatMenu editor={editor} openLatexPopover={openLatexPopover} />
      </BubbleMenu>
      <FloatingMenu editor={editor} tippyOptions={{ duration: 100 }}>
        <BlockTypeChooser editor={editor} openLatexPopover={openLatexPopover} />
      </FloatingMenu>

      {/* The editor content is not wrapped, allowing normal text editing */}
      <EditorContent editor={editor} />

      {/* Use our new LatexNodeEditor component */}
      <LatexNodeEditor
        open={latexPopoverOpen}
        onOpenChange={setLatexPopoverOpen}
        initialLatex={currentLatex}
        isBlock={isBlock}
        nodePosition={selectedNodePosition}
        onSave={handleSaveLatex}
        onDelete={selectedNodeId ? handleDeleteLatex : undefined}
      />
    </div>
  );
}
