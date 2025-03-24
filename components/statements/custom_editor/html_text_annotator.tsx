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
// Tiptap editor and extensions for rich text editing
import StarterKit from "@tiptap/starter-kit";
import { NewAnnotation } from "kysely-codegen";
import { nanoid } from "nanoid";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { BlockTypeChooser } from "./components/block_type_chooser";
import { BlockLatex } from "./components/custom_extensions/block_latex";
import { InlineLatex } from "./components/custom_extensions/inline_latex";
import { LatexCommands } from "./components/custom_extensions/latex_commands";
import { generateColorFromString, processLatex } from "./components/helpers";
import { LatexNodeEditor } from "./components/latex-node-editor";
import { TextFormatMenu } from "./components/text_format_menu";

interface HTMLTextAnnotatorProps {
  htmlContent: string;
  existingAnnotations: NewAnnotation[];
  userId: string | undefined;
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

const HTMLTextAnnotator = ({
  htmlContent,
  existingAnnotations,
  userId,
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
}: HTMLTextAnnotatorProps) => {
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
      LatexCommands,
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

          // Look for any LaTeX element - both inline and block
          // Also check for elements inside a .katex rendered element
          let latexNode = element.closest(
            '[data-type="latex"], [data-type="latex-block"], .inline-latex, .latex-block'
          );

          // If we didn't find a direct LaTeX element, check if we're inside a katex rendered element
          if (!latexNode) {
            const katexElement = element.closest(
              ".katex, .katex-html, .katex-rendered"
            );
            if (katexElement) {
              // Find the parent LaTeX element that contains this katex element
              latexNode = katexElement.closest(
                '[data-type="latex"], [data-type="latex-block"], .inline-latex, .latex-block'
              );
            }
          }

          if (latexNode) {
            // Get or generate an ID
            let id = latexNode.getAttribute("data-id");
            if (!id) {
              // Generate an ID if one doesn't exist
              id = nanoid();
              latexNode.setAttribute("data-id", id);
            }

            // Get the LaTeX content with fallbacks
            // First try data-latex attribute which should contain the raw LaTeX
            let latex = latexNode.getAttribute("data-latex");

            // If no data-latex, look for original content attribute
            if (!latex) {
              latex = latexNode.getAttribute("data-original-content");
            }

            // If still no content, try extracting from text content
            // but skip KaTeX wrappers that might be inside
            if (!latex) {
              const katexWrapper = latexNode.querySelector(
                ".katex-rendered, .katex"
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
    [editor]
  );

  // Function to handle saving LaTeX content
  const handleSaveLatex = useCallback(
    (latex: string) => {
      if (!editor) return;

      const contentToSave = latex;

      // Try to find the element in the DOM first for immediate visual feedback
      if (selectedLatexId) {
        const element = document.querySelector(
          `[data-id="${selectedLatexId}"]`
        ) as HTMLElement;

        if (element) {
          // Update the element's data-latex attribute for immediate feedback
          element.setAttribute("data-latex", contentToSave);
          element.setAttribute("data-display-mode", String(isBlock));

          // Add appropriate class based on display mode
          if (isBlock) {
            element.classList.add("latex-block");
            element.classList.remove("inline-latex");
          } else {
            element.classList.add("inline-latex");
            element.classList.remove("latex-block");
          }
        }
      }

      // First, try to update the model
      let modelUpdateSuccessful = false;
      try {
        // If it's an update to an existing LaTeX element
        if (selectedLatexId) {
          // Update based on the LaTeX type
          if (isBlock) {
            // For block LaTeX, let's use a simpler approach for block LaTeX
            // Find the element in the DOM and update its attributes directly
            const element = document.querySelector(
              `[data-id="${selectedLatexId}"]`
            ) as HTMLElement;

            if (element) {
              element.setAttribute("data-latex", contentToSave);
              // First update attributes directly, then render through KaTeX
              const editorElement = editor.view.dom as HTMLElement;
              console.log(
                "processLatex called from handleSaveLatex - element update"
              );
              processLatex(editorElement);

              // Force model update through setContent if needed
              const html = editor.getHTML();
              editor.commands.setContent(html, false, {
                preserveWhitespace: true,
              });

              modelUpdateSuccessful = true;
            }
          } else {
            // For inline LaTeX, use the existing command
            editor.commands.updateLatex({
              latexId: selectedLatexId,
              content: contentToSave,
            });
            modelUpdateSuccessful = true;
          }
        } else if (contentToSave.trim()) {
          // It's a new LaTeX element, insert it at the current position
          editor.chain().focus().run();

          // Insert the LaTeX content now that we're focused
          let inserted = false;

          if (isBlock) {
            // Use blockLatex for block mode
            inserted = editor.commands.insertContent({
              type: "blockLatex",
              attrs: {
                latex: contentToSave,
                displayMode: true,
                latexId: nanoid(),
              },
            });
          } else {
            // Use inline LaTeX for inline mode
            inserted = editor.commands.setInlineLatex({
              content: contentToSave,
              latexId: nanoid(),
            });
          }

          modelUpdateSuccessful = inserted;
        }
      } catch (error) {
        console.error("Error updating LaTeX in model:", error);
      }

      // Close the popover
      setLatexPopoverOpen(false);

      // If the model update wasn't successful, or as a secondary measure,
      // process the LaTeX in the DOM after a slight delay to ensure rendering
      if (!modelUpdateSuccessful || true) {
        // Always run as a fallback for now
        setTimeout(() => {
          if (editor) {
            const editorElement = editor.view.dom as HTMLElement;
            console.log(
              "processLatex called from handleSaveLatex - setTimeout"
            );
            processLatex(editorElement);
          }
        }, 100);
      }
    },
    [editor, selectedLatexId, isBlock]
  );

  // Handle deleting LaTeX content from the editor
  const handleDeleteLatex = useCallback(() => {
    if (!editor || !selectedLatexId) return;

    // Find and delete the node
    editor
      .chain()
      .focus()
      .deleteNode(isBlock ? "blockLatex" : "inlineLatex")
      .run();
  }, [editor, selectedLatexId, isBlock]);

  // Helper to get all text nodes
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

  // Get text nodes in a range
  const getTextNodesInRange = useCallback(
    (
      range: Range
    ): { node: Text; startOffset: number; endOffset: number }[] => {
      const nodes: { node: Text; startOffset: number; endOffset: number }[] =
        [];
      if (!containerRef.current) return nodes;

      const textNodes = getAllTextNodes(containerRef.current);

      for (const node of textNodes) {
        if (range.intersectsNode(node)) {
          const nodeRange = document.createRange();
          nodeRange.selectNodeContents(node);

          // Calculate the intersection of the ranges
          const startOffset =
            range.compareBoundaryPoints(Range.START_TO_START, nodeRange) <= 0
              ? 0
              : range.startOffset;

          const endOffset =
            range.compareBoundaryPoints(Range.END_TO_END, nodeRange) >= 0
              ? node.length
              : range.endOffset;

          if (startOffset < endOffset) {
            nodes.push({ node, startOffset, endOffset });
          }
        }
      }

      return nodes;
    },
    [getAllTextNodes]
  );

  // Process and apply annotations to the HTML content
  const processAnnotations = useCallback(
    (container: HTMLElement) => {
      // Filter annotations based on visibility settings
      const visibleAnnotations = annotations.filter((annotation) => {
        const isAuthor = annotation.userId === userId;
        if (showAuthorComments && isAuthor) return true;
        if (showReaderComments && !isAuthor) return true;
        return false;
      });

      // Process LaTeX first
      processLatex(container);

      // Apply annotations
      visibleAnnotations.forEach((annotation) => {
        const range = document.createRange();
        const textNodes = getAllTextNodes(container);

        let currentPos = 0;
        let startNode: Text | null = null;
        let endNode: Text | null = null;
        let startOffset = 0;
        let endOffset = 0;

        // Find the start and end nodes and offsets
        for (const node of textNodes) {
          const nodeLength = node.textContent?.length || 0;
          const nodeEndPos = currentPos + nodeLength;

          // Skip nodes within LaTeX
          let parentElement = node.parentElement;
          let isInsideLaTeX = false;

          while (parentElement) {
            if (
              parentElement.classList &&
              (parentElement.classList.contains("katex") ||
                parentElement.classList.contains("katex-rendered") ||
                parentElement.classList.contains("latex-rendered") ||
                parentElement.classList.contains("latex-block") ||
                parentElement.classList.contains("inline-latex"))
            ) {
              isInsideLaTeX = true;
              break;
            }
            parentElement = parentElement.parentElement;
          }

          if (isInsideLaTeX) {
            currentPos += nodeLength;
            continue;
          }

          // Find start and end positions
          if (currentPos <= annotation.start && annotation.start < nodeEndPos) {
            startNode = node;
            startOffset = annotation.start - currentPos;
          }

          if (currentPos <= annotation.end && annotation.end <= nodeEndPos) {
            endNode = node;
            endOffset = annotation.end - currentPos;
            break;
          }

          currentPos += nodeLength;
        }

        // Apply the annotation if we found both start and end positions
        if (startNode && endNode) {
          try {
            range.setStart(startNode, startOffset);
            range.setEnd(endNode, endOffset);

            const mark = document.createElement("mark");
            const annotationUserId = annotation.userId || "anonymous";
            const colors = generateColorFromString(annotationUserId);
            const tag = annotation.tag || "none";
            const annotationId = annotation.id ? annotation.id.toString() : "";
            const isSelected = selectedAnnotationId === annotationId;

            // Apply colors and styles
            mark.style.backgroundColor = colors.backgroundColor;
            mark.style.setProperty(
              "--hover-bg-color",
              colors.hoverBackgroundColor
            );

            if (isSelected) {
              mark.style.borderBottom = `2px solid ${colors.borderColor}`;
              mark.style.backgroundColor = colors.hoverBackgroundColor;
            }

            mark.className = "annotation";
            mark.dataset.tag = tag;
            mark.dataset.userId = annotationUserId;
            mark.dataset.start = annotation.start.toString();
            mark.dataset.end = annotation.end.toString();
            mark.dataset.draftId = annotation.draftId.toString();
            mark.dataset.id = annotationId;

            range.surroundContents(mark);

            // Re-process LaTeX in the annotation
            processLatex(mark);
          } catch (e) {
            console.error("Error applying annotation:", e);

            // Try alternative approach with multiple highlights
            try {
              const rangeNodes = getTextNodesInRange(range);
              rangeNodes.forEach((nodeInfo) => {
                // Skip LaTeX nodes
                let parentElement = nodeInfo.node.parentElement;
                let isInsideLaTeX = false;

                while (parentElement) {
                  if (
                    parentElement.classList &&
                    (parentElement.classList.contains("katex") ||
                      parentElement.classList.contains("katex-rendered") ||
                      parentElement.classList.contains("latex-rendered") ||
                      parentElement.classList.contains("latex-block") ||
                      parentElement.classList.contains("inline-latex"))
                  ) {
                    isInsideLaTeX = true;
                    break;
                  }
                  parentElement = parentElement.parentElement;
                }

                if (isInsideLaTeX) return;

                const nodeRange = document.createRange();
                nodeRange.setStart(nodeInfo.node, nodeInfo.startOffset);
                nodeRange.setEnd(nodeInfo.node, nodeInfo.endOffset);

                const mark = document.createElement("mark");
                const annotationUserId = annotation.userId || "anonymous";
                const colors = generateColorFromString(annotationUserId);
                const annotationId = annotation.id
                  ? annotation.id.toString()
                  : "";
                const isSelected = selectedAnnotationId === annotationId;

                mark.style.backgroundColor = colors.backgroundColor;
                mark.style.setProperty(
                  "--hover-bg-color",
                  colors.hoverBackgroundColor
                );

                if (isSelected) {
                  mark.style.borderBottom = `2px solid ${colors.borderColor}`;
                }

                mark.className = "annotation";
                mark.dataset.userId = annotationUserId;
                mark.dataset.id = annotationId;

                nodeRange.surroundContents(mark);
              });
            } catch (nestedError) {
              console.error(
                "Failed to apply partial highlighting:",
                nestedError
              );
            }
          }
        }
      });
    },
    [
      annotations,
      getAllTextNodes,
      getTextNodesInRange,
      selectedAnnotationId,
      showAuthorComments,
      showReaderComments,
      userId,
    ]
  );

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

    processAnnotations(containerRef.current);
  }, [htmlContent, processAnnotations, placeholder]);

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
    [onAnnotationClick]
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

  // useEffect(() => {
  //   if (!editor) return;

  //   const handleAnnotationClick = (event: MouseEvent) => {
  //     // ... existing click handler code ...
  //     console.log("handleAnnotationClick called");
  //   };

  //   const editorElement = editor.view.dom as HTMLElement;
  //   editorElement.addEventListener("click", handleAnnotationClick);

  //   return () => {
  //     editorElement.removeEventListener("click", handleAnnotationClick);
  //   };
  // }, [editor, editable]);

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
      <LatexNodeEditor
        open={latexPopoverOpen}
        onOpenChange={setLatexPopoverOpen}
        initialLatex={currentLatex}
        isBlock={isBlock}
        nodePosition={selectedNodePosition}
        onSave={handleSaveLatex}
        onDelete={selectedLatexId ? handleDeleteLatex : undefined}
      />
    </div>
  );
};

export default HTMLTextAnnotator;
