import "./prose.css";
import "katex/dist/katex.min.css";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  BubbleMenu,
  EditorContent,
  FloatingMenu,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { NewAnnotation } from "kysely-codegen";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { UpsertImageDataType } from "@/lib/actions/statementActions";

import { processAnnotations } from "./components/annotationHelpers";
import { BlockTypeChooser } from "./components/block_type_chooser";
import { BlockImage } from "./components/custom_extensions/block_image";
import { BlockLatex } from "./components/custom_extensions/block_latex";
import {
  deleteLatex,
  saveLatex,
} from "./components/custom_extensions/helpersLatexExtension";
import { InlineLatex } from "./components/custom_extensions/inline_latex";
import { ImageNodeEditor, NewImageData } from "./components/image-node-editor";
import { LatexNodeEditor } from "./components/latex-node-editor";
import { TextFormatMenu } from "./components/text_format_menu";
interface HTMLSuperEditorProps {
  htmlContent: string;
  existingAnnotations: NewAnnotation[];
  userId: string | undefined;
  statementId: string;
  onAnnotationChange?: (value: NewAnnotation[]) => void;
  onAnnotationClick?: (id: string) => void;
  getSpan?: (span: NewAnnotation) => NewAnnotation;
  style?: React.CSSProperties;
  className?: string;
  placeholder?: string;
  annotatable?: boolean;
  editable?: boolean;
  onContentChange?: (htmlContent: string) => void;
  selectedAnnotationId: string | undefined;
  setSelectedAnnotationId: (id: string | undefined) => void;
  showAuthorComments: boolean;
  showReaderComments: boolean;
}

const HTMLSuperEditor = ({
  htmlContent,
  existingAnnotations,
  userId,
  statementId,
  onAnnotationChange,
  getSpan,
  onAnnotationClick,
  style,
  className,
  placeholder,
  annotatable,
  editable,
  onContentChange,
  selectedAnnotationId,
  setSelectedAnnotationId,
  showAuthorComments,
  showReaderComments,
}: HTMLSuperEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [annotations, setAnnotations] = useState<NewAnnotation[]>([]);
  const [latexPopoverOpen, setLatexPopoverOpen] = useState(false);
  const [currentLatex, setCurrentLatex] = useState("");
  const [isBlock, setIsBlock] = useState(true);
  const [selectedLatexId, setSelectedLatexId] = useState<string | null>(null);
  const [selectedNodePosition, setSelectedNodePosition] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const [imagePopoverOpen, setImagePopoverOpen] = useState(false);
  const [initialImageData, setInitialImageData] = useState<UpsertImageDataType>(
    {
      src: "",
      alt: "",
      statementId,
      id: "",
    },
  );
  const [currentImageData, setCurrentImageData] = useState<NewImageData>({
    file: undefined,
    src: "",
    alt: "",

    id: undefined,
  });

  useEffect(() => {
    setAnnotations(existingAnnotations);
  }, [existingAnnotations]);

  // Initialize the Tiptap editor for rich text editing
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      InlineLatex,
      BlockLatex.configure({
        HTMLAttributes: {
          class: "latex-popover-editor",
        },
      }),
      BlockImage.configure({
        HTMLAttributes: {
          class: "block-image",
        },
      }),
    ],
    content: htmlContent,
    editable: editable,
    onUpdate: ({ editor }) => {
      if (onContentChange) {
        onContentChange(editor.getHTML());
      }
    },
    onDestroy: () => {
      // Clean up any references when editor is destroyed
      const container = containerRef.current;
      if (container) {
        // Clear content to prevent manipulation of detached nodes
        container.innerHTML = "";
      }
    },
    editorProps: {
      handleDOMEvents: {
        // Handle clicks on LaTeX elements to edit them
        click: (view, event) => {
          const element = event.target as HTMLElement;

          // Check for image elements first
          const imageNode = element.closest('img[data-type="block-image"]');
          if (imageNode) {
            const rect = imageNode.getBoundingClientRect();

            setSelectedNodePosition({
              x: rect.left,
              y: rect.top,
              width: rect.width,
              height: rect.height,
            });

            openImagePopover({
              src: imageNode.getAttribute("src") || "",
              alt: imageNode.getAttribute("alt") || "",
              id: imageNode.getAttribute("data-image-id") ?? undefined,
            });

            event.preventDefault();
            event.stopPropagation();
            return true;
          }

          // Look for any LaTeX element - both inline and block
          // Also check for elements inside a .katex rendered element
          let latexNode = element.closest(
            '[data-type="latex"], [data-type="latex-block"], .inline-latex, .latex-block',
          );

          // If we didn't find a direct LaTeX element, check if we're inside a katex rendered element
          if (!latexNode) {
            const katexElement = element.closest(
              ".katex, .katex-html, .katex-rendered",
            );
            if (katexElement) {
              // Find the parent LaTeX element that contains this katex element
              latexNode = katexElement.closest(
                '[data-type="latex"], [data-type="latex-block"], .inline-latex, .latex-block',
              );
            }
          }

          if (latexNode) {
            // Get or generate an ID
            let id = latexNode.getAttribute("data-id");

            let latex = latexNode.getAttribute("data-latex");

            if (!latex) {
              latex = latexNode.getAttribute("data-original-content");
            }

            // If still no content, try extracting from text content
            // but skip KaTeX wrappers that might be inside
            if (!latex) {
              const katexWrapper = latexNode.querySelector(
                ".katex-rendered, .katex",
              );
              if (katexWrapper) {
                // If there's a rendered KaTeX element, ignore its content
                latex = "";
              } else {
                latex = latexNode.textContent || "";
              }
            }

            const displayMode =
              latexNode.getAttribute("data-display-mode") === "true" ||
              latexNode.classList.contains("latex-block");

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
              latexId: id,
            });

            // Prevent further handling
            event.preventDefault();
            event.stopPropagation();
            return true;
          }

          return false;
        },
      },
    },
  });

  // Callback to open the LaTeX popover dialog
  const openLatexPopover = useCallback(
    ({
      latex = "",
      displayMode = true,
      latexId = null,
    }: {
      latex?: string;
      displayMode?: boolean;
      latexId?: string | null;
    }) => {
      setCurrentLatex(latex);
      setIsBlock(displayMode);
      console.log("latexId", latexId);
      setSelectedLatexId(latexId);

      // Calculate position for the popover
      if (editor) {
        const view = editor.view;
        const { from } = view.state.selection;
        const pos = view.coordsAtPos(from);

        setSelectedNodePosition({
          x: pos.left,
          y: pos.top,
          width: 1,
          height: 1,
        });
      }

      setLatexPopoverOpen(true);
    },
    [editor],
  );

  const openImagePopover = useCallback(
    ({
      src = "",
      alt = "",
      id = "",

      position = null,
    }: {
      src?: string;
      alt?: string;
      id?: string;

      position?: { x: number; y: number; width: number; height: number } | null;
    }) => {
      setInitialImageData({ src, alt, statementId, id });
      if (position) {
        setSelectedNodePosition(position);
      }
      setImagePopoverOpen(true);
    },
    [statementId],
  );

  const getAllTextNodes = useCallback((node: Node): Text[] => {
    const textNodes: Text[] = [];

    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        textNodes.push(node as Text);
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          walk(node.childNodes[i]);
        }
      }
    };

    walk(node);
    return textNodes;
  }, []);

  // Update the display when content or annotations change
  useEffect(() => {
    if (!containerRef.current || !editor) return;

    // Reset HTML content
    containerRef.current.innerHTML = htmlContent;

    // Add placeholder if empty
    if (placeholder && containerRef.current.textContent?.trim() === "") {
      const firstP = containerRef.current.querySelector("p");
      if (firstP) {
        firstP.classList.add("is-editor-empty");
        firstP.setAttribute("data-placeholder", placeholder);
      }
    }
    // Add styles for hover effects
    const styleTag = document.createElement("style");
    styleTag.textContent = `
      .annotation {
        transition: background-color 0.2s ease;
      }
      .annotation:hover {
        background-color: var(--hover-bg-color) !important;
      }
    `;
    containerRef.current.appendChild(styleTag);

    processAnnotations({
      annotations,
      userId,
      showAuthorComments,
      showReaderComments,
      selectedAnnotationId,
      container: containerRef.current,
    });
  }, [
    htmlContent,
    showAuthorComments,
    showReaderComments,
    placeholder,
    editor,
    annotations,
    selectedAnnotationId,
    getAllTextNodes,
    getSpan,
    onAnnotationChange,
    setSelectedAnnotationId,
    userId,
  ]);

  // Handle selection and create new annotations
  const handleMouseUp = useCallback(() => {
    if (!userId) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    if (!range) return;

    // Get the text content of the selection
    const text = range.toString();
    if (!text) return;

    // Calculate start and end positions
    const container = containerRef.current;
    if (!container) return;

    // Get all text nodes and their positions
    const textNodes = getAllTextNodes(container);
    const nodePositions: { node: Text; start: number; end: number }[] = [];
    let currentPos = 0;

    for (const node of textNodes) {
      const nodeLength = node.textContent?.length || 0;
      nodePositions.push({
        node,
        start: currentPos,
        end: currentPos + nodeLength,
      });
      currentPos += nodeLength;
    }

    // Find the start position
    let start = -1;
    const startNode = range.startContainer;
    const startOffset = range.startOffset;

    if (startNode.nodeType === Node.TEXT_NODE) {
      const nodeInfo = nodePositions.find((info) => info.node === startNode);
      if (nodeInfo) {
        start = nodeInfo.start + startOffset;
      }
    }

    // Find the end position
    let end = -1;
    const endNode = range.endContainer;
    const endOffset = range.endOffset;

    if (endNode.nodeType === Node.TEXT_NODE) {
      const nodeInfo = nodePositions.find((info) => info.node === endNode);
      if (nodeInfo) {
        end = nodeInfo.start + endOffset;
      }
    }

    if (start !== -1 && end !== -1) {
      const newAnnotation = {
        start,
        end,
        text,
        userId,
        id: crypto.randomUUID(),
        draftId: "", // Required by type
      };

      // Format the annotation if getSpan is provided
      const formattedAnnotation = getSpan
        ? getSpan(newAnnotation)
        : newAnnotation;

      // Update annotations
      const newAnnotations = [...annotations, formattedAnnotation];
      setAnnotations(newAnnotations);
      if (onAnnotationChange) {
        onAnnotationChange(newAnnotations);
      }

      // Clear selection and set the new annotation as selected
      selection.removeAllRanges();
      setSelectedAnnotationId(formattedAnnotation.id);
    }
  }, [
    userId,
    annotations,
    getAllTextNodes,
    getSpan,
    onAnnotationChange,
    setSelectedAnnotationId,
  ]);

  // Handle click on annotations
  const handleAnnotationClick = useCallback(
    (e: React.MouseEvent) => {
      if (!onAnnotationClick) return;
      const target = e.target as HTMLElement;
      if (target.classList.contains("annotation")) {
        const id = target.dataset.id;
        if (id) {
          onAnnotationClick(id);
        }
      }
    },
    [onAnnotationClick],
  );

  // Update the editor content when htmlContent prop changes (in view mode)
  useEffect(() => {
    if (!editable && editor) {
      editor.commands.setContent(htmlContent);
    }
  }, [htmlContent, editor, editable]);

  // Reset the editor completely when edit mode changes
  useEffect(() => {
    if (editor) {
      return () => {
        if (editor) {
          // Clean up any pending operations
          editor.commands.clearContent();
        }
      };
    }
  }, [editor, editable]);

  const handleSaveLatex = useCallback(() => {
    if (editor) {
      saveLatex({
        latex: currentLatex,
        editor,
        selectedLatexId,
        isBlock,
        setLatexPopoverOpen,
      });
    }
  }, [editor, selectedLatexId, isBlock, currentLatex, setLatexPopoverOpen]);

  const handleDeleteLatex = useCallback(() => {
    if (editor) {
      deleteLatex({ editor, selectedLatexId, isBlock, setLatexPopoverOpen });
    }
  }, [editor, selectedLatexId, isBlock, setLatexPopoverOpen]);

  return (
    <div
      className={`relative ${editable ? "editable-container" : "annotator-container"} ${className || ""}`}
      style={style}
    >
      {editable ? (
        <>
          {editor && (
            <>
              <BubbleMenu
                key={`bubble-menu-${editable}`}
                editor={editor}
                tippyOptions={{ duration: 100 }}
                className="overflow-hidden"
              >
                <TextFormatMenu
                  editor={editor}
                  openLatexPopover={openLatexPopover}
                />
              </BubbleMenu>
              <FloatingMenu
                key={`floating-menu-${editable}`}
                editor={editor}
                tippyOptions={{ duration: 100 }}
              >
                <BlockTypeChooser
                  editor={editor}
                  openLatexPopover={openLatexPopover}
                  openImagePopover={openImagePopover}
                />
              </FloatingMenu>
            </>
          )}
          <EditorContent
            key={`editor-content-${editable}`}
            editor={editor}
            className={`ProseMirror ${annotatable ? "annotator-container" : ""}`}
          />
        </>
      ) : (
        <div
          key={`view-content-${editable}`}
          ref={containerRef}
          className={`ProseMirror ${annotatable ? "annotator-container" : ""}`}
          onMouseUp={annotatable ? handleMouseUp : undefined}
          onClick={annotatable ? handleAnnotationClick : undefined}
        />
      )}

      {/* LaTeX Editor */}
      {editor && (
        <>
          <LatexNodeEditor
            open={latexPopoverOpen}
            onOpenChange={setLatexPopoverOpen}
            initialLatex={currentLatex}
            isBlock={isBlock}
            nodePosition={selectedNodePosition}
            onSave={handleSaveLatex}
            onDelete={handleDeleteLatex}
          />
          <ImageNodeEditor
            open={imagePopoverOpen}
            onOpenChange={setImagePopoverOpen}
            initialImageData={initialImageData}
            nodePosition={selectedNodePosition}
            editor={editor}
            statementId={statementId}
          />
        </>
      )}
    </div>
  );
};

export default HTMLSuperEditor;
